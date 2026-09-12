import {
  CarState,
  Driver,
  RaceEvent,
  RaceFlag,
  SimulationSnapshot,
  Team,
  TireCompound,
  Track,
} from '../types';
import { AeroPowerUnitModel } from './AeroPowerUnitModel';
import { TireModel } from './TireModel';

export interface RaceSimulationConfig {
  track: Track;
  teams: Team[];
  drivers: Driver[];
  initialTireCompound?: TireCompound;
}

export class RaceSimulation {
  private track: Track;
  private teamsMap: Map<string, Team>;
  private driversMap: Map<string, Driver>;

  private cars: CarState[] = [];
  private currentLap = 0;
  private raceTimeSec = 0.0;
  private trackWetnessPct = 0.0;
  private flag: RaceFlag = 'GREEN';
  private events: RaceEvent[] = [];
  private fastestLap: {
    driverId: string;
    lapTimeSec: number;
    lapNumber: number;
  } | null = null;

  constructor(config: RaceSimulationConfig) {
    this.track = config.track;
    this.teamsMap = new Map(config.teams.map((t) => [t.id, t]));
    this.driversMap = new Map(config.drivers.map((d) => [d.id, d]));

    this.initializeGrid(config.initialTireCompound || 'MEDIUM');
  }

  /**
   * Initializes 22 cars on the starting grid based on team/driver baseline strength.
   */
  private initializeGrid(defaultTire: TireCompound): void {
    // Generate grid ordered roughly by driver skill + team power for a realistic starting grid
    const driverList = Array.from(this.driversMap.values());
    const sortedGrid = [...driverList].sort((a, b) => {
      const teamA = this.getTeamForDriver(a.id);
      const teamB = this.getTeamForDriver(b.id);
      const scoreA = (a.skill * 1.5) + (teamA ? teamA.enginePower + teamA.aeroEfficiency : 0);
      const scoreB = (b.skill * 1.5) + (teamB ? teamB.enginePower + teamB.aeroEfficiency : 0);
      return scoreB - scoreA;
    });

    this.cars = sortedGrid.map((driver, index) => {
      const team = this.getTeamForDriver(driver.id);
      return {
        driverId: driver.id,
        teamId: team ? team.id : 'unknown',
        carNumber: driver.number,
        currentLap: 0,
        lapProgressPct: 0.0,
        totalDistanceMeters: 0,
        currentSpeedKmh: 0,
        currentLapTimeSec: 0,
        lastLapTimeSec: null,
        bestLapTimeSec: null,
        gapToLeaderSec: index * 0.35, // Starting grid gap
        intervalToAheadSec: index === 0 ? 0 : 0.35,
        aeroMode: 'Z_MODE',
        batterySoCPct: 85.0 + (Math.random() * 10), // 85-95% initial charge
        momAvailable: false,
        momActive: false,
        paceMode: 'BALANCED',
        engineMode: 'STANDARD',
        tires: TireModel.createTire(defaultTire),
        inPitLane: false,
        pitStopsCount: 0,
        pitStopServiceTimeSec: 0,
        pitRequestedNextLap: false,
        selectedNextCompound: 'HARD',
        isDnf: false,
        stressLevelPct: 10,
        hasLockup: false,
      };
    });
  }

  private getTeamForDriver(driverId: string): Team | undefined {
    for (const team of this.teamsMap.values()) {
      if (team.driverIds.includes(driverId)) return team;
    }
    return undefined;
  }

  /**
   * Simulates a full lap across all 22 cars.
   */
  public simulateLap(): SimulationSnapshot {
    if (this.currentLap >= this.track.totalLaps) {
      return this.getSnapshot();
    }

    this.currentLap += 1;

    // 1. Process each car's lap time
    for (let i = 0; i < this.cars.length; i++) {
      const car = this.cars[i];
      if (car.isDnf) continue;

      const driver = this.driversMap.get(car.driverId)!;
      const team = this.teamsMap.get(car.teamId)!;

      // Handle Pit Stop
      let lapPitLoss = 0.0;
      if (car.pitRequestedNextLap) {
        lapPitLoss = this.executePitStop(car, team, driver);
      }

      // Base track lap time
      let lapTime = this.track.baseLapTimeSec + lapPitLoss;

      // Driver skill factor (-0.5s for 98 skill vs 80 skill)
      const driverPaceDelta = -((driver.skill - 82) / 18) * 0.55;
      lapTime += driverPaceDelta;

      // Pace mode factor
      let paceWearMultiplier = 1.0;
      if (car.paceMode === 'PUSH') {
        lapTime -= 0.45;
        paceWearMultiplier = 1.45;
      } else if (car.paceMode === 'CONSERVE') {
        lapTime += 0.40;
        paceWearMultiplier = 0.75;
      }

      // Tire Delta & Degradation
      const tireDelta = TireModel.calculateTireDeltaSec(
        car.tires,
        this.trackWetnessPct,
        team.chassisBalance
      );
      lapTime += tireDelta.deltaSec;

      // Check if Cliff just hit
      if (tireDelta.isCliff && !car.tires.isCliffHit) {
        this.addEvent({
          lap: this.currentLap,
          timestampSec: this.raceTimeSec,
          type: 'CLIFF_HIT',
          driverId: driver.id,
          message: `${driver.shortCode}: "Tires are dead! Hit the cliff!" (+2.5s/lap loss)`,
          severity: 'WARNING',
        });
      }

      // Lockup check
      car.hasLockup = false;
      const lockupRoll = Math.random() * 100;
      if (lockupRoll < tireDelta.lockupRiskPct) {
        car.hasLockup = true;
        lapTime += 1.2; // Lost time running wide
        this.addEvent({
          lap: this.currentLap,
          timestampSec: this.raceTimeSec,
          type: 'LOCKUP',
          driverId: driver.id,
          message: `${driver.shortCode} locked up into Turn 1! Flat spot warning.`,
          severity: 'TACTICAL',
        });
      }

      // Apply tire degradation for the completed lap
      car.tires = TireModel.degradeTire(
        car.tires,
        paceWearMultiplier,
        driver.tireManagement,
        this.trackWetnessPct
      );

      // 2026 Aero and Power Unit (MOM & Battery)
      const aeroPower = AeroPowerUnitModel.calculateLapAeroPower({
        track: this.track,
        engineMode: car.engineMode,
        currentBatterySoC: car.batterySoCPct,
        momRequestedOrEligible: car.intervalToAheadSec <= 1.0,
        intervalToAheadSec: car.intervalToAheadSec,
        teamEnginePower: team.enginePower,
        teamAeroEfficiency: team.aeroEfficiency,
      });

      lapTime += aeroPower.lapTimeDeltaSec;
      car.batterySoCPct = aeroPower.newBatterySoC;
      car.momActive = aeroPower.momActive;

      if (car.momActive) {
        this.addEvent({
          lap: this.currentLap,
          timestampSec: this.raceTimeSec,
          type: 'MOM_DEPLOYED',
          driverId: driver.id,
          message: `${driver.shortCode} engaged 2026 Manual Override Mode (350kW full deploy)`,
          severity: 'INFO',
        });
      }

      // Small natural lap time variance (+/- 0.12s)
      const variance = (Math.random() - 0.5) * 0.24;
      lapTime += variance;

      // Save lap times
      car.lastLapTimeSec = Math.round(lapTime * 1000) / 1000;
      if (car.bestLapTimeSec === null || lapTime < car.bestLapTimeSec) {
        car.bestLapTimeSec = car.lastLapTimeSec;
      }

      // Check for fastest lap of the race (excluding pit laps)
      if (
        lapPitLoss === 0 &&
        (!this.fastestLap || lapTime < this.fastestLap.lapTimeSec)
      ) {
        this.fastestLap = {
          driverId: driver.id,
          lapTimeSec: car.lastLapTimeSec,
          lapNumber: this.currentLap,
        };
        this.addEvent({
          lap: this.currentLap,
          timestampSec: this.raceTimeSec,
          type: 'FASTEST_LAP',
          driverId: driver.id,
          message: `🟣 ${driver.shortCode} set the FASTEST LAP: ${this.formatTime(car.lastLapTimeSec)}`,
          severity: 'TACTICAL',
        });
      }

      car.currentLap = this.currentLap;
      car.totalDistanceMeters += this.track.lengthMeters;
    }

    // 2. Resolve Overtakes & Position Changes
    this.resolveOvertakes();

    // 3. Recalculate Gaps & Intervals
    this.updateGapsAndIntervals();

    // 4. Advance race clock by the leader's lap time
    const leaderLapTime = this.cars[0]?.lastLapTimeSec || this.track.baseLapTimeSec;
    this.raceTimeSec += leaderLapTime;

    return this.getSnapshot();
  }

  /**
   * Executes a pit stop for the car.
   */
  private executePitStop(car: CarState, team: Team, driver: Driver): number {
    car.pitStopsCount += 1;
    car.pitRequestedNextLap = false;

    // Pit lane traversal time (e.g. 21.5s under pit limiter)
    const laneTime = this.track.pitLaneLossSec;

    // Pit crew service time (standard: 2.1s - 2.8s)
    let serviceTime = 2.0 + (Math.max(0, 100 - team.pitCrewRating) * 0.015);
    
    // Chance of stuck wheel nut / pit error (higher if pit crew rating is low)
    const mistakeChance = Math.max(2, (100 - team.pitCrewRating) * 0.12);
    if (Math.random() * 100 < mistakeChance) {
      const extraDelay = 3.5 + (Math.random() * 4.0); // 3.5s to 7.5s delay
      serviceTime += extraDelay;
      this.addEvent({
        lap: this.currentLap,
        timestampSec: this.raceTimeSec,
        type: 'PIT_ERROR',
        driverId: driver.id,
        message: `⚠️ PIT ERROR for ${driver.shortCode}! Wheel nut cross-threaded! Service: ${serviceTime.toFixed(1)}s`,
        severity: 'DANGER',
      });
    } else {
      this.addEvent({
        lap: this.currentLap,
        timestampSec: this.raceTimeSec,
        type: 'PIT_EXIT',
        driverId: driver.id,
        message: `${driver.shortCode} box clean! Service: ${serviceTime.toFixed(1)}s -> Switched to ${car.selectedNextCompound}`,
        severity: 'INFO',
      });
    }

    car.pitStopServiceTimeSec = Math.round(serviceTime * 10) / 10;
    car.tires = TireModel.createTire(car.selectedNextCompound);

    return laneTime + serviceTime;
  }

  /**
   * Resolves overtakes between adjacent cars based on net delta, 2026 MOM, and racecraft.
   */
  private resolveOvertakes(): void {
    for (let i = this.cars.length - 1; i > 0; i--) {
      const chaser = this.cars[i];
      const defender = this.cars[i - 1];

      if (chaser.isDnf || defender.isDnf) continue;

      const chaserDriver = this.driversMap.get(chaser.driverId)!;
      const defenderDriver = this.driversMap.get(defender.driverId)!;

      // Delta advantage
      const chaserLap = chaser.lastLapTimeSec || 999;
      const defenderLap = defender.lastLapTimeSec || 999;
      const deltaAdvantage = defenderLap - chaserLap; // Positive means chaser was faster

      // If chaser was faster and was close enough
      if (deltaAdvantage > 0.35 && chaser.intervalToAheadSec <= 1.2) {
        // Racecraft calculation
        const overtakeScore = (chaserDriver.racecraft * 1.2) + (deltaAdvantage * 30) + (chaser.momActive ? 25 : 0);
        const defenseScore = (defenderDriver.racecraft * 1.1) + (defender.momActive ? 15 : 0);

        if (overtakeScore > defenseScore) {
          // Swap positions
          this.cars[i] = defender;
          this.cars[i - 1] = chaser;

          this.addEvent({
            lap: this.currentLap,
            timestampSec: this.raceTimeSec,
            type: 'OVERTAKE',
            driverId: chaserDriver.id,
            message: `🔥 OVERTAKE: P${i} ${chaserDriver.shortCode} passed ${defenderDriver.shortCode} ${chaser.momActive ? 'using 2026 MOM boost!' : 'down the straight!'}`,
            severity: 'TACTICAL',
          });
        }
      }
    }
  }

  /**
   * Updates gap to leader and interval to car ahead.
   */
  private updateGapsAndIntervals(): void {
    let cumulativeGap = 0.0;

    for (let i = 0; i < this.cars.length; i++) {
      const car = this.cars[i];
      if (i === 0) {
        car.gapToLeaderSec = 0.0;
        car.intervalToAheadSec = 0.0;
      } else {
        const ahead = this.cars[i - 1];
        // Calculate natural delta gap
        const stepInterval = Math.max(
          0.15,
          (car.lastLapTimeSec || 80) - (ahead.lastLapTimeSec || 80) + ahead.intervalToAheadSec * 0.8
        );
        car.intervalToAheadSec = Math.round(stepInterval * 10) / 10;
        cumulativeGap += car.intervalToAheadSec;
        car.gapToLeaderSec = Math.round(cumulativeGap * 10) / 10;
      }
    }
  }

  /**
   * Command: Request pit stop for a specific driver on the next lap.
   */
  public orderBox(driverId: string, nextCompound: TireCompound): boolean {
    const car = this.cars.find((c) => c.driverId === driverId);
    if (!car) return false;

    car.pitRequestedNextLap = true;
    car.selectedNextCompound = nextCompound;

    const driver = this.driversMap.get(driverId)!;
    this.addEvent({
      lap: this.currentLap,
      timestampSec: this.raceTimeSec,
      type: 'RADIO_MESSAGE',
      driverId,
      message: `📻 PIT WALL -> ${driver.shortCode}: "BOX, BOX, BOX! Pit this lap for ${nextCompound} tires!"`,
      severity: 'TACTICAL',
    });

    return true;
  }

  /**
   * Command: Set driver driving pace mode (CONSERVE / BALANCED / PUSH).
   */
  public setPaceMode(driverId: string, mode: 'CONSERVE' | 'BALANCED' | 'PUSH'): void {
    const car = this.cars.find((c) => c.driverId === driverId);
    if (car) car.paceMode = mode;
  }

  /**
   * Command: Set 2026 Power Unit engine mode (ECO / STANDARD / OVERTAKE).
   */
  public setEngineMode(driverId: string, mode: 'ECO' | 'STANDARD' | 'OVERTAKE'): void {
    const car = this.cars.find((c) => c.driverId === driverId);
    if (car) car.engineMode = mode;
  }

  private addEvent(event: Omit<RaceEvent, 'id'>): void {
    this.events.unshift({
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    });
    // Keep max 50 recent events
    if (this.events.length > 50) {
      this.events.pop();
    }
  }

  public getSnapshot(): SimulationSnapshot {
    return {
      currentLap: this.currentLap,
      totalLaps: this.track.totalLaps,
      raceTimeSec: Math.round(this.raceTimeSec * 10) / 10,
      flag: this.flag,
      trackWetnessPct: this.trackWetnessPct,
      leaderDriverId: this.cars[0]?.driverId || '',
      fastestLap: this.fastestLap,
      leaderboard: [...this.cars],
      recentEvents: [...this.events],
    };
  }

  public getDriver(driverId: string): Driver | undefined {
    return this.driversMap.get(driverId);
  }

  public getTeam(teamId: string): Team | undefined {
    return this.teamsMap.get(teamId);
  }

  private formatTime(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = (sec % 60).toFixed(3).padStart(6, '0');
    return `${m}:${s}`;
  }
}
