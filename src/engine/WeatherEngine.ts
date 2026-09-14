// PitWall: Formula Manager — Dinamik Hava Durumu ve Geçiş (Crossover) Motoru
// Hazırlayan: Semih (Lead Systems & Engine Developer)
//
// Bu motor yarışın kaderini belirleyen hava muhalefetini yönetir:
// 1. Yağmur yağdıkça pist ıslanır (Drizzle: +%4.5/tur, Rain: +%9.5/tur, Heavy: +%16/tur)
// 2. Yağmur dindiğinde pist doğal olarak kurur (-%2.4/tur + asfalt ısısı çarpanı)
// 3. Lastik geçiş eşikleri (Crossover) tetiklendiğinde pit duvarına stratejik telsiz uyarısı düşer:
//    - %0 - %18: Kuru zemin slick lastikler (Soft / Medium / Hard)
//    - %18 - %62: Geçiş Lastiği (Intermediate - Yeşil)
//    - %62 - %100: Yoğun Yağmur Lastiği (Full Wet - Mavi)

import { RaceEvent, TireCompound, WeatherCondition, WeatherForecast, WeatherState } from '../types';
import { WEATHER_CONFIG } from '../config/simulationConfig';

export class WeatherEngine {
  private condition: WeatherCondition = 'DRY';
  private trackWetnessPct: number = 0.0;
  private rainIntensityPct: number = 0.0;
  private airTempCelsius: number = WEATHER_CONFIG.baseAirTempCelsius;
  private trackTempCelsius: number = WEATHER_CONFIG.baseTrackTempCelsius;

  // Stratejik telsiz mesajlarını sadece eşik aşıldığı an 1 kez patlatmak için önceki crossover durumu
  private lastAnnouncedCrossover: 'SLICK' | 'INTERMEDIATE' | 'WET' = 'SLICK';
  private lastAnnouncedCondition: WeatherCondition = 'DRY';

  // Radar tahminleri
  private forecast: WeatherForecast[] = [];

  constructor(initialCondition: WeatherCondition = 'DRY', initialWetnessPct: number = 0.0) {
    this.condition = initialCondition;
    this.trackWetnessPct = Math.max(0, Math.min(100, initialWetnessPct));
    this.updateIntensityAndTemps();
    this.lastAnnouncedCrossover = this.getCrossoverCategory(this.trackWetnessPct);
    this.lastAnnouncedCondition = initialCondition;
    this.regenerateForecast(0, 50);
  }

  /**
   * Crossover penceresini belirler: Slick, Inter ya da Full Wet
   */
  public getCrossoverCategory(wetnessPct: number): 'SLICK' | 'INTERMEDIATE' | 'WET' {
    if (wetnessPct < WEATHER_CONFIG.intermediateCrossoverPct) {
      return 'SLICK';
    } else if (wetnessPct <= WEATHER_CONFIG.wetCrossoverPct) {
      return 'INTERMEDIATE';
    } else {
      return 'WET';
    }
  }

  /**
   * Mevcut ıslaklığa göre en ideal lastik hamuru önerisini döner
   */
  public getOptimalCompound(): TireCompound {
    const category = this.getCrossoverCategory(this.trackWetnessPct);
    if (category === 'SLICK') return 'MEDIUM';
    if (category === 'INTERMEDIATE') return 'INTERMEDIATE';
    return 'WET';
  }

  /**
   * Duruma göre yağış şiddeti ve sıcaklıkları dengeler
   */
  private updateIntensityAndTemps(): void {
    switch (this.condition) {
      case 'DRY':
        this.rainIntensityPct = 0;
        this.airTempCelsius = WEATHER_CONFIG.baseAirTempCelsius;
        this.trackTempCelsius = WEATHER_CONFIG.baseTrackTempCelsius;
        break;
      case 'OVERCAST':
        this.rainIntensityPct = 0;
        this.airTempCelsius = WEATHER_CONFIG.baseAirTempCelsius - 2.0;
        this.trackTempCelsius = WEATHER_CONFIG.baseTrackTempCelsius - 4.0;
        break;
      case 'DRIZZLE':
        this.rainIntensityPct = 25;
        this.airTempCelsius = WEATHER_CONFIG.baseAirTempCelsius - 4.0;
        this.trackTempCelsius = WEATHER_CONFIG.baseTrackTempCelsius - 8.0;
        break;
      case 'RAIN':
        this.rainIntensityPct = 65;
        this.airTempCelsius = WEATHER_CONFIG.baseAirTempCelsius - 6.0;
        this.trackTempCelsius = WEATHER_CONFIG.baseTrackTempCelsius - 12.0;
        break;
      case 'HEAVY_RAIN':
        this.rainIntensityPct = 100;
        this.airTempCelsius = WEATHER_CONFIG.baseAirTempCelsius - 8.0;
        this.trackTempCelsius = WEATHER_CONFIG.baseTrackTempCelsius - 15.0;
        break;
    }
  }

  /**
   * 1 Tur Tamamlandığında Hava Durumunu ve Pist Islaklığını İlerletir
   */
  public tickLap(currentLap: number, totalLaps: number, raceTimeSec: number): Omit<RaceEvent, 'id'>[] {
    const events: Omit<RaceEvent, 'id'>[] = [];

    // 1. Rastgele hava geçiş kontrolü (%12 olasılıkla hava evrilir)
    this.evaluateWeatherTransition();

    // 2. Islaklık matematiği: Yağmurda birikir, kuruda buharlaşır
    this.calculateWetnessStep();

    // 3. Telsiz Olayları: Hava durumu veya crossover penceresi değiştiyse pit duvarını uyar
    const newCrossover = this.getCrossoverCategory(this.trackWetnessPct);

    // Hava koşulu değiştiğinde genel bilgilendirme
    if (this.condition !== this.lastAnnouncedCondition) {
      const conditionMsg = this.getConditionChangeMessage(this.condition);
      if (conditionMsg) {
        events.push({
          lap: currentLap,
          timestampSec: raceTimeSec,
          type: 'WEATHER_CHANGE',
          message: conditionMsg,
          severity: this.condition === 'HEAVY_RAIN' ? 'DANGER' : 'TACTICAL',
        });
      }
      this.lastAnnouncedCondition = this.condition;
    }

    // Crossover penceresi değiştiğinde acil pit stratejisi uyarısı
    if (newCrossover !== this.lastAnnouncedCrossover) {
      const crossoverMsg = this.getCrossoverChangeMessage(this.lastAnnouncedCrossover, newCrossover);
      if (crossoverMsg) {
        events.push({
          lap: currentLap,
          timestampSec: raceTimeSec,
          type: 'RADIO_MESSAGE',
          message: crossoverMsg,
          severity: newCrossover === 'WET' ? 'DANGER' : 'WARNING',
        });
      }
      this.lastAnnouncedCrossover = newCrossover;
    }

    // 4. Gelecek turlar için radar tahminini yenile
    this.regenerateForecast(currentLap, totalLaps);

    return events;
  }

  /**
   * Gerçek zamanlı mikro-adımda (simulateTick) ıslaklığı akıcı kaydırır
   */
  public tickTime(dtSec: number, estimatedLapTimeSec: number = 80.0): void {
    const fractionOfLap = dtSec / estimatedLapTimeSec;

    let deltaWetness = 0;
    if (this.condition === 'DRIZZLE') {
      deltaWetness = WEATHER_CONFIG.drizzleAccumulationPerLap * fractionOfLap;
    } else if (this.condition === 'RAIN') {
      deltaWetness = WEATHER_CONFIG.rainAccumulationPerLap * fractionOfLap;
    } else if (this.condition === 'HEAVY_RAIN') {
      deltaWetness = WEATHER_CONFIG.heavyRainAccumulationPerLap * fractionOfLap;
    } else {
      // Kuruma
      const dryingMultiplier = 1.0 + Math.max(0, (this.trackTempCelsius - 25) / 20);
      deltaWetness = -(WEATHER_CONFIG.baseDryingRatePerLap * dryingMultiplier * fractionOfLap);
    }

    this.trackWetnessPct = Math.max(0, Math.min(100, Math.round((this.trackWetnessPct + deltaWetness) * 100) / 100));
  }

  /**
   * Tur bazlı ıslaklık artışı / buharlaşması
   */
  private calculateWetnessStep(): void {
    let delta = 0;
    if (this.condition === 'DRIZZLE') {
      delta = WEATHER_CONFIG.drizzleAccumulationPerLap;
    } else if (this.condition === 'RAIN') {
      delta = WEATHER_CONFIG.rainAccumulationPerLap;
    } else if (this.condition === 'HEAVY_RAIN') {
      delta = WEATHER_CONFIG.heavyRainAccumulationPerLap;
    } else {
      // Kuruma hızı: Sıcak asfalt suyu çok daha hızlı buharlaştırır
      const dryingMultiplier = 1.0 + Math.max(0, (this.trackTempCelsius - 25) / 20);
      delta = -(WEATHER_CONFIG.baseDryingRatePerLap * dryingMultiplier);
    }

    this.trackWetnessPct = Math.max(0, Math.min(100, Math.round((this.trackWetnessPct + delta) * 10) / 10));
    this.updateIntensityAndTemps();
  }

  /**
   * Hava durumu olasılık zinciri (Markov zinciri benzeri gerçekçi geçişler)
   */
  private evaluateWeatherTransition(): void {
    const roll = Math.random();
    if (roll > WEATHER_CONFIG.weatherTransitionChance) return;

    // Koşul geçiş haritası
    switch (this.condition) {
      case 'DRY':
        this.condition = 'OVERCAST';
        break;
      case 'OVERCAST':
        this.condition = Math.random() < 0.65 ? 'DRIZZLE' : 'DRY';
        break;
      case 'DRIZZLE':
        this.condition = Math.random() < 0.55 ? 'RAIN' : 'OVERCAST';
        break;
      case 'RAIN':
        this.condition = Math.random() < 0.35 ? 'HEAVY_RAIN' : 'DRIZZLE';
        break;
      case 'HEAVY_RAIN':
        this.condition = 'RAIN'; // Fırtına yatışmaya başlar
        break;
    }

    this.updateIntensityAndTemps();
  }

  /**
   * Koşul değişim telsiz anonsu
   */
  private getConditionChangeMessage(condition: WeatherCondition): string {
    switch (condition) {
      case 'OVERCAST':
        return 'TELSİZ: Gökyüzü karardı, pist üstünde bulutlanma yoğunlaşıyor.';
      case 'DRIZZLE':
        return 'TELSİZ: 2. ve 3. sektörlerde hafif çiseleme başladı. Asfalt kayganlaşıyor.';
      case 'RAIN':
        return 'TELSİZ: Yağmur şiddetini artırdı! Pist yüzeyinde su birikintileri oluşuyor.';
      case 'HEAVY_RAIN':
        return 'TELSİZ: Sağanak yağış var! Görüş mesafesi düştü, aquaplaning tehlikesi yüksek!';
      case 'DRY':
        return 'TELSİZ: Bulutlar dağıldı, güneş açtı. Pist hızla kurumaya başladı.';
      default:
        return '';
    }
  }

  /**
   * Crossover hamur penceresi değişim telsiz anonsu
   */
  private getCrossoverChangeMessage(
    prev: 'SLICK' | 'INTERMEDIATE' | 'WET',
    next: 'SLICK' | 'INTERMEDIATE' | 'WET'
  ): string {
    if (prev === 'SLICK' && next === 'INTERMEDIATE') {
      return `[CROSSOVER] Telsiz: "Islaklık %${this.trackWetnessPct.toFixed(0)} oldu! Geçiş Lastiği (Intermediate) penceresindeyiz. Box için hazır olun!"`;
    }
    if (next === 'WET') {
      return `[ACİL STRATEJİ] Telsiz: "Pist tamamen göle döndü (%${this.trackWetnessPct.toFixed(0)})! Yoğun Yağmur (Wet) hamuruna geçiş öneriliyor!"`;
    }
    if (prev === 'WET' && next === 'INTERMEDIATE') {
      return `[CROSSOVER] Telsiz: "Su tahliyesi başladı. Full Wet lastikler aşırı ısınıyor, Intermediate artık daha hızlı!"`;
    }
    if (next === 'SLICK') {
      return `[CROSSOVER] Telsiz: "Kuru yarış çizgisi açıldı (%${this.trackWetnessPct.toFixed(0)})! Kuru zemin slick lastiklerine dönüş zamanı!"`;
    }
    return '';
  }

  /**
   * Efe'nin UI bileşeninde gösterebileceği 3, 5 ve 8 turluk radar tahminini üretir
   */
  private regenerateForecast(currentLap: number, totalLaps: number): void {
    const horizons = [3, 5, 8];
    this.forecast = horizons
      .filter((inLaps) => currentLap + inLaps <= totalLaps + 2)
      .map((inLaps) => {
        let projectedWet = this.trackWetnessPct;
        let rainProb = 10;
        let cond: WeatherCondition = this.condition;

        if (this.condition === 'HEAVY_RAIN') {
          projectedWet = Math.min(100, projectedWet + (inLaps * 4));
          rainProb = 95;
          cond = 'HEAVY_RAIN';
        } else if (this.condition === 'RAIN') {
          projectedWet = Math.min(100, projectedWet + (inLaps * 3));
          rainProb = 85;
          cond = 'RAIN';
        } else if (this.condition === 'DRIZZLE') {
          projectedWet = Math.min(80, projectedWet + (inLaps * 2));
          rainProb = 70;
          cond = 'DRIZZLE';
        } else if (this.condition === 'OVERCAST') {
          rainProb = 45;
          cond = 'OVERCAST';
        } else {
          projectedWet = Math.max(0, projectedWet - (inLaps * WEATHER_CONFIG.baseDryingRatePerLap));
          rainProb = 15;
          cond = 'DRY';
        }

        return {
          inLaps,
          condition: cond,
          rainProbabilityPct: rainProb,
          projectedWetnessPct: Math.round(projectedWet),
        };
      });
  }

  // Getter ve Durum Metotları
  public getTrackWetnessPct(): number {
    return this.trackWetnessPct;
  }

  public getCondition(): WeatherCondition {
    return this.condition;
  }

  public setCondition(condition: WeatherCondition, wetnessPct?: number): void {
    this.condition = condition;
    if (wetnessPct !== undefined) {
      this.trackWetnessPct = Math.max(0, Math.min(100, wetnessPct));
    }
    this.updateIntensityAndTemps();
    this.lastAnnouncedCrossover = this.getCrossoverCategory(this.trackWetnessPct);
    this.lastAnnouncedCondition = condition;
  }

  public getState(): WeatherState {
    return {
      condition: this.condition,
      trackWetnessPct: this.trackWetnessPct,
      rainIntensityPct: this.rainIntensityPct,
      airTempCelsius: this.airTempCelsius,
      trackTempCelsius: this.trackTempCelsius,
      optimalCompound: this.getOptimalCompound(),
      forecast: [...this.forecast],
    };
  }
}
