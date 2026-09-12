import { CarState, Driver, RaceEvent } from '../types';

export interface OvertakeAttemptResult {
  success: boolean;
  event?: Omit<RaceEvent, 'id'>;
}

export class OvertakeEngine {
  /**
   * Resolves an overtake attempt between a chasing car and defending car.
   */
  public static evaluateOvertake(params: {
    chaser: CarState;
    defender: CarState;
    chaserDriver: Driver;
    defenderDriver: Driver;
    currentLap: number;
    raceTimeSec: number;
    chaserPosition: number;
  }): OvertakeAttemptResult {
    const {
      chaser,
      defender,
      chaserDriver,
      defenderDriver,
      currentLap,
      raceTimeSec,
      chaserPosition,
    } = params;

    // Both cars must be active and close
    if (chaser.isDnf || defender.isDnf) {
      return { success: false };
    }

    const chaserLap = chaser.lastLapTimeSec || 999;
    const defenderLap = defender.lastLapTimeSec || 999;
    const deltaAdvantage = defenderLap - chaserLap; // Positive means chaser was faster

    // If chaser was faster and was within striking distance (<= 1.2s)
    if (deltaAdvantage > 0.25 && chaser.intervalToAheadSec <= 1.2) {
      // 2026 Energy battle:
      let chaserMOMBonus = 0;
      let defenderDefenseBonus = 0;

      if (chaser.momActive) {
        chaserMOMBonus = 30; // 350kW sustained speed boost
      }

      // Defender tactics: If defender has > 25% battery, use tactical energy to defend!
      if (defender.batterySoCPct > 25.0 && defender.engineMode !== 'ECO') {
        defender.defensiveDeployActive = true;
        defender.batterySoCPct = Math.max(0, defender.batterySoCPct - 8.0);
        defenderDefenseBonus = 18;
      } else {
        defender.defensiveDeployActive = false;
      }

      // Racecraft and composure comparison
      const attackScore =
        (chaserDriver.racecraft * 1.25) +
        (deltaAdvantage * 35) +
        chaserMOMBonus +
        (Math.random() * 12);

      const defenseScore =
        (defenderDriver.racecraft * 1.2) +
        defenderDefenseBonus +
        (defender.tires.isCliffHit ? -35 : 0) + // Cliffed tires cannot defend!
        (Math.random() * 12);

      if (attackScore > defenseScore) {
        const passDetail = chaser.momActive
          ? 'using 2026 Manual Override Mode (350kW burst) into the chicane!'
          : 'with a bold dive down the inside!';

        return {
          success: true,
          event: {
            lap: currentLap,
            timestampSec: raceTimeSec,
            type: 'OVERTAKE',
            driverId: chaserDriver.id,
            message: `🔥 P${chaserPosition - 1} OVERTAKE: ${chaserDriver.shortCode} passed ${defenderDriver.shortCode} ${passDetail}`,
            severity: 'TACTICAL',
          },
        };
      }
    }

    return { success: false };
  }
}
