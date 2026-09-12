import { useState } from 'react';
import { DEFAULT_DRIVERS_2026, DEFAULT_TEAMS_2026 } from './data/defaultGrid2026';
import { DEFAULT_TRACKS } from './data/defaultTracks';
import { RaceSimulation } from './engine/RaceSimulation';
import { SimulationSnapshot, TireCompound } from './types';
import { Radio, Gauge, RotateCcw, Play } from 'lucide-react';

export default function App() {
  const [selectedTrack] = useState(DEFAULT_TRACKS[0]);
  const [sim, setSim] = useState(() => new RaceSimulation({
    track: selectedTrack,
    teams: DEFAULT_TEAMS_2026,
    drivers: DEFAULT_DRIVERS_2026,
    initialTireCompound: 'SOFT',
  }));
  const [snapshot, setSnapshot] = useState<SimulationSnapshot>(() => sim.getSnapshot());

  const handleNextLap = () => {
    const snap = sim.simulateLap();
    setSnapshot({ ...snap });
  };

  const handleBox = (driverId: string, compound: TireCompound) => {
    sim.orderBox(driverId, compound);
    setSnapshot({ ...sim.getSnapshot() });
  };

  const handleReset = () => {
    const newSim = new RaceSimulation({
      track: selectedTrack,
      teams: DEFAULT_TEAMS_2026,
      drivers: DEFAULT_DRIVERS_2026,
      initialTireCompound: 'SOFT',
    });
    setSim(newSim);
    setSnapshot(newSim.getSnapshot());
  };

  const leaderCar = snapshot.leaderboard[0];
  const leaderDriver = sim.getDriver(leaderCar?.driverId || '');

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col p-4">
      {/* Top Telemetry Header */}
      <header className="border-b border-neutral-800 pb-3 mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl font-bold tracking-wider uppercase text-neutral-100 font-mono">
              PITWALL: FORMULA MANAGER
            </h1>
            <span className="text-xs bg-red-950/80 text-red-400 border border-red-800/60 px-2 py-0.5 rounded font-mono font-semibold">
              2026 ACTIVE AERO & MOM
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Pist: {selectedTrack.name} ({selectedTrack.totalLaps} Tur) | Durum: {snapshot.flag}
          </p>
        </div>

        {/* Global Stats */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded">
            <span className="text-neutral-500 block text-[10px]">CURRENT LAP</span>
            <span className="text-sm font-bold text-amber-400">
              {snapshot.currentLap} / {snapshot.totalLaps}
            </span>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded">
            <span className="text-neutral-500 block text-[10px]">RACE LEADER</span>
            <span className="text-sm font-bold text-emerald-400">
              {leaderDriver?.name || '---'} ({leaderDriver?.shortCode})
            </span>
          </div>

          {snapshot.fastestLap && (
            <div className="bg-neutral-900 border border-purple-900/60 px-3 py-1.5 rounded text-purple-300">
              <span className="text-purple-400 block text-[10px]">FASTEST LAP 🟣</span>
              <span className="text-sm font-bold">
                {sim.getDriver(snapshot.fastestLap.driverId)?.shortCode} ({snapshot.fastestLap.lapTimeSec.toFixed(3)}s)
              </span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleNextLap}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 rounded text-xs transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" /> TUR ATLA (+1 LAP)
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2.5 py-2 rounded text-xs transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> SIFIRLA
            </button>
          </div>
        </div>
      </header>

      {/* Main Command Center Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        {/* Left 8 Cols: Live Timing Tower */}
        <div className="lg:col-span-8 bg-neutral-900/60 border border-neutral-800 rounded-lg p-3 flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800 mb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-300">
              <Gauge className="w-4 h-4 text-emerald-400" />
              CANLI SIRALAMA KULESİ (LIVE TIMING TOWER)
            </div>
            <span className="text-[11px] text-neutral-500 font-mono">
              22 ARAÇLIK YAŞAYAN GRID
            </span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-neutral-500 border-b border-neutral-800/80 text-[11px]">
                  <th className="py-1 px-2">POS</th>
                  <th className="py-1 px-2">PILOT</th>
                  <th className="py-1 px-2">TAKIM</th>
                  <th className="py-1 px-2">LASTİK & ISI</th>
                  <th className="py-1 px-2">SAĞLIK</th>
                  <th className="py-1 px-2">BATARYA</th>
                  <th className="py-1 px-2">FARK</th>
                  <th className="py-1 px-2">SEKTÖRLER</th>
                  <th className="py-1 px-2">SON TUR</th>
                  <th className="py-1 px-2 text-right">TAKTIK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-850">
                {snapshot.leaderboard.map((car, idx) => {
                  const driver = sim.getDriver(car.driverId)!;
                  const team = sim.getTeam(car.teamId)!;
                  const isCliff = car.tires.isCliffHit;

                  return (
                    <tr
                      key={car.driverId}
                      className={`hover:bg-neutral-800/40 transition ${
                        idx === 0 ? 'bg-amber-950/20' : ''
                      }`}
                    >
                      <td className="py-1.5 px-2 font-bold text-neutral-300">
                        {idx + 1}
                      </td>
                      <td className="py-1.5 px-2 font-semibold">
                        <span
                          className="inline-block w-2 h-2 rounded-full mr-1.5"
                          style={{ backgroundColor: team.colorHex }}
                        />
                        <span className="text-neutral-100">{driver.shortCode}</span>
                        <span className="text-neutral-500 text-[10px] ml-1">#{driver.number}</span>
                      </td>
                      <td className="py-1.5 px-2 text-neutral-400 text-[11px]">
                        {team.shortName}
                      </td>
                      <td className="py-1.5 px-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              car.tires.compound === 'SOFT'
                                ? 'bg-red-950 text-red-400 border border-red-800'
                                : car.tires.compound === 'MEDIUM'
                                ? 'bg-yellow-950 text-yellow-400 border border-yellow-800'
                                : 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                            }`}
                          >
                            {car.tires.compound[0]} ({car.tires.ageLaps}L)
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {car.tires.tempCelsius.toFixed(0)}°C
                          </span>
                          {car.inDirtyAir && (
                            <span className="text-[9px] text-orange-400 font-mono" title="Kirli hava: Lastik ısınıyor">
                              💨
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-1.5 px-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-10 bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full ${
                                isCliff ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${car.tires.healthPct}%` }}
                            />
                          </div>
                          <span
                            className={`text-[11px] ${
                              isCliff ? 'text-red-400 font-bold' : 'text-neutral-300'
                            }`}
                          >
                            {car.tires.healthPct.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-1.5 px-2">
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-cyan-400 font-semibold">
                            {car.batterySoCPct.toFixed(0)}%
                          </span>
                          {car.momActive && (
                            <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-700 px-1 rounded animate-pulse">
                              MOM 🚀
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-1.5 px-2 text-neutral-300 font-mono text-[11px]">
                        {idx === 0 ? (
                          <span className="text-amber-400 font-bold">LİDER</span>
                        ) : (
                          `+${car.gapToLeaderSec.toFixed(1)}s`
                        )}
                      </td>
                      <td className="py-1.5 px-2">
                        <div className="flex items-center gap-1 text-[10px] font-mono">
                          {car.sectorTimes.map((secTime, sIdx) => {
                            const status = car.sectorStatuses[sIdx];
                            return (
                              <span
                                key={sIdx}
                                className={`px-1 py-0.5 rounded text-[9px] font-bold ${
                                  status === 'PURPLE'
                                    ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                    : status === 'GREEN'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : 'bg-neutral-800/80 text-neutral-400'
                                }`}
                              >
                                {secTime > 0 ? secTime.toFixed(1) : '-'}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-1.5 px-2 text-neutral-400 font-mono text-[11px]">
                        {car.lastLapTimeSec ? `${car.lastLapTimeSec.toFixed(3)}s` : '---'}
                      </td>
                      <td className="py-1.5 px-2 text-right">
                        {car.pitRequestedNextLap ? (
                          <span className="text-[10px] bg-red-900/80 text-red-200 px-1.5 py-0.5 rounded animate-pulse">
                            BOX NEXT
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleBox(car.driverId, 'HARD')}
                              className="text-[10px] bg-neutral-800 hover:bg-neutral-700 px-1.5 py-0.5 rounded text-neutral-300 cursor-pointer"
                              title="Pite çağır (Hard lastik tak)"
                            >
                              BOX
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 4 Cols: Event Feed & Radio Telemetry */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Race Event Radio Log */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-3 flex-1 flex flex-col">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-300 pb-2 border-b border-neutral-800 mb-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              TELSİZ VE YARIŞ AKIŞI (RACE EVENTS)
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 max-h-[520px] pr-1">
              {snapshot.recentEvents.length === 0 ? (
                <div className="text-xs text-neutral-600 text-center py-8">
                  Yarış henüz başlamadı. 'TUR ATLA' düğmesine basarak simülasyonu başlatın.
                </div>
              ) : (
                snapshot.recentEvents.map((evt) => {
                  return (
                    <div
                      key={evt.id}
                      className={`text-xs p-2 rounded border font-mono ${
                        evt.severity === 'DANGER'
                          ? 'bg-red-950/40 border-red-800 text-red-200'
                          : evt.severity === 'WARNING'
                          ? 'bg-amber-950/40 border-amber-800 text-amber-200'
                          : evt.severity === 'TACTICAL'
                          ? 'bg-purple-950/40 border-purple-800 text-purple-200'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-neutral-500 mb-0.5">
                        <span>LAP {evt.lap}</span>
                        <span>{evt.type}</span>
                      </div>
                      <p className="leading-snug">{evt.message}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
