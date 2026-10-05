import { SOUNDS, SAMPLE_RATES } from './synth.js';

// Plays the synthesized effects through Web Audio. Browsers keep the audio
// context suspended until the first click or key press; until then sounds
// are skipped rather than queued, so nothing piles up and plays at once.
export class AudioEngine {
  constructor() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = Ctx ? new Ctx() : null;
    this.buffers = new Map();
    this.unlockWaiters = [];
    if (!this.ctx) return;

    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
    // Effects are tiny and made now. The long ambience loops are made one at
    // a time in idle moments after the page has loaded (or on first use), so
    // they don't hold up the first frame.
    const later = [];
    for (const name of Object.keys(SOUNDS)) {
      if (SAMPLE_RATES[name]) later.push(name);
      else this.buffer(name);
    }
    // The timeout keeps a machine that is always busy drawing from putting
    // this off until a level needs the loops.
    const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 50));
    const next = () => {
      const name = later.shift();
      if (!name) return;
      this.buffer(name);
      idle(next);
    };
    idle(next);

    const unlock = () => {
      if (!this.held && this.ctx.state !== 'running') this.ctx.resume();
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    this.ctx.addEventListener('statechange', () => {
      if (this.locked) return;
      for (const fn of this.unlockWaiters.splice(0)) fn();
    });
  }

  // The buffer for a sound, synthesized the first time it is needed.
  buffer(name) {
    if (!this.buffers.has(name) && SOUNDS[name]) {
      const rate = Math.min(SAMPLE_RATES[name] ?? this.ctx.sampleRate, this.ctx.sampleRate);
      const samples = SOUNDS[name](rate);
      const buffer = this.ctx.createBuffer(1, samples.length, rate);
      buffer.copyToChannel(samples, 0);
      this.buffers.set(name, buffer);
    }
    return this.buffers.get(name);
  }

  // Pausing holds the context suspended, so loops fall silent where they
  // are and nothing new plays until it is released.
  hold(held) {
    this.held = held;
    if (!this.ctx) return;
    if (held) this.ctx.suspend();
    else this.ctx.resume();
  }

  get locked() {
    return !this.ctx || this.ctx.state !== 'running';
  }

  // Runs `fn` now if audio is already allowed, otherwise once it is.
  onUnlock(fn) {
    if (!this.ctx) return;
    if (this.locked) this.unlockWaiters.push(fn);
    else fn();
  }

  get muted() {
    return this.ctx ? this.master.gain.value === 0 : true;
  }

  set muted(value) {
    if (this.ctx) this.master.gain.value = value ? 0 : 1;
  }

  play(name, volume = 1) {
    if (this.locked || !SOUNDS[name]) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffer(name);
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    src.connect(gain).connect(this.master);
    src.start();
  }

  loop(name) {
    return new LoopVoice(this, name);
  }
}

// A single looping sound whose volume and pitch can be changed while it plays.
class LoopVoice {
  constructor(engine, name) {
    this.engine = engine;
    this.name = name;
    this.source = null;
    this.gain = null;
    this.volume = 0;
    this.rate = 1;
  }

  get playing() {
    return this.source !== null;
  }

  // `offset` (0..1) starts the loop part-way through.
  start(offset = 0) {
    const { ctx, locked, master } = this.engine;
    if (this.source || locked || !SOUNDS[this.name]) return;
    const buffer = this.engine.buffer(this.name);
    this.source = ctx.createBufferSource();
    this.source.buffer = buffer;
    this.source.loop = true;
    this.source.playbackRate.value = this.rate;
    this.gain = ctx.createGain();
    this.gain.gain.value = this.volume;
    this.source.connect(this.gain).connect(master);
    this.source.start(0, offset * buffer.duration);
  }

  stop() {
    if (!this.source) return;
    this.source.stop();
    this.source.disconnect();
    this.source = null;
    this.gain = null;
  }

  // Ramps the volume to `v` over `seconds` of audio time.
  fadeTo(v, seconds) {
    this.volume = v;
    if (!this.gain) return;
    const g = this.gain.gain;
    const now = this.engine.ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(v, now + seconds);
  }

  // Fades out and stops. A new start() can begin a fresh voice right away;
  // the old one finishes its fade on its own.
  fadeOut(seconds) {
    if (!this.source) return;
    const source = this.source;
    this.fadeTo(0, seconds);
    source.stop(this.engine.ctx.currentTime + seconds);
    source.onended = () => source.disconnect();
    this.source = null;
    this.gain = null;
  }

  setVolume(v) {
    this.volume = v;
    if (this.gain) this.gain.gain.value = v;
  }

  setRate(r) {
    this.rate = r;
    if (this.source) this.source.playbackRate.value = r;
  }
}
