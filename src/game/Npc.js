import * as THREE from 'three';
import { person, slapHand } from '../world/models.js';
import { textTexture } from '../world/lowpoly.js';
import { Emitter } from './Emitter.js';
import { SLAP_RADIUS } from './slapZone.js';

const HAND_HOVER = 1.5; // m above the target while winding up
const DROP_MS = 90;
const REST_MS = 350;
const RETRACT_MS = 250;
const SHOULDER = new THREE.Vector3(0.3, 1.1, 0.1);

let alertTexture = null;

// A diner sitting at a table. Every so often, if the fly is within reach,
// they wind up (warning zone + hand raised over the fly's position) and then
// slap down on that spot.
//
// States: idle -> windup -> slap -> idle. Emits 'slap' (x, z) on impact.
export class Npc {
  // `weapon` is 'hand', 'fan' or 'swatter'.
  constructor({ x, z }, danger, { weapon, tables, rand, getFly, surfaceAt, canAttack }) {
    this.weapon = weapon;
    this.x = x;
    this.z = z;
    this.danger = danger;
    this.rand = rand;
    this.getFly = getFly;
    this.surfaceAt = surfaceAt;
    this.canAttack = canAttack;
    this.state = 'idle';
    this.elapsed = 0;
    this.cooldown = this.nextCooldown();
    this.phase = rand() * 10;
    this.events = new Emitter();

    this.model = person(rand);
    this.model.position.set(x, 0, z);
    // Face the closest point of the nearest table.
    let best = null;
    for (const t of tables) {
      const p = t.closestPoint(x, z);
      const d = Math.hypot(p.x - x, p.z - z);
      if (!best || d < best.d) best = { ...p, d };
    }
    this.model.rotation.y = Math.atan2(best.x - x, best.z - z);

    const { skin, shirt } = this.model.userData;
    this.hand = slapHand(skin, shirt);
    this.hand.visible = false;

    alertTexture ??= textTexture('!', { width: 128, height: 128, font: '110px "Paytone One", sans-serif', color: '#ff3b30' });
    this.alert = new THREE.Sprite(new THREE.SpriteMaterial({ map: alertTexture, depthTest: false }));
    this.alert.scale.setScalar(0.7);
    this.alert.position.set(x, 2.15, z);
    this.alert.visible = false;
    this.alert.renderOrder = 10;

    // Warning zone: pulsing disc, a fill that grows as the slap nears, and a rim.
    const zoneMat = (color, opacity) =>
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
    this.zone = new THREE.Group();
    this.zoneDisc = new THREE.Mesh(new THREE.CircleGeometry(SLAP_RADIUS, 32), zoneMat('#ff3b30', 0.3));
    this.zoneFill = new THREE.Mesh(new THREE.CircleGeometry(SLAP_RADIUS, 32), zoneMat('#ff3b30', 0.45));
    this.zoneRim = new THREE.Mesh(new THREE.RingGeometry(SLAP_RADIUS - 0.05, SLAP_RADIUS, 32), zoneMat('#ffffff', 0.9));
    for (const m of [this.zoneDisc, this.zoneFill, this.zoneRim]) {
      m.rotation.x = -Math.PI / 2;
      m.renderOrder = 5;
      this.zone.add(m);
    }
    this.zone.visible = false;

    this.objects = [this.model, this.hand, this.alert, this.zone];
  }

  nextCooldown() {
    const [min, max] = this.danger.cooldownMs;
    return min + this.rand() * (max - min);
  }

  isAttacking() {
    return this.state === 'windup' || this.state === 'slap';
  }

  shoulderWorld() {
    return SHOULDER.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.model.rotation.y).add(this.model.position);
  }

  update(timeMs, dtMs) {
    if (this.state === 'idle') {
      this.animateIdle(timeMs);
      this.cooldown -= dtMs;
      const fly = this.getFly();
      const inReach = Math.hypot(fly.x - this.x, fly.z - this.z) <= this.danger.reach;
      if (this.cooldown <= 0 && inReach && fly.canBeTargeted(timeMs) && this.canAttack()) this.startWindup(fly);
    } else if (this.state === 'windup') {
      this.elapsed += dtMs;
      this.updateWindup(timeMs, Math.min(1, this.elapsed / this.danger.windupMs));
      if (this.elapsed >= this.danger.windupMs) {
        this.state = 'slap';
        this.elapsed = 0;
        this.alert.visible = false;
      }
    } else if (this.state === 'slap') {
      this.elapsed += dtMs;
      this.updateSlap();
    }
  }

  // Eating with chopsticks between slaps.
  animateIdle(timeMs) {
    const { head, rightArm } = this.model.userData;
    const t = timeMs * 0.004 + this.phase;
    rightArm.rotation.x = -1.25 + Math.sin(t) * 0.35;
    head.rotation.x = Math.max(0, Math.sin(t)) * 0.15;
  }

  startWindup(fly) {
    this.state = 'windup';
    this.elapsed = 0;
    // Lock onto where the fly is right now; the player has the wind-up to escape.
    this.target = { x: fly.x, z: fly.z, y: this.surfaceAt(fly.x, fly.z).height };
    this.model.userData.rightArm.rotation.x = -2.9;
    this.model.userData.head.rotation.x = -0.15;
    this.alert.visible = true;
    this.zone.visible = true;
    this.zone.position.set(this.target.x, this.target.y + 0.02, this.target.z);
    this.hand.visible = true;
    this.hand.rotation.set(0, Math.atan2(this.target.x - this.x, this.target.z - this.z), 0);
    this.handFrom = this.shoulderWorld();
  }

  updateWindup(timeMs, p) {
    const pulse = 0.22 + 0.12 * Math.sin(timeMs * 0.02);
    this.zoneDisc.material.opacity = pulse;
    this.zoneFill.scale.setScalar(Math.max(0.01, p));
    this.alert.position.y = 2.15 + Math.abs(Math.sin(timeMs * 0.015)) * 0.15;

    // Hand travels from the shoulder to hover over the target, rising a little
    // at the end of the wind-up before it comes down.
    const travel = 1 - (1 - Math.min(1, p / 0.4)) ** 3;
    const rise = Math.max(0, (p - 0.7) / 0.3) * 0.35;
    const { x, y, z } = this.target;
    this.hand.position.set(
      THREE.MathUtils.lerp(this.handFrom.x, x, travel),
      THREE.MathUtils.lerp(this.handFrom.y, y + HAND_HOVER + rise, travel),
      THREE.MathUtils.lerp(this.handFrom.z, z, travel),
    );
  }

  updateSlap() {
    const { x, y, z } = this.target;
    const t = this.elapsed;
    if (t < DROP_MS) {
      const p = (t / DROP_MS) ** 2;
      this.hand.position.y = THREE.MathUtils.lerp(y + HAND_HOVER + 0.35, y + 0.08, p);
      return;
    }
    if (!this.landed) {
      this.landed = true;
      this.hand.position.y = y + 0.08;
      this.zone.visible = false;
      this.events.emit('slap', x, z);
    }
    if (t < DROP_MS + REST_MS) return;
    const p = Math.min(1, (t - DROP_MS - REST_MS) / RETRACT_MS);
    const home = this.shoulderWorld();
    this.hand.position.set(
      THREE.MathUtils.lerp(x, home.x, p),
      THREE.MathUtils.lerp(y + 0.08, home.y, p),
      THREE.MathUtils.lerp(z, home.z, p),
    );
    if (p >= 1) {
      this.hand.visible = false;
      this.landed = false;
      this.state = 'idle';
      this.cooldown = this.nextCooldown();
    }
  }

  // Freeze the diner when the round ends.
  stop() {
    this.state = 'stopped';
    this.zone.visible = false;
    this.alert.visible = false;
  }
}
