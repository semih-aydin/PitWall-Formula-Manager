// PitWall: Formula Manager — Seçili Pilot Telemetri ve Strateji Masası
// Stratejistin seçtiği araca anlık emirler (Push/Box/MOM) verdiği komuta kartı.
// Tamamen emojisiz, profesyonel telemetri arayüzü.

import React from 'react';
import { CarState, Driver, Team, TireCompound, PaceMode, EngineMode } from '../types';
import { Zap, Wind, AlertTriangle, Disc } from 'lucide-react';

interface DriverTelemetryCardProps {
  car: CarState;
  driver?: Driver;
  team?: Team;
  position: number;
  onPaceChange: (mode: PaceMode) => void;
  onEngineChange: (mode: EngineMode) => void;
  onOrderBox: (compound: TireCompound) => void;
}

export const DriverTelemetryCard: React.FC<DriverTelemetryCardProps> = ({
  car,
  driver,
  team,
  position,
  onPaceChange,
  onEngineChange,
  onOrderBox,
}) => {
  if (!driver || !team) return null;

  return (
    <div className="bg-neutral-900/70 border border-neutral-800 rounded-lg p-3 flex flex-col gap-3 select-none">
      {/* Pilot Başlığı & Pozisyon */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: team.colorHex }}
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-neutral-100 font-mono">
                {driver.name}
              </span>
              <span className="text-xs text-neutral-400 font-mono font-semibold">
                #{driver.number}
              </span>
            </div>
            <span className="text-[10px] text-neutral-400 font-mono">
              {team.name} // {car.currentSpeedKmh} KM/H
            </span>
          </div>
        </div>

        <div className="text-right font-mono">
          <span className="text-base font-black text-amber-400">P{position}</span>
          <span className="text-[10px] text-neutral-400 block">
            {position === 1 ? 'LİDER' : `+${car.gapToLeaderSec.toFixed(1)}s`}
          </span>
        </div>
      </div>

      {/* 2026 Batarya (SoC) & Aktif Aero Çubuğu */}
      <div className="bg-neutral-950/60 p-2 rounded border border-neutral-800 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="flex items-center gap-1 text-cyan-400 font-bold">
            <Zap className="w-3 h-3" /> 2026 BATARYA (SoC)
          </span>
          <span className="font-bold text-neutral-200">
            %{car.batterySoCPct.toFixed(0)}
          </span>
        </div>
        <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              car.batterySoCPct <= 15
                ? 'bg-red-500 animate-pulse'
                : car.batterySoCPct <= 35
                ? 'bg-amber-500'
                : 'bg-cyan-400'
            }`}
            style={{ width: `${car.batterySoCPct}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono pt-1 text-neutral-400">
          <span>AERO: <strong className="text-neutral-200">{car.aeroMode}</strong></span>
          <span>
            {car.momActive ? (
              <span className="text-cyan-400 font-bold animate-pulse">[350kW MOM AKTİF]</span>
            ) : car.intervalToAheadSec <= 1.0 ? (
              <span className="text-emerald-400 font-bold">[MOM HAZIR]</span>
            ) : (
              <span>[MOM BEKLEMEDE]</span>
            )}
          </span>
        </div>
      </div>

      {/* Lastik Sağlığı & Isı Durumu */}
      <div className="bg-neutral-950/60 p-2 rounded border border-neutral-800 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="flex items-center gap-1 text-neutral-300 font-bold">
            <Disc className="w-3 h-3 text-neutral-400" />
            LASTİK: {car.tires.compound} ({car.tires.ageLaps} TUR)
          </span>
          <span className={`font-bold ${car.tires.isCliffHit ? 'text-red-400 animate-pulse' : 'text-neutral-200'}`}>
            %{car.tires.healthPct.toFixed(0)} SAĞLIK
          </span>
        </div>

        <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              car.tires.isCliffHit ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
            }`}
            style={{ width: `${car.tires.healthPct}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono pt-1 text-neutral-400">
          <span>SICAKLIK: <strong className="text-neutral-200">{car.tires.tempCelsius.toFixed(0)}°C</strong></span>
          {car.inDirtyAir && (
            <span className="text-orange-400 flex items-center gap-0.5 font-bold">
              <Wind className="w-3 h-3" /> KİRLİ HAVA (AŞIRI ISINMA)
            </span>
          )}
          {car.tires.isCliffHit && (
            <span className="text-red-400 flex items-center gap-0.5 font-bold">
              <AlertTriangle className="w-3 h-3" /> UÇURUM ÇARPTI (+2.5s)
            </span>
          )}
        </div>
      </div>

      {/* Strateji Butonları (Pace, Motor, Box) */}
      <div className="flex flex-col gap-2 pt-1 font-mono">
        {/* Sürüş Temposu (Pace) */}
        <div>
          <span className="text-[10px] text-neutral-400 block mb-1">SÜRÜŞ TEMPOSU (PACE):</span>
          <div className="grid grid-cols-3 gap-1.5 text-[11px]">
            <button
              onClick={() => onPaceChange('CONSERVE')}
              className={`py-1.5 rounded font-bold transition cursor-pointer border ${
                car.paceMode === 'CONSERVE'
                  ? 'bg-blue-950 border-blue-600 text-blue-300'
                  : 'bg-neutral-800/80 border-neutral-700 text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              KORU
            </button>
            <button
              onClick={() => onPaceChange('BALANCED')}
              className={`py-1.5 rounded font-bold transition cursor-pointer border ${
                car.paceMode === 'BALANCED'
                  ? 'bg-neutral-800 border-neutral-500 text-neutral-100'
                  : 'bg-neutral-800/80 border-neutral-700 text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              DENGELİ
            </button>
            <button
              onClick={() => onPaceChange('PUSH')}
              className={`py-1.5 rounded font-bold transition cursor-pointer border ${
                car.paceMode === 'PUSH'
                  ? 'bg-red-950 border-red-600 text-red-300'
                  : 'bg-neutral-800/80 border-neutral-700 text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              GAZLA
            </button>
          </div>
        </div>

        {/* 2026 Motor / Batarya Modu */}
        <div>
          <span className="text-[10px] text-neutral-400 block mb-1">2026 MOTOR MODU:</span>
          <div className="grid grid-cols-3 gap-1.5 text-[11px]">
            <button
              onClick={() => onEngineChange('ECO')}
              className={`py-1.5 rounded font-bold transition cursor-pointer border ${
                car.engineMode === 'ECO'
                  ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                  : 'bg-neutral-800/80 border-neutral-700 text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              ECO / ŞARJ
            </button>
            <button
              onClick={() => onEngineChange('STANDARD')}
              className={`py-1.5 rounded font-bold transition cursor-pointer border ${
                car.engineMode === 'STANDARD'
                  ? 'bg-neutral-800 border-neutral-500 text-neutral-100'
                  : 'bg-neutral-800/80 border-neutral-700 text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              STANDART
            </button>
            <button
              onClick={() => onEngineChange('OVERTAKE')}
              className={`py-1.5 rounded font-bold transition cursor-pointer border ${
                car.engineMode === 'OVERTAKE'
                  ? 'bg-cyan-950 border-cyan-500 text-cyan-300 animate-pulse'
                  : 'bg-neutral-800/80 border-neutral-700 text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              MOM HÜCUM
            </button>
          </div>
        </div>

        {/* Pit Çağrısı (BOX THIS LAP) */}
        <div className="pt-1">
          <span className="text-[10px] text-neutral-400 block mb-1">PİT STOP ÇAĞRISI:</span>
          <div className="grid grid-cols-3 gap-1.5 text-[11px]">
            <button
              onClick={() => onOrderBox('SOFT')}
              className="py-1.5 rounded font-bold border border-red-700 bg-red-950/60 hover:bg-red-900 text-red-300 transition cursor-pointer"
            >
              BOX (SOFT)
            </button>
            <button
              onClick={() => onOrderBox('MEDIUM')}
              className="py-1.5 rounded font-bold border border-yellow-700 bg-yellow-950/60 hover:bg-yellow-900 text-yellow-300 transition cursor-pointer"
            >
              BOX (MED)
            </button>
            <button
              onClick={() => onOrderBox('HARD')}
              className="py-1.5 rounded font-bold border border-neutral-600 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition cursor-pointer"
            >
              BOX (HARD)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
