import Phaser from 'phaser';
import { isoDirection } from './isoDirection.js';

const SPEED = 240; // px/s at full speed
const ACCEL = 10; // how fast velocity catches up to input (1/s)
const HOVER_HEIGHT = 36; // px between ground position and fly sprite
const BOB_AMPLITUDE = 4;
const BOB_SPEED = 0.006;
const SCALE = 3;

// The fly lives on the ground plane at (x, y); the sprite is drawn above it
// at hover height and a shadow marks the ground position.
export class Fly {
  constructor(scene, x, y, bounds) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.bounds = bounds;

    this.shadow = scene.add.ellipse(x, y, 30, 10, 0x000000, 0.3);
    this.sprite = scene.add.sprite(x, y - HOVER_HEIGHT, 'fly', 0).setScale(SCALE);
    this.sprite.play('fly-idle');

    this.keys = scene.input.keyboard.addKeys('W,A,S,D');
  }

  update(time, delta) {
    const dt = delta / 1000;
    const dir = isoDirection({
      up: this.keys.W.isDown,
      down: this.keys.S.isDown,
      left: this.keys.A.isDown,
      right: this.keys.D.isDown,
    });
    const moving = dir.x !== 0 || dir.y !== 0;

    const t = Math.min(1, ACCEL * dt);
    this.vx += (dir.x * SPEED - this.vx) * t;
    this.vy += (dir.y * SPEED - this.vy) * t;

    const { left, top, right, bottom } = this.bounds;
    this.x = Phaser.Math.Clamp(this.x + this.vx * dt, left, right);
    this.y = Phaser.Math.Clamp(this.y + this.vy * dt, top, bottom);

    const anim = moving ? 'fly-move' : 'fly-idle';
    if (this.sprite.anims.getName() !== anim) this.sprite.play(anim);
    if (this.vx < -1) this.sprite.setFlipX(true);
    else if (this.vx > 1) this.sprite.setFlipX(false);

    const bob = Math.sin(time * BOB_SPEED) * BOB_AMPLITUDE;
    this.sprite.setPosition(this.x, this.y - HOVER_HEIGHT + bob);
    this.shadow.setPosition(this.x, this.y);
    // Shadow shrinks slightly as the fly bobs higher.
    this.shadow.setScale(1 - bob / 40);

    // Depth sort by ground y so objects further down the screen draw in front.
    this.sprite.setDepth(this.y);
    this.shadow.setDepth(this.y - 1);
  }
}
