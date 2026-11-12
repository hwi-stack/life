// Web Audio API based sound synthesizer for zero-latency, high-impact festival celebration audio

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Lazily initialized on first user interaction
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Ticking sound during digit rotation
  public playTick() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520 + Math.random() * 220, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.09, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.035);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.035);
    } catch {
      // Audio context might be restricted before interaction
    }
  }

  // Crisp, punchy bell chime when a digit locks in
  public playLockIn() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Punchy metallic attack + sweet chime chord (C5 + G5 + C6)
      const notes = [523.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = idx === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.02);

        const startTime = now + idx * 0.02;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.22, startTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.45);
      });
    } catch {
      // ignore
    }
  }

  // Fireworks pop & crackle sound ("팡!")
  public playFireworkPop() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // 1. Bass impact boom ("팡!")
      const boomOsc = this.ctx.createOscillator();
      const boomGain = this.ctx.createGain();
      boomOsc.type = 'sine';
      boomOsc.frequency.setValueAtTime(140, now);
      boomOsc.frequency.exponentialRampToValueAtTime(35, now + 0.25);
      boomGain.gain.setValueAtTime(0.3, now);
      boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      boomOsc.connect(boomGain);
      boomGain.connect(this.ctx.destination);
      boomOsc.start(now);
      boomOsc.stop(now + 0.28);

      // 2. High sparkle crackle (noise burst)
      const bufferSize = this.ctx.sampleRate * 0.12;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1800;
      filter.Q.value = 3;

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.2, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noise.start(now);
    } catch {
      // ignore
    }
  }

  /**
   * Grand Triumph Fanfare ("팡팡하게 축하하듯")
   * Combines:
   * 1. Powerful Sub-Bass Impact Boom ("쿵- 팡!!")
   * 2. Rich Multi-Voice Brass Fanfare (C4, E4, G4, C5, E5, G5, C6 triumph progression)
   * 3. Sparkling Glockenspiel cascade
   * 4. Party popper crackle burst
   */
  public playFanfare() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // 1. Grand Bass Impact ("팡!!")
      const boomOsc = this.ctx.createOscillator();
      const boomGain = this.ctx.createGain();
      boomOsc.type = 'triangle';
      boomOsc.frequency.setValueAtTime(160, now);
      boomOsc.frequency.exponentialRampToValueAtTime(30, now + 0.4);
      boomGain.gain.setValueAtTime(0.45, now);
      boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      boomOsc.connect(boomGain);
      boomGain.connect(this.ctx.destination);
      boomOsc.start(now);
      boomOsc.stop(now + 0.45);

      // 2. Brass Trumpet Fanfare: G4 -> C5 -> E5 -> G5 -> C6 (Joyful Ta-da!)
      const fanfareSequence = [
        { f: 392.0, t: 0.0, d: 0.16 }, // G4
        { f: 523.25, t: 0.14, d: 0.16 }, // C5
        { f: 659.25, t: 0.28, d: 0.18 }, // E5
        { f: 783.99, t: 0.42, d: 0.22 }, // G5
        { f: 1046.5, t: 0.62, d: 1.1 } // High C6 (long triumphant hold!)
      ];

      fanfareSequence.forEach(({ f, t, d }) => {
        if (!this.ctx) return;
        const noteStart = now + t;

        // Dual oscillators for rich, vibrant brass texture
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(f, noteStart);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(f * 1.002, noteStart); // slight chorus detune

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2600, noteStart);
        filter.frequency.exponentialRampToValueAtTime(1200, noteStart + d);

        gain.gain.setValueAtTime(0, noteStart);
        gain.gain.linearRampToValueAtTime(0.28, noteStart + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + d);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(noteStart);
        osc2.start(noteStart);
        osc1.stop(noteStart + d);
        osc2.stop(noteStart + d);
      });

      // 3. Sparkling Glockenspiel Cascade (Celestial bell sparkle over the fanfare)
      const sparkles = [
        { f: 1318.5, t: 0.1 }, // E6
        { f: 1567.98, t: 0.25 }, // G6
        { f: 2093.0, t: 0.4 }, // C7
        { f: 2637.0, t: 0.65 }, // E7
        { f: 3135.96, t: 0.85 } // G7
      ];

      sparkles.forEach(({ f, t }) => {
        if (!this.ctx) return;
        const sStart = now + t;
        const sOsc = this.ctx.createOscillator();
        const sGain = this.ctx.createGain();

        sOsc.type = 'sine';
        sOsc.frequency.setValueAtTime(f, sStart);

        sGain.gain.setValueAtTime(0, sStart);
        sGain.gain.linearRampToValueAtTime(0.12, sStart + 0.01);
        sGain.gain.exponentialRampToValueAtTime(0.001, sStart + 0.35);

        sOsc.connect(sGain);
        sGain.connect(this.ctx.destination);

        sOsc.start(sStart);
        sOsc.stop(sStart + 0.35);
      });

      // Second wave celebration chord at +0.7s ("빠-밤!!")
      const chordNotes = [523.25, 659.25, 783.99, 1046.5];
      chordNotes.forEach((freq) => {
        if (!this.ctx) return;
        const cOsc = this.ctx.createOscillator();
        const cGain = this.ctx.createGain();
        cOsc.type = 'triangle';
        cOsc.frequency.setValueAtTime(freq, now + 0.65);

        cGain.gain.setValueAtTime(0, now + 0.65);
        cGain.gain.linearRampToValueAtTime(0.18, now + 0.68);
        cGain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

        cOsc.connect(cGain);
        cGain.connect(this.ctx.destination);
        cOsc.start(now + 0.65);
        cOsc.stop(now + 1.6);
      });
    } catch {
      // ignore
    }
  }

  public playClick() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch {
      // ignore
    }
  }
}

export const soundManager = new SoundManager();
