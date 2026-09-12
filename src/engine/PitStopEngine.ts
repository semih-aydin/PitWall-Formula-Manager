// PitWall: Formula Manager — Pit Stop ve Ekip Yönetim Motoru
// Pit stop anı motorsporlarının en kritik 2.5 saniyesidir: Ya yarışı kurtarırsın ya da bijon sıkışır!

import { CarState, Driver, RaceEvent, Team, TireCompound, Track } from '../types';
import { PIT_CONFIG } from '../config/simulationConfig';
import { TireModel } from './TireModel';

export interface PitStopResult {
  lapTimeLossSec: number;        // Toplam tur süresi kaybı (Pit yolu + servis)
  serviceTimeSec: number;        // Sadece pit kutusundaki duraklama süresi (örn: 2.4s)
  wasMistake: boolean;           // Bijon sıkıştı mı / ekip bocaladı mı?
  wasDoubleStack: boolean;       // Takım arkadaşı arkasında kuyrukta bekledi mi?
  newEvents: Omit<RaceEvent, 'id'>[]; // Üretilen yarış olayları
}

export class PitStopEngine {
  /**
   * Bir aracın pite girişini, lastik değişimini ve çıkışını simüle eder.
   * Pit ekibinin hızını, olası bijon hatalarını ve double-stack bekleme süresini hesaba katar.
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
    
    // Temel servis süresi: Merkezi konfigürasyondan baz alınır ve ekip tecrübesine göre şekillenir
    let serviceTime = PIT_CONFIG.baseServiceTimeSec + (Math.max(0, 100 - team.pitCrewRating) * 0.014);
    let wasMistake = false;
    let wasDoubleStack = false;

    // 1. Double-Stack Krizi:
    // Eğer iki takım arkadaşı aynı tur peş peşe pite çağrıldıysa ve bu araç arkadaysa:
    // Öndeki aracın lastikleri bitene kadar kutuda beklemek zorundadır!
    if (teammateAlsoPitting && !isTeammateBehind) {
      wasDoubleStack = true;
      const queueRange = PIT_CONFIG.maxDoubleStackDelaySec - PIT_CONFIG.minDoubleStackDelaySec;
      const queueDelay = PIT_CONFIG.minDoubleStackDelaySec + (Math.random() * queueRange);
      serviceTime += queueDelay;
      car.doubleStackDelayed = true;

      newEvents.push({
        lap: currentLap,
        timestampSec: raceTimeSec,
        type: 'DOUBLE_STACK',
        driverId: driver.id,
        message: `[DOUBLE-STACK] ${driver.shortCode} takım arkadaşının arkasında pit kutusunda bekledi! (+${queueDelay.toFixed(1)}s kayıp)`,
        severity: 'WARNING',
      });
    } else {
      car.doubleStackDelayed = false;
    }

    // 2. Ekip Hatası & Bijon Sıkışması:
    // Ekip tecrübesi düştükçe bijonun sıkışma ihtimali artar.
    const mistakeChance = Math.max(2.0, (100 - team.pitCrewRating) * PIT_CONFIG.baseMistakeFactor);
    if (Math.random() * 100 < mistakeChance) {
      wasMistake = true;
      const delayRange = PIT_CONFIG.maxMistakeDelaySec - PIT_CONFIG.minMistakeDelaySec;
      const extraDelay = PIT_CONFIG.minMistakeDelaySec + (Math.random() * delayRange);
      serviceTime += extraDelay;

      newEvents.push({
        lap: currentLap,
        timestampSec: raceTimeSec,
        type: 'PIT_ERROR',
        driverId: driver.id,
        message: `[BİJON HATASI] ${team.shortName} mekanikerleri sağ arka bijonla cebelleşiyor! (${driver.shortCode} duraklama: ${serviceTime.toFixed(1)}s)`,
        severity: 'DANGER',
      });
    } else {
      newEvents.push({
        lap: currentLap,
        timestampSec: raceTimeSec,
        type: 'PIT_EXIT',
        driverId: driver.id,
        message: `[PİT ÇIKIŞI] ${driver.shortCode} pitten temiz çıktı (${serviceTime.toFixed(1)}s) -> Taze ${car.selectedNextCompound} takıldı.`,
        severity: 'INFO',
      });
    }

    // Araç durumunu güncelle
    car.pitStopsCount += 1;
    car.pitRequestedNextLap = false;
    car.pitStopServiceTimeSec = Math.round(serviceTime * 10) / 10;
    car.tires = TireModel.createTire(car.selectedNextCompound as TireCompound);

    // Toplam zaman kaybı = Pit yolu hız sınırı kaybı (örn: 22s) + Kutu içi tekerlek değişimi
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
