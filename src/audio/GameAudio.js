const BUZZ_MOVING = 0.35;
const BUZZ_HOVER = 0.06;
const BUZZ_FADE = 6; // how fast the buzz volume follows the fly (1/s)
const FULL_SPEED = 4.2;
const SLAP_GAP_MS = 80; // two diners landing together sound like one slap

// Sounds that follow the fly during a round: a buzz loop whose volume and
// pitch track the fly's speed, a munch loop while eating, plus one-shot slap,
// fan and hurt effects. Each loop is a single voice, so nothing stacks.
export class GameAudio {
  constructor(engine) {
    this.engine = engine;
    this.buzz = engine.loop('buzz');
    this.munch = engine.loop('munch');
    this.munch.setVolume(0.5);
    this.lastSlap = -Infinity;
  }

  update(fly, dt) {
    if (this.engine.locked) return;
    this.buzz.start();
    const speed = fly.speed;
    const airborne = fly.state === 'flying' || fly.state === 'landing';
    let target = 0;
    if (airborne) target = speed > 0.5 ? BUZZ_MOVING : BUZZ_HOVER;
    this.buzz.setVolume(this.buzz.volume + (target - this.buzz.volume) * Math.min(1, BUZZ_FADE * dt));
    this.buzz.setRate(0.9 + 0.25 * Math.min(1, speed / FULL_SPEED));

    const eating = fly.state === 'eating';
    if (eating && !this.munch.playing) this.munch.start();
    else if (!eating && this.munch.playing) this.munch.stop();
  }

  // A fan's sound starts with the whoosh of the swing and lands its thwack
  // on impact, so it plays as the strike starts; a palm plays on impact.
  swing(weapon) {
    if (weapon === 'fan') this.strike('fan');
  }

  slap(weapon = 'hand') {
    if (weapon !== 'fan') this.strike('slap');
  }

  strike(sound) {
    const now = performance.now();
    if (now - this.lastSlap < SLAP_GAP_MS) return;
    this.lastSlap = now;
    this.engine.play(sound);
  }

  hurt() {
    this.engine.play('hurt');
  }

  stop() {
    this.buzz.stop();
    this.munch.stop();
  }
}
