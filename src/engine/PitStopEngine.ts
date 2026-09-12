// PitWall: Formula Manager — Pit Stop ve Ekip Yönetim Motoru
// Pit stop anı motorsporlarının en kritik 2.5 saniyesidir: Ya yarışı kurtarırsın ya da bijon sıkışır!

import { CarState, Driver, RaceEvent, Team, TireCompound, Track } from '../types';
import { TireModel } from './TireModel';

export interface PitStopResult {
  lapTimeLossSec: number;       // Toplam zaman kaybı (pit yolu geçişi + tekerlek değişimi)
  serviceTimeSec: number;       // Sadece tekerleklerin değiştiği durma süresi (örn: 2.3s)
  wasMistake: boolean;          // Bijon sıkışması gibi bir hata oldu mu?
  wasDoubleStack: boolean;      // Takım arkadaşının arkasında sıra bekledi mi?
  newEvents: Omit<RaceEvent, 'id'>[];
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
    
    // Temel servis süresi: Red Bull gibi iyi ekipler 2.1s yaparken, zayıf ekipler 2.8s yapar
    let serviceTime = 2.1 + (Math.max(0, 100 - team.pitCrewRating) * 0.014);
    let wasMistake = false;
    let wasDoubleStack = false;

    // 1. Double-Stack Krizi:
    // Eğer iki takım arkadaşı aynı tur peş peşe pite çağrıldıysa ve bu araç arkadaysa:
    // Öndeki aracın lastikleri bitene kadar kutuda beklemek zorundadır (+3.2s ile +4.7s arası kayıp)!
    if (teammateAlsoPitting && !isTeammateBehind) {
      wasDoubleStack = true;
      const queueDelay = 3.2 + (Math.random() * 1.5);
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

    // 2. Ekip Hatası & Bijon Sıkışması (Bottas Monako 2021 faciası gibi):
    // Ekip tecrübesi düştükçe sağ arka bijonun sıkışma ihtimali artar.
    const mistakeChance = Math.max(2.0, (100 - team.pitCrewRating) * 0.12);
    if (Math.random() * 100 < mistakeChance) {
      wasMistake = true;
      const extraDelay = 3.8 + (Math.random() * 3.5); // 4-7 saniye ekstra eziyet
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
