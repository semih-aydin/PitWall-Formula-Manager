// PitWall: Formula Manager — Telsiz ve Yarış Olayları Akışı (EventFeed)
// Emojisiz, profesyonel telemetri log tasarımı.

import React from 'react';
import { RaceEvent } from '../types';
import { Radio, Zap, AlertTriangle, ShieldAlert, ArrowRightLeft, Flag } from 'lucide-react';

interface EventFeedProps {
  events: RaceEvent[];
}

export const EventFeed: React.FC<EventFeedProps> = ({ events }) => {
  const getEventIcon = (type: RaceEvent['type']) => {
    switch (type) {
      case 'OVERTAKE':
        return <ArrowRightLeft className="w-3.5 h-3.5 text-purple-400" />;
      case 'MOM_DEPLOYED':
        return <Zap className="w-3.5 h-3.5 text-cyan-400" />;
      case 'CLIFF_HIT':
      case 'LOCKUP':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
      case 'PIT_ERROR':
      case 'DOUBLE_STACK':
        return <ShieldAlert className="w-3.5 h-3.5 text-red-400" />;
      case 'FASTEST_LAP':
        return <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />;
      case 'FLAG_CHANGE':
        return <Flag className="w-3.5 h-3.5 text-yellow-400" />;
      default:
        return <Radio className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-3 flex flex-col h-full">
      {/* Başlık */}
      <div className="flex items-center gap-2 text-xs font-bold text-neutral-300 font-mono pb-2 border-b border-neutral-800 mb-2">
        <Radio className="w-4 h-4 text-cyan-400" />
        TELSİZ VE YARIŞ AKIŞI (RACE EVENTS)
      </div>

      {/* Akış Listesi */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 select-none">
        {events.length === 0 ? (
          <div className="text-xs text-neutral-600 text-center py-8 font-mono">
            Yarış henüz başlamadı. 'BAŞLAT' veya 'TUR ATLA' düğmesine basarak simülasyonu başlatın.
          </div>
        ) : (
          events.map((evt) => {
            const borderClass =
              evt.severity === 'DANGER'
                ? 'bg-red-950/30 border-red-800/80 text-red-200'
                : evt.severity === 'WARNING'
                ? 'bg-amber-950/30 border-amber-800/80 text-amber-200'
                : evt.severity === 'TACTICAL'
                ? 'bg-purple-950/30 border-purple-800/80 text-purple-200'
                : 'bg-neutral-900/90 border-neutral-800 text-neutral-300';

            return (
              <div
                key={evt.id}
                className={`text-xs p-2 rounded border font-mono transition-all ${borderClass}`}
              >
                <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1">
                  <div className="flex items-center gap-1.5 font-semibold">
                    {getEventIcon(evt.type)}
                    <span>{evt.type}</span>
                  </div>
                  <span>TUR {evt.lap}</span>
                </div>
                <p className="leading-snug text-[11px] font-mono">{evt.message}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
