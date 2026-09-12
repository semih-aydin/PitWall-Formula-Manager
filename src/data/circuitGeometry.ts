// PitWall: Formula Manager — 2D Vektör Pist Geometrisi
// Burada ikonik pistlerin (Monza ve Monako) 2B koordinat düzlemindeki eğri noktalarını tanımlıyoruz.
// Arabalar bu koordinat noktaları üzerinde 0.0 ile 1.0 arasındaki tur ilerlemesine göre kayar.

export interface Point2D {
  x: number; // 0 ile 1000 arası normalize koordinat
  y: number; // 0 ile 1000 arası normalize koordinat
}

export interface CircuitGeometry {
  trackId: string;
  viewBox: { width: number; height: number };
  points: Point2D[];        // Pistin ana asfalt çizgisi
  pitLanePoints: Point2D[];  // Pit yolu paralel çizgisi
  startFinishPoint: Point2D;
  sector1EndPct: number;    // Sektör 1 bitiş yüzdesi (örn: 0.33)
  sector2EndPct: number;    // Sektör 2 bitiş yüzdesi (örn: 0.67)
}

/**
 * Kontrol noktaları dizisinden Catmull-Rom spline eğrisi üreterek
 * pistin köşeli poligon değil, kaymak gibi akıcı ve organik virajlara sahip olmasını sağlar.
 * Öğrenci işi mantık: 4 komşu noktanın teğetlerini alıp aralarına yumuşak geçiş noktaları serpiştiririz.
 */
export function smoothClosedSpline(controlPoints: Point2D[], subdivisionsPerSegment = 6): Point2D[] {
  if (controlPoints.length < 3) return controlPoints;
  const n = controlPoints.length;
  const smoothed: Point2D[] = [];

  for (let i = 0; i < n; i++) {
    const p0 = controlPoints[(i - 1 + n) % n];
    const p1 = controlPoints[i];
    const p2 = controlPoints[(i + 1) % n];
    const p3 = controlPoints[(i + 2) % n];

    for (let t = 0; t < subdivisionsPerSegment; t++) {
      const u = t / subdivisionsPerSegment;
      const u2 = u * u;
      const u3 = u2 * u;

      // Standart Catmull-Rom matrisi formülü
      const x = 0.5 * (
        (2 * p1.x) +
        (-p0.x + p2.x) * u +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3
      );
      const y = 0.5 * (
        (2 * p1.y) +
        (-p0.y + p2.y) * u +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3
      );
      smoothed.push({
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
      });
    }
  }

  // Döngüyü eksiksiz kapatmak için ilk noktayı en sona kopyalıyoruz
  if (smoothed.length > 0) {
    smoothed.push({ x: smoothed[0].x, y: smoothed[0].y });
  }

  return smoothed;
}

// 1. Monza (Royal Temple of Speed) 2B Koordinat Eğrisi
const MONZA_RAW_POINTS: Point2D[] = [
  { x: 180, y: 510 }, // Start / Finish Başlangıcı
  { x: 380, y: 510 }, // Ana Düzlük
  { x: 580, y: 510 }, // Rettifilo frenajı
  { x: 640, y: 480 }, // Prima Variante (Turn 1)
  { x: 660, y: 440 }, // Prima Variante (Turn 2)
  { x: 640, y: 390 }, // Şikan çıkışı
  { x: 670, y: 330 }, // Curva Grande girişi
  { x: 760, y: 240 }, // Curva Grande içi
  { x: 860, y: 170 }, // Curva Grande çıkışı
  { x: 910, y: 130 }, // Roggia öncesi
  { x: 930, y: 100 }, // Roggia şikanı (Turn 4)
  { x: 890, y: 70 },  // Roggia çıkışı (Turn 5)
  { x: 800, y: 70 },  // Lesmo 1 girişi
  { x: 740, y: 90 },  // Lesmo 1 apex (Turn 6)
  { x: 690, y: 130 }, // Lesmo 2 girişi
  { x: 640, y: 170 }, // Lesmo 2 apex (Turn 7)
  { x: 560, y: 230 }, // Serraglio inişi (Köprü altı)
  { x: 460, y: 280 }, // Serraglio düzlüğü
  { x: 380, y: 320 }, // Variante Ascari frenajı
  { x: 320, y: 300 }, // Ascari sol (Turn 8)
  { x: 270, y: 320 }, // Ascari sağ (Turn 9)
  { x: 220, y: 350 }, // Ascari çıkışı (Turn 10)
  { x: 150, y: 380 }, // Rettifilo Opposto (Arka düzlük)
  { x: 90,  y: 420 }, // Parabolica frenajı
  { x: 70,  y: 470 }, // Parabolica apex (Turn 11)
  { x: 110, y: 510 }, // Parabolica çıkışı
];

export const MONZA_GEOMETRY: CircuitGeometry = {
  trackId: 'track_monza',
  viewBox: { width: 1000, height: 600 },
  points: smoothClosedSpline(MONZA_RAW_POINTS, 6),
  pitLanePoints: [
    { x: 100, y: 545 }, // Pit girişi
    { x: 380, y: 545 }, // Pit garajları
    { x: 610, y: 540 }, // Pit çıkışı
  ],
  startFinishPoint: { x: 280, y: 510 },
  sector1EndPct: 0.33,
  sector2EndPct: 0.67,
};

// 2. Monako (Monte Carlo Bay) 2B Koordinat Eğrisi
const MONACO_RAW_POINTS: Point2D[] = [
  { x: 120, y: 440 }, // Start / Finish
  { x: 300, y: 440 }, // Sainte Devote frenajı
  { x: 350, y: 400 }, // Sainte Devote (Turn 1)
  { x: 380, y: 310 }, // Beau Rivage yokuşu
  { x: 410, y: 210 }, // Massenet girişi (Turn 2)
  { x: 460, y: 120 }, // Massenet apex (Turn 3)
  { x: 550, y: 60 },  // Casino Meydanı (Turn 4)
  { x: 650, y: 60 },  // Casino düzlüğü
  { x: 720, y: 100 }, // Mirabeau Haute (Turn 5)
  { x: 800, y: 150 }, // Grand Hotel Saçtoka öncesi
  { x: 870, y: 200 }, // Fairmont Hairpin apex (Turn 6)
  { x: 880, y: 250 }, // Saçtoka çıkışı
  { x: 820, y: 280 }, // Mirabeau Bas (Turn 7)
  { x: 780, y: 320 }, // Portier girişi
  { x: 830, y: 370 }, // Portier apex (Turn 8)
  { x: 880, y: 420 }, // Tünel girişi
  { x: 870, y: 480 }, // Tünel içi (hızlı viraj)
  { x: 800, y: 510 }, // Tünel çıkışı
  { x: 700, y: 510 }, // Şikan öncesi
  { x: 650, y: 470 }, // Nouvelle Chicane sol (Turn 10)
  { x: 610, y: 490 }, // Nouvelle Chicane sağ (Turn 11)
  { x: 520, y: 500 }, // Tabac virajı (Turn 12)
  { x: 430, y: 510 }, // Louis Chiron (Turn 13)
  { x: 380, y: 470 }, // Yüzme Havuzu şikanı (Turn 14)
  { x: 320, y: 510 }, // Havuz çıkışı (Turn 16)
  { x: 230, y: 510 }, // La Rascasse frenajı
  { x: 170, y: 470 }, // La Rascasse içi (Turn 17-18)
  { x: 120, y: 490 }, // Anthony Noghes (Turn 19)
];

export const MONACO_GEOMETRY: CircuitGeometry = {
  trackId: 'track_monaco',
  viewBox: { width: 1000, height: 600 },
  points: smoothClosedSpline(MONACO_RAW_POINTS, 6),
  pitLanePoints: [
    { x: 230, y: 535 }, // Pit girişi
    { x: 330, y: 535 }, // Pit yolu
    { x: 160, y: 455 }, // Pit çıkışı
  ],
  startFinishPoint: { x: 200, y: 440 },
  sector1EndPct: 0.33,
  sector2EndPct: 0.67,
};

// 3. Silverstone (Northamptonshire Airfield Circuit) 2B Koordinat Eğrisi
const SILVERSTONE_RAW_POINTS: Point2D[] = [
  { x: 380, y: 520 }, // Hamilton Straight (Start / Finish)
  { x: 500, y: 520 }, // Abbey frenajı
  { x: 580, y: 490 }, // Abbey apex (Turn 1)
  { x: 640, y: 430 }, // Farm Curve (Turn 2)
  { x: 670, y: 360 }, // Village virajı (Turn 3)
  { x: 610, y: 320 }, // The Loop girişi
  { x: 540, y: 340 }, // The Loop hairpin (Turn 4)
  { x: 520, y: 390 }, // The Loop içi
  { x: 550, y: 430 }, // Aintree çıkışı (Turn 5)
  { x: 660, y: 430 }, // Wellington Düzlüğü
  { x: 800, y: 420 }, // Wellington sonu
  { x: 880, y: 380 }, // Brooklands (Turn 6)
  { x: 920, y: 310 }, // Luffield apex (Turn 7)
  { x: 890, y: 240 }, // Luffield çıkışı
  { x: 820, y: 210 }, // Woodcote (Turn 8)
  { x: 740, y: 200 }, // National Straight
  { x: 640, y: 190 }, // Copse frenajı
  { x: 560, y: 130 }, // Copse apex (Turn 9)
  { x: 490, y: 80 },  // Maggotts (Turn 10-11)
  { x: 430, y: 110 }, // Becketts (Turn 12-13)
  { x: 380, y: 80 },  // Chapel (Turn 14)
  { x: 260, y: 140 }, // Hangar Düzlüğü (hızlı iniş)
  { x: 140, y: 220 }, // Hangar sonu
  { x: 90,  y: 290 }, // Stowe apex (Turn 15)
  { x: 100, y: 370 }, // Stowe çıkışı
  { x: 160, y: 430 }, // Vale şikanı (Turn 16)
  { x: 220, y: 470 }, // Club girişi (Turn 17)
  { x: 290, y: 510 }, // Club apex (Turn 18)
];

export const SILVERSTONE_GEOMETRY: CircuitGeometry = {
  trackId: 'track_silverstone',
  viewBox: { width: 1000, height: 600 },
  points: smoothClosedSpline(SILVERSTONE_RAW_POINTS, 6),
  pitLanePoints: [
    { x: 280, y: 555 }, // Pit girişi
    { x: 420, y: 555 }, // The Wing garajları
    { x: 560, y: 545 }, // Pit çıkışı
  ],
  startFinishPoint: { x: 410, y: 520 },
  sector1EndPct: 0.32,
  sector2EndPct: 0.68,
};

export const CIRCUIT_GEOMETRIES: Record<string, CircuitGeometry> = {
  track_monza: MONZA_GEOMETRY,
  track_monaco: MONACO_GEOMETRY,
  track_silverstone: SILVERSTONE_GEOMETRY,
};

/**
 * Nokta dizisi (polyline) boyunca progressPct (0.0 - 1.0) ilerlemesine karşılık gelen
 * (x, y) koordinatını doğrusal interpolasyonla (lerp) hesaplar.
 */
export function getCoordinatesOnPolyline(points: Point2D[], progressPct: number): Point2D {
  if (!points || points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return points[0];

  const clampedProgress = Math.max(0, Math.min(1.0, progressPct));
  const totalSegments = points.length - 1;

  const rawIndex = clampedProgress * totalSegments;
  const startIndex = Math.min(Math.floor(rawIndex), totalSegments - 1);
  const endIndex = startIndex + 1;
  const segmentFraction = rawIndex - startIndex;

  const pStart = points[startIndex];
  const pEnd = points[endIndex];

  return {
    x: pStart.x + (pEnd.x - pStart.x) * segmentFraction,
    y: pStart.y + (pEnd.y - pStart.y) * segmentFraction,
  };
}

/**
 * 0.0 ile 1.0 arasındaki bir tur ilerleme değerine karşılık gelen (x, y) koordinatını
 * ana pist çizgisi boyunca hesaplar.
 */
export function getCoordinatesAtLapProgress(geometry: CircuitGeometry, progressPct: number): Point2D {
  return getCoordinatesOnPolyline(geometry.points, progressPct);
}

/**
 * Pitteki aracın (inPitLane) pit yolu çizgisi üzerindeki koordinatını hesaplar.
 */
export function getPitLaneCoordinates(geometry: CircuitGeometry, progressPct: number): Point2D {
  return getCoordinatesOnPolyline(geometry.pitLanePoints, progressPct);
}

/**
 * Verilen tur yüzdesindeki pist yönünü (teğet ve dik normal vektörlerini) hesaplar.
 * Sektör çizgilerini ve Start/Finish çizgisini piste tam dik çizebilmek için kullanılır.
 */
export function getTrackNormalAtLapProgress(
  geometry: CircuitGeometry,
  progressPct: number
): {
  point: Point2D;
  normal: { x: number; y: number };
} {
  const point = getCoordinatesAtLapProgress(geometry, progressPct);
  const dt = 0.005;
  const pForward = getCoordinatesAtLapProgress(geometry, (progressPct + dt) % 1.0);
  const pBackward = getCoordinatesAtLapProgress(geometry, (progressPct - dt + 1.0) % 1.0);

  const dx = pForward.x - pBackward.x;
  const dy = pForward.y - pBackward.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;

  return {
    point,
    normal: {
      x: -dy / len,
      y: dx / len,
    },
  };
}

