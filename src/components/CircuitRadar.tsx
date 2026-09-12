// PitWall: Formula Manager — 2D Vektör Pist Radarı (Circuit Radar)
// Ekranda 3D grafik yerine minimalist neon çizgilerle pist ve 22 araba akar.
// En kritik strateji özelliği olan "The Rejoin Ghost" (Hayalet Çıkış) burada çizilir.
// Tamamen emojisiz, yüksek kontrastlı telemetri ve harita tasarımı.

import React from 'react';
import {
  CIRCUIT_GEOMETRIES,
  getCoordinatesAtLapProgress,
  getPitLaneCoordinates,
  getTrackNormalAtLapProgress,
  CircuitGeometry,
} from '../data/circuitGeometry';
import { CarState, Team, Driver } from '../types';
import { RadioAudioEngine } from '../audio/RadioAudioEngine';
import { Compass, Crosshair } from 'lucide-react';

interface CircuitRadarProps {
  trackId: string;
  trackName: string;
  cars: CarState[];
  selectedDriverId: string;
  rejoinProjection: {
    rejoinProgressPct: number;
    projectedPosition: number;
    aheadDriverCode?: string;
    behindDriverCode?: string;
    gapToAheadSec: number;
  };
  getTeam: (teamId: string) => Team | undefined;
  getDriver: (driverId: string) => Driver | undefined;
  onSelectDriver: (driverId: string) => void;
}

export const CircuitRadar: React.FC<CircuitRadarProps> = ({
  trackId,
  trackName,
  cars,
  selectedDriverId,
  rejoinProjection,
  getTeam,
  getDriver,
  onSelectDriver,
}) => {
  const geometry: CircuitGeometry = CIRCUIT_GEOMETRIES[trackId] || CIRCUIT_GEOMETRIES.track_monza;
  const { viewBox, points, pitLanePoints } = geometry;

  // Pist SVG Yolunu (Path) oluşturuyoruz - Kapalı döngü (Z)
  const trackPathData =
    points.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '') + ' Z';

  // Pit Yolu SVG Yolunu oluşturuyoruz
  const pitPathData = pitLanePoints.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  // Seçili aracın anlık koordinatı
  const selectedCar = cars.find((c) => c.driverId === selectedDriverId) || cars[0];
  const selectedCoords = selectedCar
    ? selectedCar.inPitLane
      ? getPitLaneCoordinates(geometry, Math.min(1.0, selectedCar.lapProgressPct / 0.12))
      : getCoordinatesAtLapProgress(geometry, selectedCar.lapProgressPct)
    : { x: 0, y: 0 };

  // Rejoin Ghost (Hayalet Çıkış) koordinatı
  const ghostCoords = getCoordinatesAtLapProgress(geometry, rejoinProjection.rejoinProgressPct);

  // Sektör Dik Çizgileri (S1, S2 ve S/F)
  const sfInfo = getTrackNormalAtLapProgress(geometry, 0.0);
  const s1Info = getTrackNormalAtLapProgress(geometry, geometry.sector1EndPct);
  const s2Info = getTrackNormalAtLapProgress(geometry, geometry.sector2EndPct);

  const getSplitLineCoords = (
    info: { point: { x: number; y: number }; normal: { x: number; y: number } },
    width = 16
  ) => {
    return {
      x1: info.point.x - info.normal.x * width,
      y1: info.point.y - info.normal.y * width,
      x2: info.point.x + info.normal.x * width,
      y2: info.point.y + info.normal.y * width,
      labelX: info.point.x + info.normal.x * (width + 10),
      labelY: info.point.y + info.normal.y * (width + 10),
    };
  };

  const sfLine = getSplitLineCoords(sfInfo, 18);
  const s1Line = getSplitLineCoords(s1Info, 16);
  const s2Line = getSplitLineCoords(s2Info, 16);

  const handleCarClick = (driverId: string) => {
    RadioAudioEngine.playTacticalClick();
    onSelectDriver(driverId);
  };

  return (
    <div className="relative w-full h-full bg-slate-950/90 border border-neutral-800 rounded-lg overflow-hidden flex flex-col p-3 shadow-inner">
      {/* Üst Bilgi Başlığı (Pist Radarı & Aktif Bilgi) */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-800 mb-2 z-10 select-none">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-bold font-mono tracking-wider uppercase text-neutral-100">
              CANLI PİST RADARI // {trackName}
            </span>
          </div>
        </div>

        {/* Rejoin Ghost Bilgi Kartı */}
        <div className="flex items-center gap-2 text-[11px] font-mono bg-neutral-900 border border-cyan-800/80 px-2.5 py-1 rounded shadow-[0_0_10px_rgba(6,182,212,0.15)]">
          <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-cyan-300 font-bold uppercase tracking-wide">
            HAYALET ÇIKIŞ: P{rejoinProjection.projectedPosition}
          </span>
          {rejoinProjection.aheadDriverCode && (
            <span className="text-neutral-400 hidden sm:inline">
              ({rejoinProjection.aheadDriverCode} arkasında +{rejoinProjection.gapToAheadSec.toFixed(1)}s)
            </span>
          )}
        </div>
      </div>

      {/* SVG Radar Ekranı */}
      <div className="flex-1 min-h-0 w-full flex items-center justify-center relative select-none">
        <svg
          viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full max-h-full"
          style={{ filter: 'drop-shadow(0 0 12px rgba(6, 182, 212, 0.12))' }}
        >
          <defs>
            {/* Neon Çizgisi Işıltı Filtresi */}
            <filter id="neon-line-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Hayalet Araç Hologram Deseni */}
            <radialGradient id="ghost-glow-gradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#0891b2" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0891b2" stopOpacity="0" />
            </radialGradient>

            {/* Telemetri Izgarası */}
            <pattern id="radar-blueprint-grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeOpacity="0.4" />
              <circle cx="25" cy="25" r="0.75" fill="#334155" opacity="0.6" />
            </pattern>
          </defs>

          {/* 1. Arka Plan Vektör Izgarası (F1 GPS Arayüzü) */}
          <rect width={viewBox.width} height={viewBox.height} fill="#030712" />
          <rect width={viewBox.width} height={viewBox.height} fill="url(#radar-blueprint-grid)" />

          {/* Köşe Telemetri Pusulası */}
          <g transform="translate(40, 40)" opacity="0.4">
            <circle r="16" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="0" y1="-14" x2="0" y2="14" stroke="#475569" strokeWidth="1" />
            <line x1="-14" y1="0" x2="14" y2="0" stroke="#475569" strokeWidth="1" />
            <text x="-4" y="-18" fill="#64748b" fontSize="8" fontFamily="monospace" fontWeight="bold">N</text>
          </g>

          {/* 2. Pist Dış Güvenlik Şeridi (Run-off Border) */}
          <path
            d={trackPathData}
            fill="none"
            stroke="#1e293b"
            strokeWidth="32"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 3. Kerbler (Dış Hat Kırmızı-Beyaz Kerb Deseni) */}
          <path
            d={trackPathData}
            fill="none"
            stroke="#ef4444"
            strokeWidth="24"
            strokeDasharray="14 14"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.8"
          />
          <path
            d={trackPathData}
            fill="none"
            stroke="#f8fafc"
            strokeWidth="24"
            strokeDasharray="14 14"
            strokeDashoffset="14"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.8"
          />

          {/* 4. Ana Pist Asfalt Yatağı (Deep Charcoal Asphalt) */}
          <path
            d={trackPathData}
            fill="none"
            stroke="#090d16"
            strokeWidth="18"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 5. Neon Camgöbeği Yarış Çizgisi (Racing Line Groove) */}
          <path
            d={trackPathData}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#neon-line-glow)"
          />

          {/* 6. Pit Yolu (Asfalt ve Kesikli Şerit) */}
          <path
            d={pitPathData}
            fill="none"
            stroke="#0f172a"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={pitPathData}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="3.5"
            strokeDasharray="6 4"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />
          {/* Pit Yolu Etiketi */}
          {pitLanePoints[1] && (
            <text
              x={pitLanePoints[1].x}
              y={pitLanePoints[1].y + 14}
              textAnchor="middle"
              fill="#f59e0b"
              fontSize="9"
              fontFamily="monospace"
              fontWeight="bold"
            >
              [PIT ŞERİDİ]
            </text>
          )}

          {/* 7. Sektör Ayırıcı Çizgiler (S1 ve S2) */}
          {/* Sektör 1 */}
          <line
            x1={s1Line.x1}
            y1={s1Line.y1}
            x2={s1Line.x2}
            y2={s1Line.y2}
            stroke="#facc15"
            strokeWidth="2.5"
            strokeDasharray="2 2"
          />
          <g transform={`translate(${s1Line.labelX}, ${s1Line.labelY})`}>
            <rect x="-10" y="-7" width="20" height="14" rx="2" fill="#854d0e" stroke="#facc15" strokeWidth="1" />
            <text x="0" y="3" textAnchor="middle" fill="#fef08a" fontSize="8" fontFamily="monospace" fontWeight="bold">
              S1
            </text>
          </g>

          {/* Sektör 2 */}
          <line
            x1={s2Line.x1}
            y1={s2Line.y1}
            x2={s2Line.x2}
            y2={s2Line.y2}
            stroke="#facc15"
            strokeWidth="2.5"
            strokeDasharray="2 2"
          />
          <g transform={`translate(${s2Line.labelX}, ${s2Line.labelY})`}>
            <rect x="-10" y="-7" width="20" height="14" rx="2" fill="#854d0e" stroke="#facc15" strokeWidth="1" />
            <text x="0" y="3" textAnchor="middle" fill="#fef08a" fontSize="8" fontFamily="monospace" fontWeight="bold">
              S2
            </text>
          </g>

          {/* 8. Start / Finish Çizgisi */}
          <line
            x1={sfLine.x1}
            y1={sfLine.y1}
            x2={sfLine.x2}
            y2={sfLine.y2}
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeDasharray="3 3"
          />
          <g transform={`translate(${sfLine.labelX}, ${sfLine.labelY})`}>
            <rect x="-14" y="-7" width="28" height="14" rx="2" fill="#0f172a" stroke="#ffffff" strokeWidth="1" />
            <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize="7" fontFamily="monospace" fontWeight="bold">
              S / F
            </text>
          </g>

          {/* 9. Rejoin Ghost Projeksiyon Lazer Hattı */}
          {selectedCar && (
            <line
              x1={selectedCoords.x}
              y1={selectedCoords.y}
              x2={ghostCoords.x}
              y2={ghostCoords.y}
              stroke="#06b6d4"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              opacity="0.75"
            />
          )}

          {/* 10. The Rejoin Ghost (Hayalet Çıkış Noktası) */}
          <g transform={`translate(${ghostCoords.x}, ${ghostCoords.y})`}>
            <circle
              r="18"
              fill="url(#ghost-glow-gradient)"
              className="animate-ping"
              opacity="0.8"
            />
            <circle
              r="8"
              fill="#0891b2"
              stroke="#67e8f9"
              strokeWidth="2"
              opacity="0.95"
            />
            {/* Ghost Bilgi Rozeti */}
            <g transform="translate(12, -10)">
              <rect x="0" y="0" width="112" height="20" rx="3" fill="#083344" stroke="#06b6d4" strokeWidth="1" />
              <text x="6" y="14" fill="#67e8f9" fontSize="9" fontFamily="monospace" fontWeight="bold">
                HAYALET: P{rejoinProjection.projectedPosition}
              </text>
            </g>
          </g>

          {/* 11. 22 Araçlık Grid Noktaları (Neon Kapsüller) */}
          {cars.map((car) => {
            const coords = car.inPitLane
              ? getPitLaneCoordinates(geometry, Math.min(1.0, car.lapProgressPct / 0.12))
              : getCoordinatesAtLapProgress(geometry, car.lapProgressPct);
            const team = getTeam(car.teamId);
            const driver = getDriver(car.driverId);
            const isSelected = car.driverId === selectedDriverId;
            const isXMode = car.aeroMode === 'X_MODE' && !car.inPitLane;

            return (
              <g
                key={car.driverId}
                transform={`translate(${coords.x}, ${coords.y})`}
                className="cursor-pointer transition-transform hover:scale-125"
                onClick={() => handleCarClick(car.driverId)}
              >
                {/* Seçili araç için dış parlama halkası */}
                {isSelected && (
                  <>
                    <circle
                      r="16"
                      fill="none"
                      stroke="#22d3ee"
                      strokeWidth="1.5"
                      className="animate-ping"
                      opacity="0.75"
                    />
                    <circle
                      r="11"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="animate-pulse"
                    />
                  </>
                )}

                {/* X-Mode düzlük ışıltısı */}
                {isXMode && (
                  <circle
                    r="9"
                    fill="#38bdf8"
                    opacity="0.5"
                    className="animate-pulse"
                  />
                )}

                {/* Pit yolu ışıltısı */}
                {car.inPitLane && (
                  <circle
                    r="10"
                    fill="#f59e0b"
                    opacity="0.4"
                    className="animate-ping"
                  />
                )}

                {/* Araç Kapsülü (Takım Renginde) */}
                <circle
                  r={isSelected ? 6.5 : 5}
                  fill={car.inPitLane ? '#f59e0b' : team?.colorHex || '#ffffff'}
                  stroke={isSelected ? '#ffffff' : '#020617'}
                  strokeWidth="1.8"
                />

                {/* Pilot Kısaltması Rozeti */}
                <g transform="translate(8, -12)">
                  <rect
                    x="0"
                    y="0"
                    width={car.inPitLane ? 38 : isXMode ? 38 : 26}
                    height="13"
                    rx="2"
                    fill={
                      isSelected
                        ? '#06b6d4'
                        : car.inPitLane
                        ? '#78350f'
                        : '#090d16'
                    }
                    stroke={
                      isSelected
                        ? '#ffffff'
                        : car.inPitLane
                        ? '#f59e0b'
                        : '#334155'
                    }
                    strokeWidth="0.8"
                  />
                  <text
                    x="3"
                    y="9.5"
                    fill={
                      isSelected
                        ? '#020617'
                        : car.inPitLane
                        ? '#fef3c7'
                        : '#cbd5e1'
                    }
                    fontSize="8.5"
                    fontFamily="monospace"
                    fontWeight={isSelected ? 'bold' : '600'}
                  >
                    {driver?.shortCode}
                    {car.inPitLane ? ' [P]' : isXMode ? ' [X]' : ''}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Alt Açıklama Lejantı (Temiz, Emojisiz) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-800 text-[10px] font-mono text-neutral-400 select-none">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
            <span>X-MODE HATTI</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>PİT ŞERİDİ</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <span>SEKTÖR AYRIMLARI (S1, S2)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-cyan-400 bg-cyan-950" />
            <span>HAYALET ÇIKIŞ</span>
          </div>
        </div>

        <span className="text-neutral-500 hidden md:inline">
          * Haritadaki herhangi bir araca tıklayarak o pilotu seçebilir ve telsizini dinleyebilirsiniz.
        </span>
      </div>
    </div>
  );
};

