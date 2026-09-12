import {
  CarState,
  Driver,
  RaceEvent,
  SectorStatus,
  Team,
  Track,
} from '../types';
import { AeroPowerUnitModel } from './AeroPowerUnitModel';
import { TireModel } from './TireModel';

export interface LapTimeResult {
  lapTimeSec: number;
  sectorTimes: [number, number, number];
  sectorStatuses: [SectorStatus, SectorStatus, SectorStatus];
  hasLockup: boolean;
  newEvents: Omit<RaceEvent, 'id'>[];
}

export class LapTimeCalculator {
  /**
   * Calculates detailed sector times and full lap time for a car.
   */
  public static calculateLapTime(params: {
    car: CarState;
    driver: Driver;
    team: Team;
    track: Track;
    currentLap: number;
    raceTimeSec: number;
    trackWetnessPct: number;
    pitLossSec: number;
    sessionBestSectors: [number | null, number | null, number | null];
  }): LapTimeResult {
    const {
      car,
      driver,
      team,
      track,
      currentLap,
      raceTimeSec,
      trackWetnessPct,
      pitLossSec,
      sessionBestSectors,
    } = params;

    const newEvents: Omit<RaceEvent, 'id'>[] = [];

    // 1. Base Lap Time
    let totalLapTime = track.baseLapTimeSec + pitLossSec;

    // 2. Driver Skill Baseline (-0.55s for 98 skill vs 82 baseline)
    const driverPaceDelta = -((driver.skill - 82) / 18) * 0.55;
    totalLapTime += driverPaceDelta;

    // 3. Pace Mode (Push / Balanced / Conserve)
    let paceWearMultiplier = 1.0;
    if (car.paceMode === 'PUSH') {
      totalLapTime -= 0.45;
      paceWearMultiplier = 1.45;
    } else if (car.paceMode === 'CONSERVE') {
      totalLapTime += 0.40;
      paceWearMultiplier = 0.75;
    }

    // 4. Dirty Air Penalty: If following within 0.8s without passing
    if (car.inDirtyAir && pitLossSec === 0) {
      totalLapTime += 0.28; // Dirty air turbulence slows cornering grip
    }

    // 5. Tire Delta, The Cliff & Lock-up Risk
    const tireDelta = TireModel.calculateTireDeltaSec(
      car.tires,
      trackWetnessPct,
      team.chassisBalance
    );
    totalLapTime += tireDelta.deltaSec;

    // Check if The Cliff was just struck
    if (tireDelta.isCliff && !car.tires.isCliffHit) {
      newEvents.push({
        lap: currentLap,
        timestampSec: raceTimeSec,
        type: 'CLIFF_HIT',
        driverId: driver.id,
        message: `⚠️ THE CLIFF HIT! ${driver.shortCode}: "Tires completely gone, zero grip!" (+2.5s/lap loss)`,
        severity: 'WARNING',
      });
    }

    // Lock-up chance (higher on worn tires or high driver stress)
    let hasLockup = false;
    const lockupRoll = Math.random() * 100;
    if (lockupRoll < tireDelta.lockupRiskPct) {
      hasLockup = true;
      totalLapTime += 1.35; // Running wide at Turn 1 chicane
      newEvents.push({
        lap: currentLap,
        timestampSec: raceTimeSec,
        type: 'LOCKUP',
        driverId: driver.id,
        message: `💨 LOCK-UP! ${driver.shortCode} locked front-right into braking zone! Heavy flat spot.`,
        severity: 'TACTICAL',
      });
    }

    // Apply tire wear with dirty air thermal impact
    car.tires = TireModel.degradeTire(
      car.tires,
      paceWearMultiplier,
      driver.tireManagement,
      trackWetnessPct,
      car.inDirtyAir
    );

    // 6. 2026 Aero and Power Unit (X-Mode & MOM Overtake)
    const aeroPower = AeroPowerUnitModel.calculateLapAeroPower({
      track,
      engineMode: car.engineMode,
      currentBatterySoC: car.batterySoCPct,
      momRequestedOrEligible: car.intervalToAheadSec <= 1.0,
      intervalToAheadSec: car.intervalToAheadSec,
      teamEnginePower: team.enginePower,
      teamAeroEfficiency: team.aeroEfficiency,
    });

    totalLapTime += aeroPower.lapTimeDeltaSec;
    car.batterySoCPct = aeroPower.newBatterySoC;
    car.momActive = aeroPower.momActive;

    if (car.momActive && pitLossSec === 0) {
      newEvents.push({
        lap: currentLap,
        timestampSec: raceTimeSec,
        type: 'MOM_DEPLOYED',
        driverId: driver.id,
        message: `⚡ ${driver.shortCode} engaged 2026 Manual Override Mode (350kW electric deploy)`,
        severity: 'INFO',
      });
    }

    // 7. Small natural lap variance
    const variance = (Math.random() - 0.5) * 0.22;
    totalLapTime += variance;

    const roundedLapTime = Math.round(totalLapTime * 1000) / 1000;

    // 8. Sector Times Breakdown (S1, S2, S3)
    const s1Ratio = track.sectors[0].baseTimeSec / track.baseLapTimeSec;
    const s2Ratio = track.sectors[1].baseTimeSec / track.baseLapTimeSec;

    // Add small sector variance
    const s1 = Math.round((roundedLapTime * s1Ratio + (Math.random() - 0.5) * 0.15) * 1000) / 1000;
    const s2 = Math.round((roundedLapTime * s2Ratio + (Math.random() - 0.5) * 0.15) * 1000) / 1000;
    const s3 = Math.round((roundedLapTime - s1 - s2) * 1000) / 1000;

    const sectorTimes: [number, number, number] = [s1, s2, s3];
    const sectorStatuses: [SectorStatus, SectorStatus, SectorStatus] = ['YELLOW', 'YELLOW', 'YELLOW'];

    // Determine Sector Colors (Purple = session fastest, Green = personal best, Yellow = slower)
    sectorTimes.forEach((time, idx) => {
      const sessionBest = sessionBestSectors[idx];
      const personalBest = car.personalBestSectors[idx];

      if (sessionBest === null || time < sessionBest) {
        sectorStatuses[idx] = 'PURPLE';
      } else if (personalBest === null || time < personalBest) {
        sectorStatuses[idx] = 'GREEN';
      } else {
        sectorStatuses[idx] = 'YELLOW';
      }
    });

    return {
      lapTimeSec: roundedLapTime,
      sectorTimes,
      sectorStatuses,
      hasLockup,
      newEvents,
    };
  }
}
