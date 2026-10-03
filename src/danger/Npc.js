import Phaser from 'phaser';
import { SLAP_RADIUS } from './slapZone.js';

const SCALE = 3;
const HAND_SCALE = 3;
const HAND_HOVER = 110; // px above the target while winding up
const SLAP_DROP_MS = 90;
const HAND_REST_MS = 350;
const ZONE_DEPTH = 9000;
const HAND_DEPTH = 9500;

// A diner sitting at the stall. Every so often, if the fly is within reach,
// they wind up (warning zone + raised hand over the fly's position) and then
// slap down on that spot.
//
// States: idle -> windup -> slap -> idle. Emits 'slap' (x, y) on impact.
export class Npc {
  constructor(scene, { x, y }, danger, { getFly, surfaceAt }) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.danger = danger;
    this.getFly = getFly;
    this.surfaceAt = surfaceAt;
    this.state = 'idle';
    this.cooldown = this.nextCooldown();
    this.events = new Phaser.Events.EventEmitter();

    this.sprite = scene.add.sprite(x, y, 'npc', 0).setOrigin(0.5, 1).setScale(SCALE).setDepth(y);
    this.sprite.play('npc-idle');

    this.alert = scene.add
      .text(x, y - 24 * SCALE - 10, '!', {
        fontFamily: 'VT323, monospace',
        fontSize: '44px',
        color: '#ff3b30',
        stroke: '#ffffff',
        strokeThickness: 5,
      })
      .setOrigin(0.5, 1)
      .setDepth(HAND_DEPTH)
      .setVisible(false);

    this.zone = scene.add.graphics().setDepth(ZONE_DEPTH);
    this.hand = scene.add.image(x, y, 'hand').setScale(HAND_SCALE).setDepth(HAND_DEPTH).setVisible(false);
  }

  nextCooldown() {
    const [min, max] = this.danger.cooldownMs;
    return Phaser.Math.Between(min, max);
  }

  update(time, delta) {
    if (this.state === 'idle') {
      this.cooldown -= delta;
      const fly = this.getFly();
      const inReach = Phaser.Math.Distance.Between(this.x, this.y, fly.x, fly.y) <= this.danger.reach;
      if (this.cooldown <= 0 && inReach && fly.canBeTargeted(time)) this.startWindup(fly);
    } else if (this.state === 'windup') {
      this.elapsed += delta;
      this.drawWindup(time, Math.min(1, this.elapsed / this.danger.windupMs));
      if (this.elapsed >= this.danger.windupMs) this.slap();
    }
  }

  startWindup(fly) {
    this.state = 'windup';
    this.elapsed = 0;
    // Lock onto where the fly is right now; the player has the wind-up to escape.
    this.target = { x: fly.x, y: fly.y };
    const surface = this.surfaceAt(fly.x, fly.y);
    this.target.surfaceHeight = surface ? surface.height : 0;

    this.sprite.anims.stop();
    this.sprite.setFrame(2);
    this.alert.setVisible(true);
    this.hand.setVisible(true).setAlpha(1).setAngle(0);
  }

  drawWindup(time, p) {
    const { x, y, surfaceHeight } = this.target;
    const zy = y - surfaceHeight;

    // Warning: red zone whose inner fill grows to the edge as the slap nears.
    this.zone.clear();
    const pulse = 0.25 + 0.15 * Math.sin(time * 0.02);
    this.zone.fillStyle(0xff3b30, pulse);
    this.zone.fillEllipse(x, zy, SLAP_RADIUS * 2, SLAP_RADIUS);
    this.zone.fillStyle(0xff3b30, 0.45);
    this.zone.fillEllipse(x, zy, SLAP_RADIUS * 2 * p, SLAP_RADIUS * p);
    this.zone.lineStyle(2, 0xffffff, 0.8);
    this.zone.strokeEllipse(x, zy, SLAP_RADIUS * 2, SLAP_RADIUS);

    // Hand travels from the diner to hover over the target, rising slightly
    // at the end of the wind-up before it comes down.
    const travel = Phaser.Math.Easing.Cubic.Out(Math.min(1, p / 0.4));
    const startX = this.x + 20;
    const startY = this.y - 24 * SCALE;
    const hoverY = zy - HAND_HOVER - 20 * Math.max(0, (p - 0.7) / 0.3);
    this.hand.setPosition(
      Phaser.Math.Linear(startX, x, travel),
      Phaser.Math.Linear(startY, hoverY, travel),
    );

    this.alert.setY(this.y - 24 * SCALE - 10 - Math.abs(Math.sin(time * 0.015)) * 6);
  }

  slap() {
    this.state = 'slap';
    this.alert.setVisible(false);
    const { x, y, surfaceHeight } = this.target;
    this.scene.tweens.add({
      targets: this.hand,
      y: y - surfaceHeight - 12,
      duration: SLAP_DROP_MS,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.zone.clear();
        this.scene.cameras.main.shake(120, 0.006);
        this.events.emit('slap', x, y);
        this.scene.time.delayedCall(HAND_REST_MS, () => this.retract());
      },
    });
  }

  retract() {
    this.scene.tweens.add({
      targets: this.hand,
      x: this.x + 20,
      y: this.y - 24 * SCALE,
      alpha: 0,
      duration: 250,
      onComplete: () => {
        this.hand.setVisible(false);
        this.sprite.play('npc-idle');
        this.state = 'idle';
        this.cooldown = this.nextCooldown();
      },
    });
  }

  // Freeze the diner (used when the round ends).
  stop() {
    this.state = 'stopped';
    this.zone.clear();
    this.alert.setVisible(false);
  }
}
