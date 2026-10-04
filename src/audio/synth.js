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

// Electric swatter: the sharp "tạch" of a fly-sized spark jumping the
// grid, a short crackle of smaller arcs after it, and the high whine of the
// charged grid dying away. Bright and dry, with no thump.
export function swatter(sr) {
  const rand = mulberry32(23);
  // Pops in the crackle: [time s, loudness].
  const pops = [
    [0.018, 0.7],
    [0.031, 0.45],
    [0.047, 0.8],
    [0.062, 0.35],
    [0.081, 0.55],
    [0.104, 0.3],
    [0.13, 0.4],
    [0.162, 0.2],
  ];
  let hp = 0;
  let prev = 0;
  return declick(
    render(0.32, sr, (t) => {
      const noise = rand() * 2 - 1;
      // First difference of noise: hiss with the low end cut.
      const hiss = noise - prev;
      prev = noise;
      hp += 0.6 * (hiss - hp);
      // The main snap: a near-instant click with a bright ringing tail.
      const snap = hiss * Math.exp(-t * 160) * 1.3 + Math.sin(TAU * 3100 * t) * Math.exp(-t * 90) * 0.35;
      let crackle = 0;
      for (const [at, gain] of pops) {
        const local = t - at;
        if (local >= 0 && local < 0.012) crackle += hp * gain * Math.exp(-local * 420);
      }
      // A mains-like buzz under the arcs: 100 Hz square with odd harmonics.
      const hum = (Math.sign(Math.sin(TAU * 100 * t)) * 0.12 + Math.sin(TAU * 2400 * t) * 0.08) * Math.exp(-t * 14);
      return Math.tanh(2.2 * (snap + crackle + hum)) * 0.6;
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

// ----- street ambience -----
//
// Long loops layered under the game, one per kind of street sound, so each
// region can mix them differently. The layers have different lengths, so the
// mix doesn't repeat as an obvious whole.

// Renders a sound that loops without a seam: a little extra is rendered and
// crossfaded (equal power) into the start, so the end runs straight into it.
function seamless(seconds, sr, fn, fade = 0.5) {
  const n = Math.floor(seconds * sr);
  const f = Math.floor(fade * sr);
  const raw = render(seconds + fade, sr, fn);
  const out = raw.slice(0, n);
  for (let i = 0; i < f; i++) {
    const a = (i / f) * (Math.PI / 2);
    out[i] = raw[i] * Math.sin(a) + raw[n + i] * Math.cos(a);
  }
  return out;
}

// Adds `samples` into the loop `out` starting at `at`, wrapping past the
// end, so one-off events can sit anywhere in a loop, even across the seam.
function addWrapped(out, at, samples, gain = 1) {
  for (let i = 0; i < samples.length; i++) out[(at + i) % out.length] += samples[i] * gain;
}

// Scales a loop so its loudest sample is `peak`.
function normalize(samples, peak = 0.5) {
  let max = 0;
  for (const v of samples) max = Math.max(max, Math.abs(v));
  if (max > 0) for (let i = 0; i < samples.length; i++) samples[i] *= peak / max;
  return samples;
}

// Two-pole band-pass (state-variable filter); returns a per-sample function.
function bandPass(sr, q = 0.7) {
  let low = 0;
  let band = 0;
  return (x, fc) => {
    const f = 2 * Math.sin((Math.PI * Math.min(fc, sr / 6)) / sr);
    const high = x - low - q * band;
    band += f * high;
    low += f * band;
    return band;
  };
}

// Crowd murmur: several voices chatting at once, none of them words. Each
// voice is a breathy buzz at its own pitch through two moving vowel
// formants, gated into syllables.
export function murmur(sr) {
  const rand = mulberry32(101);
  const voices = Array.from({ length: 7 }, () => ({
    pitch: 105 + rand() * 140,
    phase: 0,
    f1: bandPass(sr, 0.5),
    f2: bandPass(sr, 0.6),
    rate: 3 + rand() * 2.5, // syllables per second
    gate: 0,
    target: 0,
    nextAt: 0,
    vowel: rand(),
    pan: 0.5 + rand() * 0.5,
  }));
  let brown = 0;
  return normalize(
    seamless(9, sr, (t) => {
      let sum = 0;
      for (const v of voices) {
        if (t >= v.nextAt) {
          // Start the next syllable (or a pause between phrases).
          v.target = rand() < 0.18 ? 0 : 0.4 + rand() * 0.6;
          v.vowel = rand();
          v.nextAt = t + (0.6 + rand() * 0.8) / v.rate;
        }
        v.gate += (v.target - v.gate) * (40 / sr);
        v.phase = (v.phase + (v.pitch * (1 + 0.04 * Math.sin(TAU * 1.3 * t + v.pan * 9))) / sr) % 1;
        const src = (2 * v.phase - 1) * 0.6 + (rand() * 2 - 1) * 0.4;
        const f1 = 350 + 500 * v.vowel;
        const f2 = 1000 + 1300 * (1 - v.vowel);
        sum += (v.f1(src, f1) + 0.6 * v.f2(src, f2)) * v.gate * v.pan;
      }
      brown += 0.02 * (rand() * 2 - 1 - brown);
      return sum + brown * 0.6;
    }),
    0.45,
  );
}

// Engine note of a 110 cc scooter going past: the firing pulse and its
// harmonics, rising in pitch as it comes and dropping as it leaves.
function passBy(sr, rand) {
  const seconds = 3.2 + rand() * 1.6;
  const base = 38 + rand() * 22; // firing rate (Hz)
  const width = 0.45 + rand() * 0.35; // how quickly it goes by (s)
  const centre = seconds / 2;
  let phase = 0;
  let lp = 0;
  return declick(
    render(seconds, sr, (t) => {
      const x = (t - centre) / width;
      const f = base * (1 + 0.07 * -Math.tanh(x)) * (1 + 0.02 * Math.sin(TAU * 7 * t));
      phase = (phase + f / sr) % 1;
      const pulse = phase < 0.22 ? 1 : -0.28;
      const rasp = (rand() * 2 - 1) * 0.35;
      const near = 1 / (1 + x * x);
      // Close up the engine is brighter.
      lp += (0.05 + 0.25 * near) * (pulse + rasp - lp);
      return lp * near;
    }),
    sr,
    20,
  );
}

// Traffic: a low road rumble with scooters passing every few seconds.
export function traffic(sr) {
  const rand = mulberry32(202);
  let rumble = 0;
  let rumble2 = 0;
  const out = seamless(13, sr, () => {
    rumble += 0.004 * (rand() * 2 - 1 - rumble);
    rumble2 += 0.03 * (rumble - rumble2);
    return rumble2 * 6;
  });
  const times = [0.4, 2.6, 4.1, 6.9, 8.3, 10.6, 11.8];
  for (const at of times) addWrapped(out, Math.floor(at * sr), passBy(sr, rand), 0.35 + rand() * 0.45);
  return normalize(out, 0.5);
}

// One scooter horn press: two reedy tones a third apart, a little detuned.
function horn(sr, rand, seconds) {
  const lo = 380 + rand() * 120;
  const hi = lo * 1.26;
  let p1 = 0;
  let p2 = 0;
  let lp = 0;
  return declick(
    render(seconds, sr, (t) => {
      p1 = (p1 + lo / sr) % 1;
      p2 = (p2 + hi / sr) % 1;
      const tone = (p1 < 0.5 ? 1 : -1) + (p2 < 0.5 ? 0.8 : -0.8);
      lp += 0.3 * (tone - lp);
      const env = Math.min(1, t / 0.01) * (1 - 0.3 * (t / seconds));
      return lp * env;
    }),
    sr,
    8,
  );
}

// Horns from the street: single toots and the double "bíp bíp", at
// different distances.
export function horns(sr) {
  const rand = mulberry32(303);
  const out = new Float32Array(Math.floor(17 * sr));
  const presses = [
    [1.1, [0.18]],
    [4.6, [0.12, 0.14]],
    [7.2, [0.35]],
    [10.4, [0.1, 0.1, 0.16]],
    [13.3, [0.22]],
    [15.6, [0.12, 0.2]],
  ];
  for (const [at, beeps] of presses) {
    const gain = 0.3 + rand() * 0.7;
    let t = at;
    for (const len of beeps) {
      addWrapped(out, Math.floor(t * sr), horn(sr, rand, len), gain);
      t += len + 0.07;
    }
  }
  return normalize(out, 0.5);
}

// A spoon or chopsticks against a ceramic bowl: a few inharmonic partials
// that ring briefly.
function clink(sr, rand) {
  const f = 1700 + rand() * 1600;
  const partials = [
    [1, 1, 18],
    [2.76, 0.5, 30],
    [5.4, 0.25, 45],
    [8.93, 0.12, 60],
  ];
  const tap = 0.004;
  return render(0.3, sr, (t) => {
    let v = (rand() * 2 - 1) * Math.exp(-t / tap) * 0.5;
    for (const [m, a, d] of partials) if (f * m < sr / 2) v += Math.sin(TAU * f * m * t) * a * Math.exp(-t * d);
    return v;
  });
}

// A bowl set down on a steel table: a dull knock.
function setDown(sr, rand) {
  const f = 520 + rand() * 260;
  return render(0.25, sr, (t) => (Math.sin(TAU * f * t) * 0.8 + (rand() * 2 - 1) * 0.3) * Math.exp(-t * 28));
}

// Clinking bowls and spoons at the tables around.
export function bowls(sr) {
  const rand = mulberry32(404);
  const out = new Float32Array(Math.floor(7 * sr));
  for (let i = 0; i < 14; i++) {
    const at = Math.floor(rand() * out.length);
    addWrapped(out, at, clink(sr, rand), 0.25 + rand() * 0.75);
    // Spoons often tap twice.
    if (rand() < 0.4) addWrapped(out, at + Math.floor((0.12 + rand() * 0.1) * sr), clink(sr, rand), 0.3 + rand() * 0.4);
  }
  for (let i = 0; i < 3; i++) addWrapped(out, Math.floor(rand() * out.length), setDown(sr, rand), 0.6);
  return normalize(out, 0.5);
}

// The ambience layers every region mixes (see `ambience` in src/regions.js).
export const AMBIENCE = { murmur, traffic, horns, bowls };

// Sample rates the layers are rendered at: low and mid sounds don't need
// the full rate, and Web Audio resamples them when they play.
export const SAMPLE_RATES = { murmur: 16000, traffic: 12000, horns: 22050, bowls: 32000 };

export const SOUNDS = { buzz, munch, slap, fan, swatter, hurt, jingle, ...AMBIENCE };
