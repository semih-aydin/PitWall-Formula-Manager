import { ActiveAeroMode, EngineMode, Track } from '../types';

export interface AeroPowerResult {
  aeroMode: ActiveAeroMode;
  speedDeltaKmh: number;
  lapTimeDeltaSec: number;
  newBatterySoC: number;
  momActive: boolean;
  isDerated: boolean;
}

export class AeroPowerUnitModel {
  /**
   * Evaluates current active aero mode based on track progress percentage.
   */
  public static evaluateAeroMode(track: Track, lapProgressPct: number): ActiveAeroMode {
    for (const zone of track.activeAeroZones) {
      if (zone.isStraight) {
        if (zone.startPct <= zone.endPct) {
          // Standard zone within 0..1
          if (lapProgressPct >= zone.startPct && lapProgressPct <= zone.endPct) {
            return 'X_MODE';
          }
        } else {
          // Wrap-around zone across Start/Finish line (e.g. 0.90 to 0.10)
          if (lapProgressPct >= zone.startPct || lapProgressPct <= zone.endPct) {
            return 'X_MODE';
          }
        }
      }
    }
    return 'Z_MODE';
  }

  /**
   * Calculates aerodynamic and battery deployment effects on lap delta and battery drain.
   * 
   * 2026 Regulations:
   * - X-Mode reduces straight drag for all cars.
   * - Manual Override Mode (MOM) delivers sustained 350kW boost when chasing a car within 1.0s.
   * - If battery SoC drops below 10%, early derating occurs.
   */
  public static calculateLapAeroPower(params: {
    track: Track;
    engineMode: EngineMode;
    currentBatterySoC: number;
    momRequestedOrEligible: boolean;
    intervalToAheadSec: number;
    teamEnginePower: number;   // 1-100
    teamAeroEfficiency: number; // 1-100
  }): AeroPowerResult {
    const {
      currentBatterySoC,
      momRequestedOrEligible,
      intervalToAheadSec,
      teamEnginePower,
      teamAeroEfficiency,
    } = params;

    let lapTimeDelta = 0.0;
    let batteryChange = 0.0;
    let isDerated = false;
    let momActive = false;

    // 1. Engine Power Baseline Advantage (-0.4s for top engine vs average)
    const engineDelta = -((teamEnginePower - 85) / 15) * 0.4;
    lapTimeDelta += engineDelta;

    // 2. Aero Efficiency in X-Mode straight-line performance
    const aeroDelta = -((teamAeroEfficiency - 85) / 15) * 0.35;
    lapTimeDelta += aeroDelta;

    // 3. Engine Modes (ECO / STANDARD / OVERTAKE)
    switch (params.engineMode) {
      case 'ECO':
        lapTimeDelta += 0.45;    // Slower pace
        batteryChange += 18.0;   // Net battery harvesting (+18% SoC per lap)
        break;
      case 'STANDARD':
        lapTimeDelta += 0.0;
        batteryChange += 4.0;    // Slight net harvest / balanced
        break;
      case 'OVERTAKE':
        lapTimeDelta -= 0.55;    // Fast deployment
        batteryChange -= 22.0;   // Aggressive drain
        break;
    }

    // 4. 2026 Manual Override Mode (MOM)
    // Eligible if within 1.0 second of car ahead AND battery > 20%, OR strategist explicitly triggered OVERTAKE
    const canUseMOM = (intervalToAheadSec <= 1.0 || momRequestedOrEligible) && currentBatterySoC > 18.0;

    if (canUseMOM && (intervalToAheadSec <= 1.0 || params.engineMode === 'OVERTAKE')) {
      momActive = true;
      lapTimeDelta -= 0.45;      // Extra 350kW high-speed burst up to 337 km/h
      batteryChange -= 16.0;     // Significant battery dump
    }

    // 5. Battery Derating Check
    let newSoC = Math.max(0, Math.min(100, currentBatterySoC + batteryChange));

    if (newSoC <= 10.0) {
      // Out of juice! Electric motor cuts out above 290 km/h early
      isDerated = true;
      lapTimeDelta += 0.85;      // Painful derating penalty
    }

    return {
      aeroMode: 'Z_MODE',        // Default sector status
      speedDeltaKmh: momActive ? 18.5 : (params.engineMode === 'OVERTAKE' ? 10.0 : 0.0),
      lapTimeDeltaSec: lapTimeDelta,
      newBatterySoC: Math.round(newSoC * 10) / 10,
      momActive,
      isDerated,
    };
  }
}
