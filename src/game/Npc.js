import * as THREE from 'three';
import { person, slapHand, nanFan, swatter, SWATTER_COLOURS, pickArchetype } from '../world/models.js';
import { textTexture, pick } from '../world/lowpoly.js';
import { Emitter } from './Emitter.js';
import { SLAP_RADIUS } from './slapZone.js';

const HAND_HOVER = 1.5; // m above the target while winding up
const DROP_MS = 90; // keep in step with FAN_HIT_S in audio/synth.js
const REST_MS = 350;
const RETRACT_MS = 250;
const SHOULDER = new THREE.Vector3(0.3, 1.1, 0.1);
const GUST_MS = 350;
const SPARK_MS = 320;
const SPARKS = 18;

// How each weapon looks on the way down. The warning zone, timing and hit
// rule are the same for every weapon; only the model and the pose change.
// - cock: how far (radians) the weapon is tipped back at the top of the
//   wind-up; the strike swings it flat onto the table.
// - wave: how much it fans back and forth while hovering.
// - live: how brightly the grid glows while lined up (the swatter's button
//   is held down).
const POSES = {
  hand: { cock: 0, wave: 0, live: 0 },
  fan: { cock: 1.3, wave: 0.35, live: 0 },
  swatter: { cock: 1.05, wave: 0.12, live: 0.9 },
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

    // `hand` is whatever comes down on the table: a palm, a nan fan or an
    // electric swatter.
    const { skin, shirt, rightArm, chopsticks } = this.model.userData;
    const colour = weapon === 'swatter' ? pick(rand, SWATTER_COLOURS) : null;
    const makeWeapon = { fan: () => nanFan(), swatter: () => swatter(colour) }[weapon];
    this.pose = POSES[weapon] ?? POSES.hand;
    this.hand = makeWeapon ? makeWeapon() : slapHand(skin, shirt);
    this.hand.visible = false;
    this.pivot = this.hand.userData.pivot ?? null;
    this.grid = this.hand.userData.grid ?? null;
    this.cock = 0;
    if (makeWeapon) {
      // Between strikes an armed diner holds a smaller copy, so players can
      // see who is armed: a fan fans them, a swatter is held up ready.
      chopsticks.visible = false;
      const scale = weapon === 'fan' ? 0.55 : 0.5;
      this.held = makeWeapon();
      this.held.scale.setScalar(scale);
      // Handle down the arm, blade upright with its face toward the head.
      this.held.rotation.set(Math.PI / 2, Math.PI / 2, 0, 'YXZ');
      // Grip in the hand, blade beyond it.
      this.held.position.set(0, -0.44 + this.held.userData.pivot.position.z * scale, 0.04);
      rightArm.add(this.held);
    }
    if (weapon === 'fan') {
      // A ring of air puffs out from under the fan when it lands.
      this.gust = new THREE.Mesh(
        new THREE.RingGeometry(0.55, 0.7, 28),
        new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }),
      );
      this.gust.rotation.x = -Math.PI / 2;
      this.gust.visible = false;
    }
    if (weapon === 'swatter') {
      // Sparks fly off the grid when it zaps the table: thin blue-white and
      // burning orange streaks in one instanced mesh, plus a blue flash of
      // light on the table.
      this.sparks = new THREE.InstancedMesh(
        new THREE.BoxGeometry(0.014, 0.014, 1).translate(0, 0, 0.5),
        new THREE.MeshBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
        SPARKS,
      );
      const colour = new THREE.Color();
      for (let i = 0; i < SPARKS; i++) this.sparks.setColorAt(i, colour.set(i % 3 === 0 ? '#ffb347' : '#cfeeff'));
      this.sparks.frustumCulled = false;
      this.sparks.visible = false;
      this.sparks.renderOrder = 11;
      this.sparkDirs = Array.from({ length: SPARKS }, () => new THREE.Vector3());
      this.flash = new THREE.Mesh(
        new THREE.CircleGeometry(0.45, 20),
        new THREE.MeshBasicMaterial({ color: '#2f8fff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
      );
      this.flash.rotation.x = -Math.PI / 2;
      this.flash.visible = false;
      this.flash.renderOrder = 6;
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

    this.objects = [this.model, this.hand, this.alert, this.zone, this.gust, this.sparks, this.flash].filter(Boolean);
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

  // Eating with chopsticks between slaps, fanning in the heat, or holding
  // the swatter up and sweeping it about, looking for flies.
  animateIdle(timeMs) {
    const { head, rightArm } = this.model.userData;
    const t = timeMs * 0.004 + this.phase;
    if (this.weapon === 'fan') {
      rightArm.rotation.x = -2.2 + Math.sin(t * 3) * 0.12;
      rightArm.rotation.z = 0.3 + Math.sin(t * 3) * 0.3;
      head.rotation.x = -0.05;
      return;
    }
    if (this.weapon === 'swatter') {
      rightArm.rotation.x = -1.75 + Math.sin(t * 0.7) * 0.15;
      rightArm.rotation.z = 0.15 + Math.sin(t * 0.45) * 0.35;
      head.rotation.x = -0.1;
      head.rotation.y = Math.sin(t * 0.45) * 0.3;
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
    if (this.held) this.held.visible = false;
    this.model.userData.head.rotation.y = 0;
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
      const { cock, wave, live } = this.pose;
      const fanning = Math.sin(timeMs * 0.025) * wave * (1 - rise / 0.35);
      this.cock = cock * (0.45 * travel + 0.55 * (rise / 0.35)) + fanning;
      this.pivot.rotation.x = -this.cock;
      // The swatter's grid crackles into life as it lines up.
      if (this.grid) this.grid.emissiveIntensity = live * travel * (0.7 + 0.3 * Math.sin(timeMs * 0.09));
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
      if (this.sparks) this.startSparks(x, y, z);
      this.events.emit('slap', x, z, this.weapon);
    }
    this.updateGust(t - DROP_MS);
    this.updateSparks(t - DROP_MS);
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
      if (this.held) this.held.visible = true;
      if (this.grid) this.grid.emissiveIntensity = 0;
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

  // Sparks shoot out from under the grid, mostly sideways and up.
  startSparks(x, y, z) {
    for (const d of this.sparkDirs) {
      const a = Math.random() * Math.PI * 2;
      d.set(Math.cos(a), 0.25 + Math.random() * 0.9, Math.sin(a)).normalize();
      d.multiplyScalar(0.6 + Math.random() * 0.8);
    }
    this.sparkFrom = new THREE.Vector3(x, y + 0.1, z);
    this.sparks.visible = true;
    this.flash.position.set(x, y + 0.05, z);
    this.flash.visible = true;
  }

  updateSparks(sinceImpactMs) {
    if (!this.sparks?.visible) return;
    const s = sinceImpactMs / SPARK_MS;
    if (s >= 1) {
      this.sparks.visible = false;
      this.flash.visible = false;
      if (this.grid) this.grid.emissiveIntensity = 0;
      return;
    }
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const size = new THREE.Vector3();
    const forward = new THREE.Vector3(0, 0, 1);
    const ease = 1 - (1 - s) ** 2;
    this.sparkDirs.forEach((d, i) => {
      const reach = d.length();
      p.copy(this.sparkFrom).addScaledVector(d, ease);
      q.setFromUnitVectors(forward, size.copy(d).normalize());
      // Streaks are long at first and shrink to dots as they burn out.
      size.set(1, 1, reach * 0.35 * (1 - s) + 0.02);
      m.compose(p, q, size);
      this.sparks.setMatrixAt(i, m);
    });
    this.sparks.instanceMatrix.needsUpdate = true;
    // A quick flicker rather than a smooth fade.
    const flicker = sinceImpactMs < 60 || Math.floor(sinceImpactMs / 40) % 2 === 0 ? 1 : 0.4;
    this.sparks.material.opacity = (1 - s) * flicker;
    this.flash.material.opacity = 0.55 * (1 - s) ** 2 * flicker;
    if (this.grid) this.grid.emissiveIntensity = 2.5 * (1 - s) * flicker;
  }

  // Freeze the diner when the round ends.
  stop() {
    this.state = 'stopped';
    this.zone.visible = false;
    this.alert.visible = false;
    if (this.gust) this.gust.visible = false;
    if (this.sparks) {
      this.sparks.visible = false;
      this.flash.visible = false;
    }
  }
}
