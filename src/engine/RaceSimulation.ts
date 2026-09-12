// PitWall: Formula Manager — Yarış Orkestratörü (RaceSimulation)
// Bu sınıf oyunun ana beynidir. Tüm alt motorları (Lastik, Pit, Sollama, Tur Zamanı)
// sırayla çalıştırır, 22 aracın pozisyonunu ve aralıklarını günceller.

import {
  CarState,
  Driver,
  RaceEvent,
  RaceFlag,
  SimulationSnapshot,
  Team,
  TireCompound,
  Track,
} from '../types';
import { LapTimeCalculator } from './LapTimeCalculator';
import { OvertakeEngine } from './OvertakeEngine';
import { PitStopEngine } from './PitStopEngine';
import { TireModel } from './TireModel';

export interface RaceSimulationConfig {
  track: Track;
  teams: Team[];
  drivers: Driver[];
  initialTireCompound?: TireCompound;
}

export class RaceSimulation {
  private readonly track: Track;
  private readonly teamsMap: Map<string, Team>;
  private readonly driversMap: Map<string, Driver>;

  private cars: CarState[] = [];
  private currentLap = 0;
  private raceTimeSec = 0.0;
  private trackWetnessPct = 0.0;
  private flag: RaceFlag = 'GREEN';
  private events: RaceEvent[] = [];

  // Seansın en hızlı turunu ve sektör rekorlarını tuttuğumuz yer
  private fastestLap: {
    driverId: string;
    lapTimeSec: number;
    lapNumber: number;
  } | null = null;

  private sessionBestSectors: [number | null, number | null, number | null] = [null, null, null];

  constructor(config: RaceSimulationConfig) {
    this.track = config.track;
    this.teamsMap = new Map(config.teams.map((t) => [t.id, t]));
    this.driversMap = new Map(config.drivers.map((d) => [d.id, d]));

    this.initializeGrid(config.initialTireCompound || 'MEDIUM');
  }

  /**
   * Yarış başlarken 22 arabayı başlangıç çizgisine (Grid) dizer.
   * Pilot yeteneği ve takım gücüne göre gerçekçi bir sıralama turları sonucu simüle edilir.
   */
  private initializeGrid(defaultTire: TireCompound): void {
    const driverList = Array.from(this.driversMap.values());
    const sortedGrid = [...driverList].sort((a, b) => {
      const teamA = this.getTeamForDriver(a.id);
      const teamB = this.getTeamForDriver(b.id);
      const scoreA = (a.skill * 1.5) + (teamA ? teamA.enginePower + teamA.aeroEfficiency : 0);
      const scoreB = (b.skill * 1.5) + (teamB ? teamB.enginePower + teamB.aeroEfficiency : 0);
      return scoreB - scoreA;
    });

    this.cars = sortedGrid.map((driver, index) => {
      const team = this.getTeamForDriver(driver.id);
      return {
        driverId: driver.id,
        teamId: team ? team.id : 'unknown',
        carNumber: driver.number,
        currentLap: 0,
        lapProgressPct: 0.0,
        totalDistanceMeters: 0,
        currentSpeedKmh: 0,
        currentLapTimeSec: 0,
        lastLapTimeSec: null,
        bestLapTimeSec: null,
        sectorTimes: [0, 0, 0],
        sectorStatuses: ['YELLOW', 'YELLOW', 'YELLOW'],
        personalBestSectors: [null, null, null],
        gapToLeaderSec: index * 0.35, // Griddeki her cep arası ~0.35s başlangıç mesafesi
        intervalToAheadSec: index === 0 ? 0 : 0.35,
        aeroMode: 'Z_MODE',
        batterySoCPct: 85.0 + (Math.random() * 10), // Yarışa %85-%95 şarjla başlarlar
        momAvailable: false,
        momActive: false,
        defensiveDeployActive: false,
        paceMode: 'BALANCED',
        engineMode: 'STANDARD',
        tires: TireModel.createTire(defaultTire),
        inDirtyAir: false,
        inPitLane: false,
        pitStopsCount: 0,
        pitStopServiceTimeSec: 0,
        pitRequestedNextLap: false,
        selectedNextCompound: 'HARD',
        doubleStackDelayed: false,
        isDnf: false,
        stressLevelPct: 10,
        hasLockup: false,
      };
    });
  }

  public getTeamForDriver(driverId: string): Team | undefined {
    for (const team of this.teamsMap.values()) {
      if (team.driverIds.includes(driverId)) return team;
    }
    return undefined;
  }

  /**
   * 1 Tur Simüle Et: Tüm 22 araç için 1 turu koşturur.
   * Adım 1: Pit stopları ve tur zamanlarını hesapla.
   * Adım 2: Solllama mücadelelerini çöz.
   * Adım 3: Canlı zamanlama farklarını (Gap/Interval) güncelle.
   */
  public simulateLap(): SimulationSnapshot {
    // Yarış bittiyse daha fazla tur atma
    if (this.currentLap >= this.track.totalLaps) {
      return this.getSnapshot();
    }

    this.currentLap += 1;

    // Aynı tur pite giren takım arkadaşlarını tespit ediyoruz (Double-Stack kontrolü için)
    const pittingDriversByTeam = new Map<string, string[]>();
    for (const car of this.cars) {
      if (car.pitRequestedNextLap) {
        const list = pittingDriversByTeam.get(car.teamId) || [];
        list.push(car.driverId);
        pittingDriversByTeam.set(car.teamId, list);
      }
    }

    // 1. Her Bir Aracın Turunu Hesapla
    for (let i = 0; i < this.cars.length; i++) {
      const car = this.cars[i];
      if (car.isDnf) continue;

      const driver = this.driversMap.get(car.driverId)!;
      const team = this.teamsMap.get(car.teamId)!;

      // Kirli Hava Kontrolü: Eğer öndeki arabaya 0.8 saniyeden yakınsak ve lider değilsek kirli havadayız!
      car.inDirtyAir = i > 0 && car.intervalToAheadSec <= 0.8;

      // Pit Stop Yönetimi (Eğer stratejist bir önceki tur BOX emri verdiyse)
      let pitLossSec = 0.0;
      if (car.pitRequestedNextLap) {
        const teamPittingList = pittingDriversByTeam.get(car.teamId) || [];
        const teammateAlsoPitting = teamPittingList.length > 1;
        const teammateId = team.driverIds.find((id) => id !== car.driverId);
        const teammateIdx = this.cars.findIndex((c) => c.driverId === teammateId);
        const isTeammateBehind = teammateIdx > i;

        const pitResult = PitStopEngine.executeStop({
          car,
          team,
          driver,
          track: this.track,
          currentLap: this.currentLap,
          raceTimeSec: this.raceTimeSec,
          teammateAlsoPitting,
          isTeammateBehind,
        });

        pitLossSec = pitResult.lapTimeLossSec;
        pitResult.newEvents.forEach((evt) => this.addEvent(evt));
      }

      // Tur ve Sektör Sürelerini Hesapla
      const lapCalcResult = LapTimeCalculator.calculateLapTime({
        car,
        driver,
        team,
        track: this.track,
        currentLap: this.currentLap,
        raceTimeSec: this.raceTimeSec,
        trackWetnessPct: this.trackWetnessPct,
        pitLossSec,
        sessionBestSectors: this.sessionBestSectors,
      });

      // Aracın telemetri verilerini güncelle
      car.lastLapTimeSec = lapCalcResult.lapTimeSec;
      car.sectorTimes = lapCalcResult.sectorTimes;
      car.sectorStatuses = lapCalcResult.sectorStatuses;
      car.hasLockup = lapCalcResult.hasLockup;
      lapCalcResult.newEvents.forEach((evt) => this.addEvent(evt));

      // Mor ve Yeşil Sektör Kayıtlarını Güncelle
      lapCalcResult.sectorTimes.forEach((time, idx) => {
        // Seansın en iyisi (Mor)
        if (this.sessionBestSectors[idx] === null || time < this.sessionBestSectors[idx]!) {
          this.sessionBestSectors[idx] = time;
        }
        // Pilotun kendi en iyisi (Yeşil)
        if (car.personalBestSectors[idx] === null || time < car.personalBestSectors[idx]!) {
          car.personalBestSectors[idx] = time;
        }
      });

      // Pilotun en iyi turu
      if (car.bestLapTimeSec === null || lapCalcResult.lapTimeSec < car.bestLapTimeSec) {
        car.bestLapTimeSec = lapCalcResult.lapTimeSec;
      }

      // Seansın En Hızlı Turu (Mor Tur: Pite girilmemiş temiz turlar arasından seçilir)
      if (
        pitLossSec === 0 &&
        (!this.fastestLap || lapCalcResult.lapTimeSec < this.fastestLap.lapTimeSec)
      ) {
        this.fastestLap = {
          driverId: driver.id,
          lapTimeSec: lapCalcResult.lapTimeSec,
          lapNumber: this.currentLap,
        };
        this.addEvent({
          lap: this.currentLap,
          timestampSec: this.raceTimeSec,
          type: 'FASTEST_LAP',
          driverId: driver.id,
          message: `🟣 EN HIZLI TUR: ${driver.shortCode} — ${this.formatTime(lapCalcResult.lapTimeSec)}`,
          severity: 'TACTICAL',
        });
      }

      car.currentLap = this.currentLap;
      car.totalDistanceMeters += this.track.lengthMeters;
    }

    // 2. Sollama Mücadelelerini Çöz (Arkadakiler öndekileri geçebildi mi?)
    this.resolveOvertakes();

    // 3. Canlı Farkları ve Zaman Kulesini Güncelle
    this.updateGapsAndIntervals();

    // 4. Yarış saatini liderin süresi kadar ilerlet
    const leaderLapTime = this.cars[0]?.lastLapTimeSec || this.track.baseLapTimeSec;
    this.raceTimeSec += leaderLapTime;

    return this.getSnapshot();
  }

  /**
   * Izgarayı arkadan öne doğru tarar ve yakın olan araçların geçiş hamlelerini inceler.
   */
  private resolveOvertakes(): void {
    for (let i = this.cars.length - 1; i > 0; i--) {
      const chaser = this.cars[i];
      const defender = this.cars[i - 1];

      const chaserDriver = this.driversMap.get(chaser.driverId)!;
      const defenderDriver = this.driversMap.get(defender.driverId)!;

      const result = OvertakeEngine.evaluateOvertake({
        chaser,
        defender,
        chaserDriver,
        defenderDriver,
        currentLap: this.currentLap,
        raceTimeSec: this.raceTimeSec,
        chaserPosition: i + 1,
      });

      if (result.success) {
        // Geçiş başarılı! Dizide yer değiştiriyoruz
        this.cars[i] = defender;
        this.cars[i - 1] = chaser;

        if (result.event) {
          this.addEvent(result.event);
        }
      }
    }
  }

  /**
   * Canlı sıralama kulesindeki Gap (Lidere fark) ve Interval (Öndekine fark) değerlerini hesaplar.
   */
  private updateGapsAndIntervals(): void {
    let cumulativeGap = 0.0;

    for (let i = 0; i < this.cars.length; i++) {
      const car = this.cars[i];
      if (i === 0) {
        car.gapToLeaderSec = 0.0;
        car.intervalToAheadSec = 0.0;
      } else {
        const ahead = this.cars[i - 1];
        const stepInterval = Math.max(
          0.15,
          (car.lastLapTimeSec || 80) - (ahead.lastLapTimeSec || 80) + ahead.intervalToAheadSec * 0.8
        );
        car.intervalToAheadSec = Math.round(stepInterval * 10) / 10;
        cumulativeGap += car.intervalToAheadSec;
        car.gapToLeaderSec = Math.round(cumulativeGap * 10) / 10;
      }
    }
  }

  /**
   * Stratejist Emri: Seçilen pilotu bir sonraki tur pite çağır.
   */
  public orderBox(driverId: string, nextCompound: TireCompound): boolean {
    const car = this.cars.find((c) => c.driverId === driverId);
    if (!car) return false;

    car.pitRequestedNextLap = true;
    car.selectedNextCompound = nextCompound;

    const driver = this.driversMap.get(driverId)!;
    this.addEvent({
      lap: this.currentLap,
      timestampSec: this.raceTimeSec,
      type: 'RADIO_MESSAGE',
      driverId,
      message: `📻 PIT DUVARI -> ${driver.shortCode}: "BOX, BOX! Bu turun sonunda pite gel, ${nextCompound} takıyoruz."`,
      severity: 'TACTICAL',
    });

    return true;
  }

  /**
   * Stratejist Emri: Sürüş modu (Lastik koru / Dengeli / Gazla).
   */
  public setPaceMode(driverId: string, mode: 'CONSERVE' | 'BALANCED' | 'PUSH'): void {
    const car = this.cars.find((c) => c.driverId === driverId);
    if (car) car.paceMode = mode;
  }

  /**
   * Stratejist Emri: 2026 Batarya ve Motor Modu (Eco şarj / Standart / Overtake hücum).
   */
  public setEngineMode(driverId: string, mode: 'ECO' | 'STANDARD' | 'OVERTAKE'): void {
    const car = this.cars.find((c) => c.driverId === driverId);
    if (car) car.engineMode = mode;
  }

  // Telsiz ve olay günlüğüne yeni kayıt ekler (Maksimum 50 olay saklar)
  private addEvent(event: Omit<RaceEvent, 'id'>): void {
    this.events.unshift({
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    });
    if (this.events.length > 50) {
      this.events.pop();
    }
  }

  // React arayüzüne anlık yarış durumunu döndürür
  public getSnapshot(): SimulationSnapshot {
    return {
      currentLap: this.currentLap,
      totalLaps: this.track.totalLaps,
      raceTimeSec: Math.round(this.raceTimeSec * 10) / 10,
      flag: this.flag,
      trackWetnessPct: this.trackWetnessPct,
      leaderDriverId: this.cars[0]?.driverId || '',
      fastestLap: this.fastestLap,
      sessionBestSectors: [...this.sessionBestSectors],
      leaderboard: [...this.cars],
      recentEvents: [...this.events],
    };
  }

  public getDriver(driverId: string): Driver | undefined {
    return this.driversMap.get(driverId);
  }

  public getTeam(teamId: string): Team | undefined {
    return this.teamsMap.get(teamId);
  }

  // Saniyeyi 1:21.450 formatına çevirir
  private formatTime(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = (sec % 60).toFixed(3).padStart(6, '0');
    return `${m}:${s}`;
  }
}
