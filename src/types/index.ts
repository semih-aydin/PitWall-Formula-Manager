// PitWall: Formula Manager — Domain Types & Data Models

export type TireCompound = 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET';

export interface TireSpec {
  compound: TireCompound;
  name: string;
  colorHex: string;
  baseGrip: number;          // Relative pace advantage in seconds (e.g. Soft: -0.7s, Med: 0.0s, Hard: +0.6s)
  degradationPerLap: number; // Base % wear per lap on dry track
  cliffThresholdPct: number; // Below this wear level (e.g. 20%), the cliff penalty hits
  optimalWetnessMin: number; // 0 to 100
  optimalWetnessMax: number; // 0 to 100
}

export interface TireState {
  compound: TireCompound;
  healthPct: number;         // 100% down to 0%
  ageLaps: number;           // Laps completed on this set
  isCliffHit: boolean;       // True if healthPct <= cliffThresholdPct
  tempCelsius: number;       // e.g. 90-115°C
}

export type ActiveAeroMode = 'Z_MODE' | 'X_MODE'; // Z = High Downforce (Corners), X = Low Drag (Straights)
export type EngineMode = 'ECO' | 'STANDARD' | 'OVERTAKE';
export type PaceMode = 'CONSERVE' | 'BALANCED' | 'PUSH';

export interface Driver {
  id: string;
  name: string;
  shortCode: string;         // e.g. 'VER', 'HAM', 'LEC'
  number: number;
  country: string;
  skill: number;             // 1-100 (Overall raw pace)
  racecraft: number;         // 1-100 (Overtaking & defense)
  tireManagement: number;    // 1-100 (Reduces degradation)
  composure: number;         // 1-100 (Resists stress & lock-ups)
  morale: number;            // 0-100
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  colorHex: string;
  secondaryColorHex: string;
  enginePower: number;       // 1-100 (Top speed & acceleration)
  aeroEfficiency: number;    // 1-100 (Cornering speed & drag reduction in X-Mode)
  chassisBalance: number;    // 1-100 (Tire preservation)
  pitCrewRating: number;     // 1-100 (Faster stops, lower mistake probability)
  driverIds: [string, string];
}

export interface ActiveAeroZone {
  id: string;
  name: string;
  startPct: number;          // Track progress % (0.0 to 1.0)
  endPct: number;            // Track progress % (0.0 to 1.0)
  isStraight: boolean;       // If true, cars can activate X-Mode
}

export interface TrackSector {
  sectorNumber: 1 | 2 | 3;
  startPct: number;
  endPct: number;
  baseTimeSec: number;
}

export interface Track {
  id: string;
  name: string;
  country: string;
  totalLaps: number;
  lengthMeters: number;
  baseLapTimeSec: number;
  pitLaneLossSec: number;    // Time lost traversing pit lane under green flag (e.g. 21.5s)
  activeAeroZones: ActiveAeroZone[];
  sectors: [TrackSector, TrackSector, TrackSector];
  curvePathSvg?: string;     // 2D vector circuit path for radar
}

export type SectorStatus = 'PURPLE' | 'GREEN' | 'YELLOW';

export interface CarState {
  driverId: string;
  teamId: string;
  carNumber: number;

  // Race progress
  currentLap: number;
  lapProgressPct: number;    // 0.0 to 1.0 on current lap
  totalDistanceMeters: number;
  currentSpeedKmh: number;

  // Timing
  currentLapTimeSec: number;
  lastLapTimeSec: number | null;
  bestLapTimeSec: number | null;
  sectorTimes: [number, number, number];
  sectorStatuses: [SectorStatus, SectorStatus, SectorStatus];
  personalBestSectors: [number | null, number | null, number | null];
  gapToLeaderSec: number;
  intervalToAheadSec: number;

  // 2026 Active Aero & Power Unit
  aeroMode: ActiveAeroMode;
  batterySoCPct: number;     // State of Charge: 0.0 to 100.0%
  momAvailable: boolean;     // Manual Override Mode available (e.g. within 1.0s of car ahead at detection point)
  momActive: boolean;        // Manual Override actively deploying 350kW boost
  defensiveDeployActive: boolean; // Leading car using electrical reserve to defend

  // Stratejist & Driving modes
  paceMode: PaceMode;
  engineMode: EngineMode;

  // Tires
  tires: TireState;
  inDirtyAir: boolean;       // Stuck behind another car within 0.8s, causing tire overheating

  // Pit Stop status
  inPitLane: boolean;
  pitStopsCount: number;
  pitStopServiceTimeSec: number;
  pitRequestedNextLap: boolean;
  selectedNextCompound: TireCompound;
  doubleStackDelayed: boolean; // Waited in pit box behind teammate

  // Reliability & Status
  isDnf: boolean;
  dnfReason?: string;
  stressLevelPct: number;    // 0 to 100%
  hasLockup: boolean;
}

export type RaceFlag = 'GREEN' | 'YELLOW' | 'VSC' | 'SAFETY_CAR' | 'RED';

export interface RaceEvent {
  id: string;
  lap: number;
  timestampSec: number;
  type: 
    | 'OVERTAKE'
    | 'LOCKUP'
    | 'CLIFF_HIT'
    | 'PIT_ENTRY'
    | 'PIT_EXIT'
    | 'PIT_ERROR'
    | 'DOUBLE_STACK'
    | 'FASTEST_LAP'
    | 'MOM_DEPLOYED'
    | 'RADIO_MESSAGE'
    | 'FLAG_CHANGE';
  driverId?: string;
  message: string;
  severity: 'INFO' | 'TACTICAL' | 'WARNING' | 'DANGER';
}

export interface SimulationSnapshot {
  currentLap: number;
  totalLaps: number;
  raceTimeSec: number;
  flag: RaceFlag;
  trackWetnessPct: number;   // 0% (Bone dry) to 100% (Torrential)
  leaderDriverId: string;
  fastestLap: {
    driverId: string;
    lapTimeSec: number;
    lapNumber: number;
  } | null;
  sessionBestSectors: [number | null, number | null, number | null];
  leaderboard: CarState[];    // Sorted P1 to P22
  recentEvents: RaceEvent[];
}

