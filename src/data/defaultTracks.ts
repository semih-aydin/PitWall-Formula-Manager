// PitWall: Formula Manager — Pist Verileri
// İkonik pistlerin telifsiz coğrafi isimleri, sektör süreleri ve 2026 Aktif Aero (X-Mode) düzlük bölgeleri.

import { Track } from '../types';

export const DEFAULT_TRACKS: Track[] = [
  // 1. Monza (İtalya): Hız Tapınağı — Uzun düzlükler, sert şikanlar ve yüksek hız
  {
    id: 'track_monza',
    name: 'Royal Temple of Speed (Lombardia / Monza)',
    country: 'Italy',
    totalLaps: 53,
    lengthMeters: 5793,
    baseLapTimeSec: 81.5,      // Ortalama tur: ~1:21.500
    pitLaneLossSec: 24.2,      // Pit yolu hız limiti ve geçiş kaybı: ~24.2 saniye
    activeAeroZones: [
      {
        id: 'zone_main_straight',
        name: 'Rettifilo Ana Düzlüğü',
        startPct: 0.88,
        endPct: 0.12,          // Start/Finish çizgisini kapsar
        isStraight: true,
      },
      {
        id: 'zone_curva_grande_straight',
        name: 'Curva Grande to Roggia',
        startPct: 0.22,
        endPct: 0.38,
        isStraight: true,
      },
      {
        id: 'zone_serraglio',
        name: 'Serraglio to Ascari',
        startPct: 0.52,
        endPct: 0.68,
        isStraight: true,
      },
    ],
    sectors: [
      { sectorNumber: 1, startPct: 0.0, endPct: 0.33, baseTimeSec: 26.8 },
      { sectorNumber: 2, startPct: 0.33, endPct: 0.67, baseTimeSec: 27.2 },
      { sectorNumber: 3, startPct: 0.67, endPct: 1.0, baseTimeSec: 27.5 },
    ],
  },
  {
    id: 'track_monaco',
    name: 'Monte Carlo Bay Circuit',
    country: 'Monaco',
    totalLaps: 78,
    lengthMeters: 3337,
    baseLapTimeSec: 72.8,      // ~1:12.800
    pitLaneLossSec: 21.0,
    activeAeroZones: [
      {
        id: 'zone_tunnel_straight',
        name: 'Tunnel Exit Straight',
        startPct: 0.52,
        endPct: 0.68,
        isStraight: true,
      },
      {
        id: 'zone_pit_straight',
        name: 'Start/Finish Straight',
        startPct: 0.92,
        endPct: 0.08,
        isStraight: true,
      },
    ],
    sectors: [
      { sectorNumber: 1, startPct: 0.0, endPct: 0.33, baseTimeSec: 20.2 },
      { sectorNumber: 2, startPct: 0.33, endPct: 0.67, baseTimeSec: 33.5 },
      { sectorNumber: 3, startPct: 0.67, endPct: 1.0, baseTimeSec: 19.1 },
    ],
  },
  {
    id: 'track_silverstone',
    name: 'Northamptonshire Airfield Circuit',
    country: 'United Kingdom',
    totalLaps: 52,
    lengthMeters: 5891,
    baseLapTimeSec: 87.2,      // ~1:27.200
    pitLaneLossSec: 22.5,
    activeAeroZones: [
      {
        id: 'zone_hangar_straight',
        name: 'Hangar Straight',
        startPct: 0.60,
        endPct: 0.78,
        isStraight: true,
      },
      {
        id: 'zone_wellington_straight',
        name: 'Wellington Straight',
        startPct: 0.22,
        endPct: 0.38,
        isStraight: true,
      },
    ],
    sectors: [
      { sectorNumber: 1, startPct: 0.0, endPct: 0.33, baseTimeSec: 28.1 },
      { sectorNumber: 2, startPct: 0.33, endPct: 0.67, baseTimeSec: 35.4 },
      { sectorNumber: 3, startPct: 0.67, endPct: 1.0, baseTimeSec: 23.7 },
    ],
  },
];
