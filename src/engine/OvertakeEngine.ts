// PitWall: Formula Manager — Sollama ve Tekerlek Tekerleğe Kapışma Motoru
// İki araç viraj girişinde veya düzlükte kapıştığında kim öne çıkacak?

import { CarState, Driver, RaceEvent } from '../types';

export interface OvertakeAttemptResult {
  success: boolean;               // Geçiş başarılı oldu mu?
  event?: Omit<RaceEvent, 'id'>;  // Telsiz/spiker mesajı
}

export class OvertakeEngine {
  /**
   * Arkadaki araç (chaser) ile öndeki aracı (defender) kapıştırır.
   * Hız farkı, 2026 MOM batarya avantajı, öndekinin savunma gücü ve pilot yeteneklerini tartar.
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

    // Biri yarış dışıysa (DNF) zaten kapışma olmaz
    if (chaser.isDnf || defender.isDnf) {
      return { success: false };
    }

    const chaserLap = chaser.lastLapTimeSec || 999;
    const defenderLap = defender.lastLapTimeSec || 999;
    const deltaAdvantage = defenderLap - chaserLap; // Pozitifse arkadaki daha hızlı demektir

    // Arkadaki araç hem turda daha hızlıysa hem de 1.2 saniyelik atak mesafesindeyse kapışma başlar!
    if (deltaAdvantage > 0.25 && chaser.intervalToAheadSec <= 1.2) {
      
      // 2026 Batarya Savaşı:
      let chaserMOMBonus = 0;
      let defenderDefenseBonus = 0;

      // Saldıran araç 350kW Manual Override açtıysa arkasına roket takılmış gibi gelir (+30 puan)
      if (chaser.momActive) {
        chaserMOMBonus = 30;
      }

      // Savunan aracın taktiği: Eğer liderin bataryasında >%25 şarj varsa o da bataryayı harcayıp kapıyı kapatır!
      if (defender.batterySoCPct > 25.0 && defender.engineMode !== 'ECO') {
        defender.defensiveDeployActive = true;
        defender.batterySoCPct = Math.max(0, defender.batterySoCPct - 8.0); // Savunma için biraz pil yakar
        defenderDefenseBonus = 18;
      } else {
        defender.defensiveDeployActive = false;
      }

      // Saldırı Puanı: Pilotun tekerlek tekerleğe zekası + hız farkı + MOM takviyesi + şans faktörü
      const attackScore =
        (chaserDriver.racecraft * 1.25) +
        (deltaAdvantage * 35) +
        chaserMOMBonus +
        (Math.random() * 12);

      // Savunma Puanı: Öndekinin tecrübesi + batarya savunması + bitik lastik zafiyeti + şans faktörü
      const defenseScore =
        (defenderDriver.racecraft * 1.2) +
        defenderDefenseBonus +
        (defender.tires.isCliffHit ? -35 : 0) + // Lastiği biten adam asla savunma yapamaz!
        (Math.random() * 12);

      // Eğer hücum skoru savunmayı yenerse geçiş tamamlanır!
      if (attackScore > defenseScore) {
        const passDetail = chaser.momActive
          ? '2026 Manual Override (350kW) roket moduyla düzlükte uçtu geçti!'
          : 'viraj öncesi cesur bir geç frenajla içeri dalarak sırayı kaptı!';

        return {
          success: true,
          event: {
            lap: currentLap,
            timestampSec: raceTimeSec,
            type: 'OVERTAKE',
            driverId: chaserDriver.id,
            message: `[GEÇİŞ] P${chaserPosition - 1}: ${chaserDriver.shortCode}, ${defenderDriver.shortCode}'u ${passDetail}`,
            severity: 'TACTICAL',
          },
        };
      }
    }

    return { success: false };
  }
}
