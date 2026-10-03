import Phaser from 'phaser';
import { isoDirection } from './isoDirection.js';

const SPEED = 240; // px/s at full speed
const ACCEL = 10; // how fast velocity catches up to input (1/s)
const HOVER_HEIGHT = 48; // px between ground position and fly sprite while flying
const LAND_OFFSET = 12; // px above a dish's surface when landed on it
const ALTITUDE_LERP = 8; // how fast altitude eases toward its target (1/s)
const ARRIVE_DIST = 3; // px from a dish at which the fly lands
const BOB_AMPLITUDE = 4;
const BOB_SPEED = 0.006;
const MUNCH_AMPLITUDE = 1.5;
const MUNCH_SPEED = 0.03;
const SCALE = 3;

// The fly lives on the ground plane at (x, y); the sprite is drawn above it
// at `altitude` and a shadow marks the position on whatever surface is below.
//
// States:
//   flying   - WASD controlled
//   landing  - auto-flying to a dish the player clicked
//   eating   - sitting on a dish; emits 'eat' when done
// Any WASD input during landing/eating takes off and cancels it.
export class Fly {
  constructor(scene, x, y, bounds) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.altitude = HOVER_HEIGHT;
    this.bounds = bounds;
    this.state = 'flying';
    this.target = null;
    this.eatElapsed = 0;
    this.events = new Phaser.Events.EventEmitter();

    this.shadow = scene.add.ellipse(x, y, 30, 10, 0x000000, 0.3);
    this.sprite = scene.add.sprite(x, y - HOVER_HEIGHT, 'fly', 0).setScale(SCALE);
    this.sprite.play('fly-idle');

    this.keys = scene.input.keyboard.addKeys('W,A,S,D');
  }

  landOn(food) {
    if (!food.ready) return;
    this.cancelEating();
    this.state = 'landing';
    this.target = food;
  }

  cancelEating() {
    if (this.target) this.target.setProgress(0);
    this.target = null;
    this.eatElapsed = 0;
    this.state = 'flying';
  }

  // `surfaceAt(x, y)` returns the table under a ground point, or null.
  update(time, delta, surfaceAt = () => null) {
    const dt = delta / 1000;
    const dir = isoDirection({
      up: this.keys.W.isDown,
      down: this.keys.S.isDown,
      left: this.keys.A.isDown,
      right: this.keys.D.isDown,
    });
    const hasInput = dir.x !== 0 || dir.y !== 0;
    if (hasInput && this.state !== 'flying') this.cancelEating();

    if (this.state === 'flying') this.updateFlying(dt, dir);
    else if (this.state === 'landing') this.updateLanding(dt);
    else if (this.state === 'eating') this.updateEating(delta);

    const targetAltitude =
      this.state === 'eating' ? this.target.surfaceHeight + LAND_OFFSET : HOVER_HEIGHT;
    this.altitude += (targetAltitude - this.altitude) * Math.min(1, ALTITUDE_LERP * dt);

    this.updateVisuals(time, surfaceAt(this.x, this.y), hasInput || this.state === 'landing');
  }

  updateFlying(dt, dir) {
    const t = Math.min(1, ACCEL * dt);
    this.vx += (dir.x * SPEED - this.vx) * t;
    this.vy += (dir.y * SPEED - this.vy) * t;

    const { left, top, right, bottom } = this.bounds;
    this.x = Phaser.Math.Clamp(this.x + this.vx * dt, left, right);
    this.y = Phaser.Math.Clamp(this.y + this.vy * dt, top, bottom);
  }

  updateLanding(dt) {
    const food = this.target;
    if (!food.ready) {
      this.cancelEating();
      return;
    }
    const dx = food.x - this.x;
    const dy = food.y - this.y;
    const dist = Math.hypot(dx, dy);
    const step = SPEED * dt;
    if (dist <= Math.max(ARRIVE_DIST, step)) {
      this.x = food.x;
      this.y = food.y;
      this.vx = 0;
      this.vy = 0;
      this.state = 'eating';
      this.eatElapsed = 0;
      return;
    }
    this.vx = (dx / dist) * SPEED;
    this.vy = (dy / dist) * SPEED;
    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;
  }

  updateEating(delta) {
    const food = this.target;
    this.eatElapsed += delta;
    food.setProgress(this.eatElapsed / food.info.eatMs);
    if (this.eatElapsed >= food.info.eatMs) {
      food.consume();
      this.target = null;
      this.eatElapsed = 0;
      this.state = 'flying';
      this.events.emit('eat', food);
    }
  }

  updateVisuals(time, surface, moving) {
    const eating = this.state === 'eating';
    if (eating) {
      this.sprite.anims.stop();
      this.sprite.setFrame(1);
    } else {
      const anim = moving ? 'fly-move' : 'fly-idle';
      if (!this.sprite.anims.isPlaying || this.sprite.anims.getName() !== anim) this.sprite.play(anim);
    }
    if (this.vx < -1) this.sprite.setFlipX(true);
    else if (this.vx > 1) this.sprite.setFlipX(false);

    const bob = eating
      ? Math.abs(Math.sin(time * MUNCH_SPEED)) * MUNCH_AMPLITUDE
      : Math.sin(time * BOB_SPEED) * BOB_AMPLITUDE;
    this.sprite.setPosition(this.x, this.y - this.altitude + bob);

    // Shadow falls on the table top when over a table, otherwise the floor.
    const floor = surface ? surface.height : 0;
    this.shadow.setPosition(this.x, this.y - floor);
    this.shadow.setScale(Math.max(0.4, 1 - (this.altitude - floor) / 120));
    this.shadow.setVisible(!eating);

    // Depth sort by ground y; above a table the fly is above the table top,
    // and when landed it sits on top of its dish.
    if (eating) this.sprite.setDepth(this.target.depth + 0.5);
    else if (surface) this.sprite.setDepth(surface.depth + 2);
    else this.sprite.setDepth(this.y);
    this.shadow.setDepth(surface ? surface.depth + 0.5 : this.y - 1);
  }
}
