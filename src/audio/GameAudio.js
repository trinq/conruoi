import { hasSound, playSfx } from './sounds.js';

const BUZZ_MOVING = 0.35;
const BUZZ_HOVER = 0.06;
const BUZZ_FADE = 6; // how fast the buzz volume follows the fly (1/s)
const FULL_SPEED = 240;
const SLAP_GAP_MS = 80; // two diners landing together sound like one slap

// Sounds that follow the fly during a round: a buzz loop whose volume and
// pitch track the fly's speed, a munch loop while eating, plus one-shot slap
// and hurt effects. Each loop is a single instance, so nothing stacks.
export class GameAudio {
  constructor(scene) {
    this.scene = scene;
    this.lastSlap = -Infinity;
    this.buzz = hasSound(scene, 'buzz') ? scene.sound.add('sfx-buzz', { loop: true, volume: 0 }) : null;
    this.munch = hasSound(scene, 'munch') ? scene.sound.add('sfx-munch', { loop: true, volume: 0.5 }) : null;

    // Start the buzz now, or as soon as the browser allows audio.
    if (this.buzz) {
      if (scene.sound.locked) scene.sound.once('unlocked', () => this.buzz?.play());
      else this.buzz.play();
    }
    scene.events.once('shutdown', () => this.destroy());
  }

  update(fly, dt) {
    if (this.buzz) {
      const speed = Math.hypot(fly.vx, fly.vy);
      const airborne = fly.state === 'flying' || fly.state === 'landing';
      let target = 0;
      if (airborne) target = speed > 30 ? BUZZ_MOVING : BUZZ_HOVER;
      const v = this.buzz.volume + (target - this.buzz.volume) * Math.min(1, BUZZ_FADE * dt);
      this.buzz.setVolume(v);
      this.buzz.setRate(0.9 + 0.25 * Math.min(1, speed / FULL_SPEED));
    }
    if (this.munch && !this.scene.sound.locked) {
      const eating = fly.state === 'eating';
      if (eating && !this.munch.isPlaying) this.munch.play();
      else if (!eating && this.munch.isPlaying) this.munch.stop();
    }
  }

  slap() {
    const now = this.scene.time.now;
    if (now - this.lastSlap < SLAP_GAP_MS) return;
    this.lastSlap = now;
    playSfx(this.scene, 'slap');
  }

  hurt() {
    playSfx(this.scene, 'hurt');
  }

  // Silence the loops when the round ends.
  stopLoops() {
    this.buzz?.stop();
    this.munch?.stop();
  }

  destroy() {
    this.buzz?.destroy();
    this.munch?.destroy();
    this.buzz = null;
    this.munch = null;
  }
}
