// PitWall: Formula Manager — Temel Veri Tipleri ve Modeller
// Burada oyunun kalbindeki tüm veri yapılarını tanımlıyoruz.

// 1. Lastik Hamurları (Kuru ve Islak zemin seçenekleri)
export type TireCompound = 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET';

// Bir lastik hamurunun fiziksel özellikleri
export interface TireSpec {
  compound: TireCompound;
  name: string;
  colorHex: string;
  baseGrip: number;          // Saf hız avantajı (Soft hızlıdır -0.75s, Hard yavaştır +0.65s)
  degradationPerLap: number; // Kuru zeminde her tur lastiğin yüzde kaçı eriyor?
  cliffThresholdPct: number; // Lastik sağlığı bu yüzdenin (örn: %20) altına inerse "Uçurum" (The Cliff) başlar!
  optimalWetnessMin: number; // Bu lastiğin sevdiği minimum pist ıslaklığı (0-100)
  optimalWetnessMax: number; // Bu lastiğin sevdiği maksimum pist ıslaklığı (0-100)
}

// Bir aracın o an altındaki lastik setinin anlık durumu
export interface TireState {
  compound: TireCompound;
  healthPct: number;         // Lastik ömrü (%100'den sıfıra iner)
  ageLaps: number;           // Bu lastikle kaç tur atıldı?
  isCliffHit: boolean;       // Lastik bitti mi? Uçuruma çarptı mı?
  tempCelsius: number;       // Lastik yüzey sıcaklığı (ideal: 100-105°C, kirli havada 130°C'ye fırlar)
}

// 2026 Aktif Aerodinamik Modları:
// Z_MODE: Virajlarda yüksek yere basma gücü (kanatlar dik)
// X_MODE: Düzlüklerde düşük sürtünme (kanatlar yatar, son hız tavan yapar)
export type ActiveAeroMode = 'Z_MODE' | 'X_MODE';

// Motor ve Sürüş Strateji Modları (Pit duvarından pilota verdiğimiz emirler)
export type EngineMode = 'ECO' | 'STANDARD' | 'OVERTAKE';
export type PaceMode = 'CONSERVE' | 'BALANCED' | 'PUSH';

// Pilot Modeli (Kişilik, yetenek ve psikoloji)
export interface Driver {
  id: string;
  name: string;
  shortCode: string;         // Ekranda gözüken 3 harfli kısaltma (örn: VER, LEC, HAM)
  number: number;
  country: string;
  skill: number;             // 1-100: Pilotun saf tur zamanı hızı
  racecraft: number;         // 1-100: Tekerlek tekerleğe kapışma ve sollama zekası
  tireManagement: number;    // 1-100: Lastiği koruma yeteneği (lastik aşınmasını azaltır)
  composure: number;         // 1-100: Soğukkanlılık (stres ve kilitlenme direncini belirler)
  morale: number;            // 0-100: Takım emirlerine uymasını etkileyen moral puanı
}

// Takım Modeli (Fabrika gücü ve pit ekibi kalitesi)
export interface Team {
  id: string;
  name: string;
  shortName: string;
  colorHex: string;
  secondaryColorHex: string;
  enginePower: number;       // 1-100: Düzlük hızı ve motor ivmelenmesi
  aeroEfficiency: number;    // 1-100: Viraj hızı ve X-Mode sürtünme azaltma verimi
  chassisBalance: number;    // 1-100: Şasi dengesi (lastiğe iyi bakar, aşınmayı dengeler)
  pitCrewRating: number;     // 1-100: Pit ekibinin hızı ve bijon sıkışması gibi hatalardan kaçınması
  driverIds: [string, string]; // Takımın 1. ve 2. pilotunun ID'leri
}

// 2026 Aktif Aero Bölgeleri (Eski DRS çizgilerinin yerini alan düzlükler)
export interface ActiveAeroZone {
  id: string;
  name: string;
  startPct: number;          // Pistin yüzde kaçında başlıyor? (0.0 - 1.0)
  endPct: number;            // Pistin yüzde kaçında bitiyor? (0.0 - 1.0)
  isStraight: boolean;       // Düzlük mü? (Düzlükse tüm arabalar X-Mode açabilir)
}

// Pist Sektörleri (Monza S1, S2, S3)
export interface TrackSector {
  sectorNumber: 1 | 2 | 3;
  startPct: number;
  endPct: number;
  baseTimeSec: number;
}

// Pist Modeli
export interface Track {
  id: string;
  name: string;
  country: string;
  totalLaps: number;
  lengthMeters: number;
  baseLapTimeSec: number;
  pitLaneLossSec: number;    // Yeşil bayrakta pit yolundan geçerken kaybedilen baz süre (örn: 22 saniye)
  activeAeroZones: ActiveAeroZone[];
  sectors: [TrackSector, TrackSector, TrackSector];
  curvePathSvg?: string;     // 2D pist haritası çizimi için vektör yolu
}

// Sektör Zamanlama Renkleri (F1 Live Timing klasiği)
// PURPLE: O sektörde seansın en hızlısı
// GREEN: Pilotun o sektörde kendi en iyi derecesi
// YELLOW: Önceki turlara göre daha yavaş sektör
export type SectorStatus = 'PURPLE' | 'GREEN' | 'YELLOW';

// Bir Aracın Anlık Yarış Durumu (Her tur güncellenen telemetri paketi)
export interface CarState {
  driverId: string;
  teamId: string;
  carNumber: number;

  // Yarış İlerlemesi
  currentLap: number;
  lapProgressPct: number;    // Turun yüzde kaçı tamamlandı? (0.0 - 1.0)
  totalDistanceMeters: number;
  currentSpeedKmh: number;

  // Zamanlama Verileri
  currentLapTimeSec: number;
  lastLapTimeSec: number | null;
  bestLapTimeSec: number | null;
  sectorTimes: [number, number, number];
  sectorStatuses: [SectorStatus, SectorStatus, SectorStatus];
  personalBestSectors: [number | null, number | null, number | null];
  gapToLeaderSec: number;    // Liderle aradaki toplam saniye farkı
  intervalToAheadSec: number;// Bir öndeki araçla aradaki anlık saniye farkı

  // 2026 Aktif Aero ve Güç Ünitesi
  aeroMode: ActiveAeroMode;
  batterySoCPct: number;     // Batarya Şarj Seviyesi (State of Charge: %0.0 - %100.0)
  momAvailable: boolean;     // 1 saniyenin altına inildiği için Manual Override hakkı doğdu mu?
  momActive: boolean;        // Pilot şu an 350kW ekstra bataryayı boşaltıyor mu?
  defensiveDeployActive: boolean; // Öndeki pilot arkadakini savuşturmak için batarya yakıyor mu?

  // Strateji Emirleri
  paceMode: PaceMode;
  engineMode: EngineMode;

  // Lastik ve Kirli Hava Durumu
  tires: TireState;
  inDirtyAir: boolean;       // Öndeki araca 0.8s yakın gidip lastikleri kızartıyor mu?

  // Pit Stop Durumu
  inPitLane: boolean;
  pitStopsCount: number;
  pitStopServiceTimeSec: number;
  pitRequestedNextLap: boolean;
  selectedNextCompound: TireCompound;
  doubleStackDelayed: boolean; // Takım arkadaşı da aynı tur girdiği için pit kutusunda sıra bekledi mi?

  // Dayanıklılık ve Olaylar
  isDnf: boolean;
  dnfReason?: string;
  isFinished?: boolean;      // Damalı bayrağı geçip yarışı tamamladı mı?
  stressLevelPct: number;    // Pilotun stres seviyesi (yüksek stres = viraj kaçırma riski)
  hasLockup: boolean;        // Fren kilitledi mi? (Duman duman oldu mu?)
}

// Yarış Bayrakları (Yeşil, Sarı, VSC, Güvenlik Aracı, Kırmızı ve Damalı Bayrak)
export type RaceFlag = 'GREEN' | 'YELLOW' | 'VSC' | 'SAFETY_CAR' | 'RED' | 'CHEQUERED';

// Yarış Olayları (Telsiz ve Olay Akışı için)
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
    | 'WEATHER_CHANGE'
    | 'FLAG_CHANGE'
    | 'RACE_FINISH';
  driverId?: string;
  message: string;
  severity: 'INFO' | 'TACTICAL' | 'WARNING' | 'DANGER';
}

// 8. Dinamik Hava Durumu ve Islaklık Modelleri (Faz 4 - Semih)
export type WeatherCondition = 'DRY' | 'OVERCAST' | 'DRIZZLE' | 'RAIN' | 'HEAVY_RAIN';

export interface WeatherForecast {
  inLaps: number;
  condition: WeatherCondition;
  rainProbabilityPct: number;
  projectedWetnessPct: number;
}

export interface WeatherState {
  condition: WeatherCondition;
  trackWetnessPct: number;   // Pist Islaklık Seviyesi (%0.0 - %100.0)
  rainIntensityPct: number;  // Anlık yağış şiddeti (%0.0 - %100.0)
  airTempCelsius: number;    // Hava sıcaklığı (°C)
  trackTempCelsius: number;  // Asfalt sıcaklığı (°C)
  optimalCompound: TireCompound; // Islaklığa göre ideal hamur (SOFT/MED/HARD, INTERMEDIATE, WET)
  forecast: WeatherForecast[];   // Gelecek turların radar tahmini
}

// Telemetri Anlık Ekranı (React arayüzüne gönderilen paket)
export interface SimulationSnapshot {
  currentLap: number;
  totalLaps: number;
  raceTimeSec: number;
  flag: RaceFlag;
  trackWetnessPct: number;   // Pist Islaklık Seviyesi (%0 Kuru, %100 Sağanak)
  weatherCondition: WeatherCondition;
  airTempCelsius: number;
  trackTempCelsius: number;
  optimalCompound: TireCompound;
  weatherForecast: WeatherForecast[];
  leaderDriverId: string;
  fastestLap: {
    driverId: string;
    lapTimeSec: number;
    lapNumber: number;
  } | null;
  sessionBestSectors: [number | null, number | null, number | null];
  leaderboard: CarState[];    // P1'den P22'ye sıralanmış ızgara
  recentEvents: RaceEvent[];  // Son telsiz ve yarış olayları
}

