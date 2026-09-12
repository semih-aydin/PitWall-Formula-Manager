import { DEFAULT_DRIVERS_2026, DEFAULT_TEAMS_2026 } from '../data/defaultGrid2026';
import { DEFAULT_TRACKS } from '../data/defaultTracks';
import { RaceSimulation } from './RaceSimulation';

function printLeaderboard(sim: RaceSimulation, lap: number) {
  const snapshot = sim.getSnapshot();
  console.log(`\n================================================================================`);
  console.log(`🏁 PITWALL: FORMULA MANAGER — LIVE TIMING TOWER (LAP ${lap}/${snapshot.totalLaps})`);
  console.log(`   Track: Monza (Royal Temple) | Status: ${snapshot.flag} | Wetness: ${snapshot.trackWetnessPct}%`);
  if (snapshot.fastestLap) {
    const d = sim.getDriver(snapshot.fastestLap.driverId);
    console.log(`   🟣 FASTEST LAP: ${d?.shortCode} — ${(snapshot.fastestLap.lapTimeSec).toFixed(3)}s (Lap ${snapshot.fastestLap.lapNumber})`);
  }
  console.log(`--------------------------------------------------------------------------------`);
  console.log(`POS  #   DRIVER       TEAM        TIRE       AGE   HEALTH   BATTERY   GAP      LAST LAP`);
  console.log(`--------------------------------------------------------------------------------`);

  snapshot.leaderboard.forEach((car, index) => {
    const driver = sim.getDriver(car.driverId)!;
    const team = sim.getTeam(car.teamId)!;

    const pos = (index + 1).toString().padStart(2, ' ');
    const num = car.carNumber.toString().padStart(2, ' ');
    const name = driver.shortCode.padEnd(4, ' ');
    const teamName = team.shortName.padEnd(9, ' ');
    
    // Tire format
    const tireColor = car.tires.compound === 'SOFT' ? '🔴 S' : car.tires.compound === 'MEDIUM' ? '🟡 M' : '⚪ H';
    const tireInfo = `${tireColor}`.padEnd(10, ' ');
    const age = `${car.tires.ageLaps}L`.padStart(4, ' ');
    const health = `${car.tires.healthPct.toFixed(0)}%`.padStart(5, ' ') + (car.tires.isCliffHit ? '⚠️' : '  ');
    const battery = `${car.batterySoCPct.toFixed(0)}%`.padStart(5, ' ') + (car.momActive ? '🚀' : '  ');
    
    const gap = index === 0 ? 'LEADER  ' : `+${car.gapToLeaderSec.toFixed(1)}s`.padStart(8, ' ');
    const lastLap = car.lastLapTimeSec ? `${car.lastLapTimeSec.toFixed(3)}s` : '---';

    console.log(`${pos}  #${num}  ${name}  ${teamName}  ${tireInfo}  ${age}   ${health}   ${battery}   ${gap}   ${lastLap}`);
  });
  console.log(`================================================================================`);
}

async function runTestSimulation() {
  console.log("🏎️ [Faz 1] PitWall Çekirdek Simülasyon Testi Başlatılıyor...");

  const track = DEFAULT_TRACKS[0]; // Monza
  const sim = new RaceSimulation({
    track,
    teams: DEFAULT_TEAMS_2026,
    drivers: DEFAULT_DRIVERS_2026,
    initialTireCompound: 'SOFT',
  });

  const totalTestLaps = 20;

  for (let lap = 1; lap <= totalTestLaps; lap++) {
    // Strategic commands simulation
    if (lap === 3) {
      console.log(`\n📻 [Lap 3 Strateji Emri] C. Leconte (LEC) tempoyu artırıyor: PUSH modu!`);
      sim.setPaceMode('d_leconte', 'PUSH');
    }

    if (lap === 7) {
      console.log(`\n📻 [Lap 7 Strateji Emri] C. Leconte (LEC) için 2026 MOM Overtake ve PUSH devrede!`);
      sim.setEngineMode('d_leconte', 'OVERTAKE');
    }

    if (lap === 10) {
      console.log(`\n📻 [Lap 10 Strateji Emri] BOX, BOX, BOX! C. Leconte (LEC) pite çağrılıyor -> HARD lastik takılacak.`);
      sim.orderBox('d_leconte', 'HARD');
    }

    if (lap === 11) {
      sim.setPaceMode('d_leconte', 'BALANCED');
      sim.setEngineMode('d_leconte', 'STANDARD');
    }

    sim.simulateLap();

    // Print leaderboard at key intervals
    if (lap === 1 || lap === 5 || lap === 10 || lap === 15 || lap === 20) {
      printLeaderboard(sim, lap);
    }
  }

  // Print recent highlights
  const finalSnapshot = sim.getSnapshot();
  console.log(`\n📋 YARIŞ ÖZETİ VE KRİTİK OLAYLAR (Son 15 Olay):`);
  finalSnapshot.recentEvents.slice(0, 15).reverse().forEach((evt) => {
    console.log(`   [Lap ${evt.lap.toString().padStart(2, ' ')}] ${evt.message}`);
  });

  console.log(`\n✅ [Faz 1] Çekirdek Simülasyon Testi Başarıyla Tamamlandı!`);
}

runTestSimulation().catch(console.error);
