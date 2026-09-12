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
import { AeroPowerUnitModel } from './AeroPowerUnitModel';
import { LapTimeCalculator } from './LapTimeCalculator';
import { OvertakeEngine } from './OvertakeEngine';
import { PitStopEngine } from './PitStopEngine';
import { TireModel } from './TireModel';
import { AERO_2026_CONFIG, DIRTY_AIR_CONFIG } from '../config/simulationConfig';

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
        isFinished: false,
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
   * 1 Tur Simüle Et: Tüm 22 araç için 1 tam turu koşturur.
   */
  public simulateLap(): SimulationSnapshot {
    // Yarış tamamlandıysa tur atma
    if (this.flag === 'CHEQUERED' || this.currentLap >= this.track.totalLaps) {
      return this.getSnapshot();
    }

    const nextLap = this.currentLap + 1;

    // Aynı tur pite giren takım arkadaşlarını tespit ediyoruz (Double-Stack kontrolü için)
    const pittingDriversByTeam = new Map<string, string[]>();
    for (const car of this.cars) {
      if (car.pitRequestedNextLap) {
        const list = pittingDriversByTeam.get(car.teamId) || [];
        list.push(car.driverId);
        pittingDriversByTeam.set(car.teamId, list);
      }
    }

    // 1. Her bir araç için tur tamamlama boru hattını çalıştır
    for (let i = 0; i < this.cars.length; i++) {
      const car = this.cars[i];
      if (car.isDnf) continue;

      this.processCarLapFinish(i, nextLap, pittingDriversByTeam);
      car.totalDistanceMeters = nextLap * this.track.lengthMeters;
      car.lapProgressPct = 0.0;
      car.inPitLane = false;
    }

    this.currentLap = nextLap;

    // 2. Sollama Mücadelelerini Çöz (Arkadakiler öndekileri geçebildi mi?)
    this.resolveOvertakes();

    // 3. Canlı Farkları ve Zaman Kulesini Güncelle
    this.updateGapsAndIntervals();

    // 4. Yarış saatini liderin süresi kadar ilerlet
    const leaderLapTime = this.cars[0]?.lastLapTimeSec || this.track.baseLapTimeSec;
    this.raceTimeSec += leaderLapTime;

    // 5. Damalı bayrak kontrolü: Lider son turu bitirdi mi?
    if (this.currentLap >= this.track.totalLaps) {
      this.finishRace();
    }

    return this.getSnapshot();
  }

  /**
   * Bir aracın 1 turu bitirdiği anda çalışan birleşik tur işleme boru hattı.
   * Hem anlık tur atlamada (simulateLap) hem de 60fps mikro-adımda (simulateTick)
   * aynı fizik kurallarının, pit operasyonlarının ve lastik aşınmasının çalışmasını garanti eder.
   */
  private processCarLapFinish(
    carIndex: number,
    lapNumber: number,
    pittingDriversByTeam?: Map<string, string[]>
  ): void {
    const car = this.cars[carIndex];
    if (car.isDnf) return;

    const driver = this.driversMap.get(car.driverId)!;
    const team = this.teamsMap.get(car.teamId)!;

    // Kirli Hava Kontrolü: 0.8s altındaysa aerodinamik kayıp ve aşırı ısınma yaşar
    car.inDirtyAir = carIndex > 0 && car.intervalToAheadSec <= DIRTY_AIR_CONFIG.detectionThresholdSec;

    // Pit Stop Yönetimi: Eğer stratejist BOX emri vermişse
    let pitLossSec = 0.0;
    if (car.pitRequestedNextLap) {
      const teamPittingList = pittingDriversByTeam?.get(car.teamId) || [car.driverId];
      const teammateAlsoPitting = teamPittingList.length > 1;
      const teammateId = team.driverIds.find((id) => id !== car.driverId);
      const teammateIdx = this.cars.findIndex((c) => c.driverId === teammateId);
      const isTeammateBehind = teammateIdx > carIndex;

      const pitResult = PitStopEngine.executeStop({
        car,
        team,
        driver,
        track: this.track,
        currentLap: lapNumber,
        raceTimeSec: this.raceTimeSec,
        teammateAlsoPitting,
        isTeammateBehind,
      });

      pitLossSec = pitResult.lapTimeLossSec;
      pitResult.newEvents.forEach((evt) => this.addEvent(evt));
      car.inPitLane = true;
    } else {
      car.inPitLane = false;
    }

    // Tur ve Sektör Sürelerini Hesapla (Lastik aşınması ve MOM burada işlenir)
    const lapCalcResult = LapTimeCalculator.calculateLapTime({
      car,
      driver,
      team,
      track: this.track,
      currentLap: lapNumber,
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
        lapNumber,
      };
      this.addEvent({
        lap: lapNumber,
        timestampSec: this.raceTimeSec,
        type: 'FASTEST_LAP',
        driverId: driver.id,
        message: `[EN HIZLI TUR] ${driver.shortCode} — ${this.formatTime(lapCalcResult.lapTimeSec)}`,
        severity: 'TACTICAL',
      });
    }

    car.currentLap = lapNumber;
  }

  /**
   * Damalı bayrağı sallar ve yarışı resmen tamamlar.
   */
  private finishRace(): void {
    this.flag = 'CHEQUERED';
    this.cars.forEach((c) => {
      c.isFinished = true;
    });

    const winnerCar = this.cars[0];
    const winnerDriver = this.driversMap.get(winnerCar.driverId);
    const winnerTeam = this.teamsMap.get(winnerCar.teamId);

    this.addEvent({
      lap: this.track.totalLaps,
      timestampSec: this.raceTimeSec,
      type: 'RACE_FINISH',
      driverId: winnerCar.driverId,
      message: `[DAMALI BAYRAK] Yarış tamamlandı! Kazanan: ${winnerDriver?.shortCode} (#${winnerCar.carNumber} ${winnerTeam?.shortName})`,
      severity: 'TACTICAL',
    });
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
      message: `[TELSİZ] PIT DUVARI -> ${driver.shortCode}: "BOX, BOX! Bu turun sonunda pite gel, ${nextCompound} takıyoruz."`,
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

  /**
   * The Rejoin Ghost (Hayalet Çıkış Göstergesi) Hesabı:
   * "Seçilen pilot ŞU SANİYE pite girerse, pistte tam olarak kimin önünde/arkasında çıkar?"
   * Pit kaybı süresi kadar geriye sanal bir hayalet izdüşüm hesaplar.
   */
  public calculateRejoinProjection(driverId: string): {
    rejoinProgressPct: number;
    projectedPosition: number;
    aheadDriverCode?: string;
    behindDriverCode?: string;
    gapToAheadSec: number;
  } {
    const car = this.cars.find((c) => c.driverId === driverId);
    if (!car) {
      return { rejoinProgressPct: 0, projectedPosition: 1, gapToAheadSec: 0 };
    }

    const team = this.teamsMap.get(car.teamId);
    const serviceTime = 2.4 + (team ? Math.max(0, 100 - team.pitCrewRating) * 0.014 : 0);
    const totalPitLossSec = this.track.pitLaneLossSec + serviceTime;

    const baseLapTime = car.lastLapTimeSec || this.track.baseLapTimeSec;
    const speedMps = this.track.lengthMeters / baseLapTime;
    const distanceLossMeters = speedMps * totalPitLossSec;

    // Pit kaybı sonrası tahmini toplam kat edilmiş mesafe
    const projectedDistance = Math.max(0, car.totalDistanceMeters - distanceLossMeters);
    const rejoinProgressPct = (projectedDistance % this.track.lengthMeters) / this.track.lengthMeters;

    // Pistteki diğer 21 aracın konumlarına göre tahmini dönüş pozisyonunu belirle
    let projectedPosition = 1;
    let aheadCar: CarState | undefined;
    let behindCar: CarState | undefined;

    for (const otherCar of this.cars) {
      if (otherCar.driverId === driverId) continue;
      if (otherCar.totalDistanceMeters > projectedDistance) {
        projectedPosition++;
        if (!aheadCar || otherCar.totalDistanceMeters < aheadCar.totalDistanceMeters) {
          aheadCar = otherCar;
        }
      } else {
        if (!behindCar || otherCar.totalDistanceMeters > behindCar.totalDistanceMeters) {
          behindCar = otherCar;
        }
      }
    }

    const aheadDriver = aheadCar ? this.driversMap.get(aheadCar.driverId) : undefined;
    const behindDriver = behindCar ? this.driversMap.get(behindCar.driverId) : undefined;
    const gapToAheadSec = aheadCar
      ? Math.round(((aheadCar.totalDistanceMeters - projectedDistance) / speedMps) * 10) / 10
      : 0;

    return {
      rejoinProgressPct,
      projectedPosition,
      aheadDriverCode: aheadDriver?.shortCode,
      behindDriverCode: behindDriver?.shortCode,
      gapToAheadSec,
    };
  }

  /**
   * Gerçek Zamanlı Mikro-Adım (Tick) Simülasyonu:
   * 60 FPS animasyonda arabaların pist üstünde akıcı kaymasını, pit yoluna sapmasını ve
   * çizgiyi geçtiklerinde anında tur sürelerinin/lastiklerinin güncellenmesini sağlar.
   */
  public simulateTick(dtSec: number): SimulationSnapshot {
    if (this.flag === 'CHEQUERED') {
      return this.getSnapshot();
    }

    this.raceTimeSec += dtSec;

    // Aynı tur pite giren takım arkadaşlarını tespit et
    const pittingDriversByTeam = new Map<string, string[]>();
    for (const car of this.cars) {
      if (car.pitRequestedNextLap) {
        const list = pittingDriversByTeam.get(car.teamId) || [];
        list.push(car.driverId);
        pittingDriversByTeam.set(car.teamId, list);
      }
    }

    let anyCarFinishedLap = false;

    for (let i = 0; i < this.cars.length; i++) {
      const car = this.cars[i];
      if (car.isDnf || car.isFinished) continue;

      const estimatedLapTime = car.lastLapTimeSec || this.track.baseLapTimeSec;
      const speedMps = this.track.lengthMeters / estimatedLapTime;
      
      // Mesafeyi dtSec kadar ilerlet
      car.totalDistanceMeters += speedMps * dtSec;
      car.currentSpeedKmh = Math.round((speedMps * 3.6) * 10) / 10;

      const newLapProgress = (car.totalDistanceMeters % this.track.lengthMeters) / this.track.lengthMeters;
      car.lapProgressPct = newLapProgress;

      // 2026 Aktif Aerodinamik Kontrolü: Düzlükte X-Mode, virajda Z-Mode
      car.aeroMode = AeroPowerUnitModel.evaluateAeroMode(this.track, newLapProgress);
      if (car.aeroMode === 'X_MODE') {
        car.currentSpeedKmh += car.momActive
          ? AERO_2026_CONFIG.xModeMomSpeedBoostKmh
          : AERO_2026_CONFIG.xModeBaseSpeedBoostKmh;
      }

      // Pit yolunda mı? (Pit stop yaptıysa ve pistin ilk %12'lik dilimindeyse pit yolundadır)
      if (car.inPitLane && newLapProgress > 0.12) {
        car.inPitLane = false;
      }

      // Tur bitti mi?
      const completedLaps = Math.floor(car.totalDistanceMeters / this.track.lengthMeters);
      if (completedLaps > car.currentLap) {
        this.processCarLapFinish(i, completedLaps, pittingDriversByTeam);
        anyCarFinishedLap = true;
      }
    }

    // Lider araca göre tur sayacını ve sıralama kulesini güncelle
    const leaderLaps = Math.floor((this.cars[0]?.totalDistanceMeters || 0) / this.track.lengthMeters);
    if (leaderLaps > this.currentLap) {
      this.currentLap = Math.min(this.track.totalLaps, leaderLaps);
      this.resolveOvertakes();
      this.updateGapsAndIntervals();

      // Damalı bayrak kontrolü: Lider tüm turları tamamladı mı?
      if (this.currentLap >= this.track.totalLaps) {
        this.finishRace();
      }
    } else if (anyCarFinishedLap) {
      this.updateGapsAndIntervals();
    }

    return this.getSnapshot();
  }
}
