import { CarState, Driver, RaceEvent, Team, TireCompound, Track } from '../types';
import { TireModel } from './TireModel';

export interface PitStopResult {
  lapTimeLossSec: number;
  serviceTimeSec: number;
  wasMistake: boolean;
  wasDoubleStack: boolean;
  newEvents: Omit<RaceEvent, 'id'>[];
}

export class PitStopEngine {
  /**
   * Executes a pit stop for a car, handling pit lane time, crew speed, mistakes, and teammate double-stack delays.
   */
  public static executeStop(params: {
    car: CarState;
    team: Team;
    driver: Driver;
    track: Track;
    currentLap: number;
    raceTimeSec: number;
    teammateAlsoPitting: boolean;
    isTeammateBehind: boolean;
  }): PitStopResult {
    const {
      car,
      team,
      driver,
      track,
      currentLap,
      raceTimeSec,
      teammateAlsoPitting,
      isTeammateBehind,
    } = params;

    const newEvents: Omit<RaceEvent, 'id'>[] = [];
    let serviceTime = 2.1 + (Math.max(0, 100 - team.pitCrewRating) * 0.014);
    let wasMistake = false;
    let wasDoubleStack = false;

    // 1. Double Stack Delay: If teammate also pits this lap and car is behind teammate
    if (teammateAlsoPitting && !isTeammateBehind) {
      wasDoubleStack = true;
      const queueDelay = 3.2 + (Math.random() * 1.5); // 3.2s to 4.7s waiting in the box
      serviceTime += queueDelay;
      car.doubleStackDelayed = true;

      newEvents.push({
        lap: currentLap,
        timestampSec: raceTimeSec,
        type: 'DOUBLE_STACK',
        driverId: driver.id,
        message: `⚠️ DOUBLE-STACK DELAY: ${driver.shortCode} queued in pit box behind teammate! (+${queueDelay.toFixed(1)}s wait)`,
        severity: 'WARNING',
      });
    } else {
      car.doubleStackDelayed = false;
    }

    // 2. Wheel nut cross-thread / equipment failure risk
    const mistakeChance = Math.max(2.0, (100 - team.pitCrewRating) * 0.12);
    if (Math.random() * 100 < mistakeChance) {
      wasMistake = true;
      const extraDelay = 3.8 + (Math.random() * 3.5);
      serviceTime += extraDelay;

      newEvents.push({
        lap: currentLap,
        timestampSec: raceTimeSec,
        type: 'PIT_ERROR',
        driverId: driver.id,
        message: `🚨 PIT DISASTER: ${team.shortName} crew cross-threaded right-rear wheel nut for ${driver.shortCode}! Stop: ${serviceTime.toFixed(1)}s`,
        severity: 'DANGER',
      });
    } else {
      newEvents.push({
        lap: currentLap,
        timestampSec: raceTimeSec,
        type: 'PIT_EXIT',
        driverId: driver.id,
        message: `🟢 ${driver.shortCode} pit stop complete (${serviceTime.toFixed(1)}s) -> New set of ${car.selectedNextCompound} fitted.`,
        severity: 'INFO',
      });
    }

    // Update car state
    car.pitStopsCount += 1;
    car.pitRequestedNextLap = false;
    car.pitStopServiceTimeSec = Math.round(serviceTime * 10) / 10;
    car.tires = TireModel.createTire(car.selectedNextCompound as TireCompound);

    const totalLoss = track.pitLaneLossSec + serviceTime;

    return {
      lapTimeLossSec: totalLoss,
      serviceTimeSec: Math.round(serviceTime * 10) / 10,
      wasMistake,
      wasDoubleStack,
      newEvents,
    };
  }
}
