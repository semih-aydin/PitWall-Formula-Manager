// PitWall: Formula Manager — Merkezi Simülasyon Ayarları ve Fizik Parametreleri
//
// Bu dosya oyunun kalbidir! İleride "Lastikler çok çabuk eriyor", "Kirli hava cezası az olmuş"
// veya "2026 MOM roket modu biraz daha güçlensin" dediğimizde tek tek dosya aramak yerine
// sadece buradaki sayıları değiştirmemiz yeterli olacaktır.
// Tüm değişkenler lise ve üniversite seviyesindeki bir öğrencinin rahatça anlayacağı şekilde
// Türkçe açıklamalarla belgelenmiştir.

// 1. KİRLİ HAVA VE TÜRBÜLANS AYARLARI (Dirty Air & Aero Wake)
export const DIRTY_AIR_CONFIG = {
  // Öndeki araca kaç saniyeden daha yakınsak kirli hava türbülansı başlar? (Saniye)
  detectionThresholdSec: 0.8,

  // Kirli havada viraj dönerken tutunma kaybından dolayı tur başına kaybedilen baz süre (Saniye)
  lapTimePenaltySec: 0.28,

  // Kirli havanın lastik aşınmasına etkisi (1.22 = %22 daha hızlı lastik eritir)
  wearMultiplier: 1.22,

  // Öndekinin sıcak egzoz gazı ve kayma nedeniyle lastik sıcaklığının tur başına artışı (°C)
  thermalIncreaseCelsius: 3.0,

  // Temiz havada (kirli hava yokken) lastiğin ideal sıcaklığa doğru doğal soğuma hızı (°C/tur)
  thermalCoolingCelsius: 1.5,

  // Lastiğin ideal çalışma sıcaklığı (°C)
  idealTireTempCelsius: 100.0,
};

// 2. 2026 REGÜLASYONLARI: AKTİF AERO (X-MODE) VE MANUAL OVERRIDE (MOM) AYARLARI
export const AERO_2026_CONFIG = {
  // MOM (Manual Override) aktif olabilmesi için öndeki araca maksimum fark (Saniye)
  momGapThresholdSec: 1.0,

  // MOM'u açabilmek için bataryada bulunması gereken minimum şarj yüzdesi (%)
  momMinBatterySoCPct: 18.0,

  // MOM açıldığında düzlükte 350kW ekstra güç ile tur süresinden kazanılan zaman (Saniye)
  momLapTimeBonusSec: 0.45,

  // MOM açıldığında tur başına harcanan ekstra elektrik enerjisi (%)
  momBatteryDrainPct: 16.0,

  // Düzlük modu (X-Mode) aktifken araçların ulaştığı tahmini ekstra hız takviyesi (km/h)
  xModeBaseSpeedBoostKmh: 15.0,
  xModeMomSpeedBoostKmh: 30.0,

  // Batarya kritik seviyenin altına inerse motorun güç kesmesi (Derating) eşiği (%)
  deratingThresholdPct: 10.0,

  // Derating yiyen (şarjı biten) aracın düzlükte tur başına kaybettiği süre (Saniye)
  deratingTimePenaltySec: 0.85,

  // Motor modlarının tur başına batarya dolum/tüketim miktarları (%)
  batteryModes: {
    ECO: { lapTimeDeltaSec: 0.45, batteryChangePct: 18.0 },       // Yavaş ama şarj eder
    STANDARD: { lapTimeDeltaSec: 0.0, batteryChangePct: 4.0 },     // Dengeli
    OVERTAKE: { lapTimeDeltaSec: -0.55, batteryChangePct: -22.0 }, // Çok hızlı ama şarjı sömürür
  },
};

// 3. SÜRÜŞ TEMPOSU AYARLARI (Pace Modes: Lastik Koru / Dengeli / Gazla)
export const PACE_CONFIG = {
  PUSH: {
    lapTimeBonusSec: -0.45,   // Gaza basınca tur başına 0.45 saniye hızlanır
    wearMultiplier: 1.45,     // Ancak lastiği %45 daha çabuk eritir
    tempDeltaCelsius: 3.5,    // Lastik ısınır
  },
  BALANCED: {
    lapTimeBonusSec: 0.0,
    wearMultiplier: 1.0,
    tempDeltaCelsius: 0.0,
  },
  CONSERVE: {
    lapTimeBonusSec: 0.40,    // Sakin gidince tur başına 0.40 saniye yavaşlar
    wearMultiplier: 0.75,     // Ancak lastik ömrü %25 uzar
    tempDeltaCelsius: -2.5,   // Lastik soğur
  },
};

// 4. LASTİK UÇURUMU (THE CLIFF) VE KİLİTLENME (LOCKUP) AYARLARI
export const TIRE_CLIFF_CONFIG = {
  // Uçurum vurulduğunda (lastik sağlığı eşiğin altına indiğinde) anlık baz zaman cezası (Saniye)
  baseCliffPenaltySec: 2.5,

  // Lastik tamamen %0'a indikçe eklenecek ekstra azami ceza (Saniye)
  maxAdditionalPenaltySec: 2.0,

  // Normal şartlarda her tur fren kilitleme (lockup) olma baz ihtimali (%)
  baseLockupRiskPct: 1.0,

  // Uçurum vurulduğunda kilitlenme riskinin fırladığı baz yüzde (%)
  cliffLockupRiskPct: 25.0,

  // Fren kilitlendiğinde virajı kaçırarak kaybedilen süre (Saniye)
  lockupTimeLossSec: 1.35,
};

// 5. PIT STOP VE EKİP HATASI AYARLARI
export const PIT_CONFIG = {
  // Mükemmel bir pit stopun baz servis süresi (Saniye)
  baseServiceTimeSec: 2.3,

  // Mekaniker ekibi tecrübesine göre bijon sıkışması veya lastik oturmama hata çarpanı
  baseMistakeFactor: 0.12,

  // Hata olduğunda (bijon sıkışması vb.) kaybedilen ilave süre aralığı (Saniye)
  minMistakeDelaySec: 3.8,
  maxMistakeDelaySec: 7.3,

  // Double-Stack (aynı tur peş peşe gelen takım arkadaşı) bekleme süresi aralığı (Saniye)
  minDoubleStackDelaySec: 3.2,
  maxDoubleStackDelaySec: 4.7,

  // Pit yolunda hız limiti (km/h) — Vektör radarda animasyon için
  pitLaneSpeedKmh: 80.0,
};

// 6. SOLLAMA VE YARIŞ MÜCADELESİ AYARLARI
export const OVERTAKE_CONFIG = {
  // Arkadaki pilotun atağa kalkabilmesi için öndekine maksimum fark (Saniye)
  maxAttackGapSec: 0.75,

  // Başarılı bir geçiş için gereken minimum atak skoru üstünlüğü
  minAttackMargin: 3.0,
};

// 7. DİNAMİK HAVA DURUMU VE GEÇİŞ LASTİĞİ (CROSSOVER) AYARLARI (Faz 4 - Semih)
// Yağmur ne zaman Inter/Wet gerektirir, pist kaç turda kurur gibi tüm fizik parametreleri.
export const WEATHER_CONFIG = {
  // Crossover Eşikleri: Lastik stratejisinin kader anları (%)
  // %18'in altı: Kuru zemin slick hamurlar (Soft/Med/Hard)
  // %18 - %62 arası: Yeşil yanaklı Geçiş Lastiği (Intermediate)
  // %62'nin üstü: Mavi yanaklı Yoğun Yağmur Lastiği (Full Wet)
  intermediateCrossoverPct: 18.0,
  wetCrossoverPct: 62.0,

  // Tur Başına Yağış Birikim Oranları (%)
  drizzleAccumulationPerLap: 4.5,
  rainAccumulationPerLap: 9.5,
  heavyRainAccumulationPerLap: 16.0,

  // Yağmur durduğunda veya azaldığında pistin doğal kuruma hızı (%/tur)
  // Asfalt sıcaklığı yüksekse bu hız daha da artar
  baseDryingRatePerLap: 2.4,

  // Sıcaklık baz değerleri (°C)
  baseAirTempCelsius: 23.0,
  baseTrackTempCelsius: 32.0,

  // Hava durumu geçiş olasılığı (her tur havanın evrilme şansı: %12)
  weatherTransitionChance: 0.12,
};

