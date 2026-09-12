// PitWall: Formula Manager — 2026 Aktif Aero (X-Mode/Z-Mode) ve Güç Ünitesi (MOM) Motoru
// 2026 kurallarıyla DRS kalktı! Artık düzlük modu ve batarya yönetimi savaşı var.

import { ActiveAeroMode, EngineMode, Track } from '../types';
import { AERO_2026_CONFIG } from '../config/simulationConfig';

export interface AeroPowerResult {
  aeroMode: ActiveAeroMode;   // O anki aerodinamik mod (Z_MODE veya X_MODE)
  speedDeltaKmh: number;      // Son hızdaki km/h artışı
  lapTimeDeltaSec: number;    // Tur süresine saniye cinsinden etkisi (eksi değer hız kazandırır)
  newBatterySoC: number;      // Tur sonundaki yeni batarya yüzdesi (%0 - %100)
  momActive: boolean;         // 350kW'lık Manual Override devreye girdi mi?
  isDerated: boolean;         // Batarya bittiği için elektrik gücü erken kesildi mi?
}

export class AeroPowerUnitModel {
  /**
   * Aracın pistin neresinde olduğuna bakar.
   * Düzlük bölgesindeyse kanatları yatırıp X-Mode'a geçirir, virajdaysa yere basma için Z-Mode'a döner.
   */
  public static evaluateAeroMode(track: Track, lapProgressPct: number): ActiveAeroMode {
    for (const zone of track.activeAeroZones) {
      if (zone.isStraight) {
        if (zone.startPct <= zone.endPct) {
          // Normal pist düzlüğü (örn: %20 ile %35 arası)
          if (lapProgressPct >= zone.startPct && lapProgressPct <= zone.endPct) {
            return 'X_MODE';
          }
        } else {
          // Başlangıç/Bitiş düzlüğü gibi turun sonundan başına sarkan düzlükler (%90 - %10)
          if (lapProgressPct >= zone.startPct || lapProgressPct <= zone.endPct) {
            return 'X_MODE';
          }
        }
      }
    }
    // Düzlükte değilse viraj modundayız (Z-Mode: maksimum tutunma)
    return 'Z_MODE';
  }

  /**
   * Bir tur boyunca motor gücü, X-Mode verimi ve batarya tüketimini hesaplar.
   */
  public static calculateLapAeroPower(params: {
    track: Track;
    engineMode: EngineMode;
    currentBatterySoC: number;
    momRequestedOrEligible: boolean;
    intervalToAheadSec: number;
    teamEnginePower: number;   // Takımın motor gücü (1-100)
    teamAeroEfficiency: number; // Takımın aerodinamik verimi (1-100)
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

    // 1. Motor Gücü Avantajı (Güçlü motorlar tur başına ~0.4s kazanır)
    const engineDelta = -((teamEnginePower - 85) / 15) * 0.4;
    lapTimeDelta += engineDelta;

    // 2. Aerodinamik Verim (Düzlükte az rüzgar direnci üreten araçlar ~0.35s kazanır)
    const aeroDelta = -((teamAeroEfficiency - 85) / 15) * 0.35;
    lapTimeDelta += aeroDelta;

    // 3. Seçilen Motor Modu (Merkezi ayar tablosundan okunur):
    const modeConfig = AERO_2026_CONFIG.batteryModes[params.engineMode] || AERO_2026_CONFIG.batteryModes.STANDARD;
    lapTimeDelta += modeConfig.lapTimeDeltaSec;
    batteryChange += modeConfig.batteryChangePct;

    // 4. 2026 Manual Override Mode (MOM):
    // Öndeki araca 1.0 saniye mesafedeysek ve bataryada yeterli şarj (>%18) varsa MOM açılır!
    const canUseMOM =
      (intervalToAheadSec <= AERO_2026_CONFIG.momGapThresholdSec || momRequestedOrEligible) &&
      currentBatterySoC > AERO_2026_CONFIG.momMinBatterySoCPct;

    if (canUseMOM && (intervalToAheadSec <= AERO_2026_CONFIG.momGapThresholdSec || params.engineMode === 'OVERTAKE')) {
      momActive = true;
      lapTimeDelta -= AERO_2026_CONFIG.momLapTimeBonusSec;
      batteryChange -= AERO_2026_CONFIG.momBatteryDrainPct;
    }

    // 5. Batarya Bitti mi? (Derating Kontrolü)
    let newSoC = Math.max(0, Math.min(100, currentBatterySoC + batteryChange));

    if (newSoC <= AERO_2026_CONFIG.deratingThresholdPct) {
      // Şarj bitti, elektrik motoru gücü kesti!
      isDerated = true;
      lapTimeDelta += AERO_2026_CONFIG.deratingTimePenaltySec;
    }

    return {
      aeroMode: 'Z_MODE',
      speedDeltaKmh: momActive ? 18.5 : (params.engineMode === 'OVERTAKE' ? 10.0 : 0.0),
      lapTimeDeltaSec: lapTimeDelta,
      newBatterySoC: Math.round(newSoC * 10) / 10,
      momActive,
      isDerated,
    };
  }
}
