// PitWall: Formula Manager — 2026 Sezonu Grid Kadrosu
// FOM ve FIA telif davalarından korunmak için isimler tatlı parodi / saygı isimleriyle yazılmıştır.
// Oyuncular isterse daha sonra tek tıkla kendi JSON kadrosunu yükleyebilir!

import { Driver, Team } from '../types';

export const DEFAULT_DRIVERS_2026: Driver[] = [
  // 1. Scuderia Rossa (Ferrari Kırmızıları)
  {
    id: 'd_leconte',
    name: 'Charles Leconte',
    shortCode: 'LEC',
    number: 16,
    country: 'Monaco',
    skill: 94,             // Saf tek tur hızı canavar gibidir
    racecraft: 92,
    tireManagement: 87,
    composure: 85,
    morale: 88,
  },
  {
    id: 'd_hampton',
    name: 'Lewis Hampton',
    shortCode: 'HAM',
    number: 44,
    country: 'United Kingdom',
    skill: 93,
    racecraft: 96,         // Tekerlek tekerleğe kapışmada tam bir tilkidir
    tireManagement: 95,    // Lastik ömrünü uzatmada dünya birincisi
    composure: 94,
    morale: 90,
  },

  // 2. Viper Racing (Red Bull Ford Canavarı)
  {
    id: 'd_voster',
    name: 'Max Van Der Berg',
    shortCode: 'VER',
    number: 1,
    country: 'Netherlands',
    skill: 98,             // Gridin en hızlı saf yeteneği
    racecraft: 97,
    tireManagement: 93,
    composure: 95,
    morale: 96,
  },
  {
    id: 'd_lawson',
    name: 'Liam Lawson',
    shortCode: 'LAW',
    number: 30,
    country: 'New Zealand',
    skill: 83,
    racecraft: 84,
    tireManagement: 82,
    composure: 81,
    morale: 85,
  },

  // Papaya GP (McLaren)
  {
    id: 'd_nova',
    name: 'Lando Nova',
    shortCode: 'NOR',
    number: 4,
    country: 'United Kingdom',
    skill: 93,
    racecraft: 89,
    tireManagement: 90,
    composure: 86,
    morale: 92,
  },
  {
    id: 'd_pastore',
    name: 'Oscar Pastore',
    shortCode: 'PIA',
    number: 81,
    country: 'Australia',
    skill: 91,
    racecraft: 90,
    tireManagement: 89,
    composure: 93,
    morale: 92,
  },

  // Silver Arrows (Mercedes)
  {
    id: 'd_russell',
    name: 'George Russell',
    shortCode: 'RUS',
    number: 63,
    country: 'United Kingdom',
    skill: 92,
    racecraft: 90,
    tireManagement: 88,
    composure: 86,
    morale: 88,
  },
  {
    id: 'd_antonelli',
    name: 'Kimi Antonelli',
    shortCode: 'ANT',
    number: 12,
    country: 'Italy',
    skill: 85,
    racecraft: 83,
    tireManagement: 80,
    composure: 80,
    morale: 87,
  },

  // British Racing Green (Aston Martin)
  {
    id: 'd_alvarez',
    name: 'Fernando Alvarez',
    shortCode: 'ALO',
    number: 14,
    country: 'Spain',
    skill: 92,
    racecraft: 98,
    tireManagement: 94,
    composure: 96,
    morale: 89,
  },
  {
    id: 'd_stroll',
    name: 'Lance Stroll',
    shortCode: 'STR',
    number: 18,
    country: 'Canada',
    skill: 79,
    racecraft: 80,
    tireManagement: 78,
    composure: 76,
    morale: 80,
  },

  // Grove Heritage (Williams)
  {
    id: 'd_albon',
    name: 'Alex Albon',
    shortCode: 'ALB',
    number: 23,
    country: 'Thailand',
    skill: 86,
    racecraft: 88,
    tireManagement: 91,
    composure: 88,
    morale: 86,
  },
  {
    id: 'd_sainz',
    name: 'Carlos Sainz',
    shortCode: 'SAI',
    number: 55,
    country: 'Spain',
    skill: 91,
    racecraft: 91,
    tireManagement: 92,
    composure: 91,
    morale: 89,
  },

  // Ingolstadt Speedworks (Audi)
  {
    id: 'd_hulkenberg',
    name: 'Nico Hülkenberg',
    shortCode: 'HUL',
    number: 27,
    country: 'Germany',
    skill: 85,
    racecraft: 86,
    tireManagement: 85,
    composure: 89,
    morale: 84,
  },
  {
    id: 'd_bortoleto',
    name: 'Gabriel Bortoleto',
    shortCode: 'BOR',
    number: 5,
    country: 'Brazil',
    skill: 82,
    racecraft: 82,
    tireManagement: 80,
    composure: 81,
    morale: 85,
  },

  // Apex American Racing (Cadillac / 11th Team)
  {
    id: 'd_herta',
    name: 'Colton Herta',
    shortCode: 'HER',
    number: 26,
    country: 'United States',
    skill: 83,
    racecraft: 85,
    tireManagement: 80,
    composure: 79,
    morale: 85,
  },
  {
    id: 'd_bottas',
    name: 'Valtteri Bottas',
    shortCode: 'BOT',
    number: 77,
    country: 'Finland',
    skill: 84,
    racecraft: 83,
    tireManagement: 88,
    composure: 90,
    morale: 82,
  },

  // Dieppe Blue (Alpine)
  {
    id: 'd_gasly',
    name: 'Pierre Gasly',
    shortCode: 'GAS',
    number: 10,
    country: 'France',
    skill: 85,
    racecraft: 85,
    tireManagement: 84,
    composure: 83,
    morale: 82,
  },
  {
    id: 'd_doohan',
    name: 'Jack Doohan',
    shortCode: 'DOO',
    number: 7,
    country: 'Australia',
    skill: 80,
    racecraft: 80,
    tireManagement: 79,
    composure: 78,
    morale: 83,
  },

  // Kannapolis Dynamics (Haas)
  {
    id: 'd_ocon',
    name: 'Esteban Ocon',
    shortCode: 'OCO',
    number: 31,
    country: 'France',
    skill: 84,
    racecraft: 86,
    tireManagement: 83,
    composure: 82,
    morale: 83,
  },
  {
    id: 'd_bearman',
    name: 'Oliver Bearman',
    shortCode: 'BEA',
    number: 87,
    country: 'United Kingdom',
    skill: 83,
    racecraft: 84,
    tireManagement: 81,
    composure: 82,
    morale: 87,
  },

  // Faenza Veloce (Racing Bulls)
  {
    id: 'd_tsunoda',
    name: 'Yuki Tsunoda',
    shortCode: 'TSU',
    number: 22,
    country: 'Japan',
    skill: 84,
    racecraft: 85,
    tireManagement: 81,
    composure: 78,
    morale: 84,
  },
  {
    id: 'd_hadjar',
    name: 'Isack Hadjar',
    shortCode: 'HAD',
    number: 6,
    country: 'France',
    skill: 81,
    racecraft: 82,
    tireManagement: 79,
    composure: 79,
    morale: 85,
  },
];

export const DEFAULT_TEAMS_2026: Team[] = [
  {
    id: 'team_ferrari',
    name: 'Scuderia Rossa',
    shortName: 'ROSSA',
    colorHex: '#dc2626',       // Canlı Maranello Kırmızısı
    secondaryColorHex: '#ffffff',
    enginePower: 94,           // Güçlü içten yanmalı motor
    aeroEfficiency: 93,
    chassisBalance: 92,
    pitCrewRating: 88,          // İyi ama arada taktik hatası yapabilirler
    driverIds: ['d_leconte', 'd_hampton'],
  },
  {
    id: 'team_redbull',
    name: 'Viper Racing',
    shortName: 'VIPER',
    colorHex: '#1e3a8a',       // Koyu Gece Mavisi
    secondaryColorHex: '#facc15', // Mat Sarı detaylar
    enginePower: 96,
    aeroEfficiency: 96,        // Aerodinamik dehası
    chassisBalance: 95,
    pitCrewRating: 98,          // Efsanevi 1.9 saniyelik robotik pit ekibi
    driverIds: ['d_voster', 'd_lawson'],
  },
  {
    id: 'team_mclaren',
    name: 'Papaya GP',
    shortName: 'PAPAYA',
    colorHex: '#f97316',       // Meşhur Papaya Turuncusu
    secondaryColorHex: '#06b6d4', // Camgöbeği
    enginePower: 95,
    aeroEfficiency: 95,
    chassisBalance: 94,
    pitCrewRating: 94,
    driverIds: ['d_nova', 'd_pastore'],
  },
  {
    id: 'team_mercedes',
    name: 'Silver Arrows',
    shortName: 'SILVER',
    colorHex: '#94a3b8',       // Silver
    secondaryColorHex: '#06b6d4', // Petronas Teal
    enginePower: 93,
    aeroEfficiency: 92,
    chassisBalance: 91,
    pitCrewRating: 91,
    driverIds: ['d_russell', 'd_antonelli'],
  },
  {
    id: 'team_aston',
    name: 'British Racing Green',
    shortName: 'BRG',
    colorHex: '#047857',       // Emerald Racing Green
    secondaryColorHex: '#84cc16', // Lime
    enginePower: 90,
    aeroEfficiency: 89,
    chassisBalance: 88,
    pitCrewRating: 87,
    driverIds: ['d_alvarez', 'd_stroll'],
  },
  {
    id: 'team_williams',
    name: 'Grove Heritage',
    shortName: 'GROVE',
    colorHex: '#2563eb',       // Williams Royal Blue
    secondaryColorHex: '#38bdf8',
    enginePower: 89,
    aeroEfficiency: 88,
    chassisBalance: 89,
    pitCrewRating: 86,
    driverIds: ['d_albon', 'd_sainz'],
  },
  {
    id: 'team_audi',
    name: 'Ingolstadt Speedworks',
    shortName: 'AUDI',
    colorHex: '#475569',       // Tech Slate Grey
    secondaryColorHex: '#ef4444', // Neon Red
    enginePower: 88,
    aeroEfficiency: 87,
    chassisBalance: 86,
    pitCrewRating: 84,
    driverIds: ['d_hulkenberg', 'd_bortoleto'],
  },
  {
    id: 'team_cadillac',
    name: 'Apex American',
    shortName: 'APEX',
    colorHex: '#e2e8f0',       // White Pearl
    secondaryColorHex: '#1d4ed8', // American Blue
    enginePower: 87,
    aeroEfficiency: 86,
    chassisBalance: 85,
    pitCrewRating: 82,
    driverIds: ['d_herta', 'd_bottas'],
  },
  {
    id: 'team_alpine',
    name: 'Dieppe Blue',
    shortName: 'DIEPPE',
    colorHex: '#3b82f6',       // Alpine Blue
    secondaryColorHex: '#ec4899', // Pink accent
    enginePower: 86,
    aeroEfficiency: 86,
    chassisBalance: 85,
    pitCrewRating: 83,
    driverIds: ['d_gasly', 'd_doohan'],
  },
  {
    id: 'team_haas',
    name: 'Kannapolis Dynamics',
    shortName: 'HAAS',
    colorHex: '#71717a',       // Grey Gunmetal
    secondaryColorHex: '#dc2626', // Red
    enginePower: 87,
    aeroEfficiency: 85,
    chassisBalance: 84,
    pitCrewRating: 85,
    driverIds: ['d_ocon', 'd_bearman'],
  },
  {
    id: 'team_rb',
    name: 'Faenza Veloce',
    shortName: 'FAENZA',
    colorHex: '#0284c7',       // Sky Blue
    secondaryColorHex: '#ffffff',
    enginePower: 88,
    aeroEfficiency: 86,
    chassisBalance: 86,
    pitCrewRating: 88,
    driverIds: ['d_tsunoda', 'd_hadjar'],
  },
];
