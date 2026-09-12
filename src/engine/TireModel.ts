// PitWall: Formula Manager — Lastik Fiziği ve "Uçurum" (The Cliff) Motoru
// Bu dosya yarışın kaderini belirler: Lastik ne kadar hızlı eriyor ve ne zaman bitiyor?

import { TireCompound, TireSpec, TireState } from '../types';

// Her lastik hamurunun fizik kuralları
export const TIRE_SPECS: Record<TireCompound, TireSpec> = {
  // Yumuşak Lastik: Sıralama turları ve erken kaçış için biçilmiş kaftan (-0.75s hızlı).
  // Ancak ömrü çok kısadır (15-20 turda erir).
  SOFT: {
    compound: 'SOFT',
    name: 'Yumuşak (Soft C4/C5)',
    colorHex: '#ef4444',       // Kırmızı
    baseGrip: -0.75,           // Referans tura göre 0.75 saniye daha hızlı
    degradationPerLap: 3.4,    // Her tur yaklaşık %3.4 erir
    cliffThresholdPct: 20.0,   // %20'nin altına indiğinde uçurum başlar
    optimalWetnessMin: 0,
    optimalWetnessMax: 15,
  },

  // Orta Hamur: Yarışın can damarıdır. Hem tutuşu iyidir hem de ömrü makuldür (~25-30 tur).
  MEDIUM: {
    compound: 'MEDIUM',
    name: 'Orta (Medium C3)',
    colorHex: '#eab308',       // Sarı
    baseGrip: 0.0,             // Baz süre referansı
    degradationPerLap: 2.1,    // Her tur yaklaşık %2.1 erir
    cliffThresholdPct: 18.0,
    optimalWetnessMin: 0,
    optimalWetnessMax: 15,
  },

  // Sert Hamur: Isınması zordur ve virajda yavaştır (+0.65s).
  // Ancak taş gibidir, 40 tur boyunca banamısın demez. Tek pit-stop için şarttır.
  HARD: {
    compound: 'HARD',
    name: 'Sert (Hard C1/C2)',
    colorHex: '#f8fafc',       // Beyaz
    baseGrip: 0.65,            // 0.65 saniye daha yavaş
    degradationPerLap: 1.3,    // Her tur sadece %1.3 erir
    cliffThresholdPct: 15.0,
    optimalWetnessMin: 0,
    optimalWetnessMax: 15,
  },

  // Geçiş Lastiği: Yağmur çiselemeye başlayıp pist ıslaklığı %20-%65 arasına geldiğinde takılır.
  // Kuru asfaltta kalırsa 2 turda aşırı ısınıp parçalanır!
  INTERMEDIATE: {
    compound: 'INTERMEDIATE',
    name: 'Geçiş (Intermediate)',
    colorHex: '#22c55e',       // Yeşil
    baseGrip: 1.8,
    degradationPerLap: 2.5,
    cliffThresholdPct: 18.0,
    optimalWetnessMin: 20,
    optimalWetnessMax: 65,
  },

  // Yoğun Yağmur Lastiği: Pist göle döndüğünde (%65 üzeri ıslaklık) aquaplaning'i önler.
  WET: {
    compound: 'WET',
    name: 'Yoğun Yağmur (Wet)',
    colorHex: '#3b82f6',       // Mavi
    baseGrip: 4.5,
    degradationPerLap: 2.8,
    cliffThresholdPct: 20.0,
    optimalWetnessMin: 60,
    optimalWetnessMax: 100,
  },
};

export class TireModel {
  /**
   * Pite girildiğinde araca takılan sıfır kilometre, yepyeni bir lastik seti oluşturur.
   */
  public static createTire(compound: TireCompound): TireState {
    return {
      compound,
      healthPct: 100.0,     // Fabrikadan yeni çıktı, %100 sapasağlam
      ageLaps: 0,           // 0 tur atıldı
      isCliffHit: false,    // Henüz uçuruma çarpmadı
      tempCelsius: 100.0,   // Battaniyeden yeni çıktı, ideal 100°C sıcaklıkta
    };
  }

  /**
   * Lastiğin o turki hız avantajını/kaybını saniye cinsinden hesaplar.
   * Aşınma arttıkça tur süresi uzar, uçuruma çarparsa süre aniden fırlar!
   */
  public static calculateTireDeltaSec(
    tire: TireState,
    trackWetnessPct: number,
    chassisTireCare: number // Takımın şasi dengesi (1-100)
  ): { deltaSec: number; isCliff: boolean; lockupRiskPct: number } {
    const spec = TIRE_SPECS[tire.compound];

    // 1. Hamurun temel hız farkı (Soft hızlı, Hard yavaş)
    let deltaSec = spec.baseGrip;

    // 2. Normal Aşınma Kaybı (%100'den %20'ye kadar doğrusal yavaşlama)
    // Lastik eskidikçe yavaşça tur başına 1.3 saniyeye kadar kaybederiz.
    const wearFactor = (100 - tire.healthPct) / 100;
    const chassisFactor = 1 - (((chassisTireCare - 85) / 100) * 0.15); // Şasisi iyi takım lastiği korur
    const wearDelta = wearFactor * 1.3 * chassisFactor;
    deltaSec += wearDelta;

    // 3. "Uçurum" (The Cliff) Mekaniği:
    // Eğer lastik sağlığı %20'nin altına inerse kauçuk tamamen biter.
    // Bir anda tur başına +2.5 saniye ceza biner ve spin/kilitlenme riski tavan yapar!
    const isCliff = tire.healthPct <= spec.cliffThresholdPct;
    let lockupRisk = 1.0; // Normalde her tur %1 kilitlenme riski vardır

    if (isCliff) {
      const cliffDepth = (spec.cliffThresholdPct - tire.healthPct) / spec.cliffThresholdPct;
      deltaSec += 2.5 + (cliffDepth * 2.0); // Aniden 2.5s ile 4.5s arası zaman kaybı!
      lockupRisk += 25.0 + (cliffDepth * 30.0); // Fren kilitlenip dışarı uçma riski %55'lere fırlar!
    }

    // 4. Pist Islaklığı ile Lastik Uyumu (Hava Durumu Kumarı):
    if (tire.compound === 'SOFT' || tire.compound === 'MEDIUM' || tire.compound === 'HARD') {
      // Islak pistte kuru zemin lastiğiyle kalırsan buz pateni yaparsın!
      if (trackWetnessPct > 20) {
        const wetPenalty = ((trackWetnessPct - 20) / 10) * 2.2;
        deltaSec += wetPenalty;
        lockupRisk += trackWetnessPct * 0.5;
      }
    } else if (tire.compound === 'INTERMEDIATE') {
      // Yağmur durup pist kuruyunca yeşil lastikle kalırsan araba gitmez
      if (trackWetnessPct < 15) {
        deltaSec += 3.0; // Kuru asfaltta Inter lastik çok yavaştır
      } else if (trackWetnessPct > 65) {
        deltaSec += ((trackWetnessPct - 65) / 10) * 1.5; // Sel basarsa kızaklama yapar
      }
    } else if (tire.compound === 'WET') {
      // Kuru asfaltta mavi yağmur lastiğiyle gezmek intihardır
      if (trackWetnessPct < 40) {
        deltaSec += 6.0;
      }
    }

    return { deltaSec, isCliff, lockupRiskPct: Math.min(95, lockupRisk) };
  }

  /**
   * Bir tur tamamlandığında lastiğin ne kadar aşındığını ve sıcaklığını hesaplar.
   * Pilot gaza yüklenirse (PUSH) veya öndeki aracın kirli havasında kalırsa lastik daha çabuk biter.
   */
  public static degradeTire(
    currentTire: TireState,
    paceMultiplier: number,  // Sürüş modu çarpanı (Conserve: 0.75, Balanced: 1.0, Push: 1.45)
    driverTireCare: number,   // Pilotun lastik saklama yeteneği (1-100)
    trackWetnessPct: number,
    inDirtyAir: boolean = false // Öndekinin egzoz dumanında ve türbülansında mı gidiyor?
  ): TireState {
    const spec = TIRE_SPECS[currentTire.compound];
    
    // Usta pilotlar (Hamilton, Alonso vb.) lastiği %25'e kadar daha az aşındırır
    const careDiscount = 1 - ((driverTireCare - 50) / 200);
    
    // Kirli havada araba virajda kaydığı için lastik %22 daha hızlı erir
    const dirtyAirWearMultiplier = inDirtyAir ? 1.22 : 1.0;

    let lapWear = spec.degradationPerLap * paceMultiplier * careDiscount * dirtyAirWearMultiplier;

    // Islak lastik kuru pistte 2.5 kat daha hızlı aşınır ve parçalanır
    if ((spec.compound === 'INTERMEDIATE' || spec.compound === 'WET') && trackWetnessPct < 15) {
      lapWear *= 2.5;
    }

    const newHealth = Math.max(0, currentTire.healthPct - lapWear);
    const cliffHit = newHealth <= spec.cliffThresholdPct;

    // Sıcaklık fiziği: Temiz havada 100°C'ye doğru soğur; Push ve Kirli Havada 130°C'yi aşar
    let tempDelta = 0;
    if (paceMultiplier > 1.2) tempDelta += 3.5;       // Gazlayınca ısınır
    else if (paceMultiplier < 0.9) tempDelta -= 2.5;  // Tempoyu düşürünce soğur

    if (inDirtyAir) tempDelta += 3.0; // Kirli hava lastiği pişirir!
    else if (currentTire.tempCelsius > 102) tempDelta -= 1.5; // Temiz hava doğal soğutma sağlar

    const newTemp = Math.max(80, Math.min(138, currentTire.tempCelsius + tempDelta));

    return {
      compound: currentTire.compound,
      healthPct: Math.round(newHealth * 10) / 10,
      ageLaps: currentTire.ageLaps + 1,
      isCliffHit: cliffHit,
      tempCelsius: Math.round(newTemp * 10) / 10,
    };
  }
}
