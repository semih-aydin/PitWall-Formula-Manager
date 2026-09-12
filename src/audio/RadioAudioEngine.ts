// PitWall: Formula Manager — Prosedürel Telsiz & Ses Motoru (Web Audio API)
//
// Bu modül harici hiçbir MP3/WAV ses dosyası indirmeden, tamamen tarayıcının kendi
// matematiksel ses sentezleyicisini (Web Audio API) kullanarak gerçek zamanlı F1 telsiz
// sesleri, cızırtıları ve taktiksel kokpit klikleri üretir.
// Sıfır bant genişliği, sıfır maliyet ve anında tepki süresi!

class RadioAudioEngineImpl {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  constructor() {
    // AudioContext kullanıcı sayfada bir yere tıklayana kadar tarayıcı tarafından kilitli tutulur.
    // İlk kullanıcı etkileşiminde başlatılacaktır.
  }

  /**
   * Tarayıcının ses motorunu (AudioContext) başlatır veya uykudan uyandırır.
   */
  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    return this.ctx;
  }

  /**
   * Sesi tamamen susturur veya açar.
   */
  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * 1. F1 Telsiz Açılış / Kapanış / Onay Bip Tonları (Radio Chimes)
   * Formula 1 takım telsizlerinin başlangıcındaki o ikonik iki frekanslı sesleri üretir.
   */
  public playRadioBeep(type: 'OPEN' | 'CLOSE' | 'CONFIRM' | 'BEEP_MID' = 'OPEN'): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';

    if (type === 'OPEN') {
      // Açılış tonu: 880Hz (La) -> 1200Hz hızlı geçiş
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'CONFIRM') {
      // Pit Onay tonu: 1050Hz -> 1400Hz tok çift onay
      osc.frequency.setValueAtTime(1050, now);
      osc.frequency.setValueAtTime(1400, now + 0.05);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.13);
    } else if (type === 'BEEP_MID') {
      // Orta bilgilendirme tonu (Sollama / En Hızlı Tur): 950Hz
      osc.frequency.setValueAtTime(950, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.06);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.09);
    } else {
      // Kapanış tonu: 1200Hz -> 750Hz iniş
      osc.frequency.setValueAtTime(1150, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.06);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.09);
    }
  }

  /**
   * 2. Prosedürel Telsiz Cızırtısı & Hışırtısı (Radio Static / Noise Burst)
   * Beyaz gürültü (White noise) üretir ve bunu askeri telsiz frekansına (Bandpass 400Hz - 3200Hz)
   * filtreleyerek arkadan gelen o cızırtılı gerçekçi telsiz atmosferini yaratır.
   */
  public playRadioStatic(durationSec: number = 0.45): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const bufferSize = ctx.sampleRate * durationSec;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Beyaz gürültü (Rastgele ses dalgaları) oluştur
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.4;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    // Bandpass Filtre: Sadece telsiz frekans aralığını geçir (400Hz - 3000Hz)
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, ctx.currentTime);
    filter.Q.setValueAtTime(1.8, ctx.currentTime);

    // Ses seviyesi zarfı (Hızlı yükselir, hafif dalgalanır ve kesilir)
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noiseSource.start(now);
    noiseSource.stop(now + durationSec);
  }

  /**
   * 3. Tam Telsiz İletişim Paketi (Bip + Cızırtı + Kapanış Bipi)
   * Pit duvarından "BOX, BOX!" veya pilot telsizi geldiğinde çalınır.
   */
  public playRadioTransmission(): void {
    if (this.isMuted) return;
    this.playRadioBeep('OPEN');
    setTimeout(() => {
      this.playRadioStatic(0.4);
    }, 60);
    setTimeout(() => {
      this.playRadioBeep('CLOSE');
    }, 450);
  }

  /**
   * 4. Taktiksel Kokpit Düğme Sesi (Tactical Switch Click)
   * Stratejist bir sürüş moduna veya pit butonuna bastığında tok bir mekanik ses verir.
   */
  public playTacticalClick(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.03);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  /**
   * 5. Uçurum / Tehlike Alarmı (Warning Siren Ping)
   * Lastik uçuruma çarptığında veya bijon sıkıştığında çalan iki tonlu ikaz.
   */
  public playWarningAlarm(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.setValueAtTime(500, now + 0.08);
    osc.frequency.setValueAtTime(700, now + 0.16);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.26);
  }
}

export const RadioAudioEngine = new RadioAudioEngineImpl();
