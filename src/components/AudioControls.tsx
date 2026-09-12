// PitWall: Formula Manager — Ses ve Telsiz Kontrol Düğmesi
// Stratejistin telsiz seslerini tek tıkla açıp kapatabilmesini sağlar.
// Emojisiz, yüksek kontrastlı neon Lucide ikonları ile tasarlanmıştır.

import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { RadioAudioEngine } from '../audio/RadioAudioEngine';

export const AudioControls: React.FC = () => {
  const [isMuted, setIsMuted] = useState<boolean>(() => RadioAudioEngine.getIsMuted());

  const handleToggle = () => {
    const newMuted = RadioAudioEngine.toggleMute();
    setIsMuted(newMuted);
    if (!newMuted) {
      RadioAudioEngine.playRadioBeep('OPEN');
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs font-mono font-bold transition cursor-pointer ${
        isMuted
          ? 'bg-neutral-900 border-neutral-700 text-neutral-500 hover:text-neutral-300'
          : 'bg-cyan-950/60 border-cyan-700 text-cyan-300 hover:bg-cyan-900/80 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
      }`}
      title={isMuted ? 'Telsiz Sesini Aç' : 'Telsiz Sesini Kapat'}
    >
      {isMuted ? (
        <>
          <VolumeX className="w-3.5 h-3.5 text-neutral-400" />
          <span className="hidden sm:inline">SES KAPALI</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="hidden sm:inline">TELSİZ AÇIK</span>
        </>
      )}
    </button>
  );
};
