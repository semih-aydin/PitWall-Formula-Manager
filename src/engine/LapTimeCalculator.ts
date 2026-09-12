// PitWall: Formula Manager — Tur Zamanı ve Sektör Hesaplama Motoru
// Bu modül bir aracın 1 turu kaç saniyede tamamladığını ve S1, S2, S3 sürelerini hesaplar.
// Tüm etkenler burada toplanır: Pilot yeteneği + Lastik + 2026 MOM + Kirli Hava + Şans faktörü.

import {
  CarState,
  Driver,
  RaceEvent,
  SectorStatus,
  Team,
  Track,
} from '../types';
import { AeroPowerUnitModel } from './AeroPowerUnitModel';
import { TireModel } from './TireModel';

export interface LapTimeResult {
  lapTimeSec: number;                                       // Toplam tur süresi (örn: 80.245s)
  sectorTimes: [number, number, number];                    // [S1, S2, S3] saniyeleri
  sectorStatuses: [SectorStatus, SectorStatus, SectorStatus];// [Mor, Yeşil, Sarı] renk durumları
  hasLockup: boolean;                                       // Bu tur virajda fren kilitlendi mi?
  newEvents: Omit<RaceEvent, 'id'>[];                       // Üretilen telsiz ve yarış olayları
}

export class LapTimeCalculator {
  /**
   * Bir aracın tur süresini milisaniyesine kadar hesaplar.
   */
  public static calculateLapTime(params: {
    car: CarState;
    driver: Driver;
    team: Team;
    track: Track;
    currentLap: number;
    raceTimeSec: number;
    trackWetnessPct: number;
    pitLossSec: number;
    sessionBestSectors: [number | null, number | null, number | null];
  }): LapTimeResult {
    const {
      car,
      driver,
      team,
      track,
      currentLap,
      raceTimeSec,
      trackWetnessPct,
      pitLossSec,
      sessionBestSectors,
    } = params;

    const newEvents: Omit<RaceEvent, 'id'>[] = [];

    // 1. Temel Pist Süresi (Pist boşken atılacak standart süre + pite girildiyse pit kaybı)
    let totalLapTime = track.baseLapTimeSec + pitLossSec;

    // 2. Pilot Yeteneği Farkı (Verstappen gibi 98 skill pilotlar 82'lik çaylaklara göre ~0.55s hızlıdır)
    const driverPaceDelta = -((driver.skill - 82) / 18) * 0.55;
    totalLapTime += driverPaceDelta;

    // 3. Strateji Modu (PUSH gaza basar zaman kazandırır, CONSERVE lastik korur zaman kaybettirir)
    let paceWearMultiplier = 1.0;
    if (car.paceMode === 'PUSH') {
      totalLapTime -= 0.45;        // -0.45s hız kazanır
      paceWearMultiplier = 1.45;   // Ama lastiği %45 daha hızlı yakar
    } else if (car.paceMode === 'CONSERVE') {
      totalLapTime += 0.40;        // +0.40s yavaşlar
      paceWearMultiplier = 0.75;   // Ama lastik ömrünü uzatır
    }

    // 4. Kirli Hava (Dirty Air) Kaybı: Öndeki aracın 0.8s arkasındaysak aerodinamik tutuş bozulur
    if (car.inDirtyAir && pitLossSec === 0) {
      totalLapTime += 0.28; // Virajlarda arkadan kayma ve tutuş kaybı (+0.28s)
    }

    // 5. Lastik Hamuru, Aşınma ve "Uçurum" (The Cliff) Etkisi
    const tireDelta = TireModel.calculateTireDeltaSec(
      car.tires,
      trackWetnessPct,
      team.chassisBalance
    );
    totalLapTime += tireDelta.deltaSec;

    // Uçurum ilk defa bu tur vurulduysa telsizden acil durum uyarısı patlat!
    if (tireDelta.isCliff && !car.tires.isCliffHit) {
      newEvents.push({
        lap: currentLap,
        timestampSec: raceTimeSec,
        type: 'CLIFF_HIT',
        driverId: driver.id,
        message: `⚠️ UÇURUM ÇARPTI! ${driver.shortCode}: "Lastikler bitti dostum, arkada sıfır tutuş var!" (+2.5s/tur kayıp)`,
        severity: 'WARNING',
      });
    }

    // Fren Kilitleme (Lock-up) Kontrolü (Lastik eskidikçe ve pilot zorladıkça kilitlenme ihtimali artar)
    let hasLockup = false;
    const lockupRoll = Math.random() * 100;
    if (lockupRoll < tireDelta.lockupRiskPct) {
      hasLockup = true;
      totalLapTime += 1.35; // Virajı geniş alıp kaçış alanına taştığı için +1.35s kaybeder
      newEvents.push({
        lap: currentLap,
        timestampSec: raceTimeSec,
        type: 'LOCKUP',
        driverId: driver.id,
        message: `💨 FREN KİLİTLENDİ! ${driver.shortCode} ilk virajda dumanlar çıkararak lastiği düzleştirdi (flat spot)!`,
        severity: 'TACTICAL',
      });
    }

    // Bu tur için lastik aşınmasını ve kirli hava ısınmasını uygula
    car.tires = TireModel.degradeTire(
      car.tires,
      paceWearMultiplier,
      driver.tireManagement,
      trackWetnessPct,
      car.inDirtyAir
    );

    // 6. 2026 Aktif Aero ve Manual Override (MOM) Batarya Hesabı
    const aeroPower = AeroPowerUnitModel.calculateLapAeroPower({
      track,
      engineMode: car.engineMode,
      currentBatterySoC: car.batterySoCPct,
      momRequestedOrEligible: car.intervalToAheadSec <= 1.0,
      intervalToAheadSec: car.intervalToAheadSec,
      teamEnginePower: team.enginePower,
      teamAeroEfficiency: team.aeroEfficiency,
    });

    totalLapTime += aeroPower.lapTimeDeltaSec;
    car.batterySoCPct = aeroPower.newBatterySoC;
    car.momActive = aeroPower.momActive;

    if (car.momActive && pitLossSec === 0) {
      newEvents.push({
        lap: currentLap,
        timestampSec: raceTimeSec,
        type: 'MOM_DEPLOYED',
        driverId: driver.id,
        message: `⚡ ${driver.shortCode} 2026 Manual Override (350kW) roket modunu açtı!`,
        severity: 'INFO',
      });
    }

    // 7. Doğal Tur Varyansı (Her tur birbirinin fotokopisi olmasın diye +/- 0.1s rastgelelik)
    const variance = (Math.random() - 0.5) * 0.22;
    totalLapTime += variance;

    const roundedLapTime = Math.round(totalLapTime * 1000) / 1000;

    // 8. Sektör Zamanlarını Parçalara Ayırma (S1, S2, S3)
    const s1Ratio = track.sectors[0].baseTimeSec / track.baseLapTimeSec;
    const s2Ratio = track.sectors[1].baseTimeSec / track.baseLapTimeSec;

    // Sektörler arası mikro dalgalanmalar
    const s1 = Math.round((roundedLapTime * s1Ratio + (Math.random() - 0.5) * 0.15) * 1000) / 1000;
    const s2 = Math.round((roundedLapTime * s2Ratio + (Math.random() - 0.5) * 0.15) * 1000) / 1000;
    const s3 = Math.round((roundedLapTime - s1 - s2) * 1000) / 1000;

    const sectorTimes: [number, number, number] = [s1, s2, s3];
    const sectorStatuses: [SectorStatus, SectorStatus, SectorStatus] = ['YELLOW', 'YELLOW', 'YELLOW'];

    // Sektör Renklerini Belirleme (F1 Canlı Zamanlama Kuralı):
    // PURPLE (Mor): Tüm seansın en iyi sektör derecesi
    // GREEN (Yeşil): Pilotun o yarıştaki kendi en iyi derecesi
    // YELLOW (Sarı): Önceki turlara göre daha yavaş sektör
    sectorTimes.forEach((time, idx) => {
      const sessionBest = sessionBestSectors[idx];
      const personalBest = car.personalBestSectors[idx];

      if (sessionBest === null || time < sessionBest) {
        sectorStatuses[idx] = 'PURPLE';
      } else if (personalBest === null || time < personalBest) {
        sectorStatuses[idx] = 'GREEN';
      } else {
        sectorStatuses[idx] = 'YELLOW';
      }
    });

    return {
      lapTimeSec: roundedLapTime,
      sectorTimes,
      sectorStatuses,
      hasLockup,
      newEvents,
    };
  }
}
