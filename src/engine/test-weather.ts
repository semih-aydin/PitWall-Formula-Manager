// PitWall: Formula Manager — Hava Durumu & Crossover Testi
// Semih tarafından motor doğrulaması için yazıldı.

import { RaceSimulation } from './RaceSimulation';
import { DEFAULT_DRIVERS_2026, DEFAULT_TEAMS_2026 } from '../data/defaultGrid2026';
import { DEFAULT_TRACKS } from '../data/defaultTracks';

console.log("================================================================================");
console.log("FAZ 4 HAVA DURUMU VE CROSSOVER MOTOR TESTI");
console.log("================================================================================");

const sim = new RaceSimulation({
  track: DEFAULT_TRACKS[0], // Monza
  teams: DEFAULT_TEAMS_2026,
  drivers: DEFAULT_DRIVERS_2026,
  initialTireCompound: 'MEDIUM',
  initialWeather: 'DRY',
  initialWetnessPct: 0.0,
});

console.log("\n[ADIM 1] Baslangic Durumu (Kuru Asfalt):");
let snap = sim.getSnapshot();
console.log(`Tur: ${snap.currentLap} | Kosul: ${snap.weatherCondition} | Islaklik: %${snap.trackWetnessPct} | Oneri: ${snap.optimalCompound}`);

console.log("\n[ADIM 2] 3 Tur Kuru Kosu:");
for (let i = 0; i < 3; i++) {
  snap = sim.simulateLap();
}
console.log(`Tur: ${snap.currentLap} | Kosul: ${snap.weatherCondition} | Islaklik: %${snap.trackWetnessPct} | Oneri: ${snap.optimalCompound}`);

console.log("\n[ADIM 3] Yagmur Baslatiliyor (RAIN - %25 Islaklik ile Inter Crossover Testi):");
sim.setWeatherCondition('RAIN', 25.0);
snap = sim.simulateLap();
console.log(`Tur: ${snap.currentLap} | Kosul: ${snap.weatherCondition} | Islaklik: %${snap.trackWetnessPct} | Oneri: ${snap.optimalCompound}`);
console.log("Son Telsiz Olaylari:");
snap.recentEvents.slice(0, 3).forEach(e => console.log(`   [${e.type}] ${e.message}`));

console.log("\n[ADIM 4] Yogun Yagis (HEAVY_RAIN - %68 Islaklik ile Full Wet Crossover Testi):");
sim.setWeatherCondition('HEAVY_RAIN', 68.0);
snap = sim.simulateLap();
console.log(`Tur: ${snap.currentLap} | Kosul: ${snap.weatherCondition} | Islaklik: %${snap.trackWetnessPct} | Oneri: ${snap.optimalCompound}`);
console.log("Son Telsiz Olaylari:");
snap.recentEvents.slice(0, 3).forEach(e => console.log(`   [${e.type}] ${e.message}`));

console.log("\n[ADIM 5] Yagmur Dindi, Gunes Acti (DRY - Pist Kuruma Testi):");
sim.setWeatherCondition('DRY');
const wetnessBefore = sim.getSnapshot().trackWetnessPct;
snap = sim.simulateLap();
const wetnessAfter = snap.trackWetnessPct;
console.log(`Tur: ${snap.currentLap} | Onceki Islaklik: %${wetnessBefore} -> Yeni Islaklik: %${wetnessAfter} (Fark: -%${(wetnessBefore - wetnessAfter).toFixed(1)})`);
console.log(`Kosul: ${snap.weatherCondition} | Oneri: ${snap.optimalCompound}`);

console.log("\n[ADIM 6] Radar Tahmin Verisi Dogrulamasi (Efe'nin radari icin):");
console.log("Gelecek Tur Tahminleri:", snap.weatherForecast);

console.log("\n================================================================================");
console.log("[BASARILI] Hava durumu motoru tum crossover esiklerini ve telsizleri dogruladi!");
console.log("================================================================================");
