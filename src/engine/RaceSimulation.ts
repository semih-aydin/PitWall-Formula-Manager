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
import { LapTimeCalculator } from './LapTimeCalculator';
import { OvertakeEngine } from './OvertakeEngine';
import { PitStopEngine } from './PitStopEngine';
import { TireModel } from './TireModel';

export interface RaceSimulationConfig {
  track: Track;
  teams: Team[];
  drivers: Driver[];
  initialTireCompound?: TireCompound;
}

export class RaceSimulation {
  private readonly track: Track;
  private readonly teamsMap: Map<string, Team>;
  private readonly driversMap: Map<string, Driver>;

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

  private sessionBestSectors: [number | null, number | null, number | null] = [null, null, null];

  constructor(config: RaceSimulationConfig) {
    this.track = config.track;
    this.teamsMap = new Map(config.teams.map((t) => [t.id, t]));
    this.driversMap = new Map(config.drivers.map((d) => [d.id, d]));

    this.initializeGrid(config.initialTireCompound || 'MEDIUM');
  }

  /**
   * Sets up initial grid ordering based on qualifying/base strength.
   */
  private initializeGrid(defaultTire: TireCompound): void {
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
        sectorTimes: [0, 0, 0],
        sectorStatuses: ['YELLOW', 'YELLOW', 'YELLOW'],
        personalBestSectors: [null, null, null],
        gapToLeaderSec: index * 0.35,
        intervalToAheadSec: index === 0 ? 0 : 0.35,
        aeroMode: 'Z_MODE',
        batterySoCPct: 85.0 + (Math.random() * 10),
        momAvailable: false,
        momActive: false,
        defensiveDeployActive: false,
        paceMode: 'BALANCED',
        engineMode: 'STANDARD',
        tires: TireModel.createTire(defaultTire),
        inDirtyAir: false,
        inPitLane: false,
        pitStopsCount: 0,
        pitStopServiceTimeSec: 0,
        pitRequestedNextLap: false,
        selectedNextCompound: 'HARD',
        doubleStackDelayed: false,
        isDnf: false,
        stressLevelPct: 10,
        hasLockup: false,
      };
    });
  }

  public getTeamForDriver(driverId: string): Team | undefined {
    for (const team of this.teamsMap.values()) {
      if (team.driverIds.includes(driverId)) return team;
    }
    return undefined;
  }

  /**
   * Simulates a full lap across all 22 cars using modular sub-engines.
   */
  public simulateLap(): SimulationSnapshot {
    if (this.currentLap >= this.track.totalLaps) {
      return this.getSnapshot();
    }

    this.currentLap += 1;

    // Track which teams have pit requests this lap for double-stack detection
    const pittingDriversByTeam = new Map<string, string[]>();
    for (const car of this.cars) {
      if (car.pitRequestedNextLap) {
        const list = pittingDriversByTeam.get(car.teamId) || [];
        list.push(car.driverId);
        pittingDriversByTeam.set(car.teamId, list);
      }
    }

    // 1. Process Each Car's Lap Time
    for (let i = 0; i < this.cars.length; i++) {
      const car = this.cars[i];
      if (car.isDnf) continue;

      const driver = this.driversMap.get(car.driverId)!;
      const team = this.teamsMap.get(car.teamId)!;

      // Check Dirty Air (within 0.8s of car ahead and not leader)
      car.inDirtyAir = i > 0 && car.intervalToAheadSec <= 0.8;

      // Handle Pit Stop via PitStopEngine
      let pitLossSec = 0.0;
      if (car.pitRequestedNextLap) {
        const teamPittingList = pittingDriversByTeam.get(car.teamId) || [];
        const teammateAlsoPitting = teamPittingList.length > 1;
        // Teammate is ahead on track if their index in cars array is smaller
        const teammateId = team.driverIds.find((id) => id !== car.driverId);
        const teammateIdx = this.cars.findIndex((c) => c.driverId === teammateId);
        const isTeammateBehind = teammateIdx > i;

        const pitResult = PitStopEngine.executeStop({
          car,
          team,
          driver,
          track: this.track,
          currentLap: this.currentLap,
          raceTimeSec: this.raceTimeSec,
          teammateAlsoPitting,
          isTeammateBehind,
        });

        pitLossSec = pitResult.lapTimeLossSec;
        pitResult.newEvents.forEach((evt) => this.addEvent(evt));
      }

      // Calculate Lap and Sector Times via LapTimeCalculator
      const lapCalcResult = LapTimeCalculator.calculateLapTime({
        car,
        driver,
        team,
        track: this.track,
        currentLap: this.currentLap,
        raceTimeSec: this.raceTimeSec,
        trackWetnessPct: this.trackWetnessPct,
        pitLossSec,
        sessionBestSectors: this.sessionBestSectors,
      });

      // Update car sector and lap timing state
      car.lastLapTimeSec = lapCalcResult.lapTimeSec;
      car.sectorTimes = lapCalcResult.sectorTimes;
      car.sectorStatuses = lapCalcResult.sectorStatuses;
      car.hasLockup = lapCalcResult.hasLockup;
      lapCalcResult.newEvents.forEach((evt) => this.addEvent(evt));

      // Update Personal Best and Session Best Sectors
      lapCalcResult.sectorTimes.forEach((time, idx) => {
        // Session best (Purple)
        if (this.sessionBestSectors[idx] === null || time < this.sessionBestSectors[idx]!) {
          this.sessionBestSectors[idx] = time;
        }
        // Personal best (Green)
        if (car.personalBestSectors[idx] === null || time < car.personalBestSectors[idx]!) {
          car.personalBestSectors[idx] = time;
        }
      });

      // Best lap tracking
      if (car.bestLapTimeSec === null || lapCalcResult.lapTimeSec < car.bestLapTimeSec) {
        car.bestLapTimeSec = lapCalcResult.lapTimeSec;
      }

      // Session Fastest Lap (only on clean racing laps)
      if (
        pitLossSec === 0 &&
        (!this.fastestLap || lapCalcResult.lapTimeSec < this.fastestLap.lapTimeSec)
      ) {
        this.fastestLap = {
          driverId: driver.id,
          lapTimeSec: lapCalcResult.lapTimeSec,
          lapNumber: this.currentLap,
        };
        this.addEvent({
          lap: this.currentLap,
          timestampSec: this.raceTimeSec,
          type: 'FASTEST_LAP',
          driverId: driver.id,
          message: `🟣 FASTEST LAP: ${driver.shortCode} — ${this.formatTime(lapCalcResult.lapTimeSec)}`,
          severity: 'TACTICAL',
        });
      }

      car.currentLap = this.currentLap;
      car.totalDistanceMeters += this.track.lengthMeters;
    }

    // 2. Resolve Overtakes via OvertakeEngine
    this.resolveOvertakes();

    // 3. Update Live Timing Intervals & Gaps
    this.updateGapsAndIntervals();

    // 4. Advance race clock
    const leaderLapTime = this.cars[0]?.lastLapTimeSec || this.track.baseLapTimeSec;
    this.raceTimeSec += leaderLapTime;

    return this.getSnapshot();
  }

  /**
   * Iterates through the field and resolves overtaking duels.
   */
  private resolveOvertakes(): void {
    for (let i = this.cars.length - 1; i > 0; i--) {
      const chaser = this.cars[i];
      const defender = this.cars[i - 1];

      const chaserDriver = this.driversMap.get(chaser.driverId)!;
      const defenderDriver = this.driversMap.get(defender.driverId)!;

      const result = OvertakeEngine.evaluateOvertake({
        chaser,
        defender,
        chaserDriver,
        defenderDriver,
        currentLap: this.currentLap,
        raceTimeSec: this.raceTimeSec,
        chaserPosition: i + 1,
      });

      if (result.success) {
        // Swap positions in the running order
        this.cars[i] = defender;
        this.cars[i - 1] = chaser;

        if (result.event) {
          this.addEvent(result.event);
        }
      }
    }
  }

  /**
   * Recalculates leader gaps and interval deltas.
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
   * Strategist Command: Box for tires on the next lap.
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
      message: `📻 PIT WALL -> ${driver.shortCode}: "BOX, BOX! Box this lap for fresh ${nextCompound} tires."`,
      severity: 'TACTICAL',
    });

    return true;
  }

  /**
   * Strategist Command: Pace mode.
   */
  public setPaceMode(driverId: string, mode: 'CONSERVE' | 'BALANCED' | 'PUSH'): void {
    const car = this.cars.find((c) => c.driverId === driverId);
    if (car) car.paceMode = mode;
  }

  /**
   * Strategist Command: 2026 Engine & battery deployment mode.
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
      sessionBestSectors: [...this.sessionBestSectors],
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
