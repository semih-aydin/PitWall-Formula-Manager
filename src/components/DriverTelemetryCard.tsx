// PitWall: Formula Manager — Seçili Pilot Telemetri ve Strateji Masası
// Stratejistin seçtiği araca anlık emirler (Push/Box/MOM) verdiği komuta kartı.
// Undercut & Overcut hesaplayıcı: Hannah Schmitz / James Vowles gibi erken veya geç pitle sıra kazanma analizi.
// Tamamen emojisiz, profesyonel telemetri arayüzü.

import React from 'react';
import { CarState, Driver, Team, TireCompound, PaceMode, EngineMode } from '../types';
import { Zap, Wind, AlertTriangle, Disc, Target, Radio } from 'lucide-react';
import { RadioAudioEngine } from '../audio/RadioAudioEngine';

interface DriverTelemetryCardProps {
  car: CarState;
  driver?: Driver;
  team?: Team;
  position: number;
  aheadCar?: CarState;
  aheadDriver?: Driver;
  behindCar?: CarState;
  behindDriver?: Driver;
  rejoinProjection?: {
    rejoinProgressPct: number;
    projectedPosition: number;
    aheadDriverCode?: string;
    gapToAheadSec: number;
  };
  onPaceChange: (mode: PaceMode) => void;
  onEngineChange: (mode: EngineMode) => void;
  onOrderBox: (compound: TireCompound) => void;
}

export const DriverTelemetryCard: React.FC<DriverTelemetryCardProps> = ({
  car,
  driver,
  team,
  position,
  aheadCar,
  aheadDriver,
  behindCar,
  behindDriver,
  rejoinProjection,
  onPaceChange,
  onEngineChange,
  onOrderBox,
}) => {
  if (!driver || !team) return null;

  // Undercut / Overcut Taktik Penceresi Analizi (Öğrenci işi: Temiz matematik ve kural mantığı)
  const getTacticalAdvice = () => {
    // 1. Zaten pit çağrısı yapılmışsa
    if (car.pitRequestedNextLap) {
      return {
        badge: 'PİT ÇAĞRISI ONAYLANDI',
        sub: `Tur sonu pite girilecek (${car.selectedNextCompound})`,
        border: 'border-red-600 bg-red-950/40 text-red-200',
        color: 'text-red-400',
        advice: 'IN-LAP PUSH: Pite giriş turunda lastikleri ve bataryayı tam güçle harcayın, saniyenin onda biri bile kıymetli.',
      };
    }

    // 2. Şu an pit yolundaysa
    if (car.inPitLane) {
      return {
        badge: 'PİT STOP İCRA EDİLİYOR',
        sub: 'Pit yolu hız sınırlandırıcısı devrede (80 km/h)',
        border: 'border-amber-600 bg-amber-950/40 text-amber-200',
        color: 'text-amber-400',
        advice: 'Teknisyenler yeni lastikleri takıyor. Çıkışta hayalet projeksiyon noktasında yarışa dönülecek.',
      };
    }

    // 3. Önümüzdeki araca karşı Undercut Fırsatı
    // Açıklama: Öndeki araçla fark 0.4s ile 2.5s arasındaysa ve lastiklerimiz aşınmaya başlamışsa,
    // ondan önce pite girip taze hamurla out-lap atarak öne geçeriz.
    if (aheadCar && car.intervalToAheadSec > 0.3 && car.intervalToAheadSec <= 2.6) {
      const estimatedProb = Math.min(88, Math.max(58, Math.round(86 - car.intervalToAheadSec * 11)));
      return {
        badge: 'UNDERCUT PENCERESİ AÇIK',
        sub: `${aheadDriver?.shortCode || 'Öndeki'} ile fark ${car.intervalToAheadSec.toFixed(1)}s`,
        border: 'border-emerald-600 bg-emerald-950/40 text-emerald-200',
        color: 'text-emerald-400',
        advice: `Şimdi pite girilirse taze hamurun out-lap avantajıyla (%${estimatedProb} ihtimalle) ${aheadDriver?.shortCode || 'rakibin'} önüne geçilecek.`,
      };
    }

    // 4. Arkadaki araçtan gelen Undercut Tehdidi
    // Açıklama: Arkadaki pilot 1.5 saniyenin altındaysa bizi erken pitle geçmeye çalışabilir.
    if (behindCar && behindCar.intervalToAheadSec <= 1.6 && car.tires.healthPct < 65) {
      return {
        badge: 'UNDERCUT TEHDİDİ (ARKADAN)',
        sub: `${behindDriver?.shortCode || 'Arkadaki'} baskı kuruyor (${behindCar.intervalToAheadSec.toFixed(1)}s)`,
        border: 'border-amber-600 bg-amber-950/40 text-amber-200',
        color: 'text-amber-400',
        advice: `${behindDriver?.shortCode || 'Arkadaki araç'} erken pite girip bizi alt edebilir. Pozisyon korumak için önceden BOX kararı düşünün.`,
      };
    }

    // 5. Overcut Fırsatı (Temiz Havada Fark Açma)
    // Açıklama: Öndeki araba pite girdiğinde ya da önümüz tamamen boşsa, lastikler hala iyiyse piste kalıp hızlı turlar basarız.
    if (aheadCar && (aheadCar.inPitLane || car.intervalToAheadSec > 4.5) && car.tires.healthPct > 60) {
      return {
        badge: 'OVERCUT FIRSATI (TEMİZ HAVA)',
        sub: 'Önünüz açık, kirli hava etkisi sıfır',
        border: 'border-cyan-600 bg-cyan-950/40 text-cyan-200',
        color: 'text-cyan-400',
        advice: 'Trafiksiz temiz havada ritim yakalayın. Rakipler pitteyken 2 tur daha pistte kalarak farkı açın.',
      };
    }

    // 6. Dengeli Ritim Modu
    return {
      badge: 'RİTİM VE YÖNETİM MODU',
      sub: `Lastik ömrü: ${car.tires.ageLaps} tur / Sağlık: %${car.tires.healthPct.toFixed(0)}`,
      border: 'border-neutral-800 bg-neutral-950/40 text-neutral-300',
      color: 'text-neutral-400',
      advice: 'Yarış dengeli akıyor. 2026 MOM bataryasını şarj edin, lastik sıcaklığını 90-105°C bandında tutun.',
    };
  };

  const tactic = getTacticalAdvice();

  // Buton Tıklama Sesleri
  const handlePaceClick = (mode: PaceMode) => {
    RadioAudioEngine.playTacticalClick();
    onPaceChange(mode);
  };

  const handleEngineClick = (mode: EngineMode) => {
    RadioAudioEngine.playTacticalClick();
    onEngineChange(mode);
  };

  const handleBoxClick = (compound: TireCompound) => {
    RadioAudioEngine.playTacticalClick();
    RadioAudioEngine.playRadioBeep('CONFIRM');
    onOrderBox(compound);
  };

  return (
    <div className="bg-neutral-900/70 border border-neutral-800 rounded-lg p-3 flex flex-col gap-3 select-none">
      {/* Pilot Başlığı & Pozisyon */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full shadow-sm"
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

      {/* Taktik Karar Penceresi (Undercut / Overcut Danışmanı) */}
      <div className={`p-2.5 rounded border flex flex-col gap-1 font-mono transition-all text-xs ${tactic.border}`}>
        <div className="flex items-center justify-between">
          <span className={`flex items-center gap-1.5 font-bold text-[11px] ${tactic.color}`}>
            <Target className="w-3.5 h-3.5" />
            {tactic.badge}
          </span>
          <div className="flex items-center gap-2">
            {rejoinProjection && (
              <span className="text-[10px] text-cyan-300 font-bold bg-neutral-950/80 px-1.5 py-0.5 rounded border border-cyan-800">
                PİT ÇIKIŞI: P{rejoinProjection.projectedPosition}
              </span>
            )}
            <span className="text-[10px] text-neutral-400">
              {tactic.sub}
            </span>
          </div>
        </div>
        <p className="leading-snug text-[10.5px] opacity-90 mt-0.5">
          {tactic.advice}
        </p>
      </div>

      {/* Strateji Butonları (Pace, Motor, Box) */}
      <div className="flex flex-col gap-2 pt-1 font-mono">
        {/* Sürüş Temposu (Pace) */}
        <div>
          <span className="text-[10px] text-neutral-400 block mb-1">SÜRÜŞ TEMPOSU (PACE):</span>
          <div className="grid grid-cols-3 gap-1.5 text-[11px]">
            <button
              onClick={() => handlePaceClick('CONSERVE')}
              className={`py-1.5 rounded font-bold transition cursor-pointer border ${
                car.paceMode === 'CONSERVE'
                  ? 'bg-blue-950 border-blue-600 text-blue-300'
                  : 'bg-neutral-800/80 border-neutral-700 text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              KORU
            </button>
            <button
              onClick={() => handlePaceClick('BALANCED')}
              className={`py-1.5 rounded font-bold transition cursor-pointer border ${
                car.paceMode === 'BALANCED'
                  ? 'bg-neutral-800 border-neutral-500 text-neutral-100'
                  : 'bg-neutral-800/80 border-neutral-700 text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              DENGELİ
            </button>
            <button
              onClick={() => handlePaceClick('PUSH')}
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
              onClick={() => handleEngineClick('ECO')}
              className={`py-1.5 rounded font-bold transition cursor-pointer border ${
                car.engineMode === 'ECO'
                  ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                  : 'bg-neutral-800/80 border-neutral-700 text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              ECO / ŞARJ
            </button>
            <button
              onClick={() => handleEngineClick('STANDARD')}
              className={`py-1.5 rounded font-bold transition cursor-pointer border ${
                car.engineMode === 'STANDARD'
                  ? 'bg-neutral-800 border-neutral-500 text-neutral-100'
                  : 'bg-neutral-800/80 border-neutral-700 text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              STANDART
            </button>
            <button
              onClick={() => handleEngineClick('OVERTAKE')}
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
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-neutral-400 flex items-center gap-1">
              <Radio className="w-3 h-3 text-cyan-400" />
              TELSİZLE PİT ÇAĞRISI (BOX):
            </span>
            {car.pitRequestedNextLap && (
              <span className="text-[10px] text-red-400 font-bold animate-pulse">
                TUR SONU PİT ONAYLANDI ({car.selectedNextCompound})
              </span>
            )}
            {car.inPitLane && (
              <span className="text-[10px] text-amber-400 font-bold animate-pulse">
                ŞU AN PİT YOLUNDA
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-[11px]">
            <button
              onClick={() => handleBoxClick('SOFT')}
              className={`py-1.5 rounded font-bold border transition cursor-pointer ${
                car.pitRequestedNextLap && car.selectedNextCompound === 'SOFT'
                  ? 'border-red-500 bg-red-800 text-white animate-pulse'
                  : 'border-red-700 bg-red-950/60 hover:bg-red-900 text-red-300'
              }`}
            >
              BOX (SOFT)
            </button>
            <button
              onClick={() => handleBoxClick('MEDIUM')}
              className={`py-1.5 rounded font-bold border transition cursor-pointer ${
                car.pitRequestedNextLap && car.selectedNextCompound === 'MEDIUM'
                  ? 'border-yellow-500 bg-yellow-800 text-white animate-pulse'
                  : 'border-yellow-700 bg-yellow-950/60 hover:bg-yellow-900 text-yellow-300'
              }`}
            >
              BOX (MED)
            </button>
            <button
              onClick={() => handleBoxClick('HARD')}
              className={`py-1.5 rounded font-bold border transition cursor-pointer ${
                car.pitRequestedNextLap && car.selectedNextCompound === 'HARD'
                  ? 'border-neutral-300 bg-neutral-600 text-white animate-pulse'
                  : 'border-neutral-600 bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
              }`}
            >
              BOX (HARD)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

