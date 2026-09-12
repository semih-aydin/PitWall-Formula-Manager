// PitWall: Formula Manager — 2D Vektör Pist Radarı (Circuit Radar)
// Ekranda 3D grafik yerine minimalist neon çizgilerle pist ve 22 araba akar.
// En kritik strateji özelliği olan "The Rejoin Ghost" (Hayalet Çıkış) burada çizilir.

import React from 'react';
import { CIRCUIT_GEOMETRIES, getCoordinatesAtLapProgress, CircuitGeometry } from '../data/circuitGeometry';
import { CarState, Team, Driver } from '../types';

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

  // Pist SVG Yolunu (Path) oluşturuyoruz
  const trackPathData = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  // Pit Yolu SVG Yolunu oluşturuyoruz
  const pitPathData = pitLanePoints.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  // Seçili aracın anlık koordinatı
  const selectedCar = cars.find((c) => c.driverId === selectedDriverId) || cars[0];
  const selectedCoords = selectedCar
    ? getCoordinatesAtLapProgress(geometry, selectedCar.lapProgressPct)
    : { x: 0, y: 0 };

  // Rejoin Ghost (Hayalet Çıkış) koordinatı
  const ghostCoords = getCoordinatesAtLapProgress(geometry, rejoinProjection.rejoinProgressPct);

  return (
    <div className="relative w-full h-full bg-neutral-950/80 border border-neutral-800 rounded-lg overflow-hidden flex flex-col p-3">
      {/* Üst Bilgi Başlığı (Pist Radarı & Aktif Bilgi) */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-800 mb-2 z-10">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-bold font-mono tracking-wider uppercase text-neutral-200">
            2B PİST RADARI // {trackName}
          </span>
        </div>

        {/* Rejoin Ghost Bilgi Kartı */}
        <div className="flex items-center gap-2 text-[11px] font-mono bg-neutral-900 border border-cyan-900/60 px-2.5 py-1 rounded">
          <span className="text-cyan-400 font-bold uppercase tracking-wide">
            HAYALET ÇIKIŞ: P{rejoinProjection.projectedPosition}
          </span>
          {rejoinProjection.aheadDriverCode && (
            <span className="text-neutral-400">
              ({rejoinProjection.aheadDriverCode} arkasında +{rejoinProjection.gapToAheadSec}s)
            </span>
          )}
        </div>
      </div>

      {/* SVG Radar Ekranı */}
      <div className="flex-1 w-full flex items-center justify-center relative select-none">
        <svg
          viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
          className="w-full h-full max-h-[500px]"
          style={{ filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.08))' }}
        >
          <defs>
            {/* Pist Asfalt Işıltısı */}
            <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            {/* Hayalet Araç Hologram Deseni */}
            <radialGradient id="ghost-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#0891b2" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0891b2" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* 1. Pist Asfalt Tabanı (Koyu geniş hat) */}
          <path
            d={trackPathData}
            fill="none"
            stroke="#171717"
            strokeWidth="24"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 2. Pist Bordürleri / Dış Çizgisi */}
          <path
            d={trackPathData}
            fill="none"
            stroke="#262626"
            strokeWidth="16"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 3. 2026 Aktif Aero Düzlük Bölgeleri (X-Mode açık mavi çizgiler) */}
          <path
            d={trackPathData}
            fill="none"
            stroke="#0e7490"
            strokeWidth="4"
            strokeDasharray="40 12"
            strokeLinecap="round"
            opacity="0.7"
          />

          {/* 4. Pit Yolu Çizgisi */}
          <path
            d={pitPathData}
            fill="none"
            stroke="#525252"
            strokeWidth="4"
            strokeDasharray="6 4"
            strokeLinecap="round"
          />

          {/* 5. Start / Finish Çizgisi */}
          <line
            x1={geometry.startFinishPoint.x}
            y1={geometry.startFinishPoint.y - 14}
            x2={geometry.startFinishPoint.x}
            y2={geometry.startFinishPoint.y + 14}
            stroke="#ffffff"
            strokeWidth="3"
            strokeDasharray="3 3"
          />

          {/* 6. Rejoin Ghost ve Seçili Araç Arasındaki Taktiksel Lazer Çizgisi */}
          {selectedCar && (
            <line
              x1={selectedCoords.x}
              y1={selectedCoords.y}
              x2={ghostCoords.x}
              y2={ghostCoords.y}
              stroke="#06b6d4"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity="0.4"
            />
          )}

          {/* 7. THE REJOIN GHOST (Hayalet Çıkış Hologramı) */}
          <g transform={`translate(${ghostCoords.x}, ${ghostCoords.y})`}>
            {/* Hologram Nabız Halkası */}
            <circle
              r="16"
              fill="url(#ghost-glow)"
              className="animate-ping"
              opacity="0.75"
            />
            <circle
              r="8"
              fill="#0891b2"
              stroke="#67e8f9"
              strokeWidth="2"
              opacity="0.9"
            />
            {/* Ghost Etiketi */}
            <text
              x="12"
              y="4"
              fill="#67e8f9"
              fontSize="10"
              fontFamily="monospace"
              fontWeight="bold"
            >
              HAYALET (P{rejoinProjection.projectedPosition})
            </text>
          </g>

          {/* 8. 22 Araçlık Grid Noktaları (Neon Kapsüller) */}
          {cars.map((car) => {
            const coords = getCoordinatesAtLapProgress(geometry, car.lapProgressPct);
            const team = getTeam(car.teamId);
            const driver = getDriver(car.driverId);
            const isSelected = car.driverId === selectedDriverId;
            const isXMode = car.aeroMode === 'X_MODE';

            return (
              <g
                key={car.driverId}
                transform={`translate(${coords.x}, ${coords.y})`}
                className="cursor-pointer transition-transform hover:scale-125"
                onClick={() => onSelectDriver(car.driverId)}
              >
                {/* Seçili araç için dış parlama halkası */}
                {isSelected && (
                  <circle
                    r="12"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    className="animate-pulse"
                  />
                )}

                {/* X-Mode düzlük ışıltısı */}
                {isXMode && (
                  <circle
                    r="8"
                    fill="#38bdf8"
                    opacity="0.4"
                    className="animate-pulse"
                  />
                )}

                {/* Araç Kapsülü (Takım Renginde) */}
                <circle
                  r={isSelected ? 6 : 4.5}
                  fill={team?.colorHex || '#ffffff'}
                  stroke={isSelected ? '#ffffff' : '#0a0a0a'}
                  strokeWidth="1.5"
                />

                {/* Pilot Numarası veya Kısaltması */}
                <text
                  x="8"
                  y="-6"
                  fill={isSelected ? '#ffffff' : '#a3a3a3'}
                  fontSize={isSelected ? '10' : '8'}
                  fontFamily="monospace"
                  fontWeight={isSelected ? 'bold' : 'normal'}
                >
                  {driver?.shortCode}
                  {isXMode && (
                    <tspan fill="#38bdf8" fontSize="7" dx="3">
                      [X]
                    </tspan>
                  )}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Alt Açıklama Lejantı (Temiz, Emojisiz) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-800/80 text-[10px] font-mono text-neutral-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
            <span>X-MODE DÜZLÜK HATTI</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-600 border border-neutral-400" />
            <span>START / FINISH</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-cyan-400 bg-cyan-950" />
            <span>HAYALET ÇIKIŞ (REJOIN GHOST)</span>
          </div>
        </div>

        <span className="text-neutral-500">
          * Haritadaki herhangi bir araca tıklayarak o pilotun telemetrisini ve hayalet çıkışını takip edebilirsiniz.
        </span>
      </div>
    </div>
  );
};
