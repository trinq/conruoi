import { SOUNDS } from './synth.js';

// Renders every synthesized effect into an AudioBuffer in Phaser's audio
// cache under `sfx-<name>`. Only the Web Audio sound manager can play
// buffers; with HTML5 audio or no audio the game simply stays silent.
export function registerSounds(scene) {
  const ctx = scene.sound.context;
  if (!ctx) return;
  for (const [name, generate] of Object.entries(SOUNDS)) {
    const samples = generate(ctx.sampleRate);
    const buffer = ctx.createBuffer(1, samples.length, ctx.sampleRate);
    buffer.copyToChannel(samples, 0);
    scene.cache.audio.add(`sfx-${name}`, buffer);
  }
}

export function hasSound(scene, name) {
  return scene.cache.audio.exists(`sfx-${name}`);
}

// One-shot effect. Skipped while the browser still blocks audio (before the
// first click/key press) so nothing piles up and plays all at once later.
export function playSfx(scene, name, config) {
  if (!hasSound(scene, name) || scene.sound.locked) return;
  scene.sound.play(`sfx-${name}`, config);
}
