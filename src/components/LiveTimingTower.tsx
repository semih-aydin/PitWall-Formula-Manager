// PitWall: Formula Manager — Canlı Sıralama Kulesi (Live Timing Tower)
// Emojisiz, saf profesyonel F1 telemetri masası standartlarında tasarım.
// 22 pilotun anlık P1-P22 sıralamasını, aralıklarını, lastiklerini ve sektörlerini gösterir.

import React from 'react';
import { CarState, Driver, Team, TireCompound } from '../types';
import { Gauge, Wind, AlertTriangle, Zap } from 'lucide-react';

interface LiveTimingTowerProps {
  leaderboard: CarState[];
  selectedDriverId: string;
  onSelectDriver: (driverId: string) => void;
  onOrderBox: (driverId: string, compound: TireCompound) => void;
  getDriver: (driverId: string) => Driver | undefined;
  getTeam: (teamId: string) => Team | undefined;
}

export const LiveTimingTower: React.FC<LiveTimingTowerProps> = ({
  leaderboard,
  selectedDriverId,
  onSelectDriver,
  onOrderBox,
  getDriver,
  getTeam,
}) => {
  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-3 flex flex-col h-full">
      {/* Kule Başlığı */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-800 mb-2">
        <div className="flex items-center gap-2 text-xs font-bold text-neutral-300 font-mono">
          <Gauge className="w-4 h-4 text-emerald-400" />
          CANLI SIRALAMA KULESİ (LIVE TIMING)
        </div>
        <span className="text-[11px] text-neutral-500 font-mono">
          22 ARAÇLIK YAŞAYAN GRID
        </span>
      </div>

      {/* Tablo */}
      <div className="overflow-x-auto flex-1 select-none">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="text-neutral-500 border-b border-neutral-800/80 text-[11px]">
              <th className="py-1 px-2">SIRA</th>
              <th className="py-1 px-2">PİLOT</th>
              <th className="py-1 px-2">TAKIM</th>
              <th className="py-1 px-2">LASTİK & ISI</th>
              <th className="py-1 px-2">SAĞLIK</th>
              <th className="py-1 px-2">BATARYA</th>
              <th className="py-1 px-2">FARK</th>
              <th className="py-1 px-2">SEKTÖRLER</th>
              <th className="py-1 px-2">SON TUR</th>
              <th className="py-1 px-2 text-right">KOMUT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-850">
            {leaderboard.map((car, idx) => {
              const driver = getDriver(car.driverId);
              const team = getTeam(car.teamId);
              const isSelected = car.driverId === selectedDriverId;
              const isCliff = car.tires.isCliffHit;

              // Lastik Renk ve Rozet Mantığı (Emojisiz, Profesyonel)
              const compoundBadge =
                car.tires.compound === 'SOFT'
                  ? 'border-red-600 bg-red-950/70 text-red-300'
                  : car.tires.compound === 'MEDIUM'
                  ? 'border-yellow-600 bg-yellow-950/70 text-yellow-300'
                  : car.tires.compound === 'HARD'
                  ? 'border-neutral-400 bg-neutral-900 text-neutral-200'
                  : car.tires.compound === 'INTERMEDIATE'
                  ? 'border-emerald-600 bg-emerald-950/70 text-emerald-300'
                  : 'border-blue-600 bg-blue-950/70 text-blue-300';

              return (
                <tr
                  key={car.driverId}
                  onClick={() => onSelectDriver(car.driverId)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-cyan-950/30 border-l-2 border-cyan-400'
                      : idx === 0
                      ? 'bg-amber-950/15'
                      : 'hover:bg-neutral-800/40'
                  }`}
                >
                  {/* Sıra Numarası */}
                  <td className="py-1.5 px-2 font-bold text-neutral-300">
                    {idx + 1}
                  </td>

                  {/* Pilot Bilgisi */}
                  <td className="py-1.5 px-2 font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: team?.colorHex || '#ffffff' }}
                      />
                      <span className={isSelected ? 'text-cyan-300 font-bold' : 'text-neutral-100'}>
                        {driver?.shortCode}
                      </span>
                      <span className="text-neutral-500 text-[10px]">#{driver?.number}</span>
                    </div>
                  </td>

                  {/* Takım */}
                  <td className="py-1.5 px-2 text-neutral-400 text-[11px]">
                    {team?.shortName}
                  </td>

                  {/* Lastik Hamuru ve Sıcaklığı */}
                  <td className="py-1.5 px-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`border px-1.5 py-0.5 rounded text-[10px] font-bold ${compoundBadge}`}
                      >
                        {car.tires.compound[0]} ({car.tires.ageLaps}T)
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {car.tires.tempCelsius.toFixed(0)}°C
                      </span>
                      {car.inDirtyAir && (
                        <span
                          className="flex items-center gap-0.5 text-[9px] bg-orange-950/60 border border-orange-800 text-orange-300 px-1 py-0.5 rounded"
                          title="Kirli Hava: Lastik aşırı ısınıyor"
                        >
                          <Wind className="w-2.5 h-2.5" /> WAKE
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Lastik Sağlığı & Uçurum (The Cliff) */}
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
                        className={`text-[11px] font-semibold ${
                          isCliff ? 'text-red-400 flex items-center gap-0.5' : 'text-neutral-300'
                        }`}
                      >
                        {car.tires.healthPct.toFixed(0)}%
                        {isCliff && <AlertTriangle className="w-3 h-3 text-red-500" />}
                      </span>
                    </div>
                  </td>

                  {/* 2026 Batarya ve MOM Durumu */}
                  <td className="py-1.5 px-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-cyan-400 font-semibold">
                        {car.batterySoCPct.toFixed(0)}%
                      </span>
                      {car.momActive && (
                        <span className="flex items-center gap-0.5 text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-600 px-1 py-0.5 rounded font-bold animate-pulse">
                          <Zap className="w-2.5 h-2.5 text-cyan-400" /> MOM
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Lidere Fark */}
                  <td className="py-1.5 px-2 text-neutral-300 font-mono text-[11px]">
                    {idx === 0 ? (
                      <span className="text-amber-400 font-bold">LİDER</span>
                    ) : (
                      `+${car.gapToLeaderSec.toFixed(1)}s`
                    )}
                  </td>

                  {/* S1, S2, S3 Sektör Durumları (Mor, Yeşil, Sarı) */}
                  <td className="py-1.5 px-2">
                    <div className="flex items-center gap-1 text-[10px] font-mono">
                      {car.sectorTimes.map((secTime, sIdx) => {
                        const status = car.sectorStatuses[sIdx];
                        const statusClass =
                          status === 'PURPLE'
                            ? 'bg-purple-950 text-purple-300 border border-purple-700 font-bold'
                            : status === 'GREEN'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                            : 'bg-neutral-800/80 text-neutral-400';

                        return (
                          <span
                            key={sIdx}
                            className={`px-1 py-0.5 rounded text-[9px] ${statusClass}`}
                          >
                            {secTime > 0 ? secTime.toFixed(1) : '-'}
                          </span>
                        );
                      })}
                    </div>
                  </td>

                  {/* Son Tur Derecesi */}
                  <td className="py-1.5 px-2 text-neutral-400 font-mono text-[11px]">
                    {car.lastLapTimeSec ? `${car.lastLapTimeSec.toFixed(3)}s` : '---'}
                  </td>

                  {/* Taktik / Box Komutu */}
                  <td className="py-1.5 px-2 text-right">
                    {car.inPitLane ? (
                      <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-600 px-1.5 py-0.5 rounded font-bold animate-pulse">
                        PİTTE
                      </span>
                    ) : car.pitRequestedNextLap ? (
                      <span className="text-[10px] bg-red-950 text-red-300 border border-red-700 px-1.5 py-0.5 rounded font-bold animate-pulse">
                        BOX PLANLANDI
                      </span>
                    ) : car.isFinished ? (
                      <span className="text-[10px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded font-bold">
                        BİTTİ
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOrderBox(car.driverId, 'HARD');
                        }}
                        className="text-[10px] bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-1.5 py-0.5 rounded text-neutral-300 font-bold cursor-pointer transition"
                      >
                        BOX
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
