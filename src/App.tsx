// PitWall: Formula Manager — Ana Taktik Kokpiti (Tactical Cockpit)
// F1 Manager + Canlı Zamanlama Kulesi + 2D Vektör Pist Radarı ve Hayalet Çıkış (Rejoin Ghost).
// Tasarım İlkesi: Emojisiz, NASA telemetri masası zarafetinde, ultra şık karanlık mod.

import { useState, useEffect, useRef } from 'react';
import { DEFAULT_DRIVERS_2026, DEFAULT_TEAMS_2026 } from './data/defaultGrid2026';
import { DEFAULT_TRACKS } from './data/defaultTracks';
import { RaceSimulation } from './engine/RaceSimulation';
import { CircuitRadar } from './components/CircuitRadar';
import { LiveTimingTower } from './components/LiveTimingTower';
import { DriverTelemetryCard } from './components/DriverTelemetryCard';
import { EventFeed } from './components/EventFeed';
import { SpeedControls } from './components/SpeedControls';
import { AudioControls } from './components/AudioControls';
import { SimulationSnapshot, TireCompound, PaceMode, EngineMode } from './types';
import { Activity, Flag } from 'lucide-react';

export default function App() {
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0);
  const selectedTrack = DEFAULT_TRACKS[selectedTrackIndex];

  // Yarış motorunu oluşturuyoruz
  const [sim, setSim] = useState(() => new RaceSimulation({
    track: selectedTrack,
    teams: DEFAULT_TEAMS_2026,
    drivers: DEFAULT_DRIVERS_2026,
    initialTireCompound: 'SOFT',
  }));

  const [snapshot, setSnapshot] = useState<SimulationSnapshot>(() => sim.getSnapshot());
  const [selectedDriverId, setSelectedDriverId] = useState<string>('d_leconte'); // Varsayılan: Charles Leconte
  
  // Simülasyon Canlı Oynatma ve Hız Kontrolleri
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const lastTickTimeRef = useRef<number>(Date.now());

  // Canlı Simülasyon Döngüsü (Tick Loop)
  useEffect(() => {
    if (!isPlaying) return;

    lastTickTimeRef.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const rawDtSec = (now - lastTickTimeRef.current) / 1000;
      lastTickTimeRef.current = now;

      // dtSec sınırlandırması (arka sekmede kalınca ani zıplamaları önler)
      const clampedDt = Math.min(rawDtSec, 0.1);
      const effectiveDt = clampedDt * speedMultiplier * 1.5;

      const newSnap = sim.simulateTick(effectiveDt);
      setSnapshot({ ...newSnap });

      if (newSnap.flag === 'CHEQUERED') {
        setIsPlaying(false);
      }
    }, 40); // ~25 FPS akıcı telemetri güncellemesi

    return () => clearInterval(interval);
  }, [isPlaying, speedMultiplier, sim]);

  // Manuel 1 Tur İlerlet
  const handleNextLap = () => {
    const snap = sim.simulateLap();
    setSnapshot({ ...snap });
    if (snap.flag === 'CHEQUERED') {
      setIsPlaying(false);
    }
  };

  // Pite Çağır (Box)
  const handleOrderBox = (driverId: string, compound: TireCompound) => {
    sim.orderBox(driverId, compound);
    setSnapshot({ ...sim.getSnapshot() });
  };

  // Sürüş Temposu (Push / Balanced / Conserve)
  const handlePaceChange = (mode: PaceMode) => {
    sim.setPaceMode(selectedDriverId, mode);
    setSnapshot({ ...sim.getSnapshot() });
  };

  // Motor Modu (Eco / Standard / Overtake)
  const handleEngineChange = (mode: EngineMode) => {
    sim.setEngineMode(selectedDriverId, mode);
    setSnapshot({ ...sim.getSnapshot() });
  };

  // Sıfırla
  const handleReset = () => {
    setIsPlaying(false);
    const newSim = new RaceSimulation({
      track: selectedTrack,
      teams: DEFAULT_TEAMS_2026,
      drivers: DEFAULT_DRIVERS_2026,
      initialTireCompound: 'SOFT',
    });
    setSim(newSim);
    setSnapshot(newSim.getSnapshot());
  };

  // Pist Değiştir
  const handleTrackChange = (idx: number) => {
    setIsPlaying(false);
    setSelectedTrackIndex(idx);
    const newSim = new RaceSimulation({
      track: DEFAULT_TRACKS[idx],
      teams: DEFAULT_TEAMS_2026,
      drivers: DEFAULT_DRIVERS_2026,
      initialTireCompound: 'SOFT',
    });
    setSim(newSim);
    setSnapshot(newSim.getSnapshot());
  };

  // Seçili aracın Rejoin Ghost projeksiyonu
  const rejoinProjection = sim.calculateRejoinProjection(selectedDriverId);
  const selectedCar = snapshot.leaderboard.find((c) => c.driverId === selectedDriverId) || snapshot.leaderboard[0];
  const selectedDriver = sim.getDriver(selectedCar?.driverId || '');
  const selectedTeam = sim.getTeam(selectedCar?.teamId || '');
  const selectedPosition = snapshot.leaderboard.findIndex((c) => c.driverId === selectedDriverId) + 1;

  const leaderCar = snapshot.leaderboard[0];
  const leaderDriver = sim.getDriver(leaderCar?.driverId || '');

  // Undercut / Overcut hesaplaması için öndeki ve arkadaki araçlar
  const selectedIndex = snapshot.leaderboard.findIndex((c) => c.driverId === selectedDriverId);
  const aheadCar = selectedIndex > 0 ? snapshot.leaderboard[selectedIndex - 1] : undefined;
  const aheadDriver = aheadCar ? sim.getDriver(aheadCar.driverId) : undefined;
  const behindCar = selectedIndex < snapshot.leaderboard.length - 1 ? snapshot.leaderboard[selectedIndex + 1] : undefined;
  const behindDriver = behindCar ? sim.getDriver(behindCar.driverId) : undefined;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col p-3 gap-3 font-mono">
      {/* Üst Komuta Paneli ve Global Telemetri Başlığı */}
      <header className="border border-neutral-800 bg-neutral-900/80 rounded-lg p-3 flex flex-wrap items-center justify-between gap-4 select-none">
        {/* Sol: Logo ve 2026 Göstergesi */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-cyan-950 border border-cyan-500 flex items-center justify-center">
            <Activity className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-wider uppercase text-neutral-100">
                PITWALL: FORMULA MANAGER
              </h1>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.5 rounded font-bold">
                2026 AKTİF AERO & MOM
              </span>
            </div>
            {/* Pist Seçici */}
            <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
              <span>PİST:</span>
              <select
                value={selectedTrackIndex}
                onChange={(e) => handleTrackChange(Number(e.target.value))}
                className="bg-neutral-800 border border-neutral-700 text-neutral-200 px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer focus:outline-none"
              >
                {DEFAULT_TRACKS.map((t, idx) => (
                  <option key={t.id} value={idx}>
                    {t.name} ({t.totalLaps} Tur)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Orta: Canlı Yarış İstatistikleri */}
        <div className="flex items-center gap-3 text-xs">
          {/* Tur Sayacı */}
          <div className="bg-neutral-950 border border-neutral-800 px-3 py-1.5 rounded">
            <span className="text-neutral-500 block text-[9px]">TUR SAYACI</span>
            <span className="text-sm font-bold text-amber-400">
              {snapshot.currentLap} / {snapshot.totalLaps}
            </span>
          </div>

          {/* Yarış Lideri */}
          <div className="bg-neutral-950 border border-neutral-800 px-3 py-1.5 rounded">
            <span className="text-neutral-500 block text-[9px]">YARIŞ LİDERİ</span>
            <span className="text-sm font-bold text-emerald-400">
              {leaderDriver?.shortCode} ({leaderDriver?.name})
            </span>
          </div>

          {/* En Hızlı Tur */}
          {snapshot.fastestLap && (
            <div className="bg-neutral-950 border border-purple-900/80 px-3 py-1.5 rounded text-purple-300">
              <span className="text-purple-400 block text-[9px]">EN HIZLI TUR</span>
              <span className="text-sm font-bold">
                {sim.getDriver(snapshot.fastestLap.driverId)?.shortCode} ({snapshot.fastestLap.lapTimeSec.toFixed(3)}s)
              </span>
            </div>
          )}

          {/* Bayrak Durumu */}
          <div
            className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 border transition-all ${
              snapshot.flag === 'CHEQUERED'
                ? 'bg-neutral-100 text-neutral-950 border-neutral-300 font-black animate-pulse'
                : snapshot.flag === 'YELLOW'
                ? 'bg-yellow-950 border-yellow-800 text-yellow-400'
                : snapshot.flag === 'RED'
                ? 'bg-red-950 border-red-800 text-red-400'
                : 'bg-neutral-950 border-neutral-800 text-emerald-400'
            }`}
          >
            <Flag className={`w-3.5 h-3.5 ${snapshot.flag === 'CHEQUERED' ? 'text-neutral-950' : 'text-emerald-400'}`} />
            <span className="text-xs font-bold font-mono">
              {snapshot.flag === 'CHEQUERED' ? 'DAMALI BAYRAK' : snapshot.flag}
            </span>
          </div>
        </div>

        {/* Sağ: Ses ve Hız Kontrol Barı */}
        <div className="flex items-center gap-2">
          <AudioControls />
          <SpeedControls
            isPlaying={isPlaying}
            speedMultiplier={speedMultiplier}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            onSetSpeed={(s) => setSpeedMultiplier(s)}
            onNextLap={handleNextLap}
            onReset={handleReset}
          />
        </div>
      </header>

      {/* Ana Kokpit Izgarası (Grid Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1">
        {/* Sol Panel: Canlı Sıralama Kulesi (6 Kolon) */}
        <div className="lg:col-span-6 flex flex-col h-full">
          <LiveTimingTower
            leaderboard={snapshot.leaderboard}
            selectedDriverId={selectedDriverId}
            onSelectDriver={(id) => setSelectedDriverId(id)}
            onOrderBox={(id, compound) => handleOrderBox(id, compound)}
            getDriver={(id) => sim.getDriver(id)}
            getTeam={(id) => sim.getTeam(id)}
          />
        </div>

        {/* Sağ Panel: 2D Pist Radarı + Telemetri Masası (6 Kolon) */}
        <div className="lg:col-span-6 flex flex-col gap-3">
          {/* Üst: 2B Vektör Pist Radarı ve Hayalet Çıkış (Rejoin Ghost) */}
          <div className="h-[420px] w-full">
            <CircuitRadar
              trackId={selectedTrack.id}
              trackName={selectedTrack.name}
              cars={snapshot.leaderboard}
              selectedDriverId={selectedDriverId}
              rejoinProjection={rejoinProjection}
              getTeam={(id) => sim.getTeam(id)}
              getDriver={(id) => sim.getDriver(id)}
              onSelectDriver={(id) => setSelectedDriverId(id)}
            />
          </div>

          {/* Alt: Seçili Araç Telemetrisi ve Olay Günlüğü */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
            {/* Seçili Pilot Kokpiti */}
            {selectedCar && (
              <DriverTelemetryCard
                car={selectedCar}
                driver={selectedDriver}
                team={selectedTeam}
                position={selectedPosition}
                aheadCar={aheadCar}
                aheadDriver={aheadDriver}
                behindCar={behindCar}
                behindDriver={behindDriver}
                rejoinProjection={rejoinProjection}
                onPaceChange={handlePaceChange}
                onEngineChange={handleEngineChange}
                onOrderBox={(compound) => handleOrderBox(selectedDriverId, compound)}
              />
            )}

            {/* Telsiz ve Olay Akışı */}
            <div className="h-full">
              <EventFeed events={snapshot.recentEvents} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
