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

// 1. Monza (Royal Temple of Speed) 2B Koordinat Eğrisi
// Monza'nın meşhur yapısı: Uzun ana düzlük, Rettifilo şikanı, Curva Grande, Roggia, Lesmo virajları, Serraglio ve Parabolica.
export const MONZA_GEOMETRY: CircuitGeometry = {
  trackId: 'track_monza',
  viewBox: { width: 1000, height: 500 },
  points: [
    { x: 150, y: 420 }, // 0.00 Start/Finish Başlangıcı
    { x: 450, y: 420 }, // 0.10 Rettifilo Düzlüğü
    { x: 520, y: 420 }, // Rettifilo frenajı
    { x: 535, y: 395 }, // Şikan içi
    { x: 520, y: 370 }, // Şikan çıkışı
    { x: 550, y: 330 }, // Curva Grande'ye giriş
    { x: 620, y: 260 }, // Curva Grande içi
    { x: 720, y: 190 }, // Curva Grande çıkışı
    { x: 780, y: 150 }, // Variante della Roggia öncesi
    { x: 795, y: 140 }, // Roggia şikanı
    { x: 820, y: 145 }, // Roggia çıkışı
    { x: 870, y: 160 }, // Lesmo 1 girişi
    { x: 890, y: 185 }, // Lesmo 1 apex
    { x: 875, y: 220 }, // Lesmo 2 öncesi
    { x: 890, y: 245 }, // Lesmo 2 apex
    { x: 870, y: 275 }, // Lesmo 2 çıkışı (Serraglio düzlüğüne iniş)
    { x: 750, y: 310 }, // Serraglio düzlüğü
    { x: 630, y: 345 }, // Köprü altı
    { x: 520, y: 360 }, // Variante Ascari frenajı
    { x: 470, y: 345 }, // Ascari sol
    { x: 440, y: 325 }, // Ascari sağ
    { x: 380, y: 300 }, // Ascari çıkışı
    { x: 260, y: 280 }, // Arka düzlük (Rettifilo opposto)
    { x: 180, y: 270 }, // Curva Parabolica frenajı
    { x: 120, y: 290 }, // Parabolica girişi
    { x: 80,  y: 340 }, // Parabolica apex (geniş sağ viraj)
    { x: 100, y: 395 }, // Parabolica çıkışı
    { x: 150, y: 420 }, // 1.00 Start/Finish'e bağlanış
  ],
  pitLanePoints: [
    { x: 110, y: 440 }, // Pit girişi
    { x: 300, y: 440 }, // Pit kutuları
    { x: 490, y: 440 }, // Pit çıkışı
  ],
  startFinishPoint: { x: 250, y: 420 },
  sector1EndPct: 0.33,
  sector2EndPct: 0.67,
};

// 2. Monako (Monte Carlo Bay) 2B Koordinat Eğrisi
// Sainte Devote, Beau Rivage tırmanışı, Massenet, Casino, Mirabeau, Grand Hotel Saçtoka virajı, Tünel ve Havuz bölümü.
export const MONACO_GEOMETRY: CircuitGeometry = {
  trackId: 'track_monaco',
  viewBox: { width: 1000, height: 600 },
  points: [
    { x: 200, y: 480 }, // Start / Finish
    { x: 360, y: 480 }, // Sainte Devote frenajı
    { x: 390, y: 440 }, // Sainte Devote içi
    { x: 420, y: 350 }, // Beau Rivage yokuşu
    { x: 450, y: 250 }, // Massenet girişi
    { x: 520, y: 200 }, // Casino Meydanı
    { x: 580, y: 220 }, // Mirabeau Haute
    { x: 620, y: 270 }, // Grand Hotel Saçtoka (Fairmont Hairpin)
    { x: 580, y: 310 }, // Mirabeau Bas
    { x: 630, y: 340 }, // Portier (Deniz kıyısına iniş)
    { x: 750, y: 360 }, // Tünel içi (hızlı karanlık bölüm)
    { x: 850, y: 370 }, // Tünel çıkışı
    { x: 870, y: 430 }, // Nouvelle Chicane
    { x: 830, y: 470 }, // Tabac virajı
    { x: 720, y: 480 }, // Louis Chiron (Havuz bölümü 1)
    { x: 620, y: 520 }, // Havuz bölümü şikanı
    { x: 500, y: 530 }, // Rascasse frenajı
    { x: 450, y: 500 }, // Rascasse dar virajı
    { x: 370, y: 520 }, // Anthony Noghes son virajı
    { x: 200, y: 480 }, // Start / Finish bağlanışı
  ],
  pitLanePoints: [
    { x: 460, y: 540 }, // Pit girişi
    { x: 300, y: 510 }, // Pit yolu
    { x: 210, y: 490 }, // Pit çıkışı
  ],
  startFinishPoint: { x: 250, y: 480 },
  sector1EndPct: 0.33,
  sector2EndPct: 0.67,
};

// 3. Silverstone (Northamptonshire Airfield Circuit) 2B Koordinat Eğrisi
// Hamilton Straight, Abbey, Farm, Village, The Loop, Aintree, Wellington Düzlüğü,
// Brooklands, Luffield, Woodcote, Copse, Maggotts-Becketts-Chapel, Hangar Düzlüğü, Stowe, Vale, Club.
export const SILVERSTONE_GEOMETRY: CircuitGeometry = {
  trackId: 'track_silverstone',
  viewBox: { width: 1000, height: 600 },
  points: [
    { x: 380, y: 480 }, // 0.00 Hamilton Straight (Start / Finish)
    { x: 480, y: 480 }, // Abbey girişi
    { x: 530, y: 450 }, // Abbey apex
    { x: 550, y: 410 }, // Farm Curve
    { x: 520, y: 370 }, // Village virajı
    { x: 460, y: 360 }, // The Loop girişi
    { x: 430, y: 390 }, // The Loop içi
    { x: 450, y: 420 }, // The Loop çıkışı
    { x: 500, y: 430 }, // Aintree
    { x: 620, y: 420 }, // Wellington Düzlüğü
    { x: 740, y: 410 }, // Wellington sonu
    { x: 780, y: 380 }, // Brooklands
    { x: 800, y: 330 }, // Luffield
    { x: 760, y: 290 }, // Woodcote
    { x: 700, y: 270 }, // Ulusal Düzlük
    { x: 620, y: 240 }, // Copse frenajı
    { x: 580, y: 190 }, // Copse apex
    { x: 520, y: 170 }, // Maggotts
    { x: 460, y: 190 }, // Becketts
    { x: 410, y: 160 }, // Chapel çıkışı
    { x: 260, y: 200 }, // Hangar Düzlüğü (hızlı iniş)
    { x: 150, y: 240 }, // Stowe frenajı
    { x: 120, y: 290 }, // Stowe apex
    { x: 160, y: 370 }, // Vale şikanı
    { x: 220, y: 410 }, // Club virajı girişi
    { x: 300, y: 460 }, // Club çıkışı (Start/Finish'e bağlanış)
    { x: 380, y: 480 }, // 1.00 Tur Sonu
  ],
  pitLanePoints: [
    { x: 270, y: 460 }, // Pit girişi
    { x: 380, y: 460 }, // Pit garajları (The Wing)
    { x: 500, y: 460 }, // Pit çıkışı
  ],
  startFinishPoint: { x: 400, y: 480 },
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
