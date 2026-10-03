import * as THREE from 'three';
import { fly as flyModel } from '../world/models.js';
import { Emitter } from './Emitter.js';

const SPEED = 4.2; // m/s at full speed
const ACCEL = 10; // how fast velocity catches up to input (1/s)
const HOVER_HEIGHT = 1.35; // altitude while flying
const LAND_OFFSET = 0.32; // altitude above a dish's table when landed on it
const ALTITUDE_LERP = 8;
const TURN_LERP = 12;
const BOB_AMPLITUDE = 0.07;
const BOB_SPEED = 0.006;
const MUNCH_AMPLITUDE = 0.03;
const MUNCH_SPEED = 0.03;
const STUN_MS = 600; // no control after being hit
const INVINCIBLE_MS = 1800; // i-frames after being hit (includes the stun)
const KNOCKBACK_SPEED = 5;
const STUN_DRAG = 4;

// The player. (x, z) is the fly's position on the ground plane; the model is
// drawn `altitude` above it, and a blob shadow marks the spot below.
//
// States:
//   flying   - keyboard controlled
//   landing  - auto-flying to a dish the player clicked
//   eating   - sitting on a dish; emits 'eat' when done
//   stunned  - knocked back after a slap, no control
// Any movement input during landing/eating takes off and cancels it.
export class Fly {
  constructor(x, z, bounds) {
    this.x = x;
    this.z = z;
    this.vx = 0;
    this.vz = 0;
    this.altitude = HOVER_HEIGHT;
    this.yaw = Math.PI; // start facing the diners
    this.bounds = bounds;
    this.state = 'flying';
    this.target = null;
    this.eatElapsed = 0;
    this.stunnedUntil = 0;
    this.invincibleUntil = 0;
    this.events = new Emitter();

    this.model = flyModel();
    this.shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.22, 16),
      new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.32, depthWrite: false }),
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.objects = [this.model, this.shadow];
  }

  get speed() {
    return Math.hypot(this.vx, this.vz);
  }

  landOn(food) {
    if (!food.ready || this.state === 'stunned') return;
    this.cancelEating();
    this.state = 'landing';
    this.target = food;
  }

  cancelEating() {
    if (this.target) this.target.progress = 0;
    this.target = null;
    this.eatElapsed = 0;
    this.state = 'flying';
  }

  // Knocks the fly away from (fromX, fromZ), stuns it and starts i-frames.
  hit(fromX, fromZ, timeMs) {
    this.cancelEating();
    const dx = this.x - fromX;
    const dz = this.z - fromZ;
    const len = Math.hypot(dx, dz);
    // A dead-centre hit has no direction; knock it toward the viewer.
    this.vx = len > 0.05 ? (dx / len) * KNOCKBACK_SPEED : 0;
    this.vz = len > 0.05 ? (dz / len) * KNOCKBACK_SPEED : KNOCKBACK_SPEED;
    this.state = 'stunned';
    this.stunnedUntil = timeMs + STUN_MS;
    this.invincibleUntil = timeMs + INVINCIBLE_MS;
  }

  isInvincible(timeMs) {
    return timeMs < this.invincibleUntil;
  }

  // Diners only start a new slap once the fly has recovered.
  canBeTargeted(timeMs) {
    return this.state !== 'stunned' && !this.isInvincible(timeMs);
  }

  // `dir` is the movement input; `surfaceAt(x, z)` gives the height below.
  update(timeMs, dt, dir, surfaceAt) {
    const stunned = this.state === 'stunned';
    const hasInput = !stunned && (dir.x !== 0 || dir.z !== 0);
    if (hasInput && this.state !== 'flying') this.cancelEating();

    if (stunned) this.updateStunned(timeMs, dt);
    else if (this.state === 'flying') this.updateFlying(dt, dir);
    else if (this.state === 'landing') this.updateLanding(dt);
    else if (this.state === 'eating') this.updateEating(timeMs, dt);

    const targetAltitude = this.state === 'eating' ? this.target.surfaceHeight + LAND_OFFSET : HOVER_HEIGHT;
    this.altitude += (targetAltitude - this.altitude) * Math.min(1, ALTITUDE_LERP * dt);

    this.updateModel(timeMs, dt, surfaceAt(this.x, this.z));
  }

  updateFlying(dt, dir) {
    const t = Math.min(1, ACCEL * dt);
    this.vx += (dir.x * SPEED - this.vx) * t;
    this.vz += (dir.z * SPEED - this.vz) * t;
    this.move(dt);
  }

  updateStunned(timeMs, dt) {
    const decay = Math.max(0, 1 - STUN_DRAG * dt);
    this.vx *= decay;
    this.vz *= decay;
    this.move(dt);
    if (timeMs >= this.stunnedUntil) this.state = 'flying';
  }

  move(dt) {
    const { minX, maxX, minZ, maxZ } = this.bounds;
    this.x = THREE.MathUtils.clamp(this.x + this.vx * dt, minX, maxX);
    this.z = THREE.MathUtils.clamp(this.z + this.vz * dt, minZ, maxZ);
  }

  updateLanding(dt) {
    const food = this.target;
    if (!food.ready) {
      this.cancelEating();
      return;
    }
    const dx = food.x - this.x;
    const dz = food.z - this.z;
    const dist = Math.hypot(dx, dz);
    const step = SPEED * dt;
    if (dist <= Math.max(0.03, step)) {
      this.x = food.x;
      this.z = food.z;
      this.vx = 0;
      this.vz = 0;
      this.state = 'eating';
      this.eatElapsed = 0;
      return;
    }
    this.vx = (dx / dist) * SPEED;
    this.vz = (dz / dist) * SPEED;
    this.x += (dx / dist) * step;
    this.z += (dz / dist) * step;
  }

  updateEating(timeMs, dt) {
    const food = this.target;
    this.eatElapsed += dt * 1000;
    food.progress = this.eatElapsed / food.info.eatMs;
    if (this.eatElapsed >= food.info.eatMs) {
      food.progress = 0;
      food.consume(timeMs);
      this.target = null;
      this.eatElapsed = 0;
      this.state = 'flying';
      this.events.emit('eat', food);
    }
  }

  updateModel(timeMs, dt, surface) {
    const m = this.model;
    const eating = this.state === 'eating';
    const stunned = this.state === 'stunned';

    // Face the direction of travel.
    if (this.speed > 0.3 && !stunned) {
      const want = Math.atan2(this.vx, this.vz);
      let diff = want - this.yaw;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      this.yaw += diff * Math.min(1, TURN_LERP * dt);
    }
    if (stunned) this.yaw += dt * 18;

    const bob = eating
      ? Math.abs(Math.sin(timeMs * MUNCH_SPEED)) * MUNCH_AMPLITUDE
      : Math.sin(timeMs * BOB_SPEED) * BOB_AMPLITUDE;
    m.position.set(this.x, this.altitude + bob, this.z);
    m.rotation.set(Math.min(0.35, this.speed * 0.06), this.yaw, stunned ? Math.sin(timeMs * 0.03) * 0.6 : 0, 'YXZ');

    // Wings buzz while airborne and fold back while eating.
    for (const w of m.userData.wings) {
      const side = w.userData.side;
      w.rotation.z = eating ? side * -0.15 : side * (0.25 + Math.sin(timeMs * 0.09 + side) * 0.55);
    }

    // i-frames flicker.
    m.visible = !(this.isInvincible(timeMs) && Math.floor(timeMs / 80) % 2 === 0);

    this.shadow.position.set(this.x, surface.height + 0.02, this.z);
    const h = this.altitude - surface.height;
    this.shadow.scale.setScalar(THREE.MathUtils.clamp(1.25 - h * 0.35, 0.5, 1.2));
    this.shadow.visible = !eating;
  }
}
