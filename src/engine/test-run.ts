import { DEFAULT_DRIVERS_2026, DEFAULT_TEAMS_2026 } from '../data/defaultGrid2026';
import { DEFAULT_TRACKS } from '../data/defaultTracks';
import { RaceSimulation } from './RaceSimulation';

function printLeaderboard(sim: RaceSimulation, lap: number) {
  const snapshot = sim.getSnapshot();
  console.log(`\n==========================================================================================`);
  console.log(`🏁 PITWALL: FORMULA MANAGER — LIVE TIMING TOWER (LAP ${lap}/${snapshot.totalLaps})`);
  console.log(`   Track: Monza (Royal Temple) | Status: ${snapshot.flag} | Wetness: ${snapshot.trackWetnessPct}%`);
  
  if (snapshot.fastestLap) {
    const d = sim.getDriver(snapshot.fastestLap.driverId);
    console.log(`   🟣 FASTEST LAP: ${d?.shortCode} — ${(snapshot.fastestLap.lapTimeSec).toFixed(3)}s (Lap ${snapshot.fastestLap.lapNumber})`);
  }

  const sBest = snapshot.sessionBestSectors;
  console.log(`   SECTOR BESTS -> S1: ${sBest[0]?.toFixed(3) || '---'}s | S2: ${sBest[1]?.toFixed(3) || '---'}s | S3: ${sBest[2]?.toFixed(3) || '---'}s`);
  console.log(`------------------------------------------------------------------------------------------`);
  console.log(`POS  #   DRIVER       TEAM        TIRE       HEALTH   TEMP   BATTERY   GAP      SECTORS (S1/S2/S3)`);
  console.log(`------------------------------------------------------------------------------------------`);

  snapshot.leaderboard.forEach((car, index) => {
    const driver = sim.getDriver(car.driverId)!;
    const team = sim.getTeam(car.teamId)!;

    const pos = (index + 1).toString().padStart(2, ' ');
    const num = car.carNumber.toString().padStart(2, ' ');
    const name = driver.shortCode.padEnd(4, ' ');
    const teamName = team.shortName.padEnd(9, ' ');

    const tireColor = car.tires.compound === 'SOFT' ? '🔴 S' : car.tires.compound === 'MEDIUM' ? '🟡 M' : '⚪ H';
    const tireInfo = `${tireColor} ${car.tires.ageLaps}L`.padEnd(9, ' ');
    const health = `${car.tires.healthPct.toFixed(0)}%`.padStart(4, ' ') + (car.tires.isCliffHit ? '⚠️' : '  ');
    const temp = `${car.tires.tempCelsius.toFixed(0)}°C`.padStart(6, ' ') + (car.inDirtyAir ? '💨' : '  ');
    const battery = `${car.batterySoCPct.toFixed(0)}%`.padStart(5, ' ') + (car.momActive ? '🚀' : '  ');

    const gap = index === 0 ? 'LEADER  ' : `+${car.gapToLeaderSec.toFixed(1)}s`.padStart(8, ' ');

    const s1Icon = car.sectorStatuses[0] === 'PURPLE' ? '🟣' : car.sectorStatuses[0] === 'GREEN' ? '🟢' : '🟡';
    const s2Icon = car.sectorStatuses[1] === 'PURPLE' ? '🟣' : car.sectorStatuses[1] === 'GREEN' ? '🟢' : '🟡';
    const s3Icon = car.sectorStatuses[2] === 'PURPLE' ? '🟣' : car.sectorStatuses[2] === 'GREEN' ? '🟢' : '🟡';
    const sectors = `${s1Icon}${car.sectorTimes[0].toFixed(1)} ${s2Icon}${car.sectorTimes[1].toFixed(1)} ${s3Icon}${car.sectorTimes[2].toFixed(1)}`;

    console.log(`${pos}  #${num}  ${name}  ${teamName}  ${tireInfo}  ${health}  ${temp}  ${battery}  ${gap}  ${sectors}`);
  });
  console.log(`==========================================================================================`);
}

async function runTestSimulation() {
  console.log("🏎️ [Faz 1 Refactoring] Modüler Çekirdek Simülasyon Testi Başlatılıyor...");

  const track = DEFAULT_TRACKS[0]; // Monza
  const sim = new RaceSimulation({
    track,
    teams: DEFAULT_TEAMS_2026,
    drivers: DEFAULT_DRIVERS_2026,
    initialTireCompound: 'SOFT',
  });

  const totalTestLaps = 20;

  for (let lap = 1; lap <= totalTestLaps; lap++) {
    // Strategic commands
    if (lap === 3) {
      console.log(`\n📻 [Lap 3 Strateji Emri] C. Leconte (LEC) tempoyu artırıyor: PUSH modu!`);
      sim.setPaceMode('d_leconte', 'PUSH');
    }

    if (lap === 7) {
      console.log(`\n📻 [Lap 7 Strateji Emri] C. Leconte (LEC) için 2026 MOM Overtake devrede!`);
      sim.setEngineMode('d_leconte', 'OVERTAKE');
    }

    // Teammate Double-Stack test on Lap 10: Calling both Ferrari drivers (LEC & HAM) in the exact same lap!
    if (lap === 10) {
      console.log(`\n🚨 [Lap 10 DOUBLE-STACK TESTİ] Scuderia Rossa ikisini birden çağırıyor: LEC ve HAM aynı tur pite!`);
      sim.orderBox('d_leconte', 'HARD');
      sim.orderBox('d_hampton', 'HARD');
    }

    if (lap === 11) {
      sim.setPaceMode('d_leconte', 'BALANCED');
      sim.setEngineMode('d_leconte', 'STANDARD');
      sim.setPaceMode('d_hampton', 'BALANCED');
    }

    sim.simulateLap();

    if (lap === 1 || lap === 5 || lap === 10 || lap === 11 || lap === 20) {
      printLeaderboard(sim, lap);
    }
  }

  // Highlights
  const finalSnapshot = sim.getSnapshot();
  console.log(`\n📋 YARIŞ ÖZETİ VE KRİTİK OLAYLAR (Son 15 Olay):`);
  finalSnapshot.recentEvents.slice(0, 15).reverse().forEach((evt) => {
    console.log(`   [Lap ${evt.lap.toString().padStart(2, ' ')}] ${evt.message}`);
  });

  console.log(`\n✅ [Faz 1 Refactoring] Modüler Motor, Sektör Zamanlaması ve Double-Stack Testi Başarıyla Tamamlandı!`);
}

runTestSimulation().catch(console.error);
