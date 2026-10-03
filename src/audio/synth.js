// Procedurally generated sound effects. Each generator returns mono PCM
// samples (Float32Array in -1..1) for the given sample rate, so there are no
// audio files to download or license.

const TAU = Math.PI * 2;

// Small deterministic PRNG so the noise-based sounds are the same every run.
function mulberry32(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function render(seconds, sr, fn) {
  const out = new Float32Array(Math.floor(seconds * sr));
  for (let i = 0; i < out.length; i++) out[i] = fn(i / sr, i);
  return out;
}

// Short linear fade at both ends to avoid clicks.
function declick(samples, sr, ms = 4) {
  const n = Math.min(Math.floor((ms / 1000) * sr), samples.length >> 1);
  for (let i = 0; i < n; i++) {
    samples[i] *= i / n;
    samples[samples.length - 1 - i] *= i / n;
  }
  return samples;
}

// Seamless 0.5 s loop: buzzy saw at ~190 Hz with wing-beat tremolo and a
// slight vibrato. All modulation rates complete whole cycles in the loop.
export function buzz(sr) {
  const seconds = 0.5;
  const n = Math.floor(seconds * sr);
  const out = new Float32Array(n);
  let phase = 0;
  let lp = 0;
  // Run the loop twice and keep the second pass so the low-pass filter state
  // is already settled where the loop wraps around.
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      phase = (phase + (190 + 8 * Math.sin(TAU * 6 * t)) / sr) % 1;
      const saw = 2 * phase - 1;
      const tremolo = 0.65 + 0.35 * Math.sin(TAU * 40 * t);
      lp += 0.25 * (saw * tremolo - lp);
      if (pass === 1) out[i] = 0.5 * lp;
    }
  }
  return out;
}

// 0.4 s loop of two crunchy bites.
export function munch(sr) {
  const rand = mulberry32(7);
  let lp = 0;
  return render(0.4, sr, (t) => {
    const local = t < 0.2 ? t : t - 0.2;
    const attack = Math.min(1, local / 0.003);
    const env = attack * Math.exp(-local * 32) * (local < 0.14 ? 1 : 0);
    const noise = rand() * 2 - 1;
    lp += 0.35 * (noise - lp);
    const chomp = Math.sin(TAU * 140 * local) * Math.exp(-local * 60);
    return env * (0.55 * lp + 0.35 * chomp);
  });
}

// Sharp crack of a palm on a table plus a low thump.
export function slap(sr) {
  const rand = mulberry32(42);
  let phase = 0;
  return declick(
    render(0.3, sr, (t) => {
      const crack = (rand() * 2 - 1) * Math.exp(-t * 45);
      phase += (60 + 70 * Math.exp(-t * 25)) / sr;
      const thump = Math.sin(TAU * phase) * Math.exp(-t * 16);
      return Math.tanh(1.6 * (0.7 * crack + 0.8 * thump)) * 0.8;
    }),
    sr,
    1,
  );
}

// Nan fan: a whoosh rising as the fan swings down, then the flat, papery
// "phạch" of woven bamboo on the table with a hollow knock and a rattle of
// loose strips, and a puff of air. No deep thump, unlike a palm. The impact
// lands at FAN_HIT_S, which matches the strike's drop time, so the sound is
// started as the strike begins.
export const FAN_HIT_S = 0.09;

export function fan(sr) {
  const rand = mulberry32(11);
  // State-variable filter, swept for the whoosh.
  let low = 0;
  let band = 0;
  let hp = 0;
  return declick(
    render(0.45, sr, (t) => {
      const noise = rand() * 2 - 1;
      const local = t - FAN_HIT_S;
      const fc = local < 0 ? 350 + 2200 * (t / FAN_HIT_S) ** 2 : 1400 * Math.exp(-local * 6) + 300;
      const f = 2 * Math.sin((Math.PI * fc) / sr);
      const high = noise - low - 0.7 * band;
      band += f * high;
      low += f * band;
      const whoosh = band * (local < 0 ? (t / FAN_HIT_S) ** 2 : 0.5 * Math.exp(-local * 14));
      if (local < 0) return 0.5 * whoosh;

      hp += 0.5 * (noise - hp);
      const crack = (noise - hp) * Math.exp(-local * 75);
      const rattleAt = local - 0.022;
      const rattle = rattleAt > 0 ? (noise - hp) * 0.45 * Math.exp(-rattleAt * 90) : 0;
      const knock = Math.sin(TAU * 240 * local) * Math.exp(-local * 32) + 0.5 * Math.sin(TAU * 640 * local) * Math.exp(-local * 50);
      return Math.tanh(1.8 * (0.9 * crack + rattle + 0.45 * knock + 0.5 * whoosh)) * 0.7;
    }),
    sr,
    1,
  );
}

function square(phase) {
  return phase % 1 < 0.5 ? 1 : -1;
}

function triangle(phase) {
  const p = phase % 1;
  return 4 * Math.abs(p - 0.5) - 1;
}

// Plays notes back to back; each note is [freq, seconds]. `voice(phase)`
// shapes the waveform and `bend` (per second) pitches each note down.
function sequence(notes, sr, voice, { bend = 0, decay = 6, volume = 0.35 } = {}) {
  const total = notes.reduce((s, [, d]) => s + d, 0);
  let phase = 0;
  return declick(
    render(total, sr, (t) => {
      let start = 0;
      for (const [freq, dur] of notes) {
        if (t < start + dur) {
          const local = t - start;
          phase += (freq * (1 - bend * local)) / sr;
          const attack = Math.min(1, local / 0.006);
          return voice(phase) * attack * Math.exp(-local * decay) * volume;
        }
        start += dur;
      }
      return 0;
    }),
    sr,
  );
}

// Descending "wah wah" when a life is lost.
export function hurt(sr) {
  return sequence(
    [
      [330, 0.13],
      [262, 0.13],
      [196, 0.26],
    ],
    sr,
    (p) => 0.6 * square(p) + 0.4 * triangle(p),
    { bend: 0.6, decay: 5, volume: 0.3 },
  );
}

// Rising arpeggio for finishing a level.
export function jingle(sr) {
  return sequence(
    [
      [523.25, 0.1],
      [659.25, 0.1],
      [783.99, 0.1],
      [1046.5, 0.45],
    ],
    sr,
    (p) => 0.5 * square(p) + 0.5 * triangle(p),
    { decay: 4, volume: 0.3 },
  );
}

export const SOUNDS = { buzz, munch, slap, fan, hurt, jingle };
