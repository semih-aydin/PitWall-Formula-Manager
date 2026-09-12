// PitWall: Formula Manager — Simülasyon Test Koşucusu
// Bu script terminalde 20 turluk örnek bir yarışı simüle eder ve
// ekrana tıpkı televizyondaki F1 Canlı Zamanlama Kulesi gibi renkli çıktılar basar.

import { DEFAULT_DRIVERS_2026, DEFAULT_TEAMS_2026 } from '../data/defaultGrid2026';
import { DEFAULT_TRACKS } from '../data/defaultTracks';
import { RaceSimulation } from './RaceSimulation';

// Terminale sıralama kulesini (Live Timing Tower) yazdıran yardımcı fonksiyon
function printLeaderboard(sim: RaceSimulation, lap: number) {
  const snapshot = sim.getSnapshot();
  console.log(`\n==========================================================================================`);
  console.log(`🏁 PITWALL: FORMULA MANAGER — CANLI ZAMANLAMA KULESİ (TUR ${lap}/${snapshot.totalLaps})`);
  console.log(`   Pist: Monza (Royal Temple) | Durum: ${snapshot.flag} | Islaklık: %${snapshot.trackWetnessPct}`);
  
  if (snapshot.fastestLap) {
    const d = sim.getDriver(snapshot.fastestLap.driverId);
    console.log(`   🟣 EN HIZLI TUR: ${d?.shortCode} — ${(snapshot.fastestLap.lapTimeSec).toFixed(3)}s (Tur ${snapshot.fastestLap.lapNumber})`);
  }

  const sBest = snapshot.sessionBestSectors;
  console.log(`   SEKTÖR REKORLARI -> S1: ${sBest[0]?.toFixed(3) || '---'}s | S2: ${sBest[1]?.toFixed(3) || '---'}s | S3: ${sBest[2]?.toFixed(3) || '---'}s`);
  console.log(`------------------------------------------------------------------------------------------`);
  console.log(`SIRA #   PİLOT        TAKIM       LASTİK     SAĞLIK   ISI    BATARYA   FARK     SEKTÖRLER (S1/S2/S3)`);
  console.log(`------------------------------------------------------------------------------------------`);

  snapshot.leaderboard.forEach((car, index) => {
    const driver = sim.getDriver(car.driverId)!;
    const team = sim.getTeam(car.teamId)!;

    const pos = (index + 1).toString().padStart(2, ' ');
    const num = car.carNumber.toString().padStart(2, ' ');
    const name = driver.shortCode.padEnd(4, ' ');
    const teamName = team.shortName.padEnd(9, ' ');

    // Lastik hamuru ve tur sayısı
    const tireColor = car.tires.compound === 'SOFT' ? '🔴 S' : car.tires.compound === 'MEDIUM' ? '🟡 M' : '⚪ H';
    const tireInfo = `${tireColor} ${car.tires.ageLaps}L`.padEnd(9, ' ');
    
    // Sağlık ve sıcaklık (kirli havadaysa yanına duman ikonu koyuyoruz)
    const health = `${car.tires.healthPct.toFixed(0)}%`.padStart(4, ' ') + (car.tires.isCliffHit ? '⚠️' : '  ');
    const temp = `${car.tires.tempCelsius.toFixed(0)}°C`.padStart(6, ' ') + (car.inDirtyAir ? '💨' : '  ');
    const battery = `${car.batterySoCPct.toFixed(0)}%`.padStart(5, ' ') + (car.momActive ? '🚀' : '  ');

    const gap = index === 0 ? 'LİDER   ' : `+${car.gapToLeaderSec.toFixed(1)}s`.padStart(8, ' ');

    // Sektör renkleri: Mor (🟣 rekor), Yeşil (🟢 kişisel en iyi), Sarı (🟡 yavaş)
    const s1Icon = car.sectorStatuses[0] === 'PURPLE' ? '🟣' : car.sectorStatuses[0] === 'GREEN' ? '🟢' : '🟡';
    const s2Icon = car.sectorStatuses[1] === 'PURPLE' ? '🟣' : car.sectorStatuses[1] === 'GREEN' ? '🟢' : '🟡';
    const s3Icon = car.sectorStatuses[2] === 'PURPLE' ? '🟣' : car.sectorStatuses[2] === 'GREEN' ? '🟢' : '🟡';
    const sectors = `${s1Icon}${car.sectorTimes[0].toFixed(1)} ${s2Icon}${car.sectorTimes[1].toFixed(1)} ${s3Icon}${car.sectorTimes[2].toFixed(1)}`;

    console.log(`${pos}  #${num}  ${name}  ${teamName}  ${tireInfo}  ${health}  ${temp}  ${battery}  ${gap}  ${sectors}`);
  });
  console.log(`==========================================================================================`);
}

// Ana simülasyon testi
async function runTestSimulation() {
  console.log("🏎️ [Faz 1] PitWall Modüler Simülasyon Testi Başlatılıyor...");

  const track = DEFAULT_TRACKS[0]; // Monza Pisti
  const sim = new RaceSimulation({
    track,
    teams: DEFAULT_TEAMS_2026,
    drivers: DEFAULT_DRIVERS_2026,
    initialTireCompound: 'SOFT', // Herkes Yumuşak (Kırmızı) lastikle başlıyor
  });

  const totalTestLaps = 20;

  for (let lap = 1; lap <= totalTestLaps; lap++) {
    // 3. Tur: Pit duvarından Leconte'a "Bas gaza" (PUSH) emri veriyoruz
    if (lap === 3) {
      console.log(`\n📻 [Tur 3 Strateji Emri] C. Leconte (LEC) tempoyu artırıyor: PUSH modu!`);
      sim.setPaceMode('d_leconte', 'PUSH');
    }

    // 7. Tur: Leconte için 2026 MOM roket modu aktif ediliyor
    if (lap === 7) {
      console.log(`\n📻 [Tur 7 Strateji Emri] C. Leconte (LEC) için 2026 MOM Overtake devrede!`);
      sim.setEngineMode('d_leconte', 'OVERTAKE');
    }

    // 10. Tur DOUBLE-STACK Testi:
    // Ferrari stratejisti iki pilotunu (LEC ve HAM) aynı tur peş peşe pite çağırıyor!
    // Arkadaki pilotun pit kutusunda bekleyip beklemediğini test ediyoruz.
    if (lap === 10) {
      console.log(`\n🚨 [Tur 10 DOUBLE-STACK TESTİ] Scuderia Rossa ikisini birden çağırdı: LEC ve HAM aynı tur pite!`);
      sim.orderBox('d_leconte', 'HARD');
      sim.orderBox('d_hampton', 'HARD');
    }

    if (lap === 11) {
      sim.setPaceMode('d_leconte', 'BALANCED');
      sim.setEngineMode('d_leconte', 'STANDARD');
      sim.setPaceMode('d_hampton', 'BALANCED');
    }

    // Turu koştur
    sim.simulateLap();

    // Belirli turlarda telemetri tablosunu ekrana bas
    if (lap === 1 || lap === 5 || lap === 10 || lap === 11 || lap === 20) {
      printLeaderboard(sim, lap);
    }
  }

  // Sonuç özeti ve son olaylar
  const finalSnapshot = sim.getSnapshot();
  console.log(`\n📋 YARIŞ ÖZETİ VE KRİTİK OLAYLAR (Son 15 Olay):`);
  finalSnapshot.recentEvents.slice(0, 15).reverse().forEach((evt) => {
    console.log(`   [Tur ${evt.lap.toString().padStart(2, ' ')}] ${evt.message}`);
  });

  console.log(`\n✅ [Faz 1] Simülasyon Testi Başarıyla Tamamlandı!`);
}

runTestSimulation().catch(console.error);
