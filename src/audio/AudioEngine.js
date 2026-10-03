import { SOUNDS } from './synth.js';

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
    for (const [name, generate] of Object.entries(SOUNDS)) {
      const samples = generate(this.ctx.sampleRate);
      const buffer = this.ctx.createBuffer(1, samples.length, this.ctx.sampleRate);
      buffer.copyToChannel(samples, 0);
      this.buffers.set(name, buffer);
    }

    const unlock = () => {
      if (this.ctx.state !== 'running') this.ctx.resume();
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    this.ctx.addEventListener('statechange', () => {
      if (this.locked) return;
      for (const fn of this.unlockWaiters.splice(0)) fn();
    });
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
    if (this.locked || !this.buffers.has(name)) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffers.get(name);
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

  start() {
    const { ctx, locked, buffers, master } = this.engine;
    if (this.source || locked || !buffers.has(this.name)) return;
    this.source = ctx.createBufferSource();
    this.source.buffer = buffers.get(this.name);
    this.source.loop = true;
    this.source.playbackRate.value = this.rate;
    this.gain = ctx.createGain();
    this.gain.gain.value = this.volume;
    this.source.connect(this.gain).connect(master);
    this.source.start();
  }

  stop() {
    if (!this.source) return;
    this.source.stop();
    this.source.disconnect();
    this.source = null;
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
