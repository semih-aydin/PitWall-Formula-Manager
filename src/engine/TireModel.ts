import { TireCompound, TireSpec, TireState } from '../types';

export const TIRE_SPECS: Record<TireCompound, TireSpec> = {
  SOFT: {
    compound: 'SOFT',
    name: 'Soft C4/C5',
    colorHex: '#ef4444',       // Red
    baseGrip: -0.75,           // 0.75s faster per lap than neutral
    degradationPerLap: 3.4,    // ~15-20 laps competitive life
    cliffThresholdPct: 20.0,
    optimalWetnessMin: 0,
    optimalWetnessMax: 15,
  },
  MEDIUM: {
    compound: 'MEDIUM',
    name: 'Medium C3',
    colorHex: '#eab308',       // Yellow
    baseGrip: 0.0,             // Baseline
    degradationPerLap: 2.1,    // ~25-30 laps life
    cliffThresholdPct: 18.0,
    optimalWetnessMin: 0,
    optimalWetnessMax: 15,
  },
  HARD: {
    compound: 'HARD',
    name: 'Hard C1/C2',
    colorHex: '#f8fafc',       // White
    baseGrip: 0.65,            // 0.65s slower per lap than neutral
    degradationPerLap: 1.3,    // ~35-45 laps life
    cliffThresholdPct: 15.0,
    optimalWetnessMin: 0,
    optimalWetnessMax: 15,
  },
  INTERMEDIATE: {
    compound: 'INTERMEDIATE',
    name: 'Intermediate',
    colorHex: '#22c55e',       // Green
    baseGrip: 1.8,
    degradationPerLap: 2.5,
    cliffThresholdPct: 18.0,
    optimalWetnessMin: 20,
    optimalWetnessMax: 65,
  },
  WET: {
    compound: 'WET',
    name: 'Extreme Wet',
    colorHex: '#3b82f6',       // Blue
    baseGrip: 4.5,
    degradationPerLap: 2.8,
    cliffThresholdPct: 20.0,
    optimalWetnessMin: 60,
    optimalWetnessMax: 100,
  },
};

export class TireModel {
  /**
   * Initializes a brand new tire set.
   */
  public static createTire(compound: TireCompound): TireState {
    return {
      compound,
      healthPct: 100.0,
      ageLaps: 0,
      isCliffHit: false,
      tempCelsius: 100.0,
    };
  }

  /**
   * Calculates the lap time delta (in seconds) caused by tire grip, degradation, the Cliff, and track wetness.
   */
  public static calculateTireDeltaSec(
    tire: TireState,
    trackWetnessPct: number,
    chassisTireCare: number // 1-100 from team/driver
  ): { deltaSec: number; isCliff: boolean; lockupRiskPct: number } {
    const spec = TIRE_SPECS[tire.compound];

    // 1. Base Compound Grip Delta
    let deltaSec = spec.baseGrip;

    // 2. Linear Wear Degradation (100% -> Cliff)
    const wearFactor = (100 - tire.healthPct) / 100;
    const chassisFactor = 1 - (((chassisTireCare - 85) / 100) * 0.15);
    const wearDelta = wearFactor * 1.3 * chassisFactor; // Up to ~1.3s slower near cliff
    deltaSec += wearDelta;

    // 3. The Cliff Penalty (< 20% health)
    const isCliff = tire.healthPct <= spec.cliffThresholdPct;
    let lockupRisk = 1.0; // Base 1% risk of lockup per lap

    if (isCliff) {
      // Massive +2.5s cliff penalty plus quadratic loss as rubber shreds
      const cliffDepth = (spec.cliffThresholdPct - tire.healthPct) / spec.cliffThresholdPct;
      deltaSec += 2.5 + (cliffDepth * 2.0);
      lockupRisk += 25.0 + (cliffDepth * 30.0); // Extreme lockup & spin risk!
    }

    // 4. Track Wetness vs Tire Suitability (Crossover dynamics)
    if (tire.compound === 'SOFT' || tire.compound === 'MEDIUM' || tire.compound === 'HARD') {
      // Slicks in the wet
      if (trackWetnessPct > 20) {
        const wetPenalty = ((trackWetnessPct - 20) / 10) * 2.2; // Massive slip & slide
        deltaSec += wetPenalty;
        lockupRisk += trackWetnessPct * 0.5;
      }
    } else if (tire.compound === 'INTERMEDIATE') {
      // Inter on dry track overheats & degrades
      if (trackWetnessPct < 15) {
        deltaSec += 3.0; // Slow on dry asphalt
      } else if (trackWetnessPct > 65) {
        deltaSec += ((trackWetnessPct - 65) / 10) * 1.5; // Aquaplaning
      }
    } else if (tire.compound === 'WET') {
      // Wet on dry track burns up instantly
      if (trackWetnessPct < 40) {
        deltaSec += 6.0;
      }
    }

    return { deltaSec, isCliff, lockupRiskPct: Math.min(95, lockupRisk) };
  }

  /**
   * Applies degradation for 1 lap completed based on driver pace, tire care, weather, and aerodynamic wake.
   */
  public static degradeTire(
    currentTire: TireState,
    paceMultiplier: number,  // e.g. Conserve = 0.75, Balanced = 1.0, Push = 1.45
    driverTireCare: number,   // 1-100
    trackWetnessPct: number,
    inDirtyAir: boolean = false
  ): TireState {
    const spec = TIRE_SPECS[currentTire.compound];
    
    // Tire care factor: 100 rating reduces wear by ~25%
    const careDiscount = 1 - ((driverTireCare - 50) / 200); // 0.75 to 1.15
    const dirtyAirWearMultiplier = inDirtyAir ? 1.22 : 1.0; // Turbulent wake causes micro-sliding

    let lapWear = spec.degradationPerLap * paceMultiplier * careDiscount * dirtyAirWearMultiplier;

    // Wet tire on dry track overheats and shreds 2.5x faster
    if ((spec.compound === 'INTERMEDIATE' || spec.compound === 'WET') && trackWetnessPct < 15) {
      lapWear *= 2.5;
    }

    const newHealth = Math.max(0, currentTire.healthPct - lapWear);
    const cliffHit = newHealth <= spec.cliffThresholdPct;

    // Temperature dynamics: Clean air cools towards 100°C; Push and Dirty Air heat up
    let tempDelta = 0;
    if (paceMultiplier > 1.2) tempDelta += 3.5;
    else if (paceMultiplier < 0.9) tempDelta -= 2.5;

    if (inDirtyAir) tempDelta += 3.0; // Dirty air cooks tires
    else if (currentTire.tempCelsius > 102) tempDelta -= 1.5; // Cooling in clean air

    const newTemp = Math.max(80, Math.min(138, currentTire.tempCelsius + tempDelta));

    return {
      compound: currentTire.compound,
      healthPct: Math.round(newHealth * 10) / 10,
      ageLaps: currentTire.ageLaps + 1,
      isCliffHit: cliffHit,
      tempCelsius: Math.round(newTemp * 10) / 10,
    };
  }
}
