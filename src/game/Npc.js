import * as THREE from 'three';
import { person, slapHand, nanFan, pickArchetype } from '../world/models.js';
import { textTexture } from '../world/lowpoly.js';
import { Emitter } from './Emitter.js';
import { SLAP_RADIUS } from './slapZone.js';

const HAND_HOVER = 1.5; // m above the target while winding up
const DROP_MS = 90; // keep in step with FAN_HIT_S in audio/synth.js
const REST_MS = 350;
const RETRACT_MS = 250;
const SHOULDER = new THREE.Vector3(0.3, 1.1, 0.1);
const GUST_MS = 350;

// How each weapon looks on the way down. The warning zone, timing and hit
// rule are the same for every weapon; only the model and the pose change.
// - cock: how far (radians) the weapon is tipped back at the top of the
//   wind-up; the strike swings it flat onto the table.
// - wave: how much it fans back and forth while hovering.
const POSES = {
  hand: { cock: 0, wave: 0 },
  fan: { cock: 1.3, wave: 0.35 },
};

let alertTexture = null;

// A diner sitting at a table. Every so often, if the fly is within reach,
// they wind up (warning zone + hand raised over the fly's position) and then
// slap down on that spot.
//
// States: idle -> windup -> slap -> idle. Emits 'swing' (weapon) as the
// strike starts coming down and 'slap' (x, z, weapon) on impact.
export class Npc {
  // `weapon` is 'hand', 'fan' or 'swatter'.
  constructor({ x, z }, danger, { weapon, south = false, tables, rand, getFly, surfaceAt, canAttack }) {
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

    this.model = person(rand, pickArchetype(rand, { south }));
    this.model.position.set(x, 0, z);
    // Face the closest point of the nearest table.
    let best = null;
    for (const t of tables) {
      const p = t.closestPoint(x, z);
      const d = Math.hypot(p.x - x, p.z - z);
      if (!best || d < best.d) best = { ...p, d };
    }
    this.model.rotation.y = Math.atan2(best.x - x, best.z - z);

    // `hand` is whatever comes down on the table: a palm or a nan fan.
    const { skin, shirt, rightArm, chopsticks } = this.model.userData;
    const fan = weapon === 'fan';
    this.pose = POSES[fan ? 'fan' : 'hand'];
    this.hand = fan ? nanFan() : slapHand(skin, shirt);
    this.hand.visible = false;
    this.pivot = this.hand.userData.pivot ?? null;
    this.cock = 0;
    if (fan) {
      // Between strikes a fan diner fans themself with a smaller copy, so
      // players can see who is armed.
      chopsticks.visible = false;
      this.heldFan = nanFan();
      this.heldFan.scale.setScalar(0.55);
      // Handle down the arm, blade upright with its face toward the head.
      this.heldFan.rotation.set(Math.PI / 2, Math.PI / 2, 0, 'YXZ');
      // Grip in the hand, blade beyond it.
      this.heldFan.position.set(0, -0.44 + this.heldFan.userData.pivot.position.z * 0.55, 0.04);
      rightArm.add(this.heldFan);
      // A ring of air puffs out from under the fan when it lands.
      this.gust = new THREE.Mesh(
        new THREE.RingGeometry(0.55, 0.7, 28),
        new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }),
      );
      this.gust.rotation.x = -Math.PI / 2;
      this.gust.visible = false;
    }

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

    this.objects = [this.model, this.hand, this.alert, this.zone, ...(this.gust ? [this.gust] : [])];
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
        this.events.emit('swing', this.weapon);
      }
    } else if (this.state === 'slap') {
      this.elapsed += dtMs;
      this.updateSlap();
    }
  }

  // Eating with chopsticks between slaps, or fanning in the heat.
  animateIdle(timeMs) {
    const { head, rightArm } = this.model.userData;
    const t = timeMs * 0.004 + this.phase;
    if (this.heldFan) {
      rightArm.rotation.x = -2.2 + Math.sin(t * 3) * 0.12;
      rightArm.rotation.z = 0.3 + Math.sin(t * 3) * 0.3;
      head.rotation.x = -0.05;
      return;
    }
    rightArm.rotation.x = -1.25 + Math.sin(t) * 0.35;
    head.rotation.x = Math.max(0, Math.sin(t)) * 0.15;
  }

  startWindup(fly) {
    this.state = 'windup';
    this.elapsed = 0;
    // Lock onto where the fly is right now; the player has the wind-up to escape.
    this.target = { x: fly.x, z: fly.z, y: this.surfaceAt(fly.x, fly.z).height };
    this.model.userData.rightArm.rotation.set(-2.9, 0, 0);
    this.model.userData.head.rotation.x = -0.15;
    if (this.heldFan) this.heldFan.visible = false;
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
    if (this.pivot) {
      // Fan it while lining up, then cock it right back before the strike.
      const { cock, wave } = this.pose;
      const fanning = Math.sin(timeMs * 0.025) * wave * (1 - rise / 0.35);
      this.cock = cock * (0.45 * travel + 0.55 * (rise / 0.35)) + fanning;
      this.pivot.rotation.x = -this.cock;
    }
  }

  updateSlap() {
    const { x, y, z } = this.target;
    const t = this.elapsed;
    if (t < DROP_MS) {
      const p = (t / DROP_MS) ** 2;
      this.hand.position.y = THREE.MathUtils.lerp(y + HAND_HOVER + 0.35, y + 0.08, p);
      // The fan swings flat as it comes down.
      if (this.pivot) this.pivot.rotation.x = -this.cock * (1 - Math.sqrt(t / DROP_MS));
      return;
    }
    if (!this.landed) {
      this.landed = true;
      this.hand.position.y = y + 0.08;
      if (this.pivot) this.pivot.rotation.x = 0;
      this.zone.visible = false;
      if (this.gust) {
        this.gust.position.set(x, y + 0.04, z);
        this.gust.visible = true;
      }
      this.events.emit('slap', x, z, this.weapon);
    }
    this.updateGust(t - DROP_MS);
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
      if (this.heldFan) this.heldFan.visible = true;
      this.landed = false;
      this.state = 'idle';
      this.cooldown = this.nextCooldown();
    }
  }

  updateGust(sinceImpactMs) {
    if (!this.gust?.visible) return;
    const g = sinceImpactMs / GUST_MS;
    if (g >= 1) {
      this.gust.visible = false;
      return;
    }
    this.gust.scale.setScalar(0.7 + g * 1.1);
    this.gust.material.opacity = 0.7 * (1 - g);
  }

  // Freeze the diner when the round ends.
  stop() {
    this.state = 'stopped';
    this.zone.visible = false;
    this.alert.visible = false;
    if (this.gust) this.gust.visible = false;
  }
}
