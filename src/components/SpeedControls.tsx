// PitWall: Formula Manager — Simülasyon Hız ve Kontrol Barı (SpeedControls)
// 1x, 2x, 5x, 10x simülasyon hızları ve duraklatma kontrolleri.
// Tamamen emojisiz, minimalist Lucide ikonları.

import React from 'react';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';

interface SpeedControlsProps {
  isPlaying: boolean;
  speedMultiplier: number;
  onTogglePlay: () => void;
  onSetSpeed: (speed: number) => void;
  onNextLap: () => void;
  onReset: () => void;
}

export const SpeedControls: React.FC<SpeedControlsProps> = ({
  isPlaying,
  speedMultiplier,
  onTogglePlay,
  onSetSpeed,
  onNextLap,
  onReset,
}) => {
  const speeds = [1, 2, 5, 10];

  return (
    <div className="flex items-center gap-2 font-mono text-xs select-none">
      {/* Oynat / Durdur Butonu */}
      <button
        onClick={onTogglePlay}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold transition cursor-pointer border ${
          isPlaying
            ? 'bg-amber-950/80 border-amber-600 text-amber-300 hover:bg-amber-900'
            : 'bg-emerald-950/80 border-emerald-600 text-emerald-300 hover:bg-emerald-900'
        }`}
      >
        {isPlaying ? (
          <>
            <Pause className="w-3.5 h-3.5" /> DURAKLAT
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5" /> CANLI BAŞLAT
          </>
        )}
      </button>

      {/* Hız Çarpanları (1x, 2x, 5x, 10x) */}
      <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded p-0.5">
        {speeds.map((s) => (
          <button
            key={s}
            onClick={() => onSetSpeed(s)}
            className={`px-2 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
              speedMultiplier === s
                ? 'bg-cyan-950 border border-cyan-500 text-cyan-300'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* 1 Tur Manuel Atla */}
      <button
        onClick={onNextLap}
        className="flex items-center gap-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 px-2.5 py-1.5 rounded transition cursor-pointer"
        title="Anında 1 Tur Atla"
      >
        <SkipForward className="w-3.5 h-3.5 text-neutral-400" />
        <span>+1 TUR</span>
      </button>

      {/* Sıfırla */}
      <button
        onClick={onReset}
        className="flex items-center gap-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-red-400 px-2.5 py-1.5 rounded transition cursor-pointer"
        title="Yarışı Başa Sar"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
