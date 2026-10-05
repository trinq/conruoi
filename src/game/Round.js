import * as THREE from 'three';
import { rng } from '../world/lowpoly.js';
import { PAVING } from '../world/area.js';
import { Emitter } from './Emitter.js';
import { Table } from './Table.js';
import { Food } from './Food.js';
import { Fly } from './Fly.js';
import { Npc } from './Npc.js';
import { inSlapZone } from './slapZone.js';
import { dishFor, REGIONS } from '../regions.js';

const GROUND = { height: 0.04 }; // top of the packed-earth clearing
const BOUNDS_INSET = 0.4;

// One attempt at one level: builds its tables, dishes and diners, runs the
// fly and the slaps, and keeps score and lives.
//
// Events: 'score' (score, food), 'lives' (lives), 'swing' (weapon) as a
//         strike starts coming down, 'slap' (x, z, weapon) as it lands,
//         'hit', 'won', 'lost'.
export class Round {
  constructor(scene, level, levelIndex, { lives }) {
    this.scene = scene;
    this.level = level;
    this.score = 0;
    this.lives = lives;
    this.over = false;
    this.time = 0;
    this.events = new Emitter();
    this.group = new THREE.Group();
    scene.add(this.group);

    const rand = rng(1000 + levelIndex * 17);
    this.tables = level.tables.map((t) => new Table(t));
    this.foods = [];
    for (const [i, t] of this.tables.entries()) {
      this.group.add(t.model);
      for (const f of level.tables[i].foods) {
        const food = new Food(t, dishFor(level.region, f), f, rand);
        this.foods.push(food);
        this.group.add(...food.objects);
      }
    }

    this.fly = new Fly(level.flyStart.x, level.flyStart.z, {
      minX: PAVING.minX + BOUNDS_INSET,
      maxX: PAVING.maxX - BOUNDS_INSET,
      minZ: PAVING.minZ + BOUNDS_INSET,
      maxZ: PAVING.maxZ - BOUNDS_INSET,
    });
    this.group.add(...this.fly.objects);
    this.fly.events.on('eat', (food) => this.onEat(food));

    const { danger } = level;
    const surfaceAt = (x, z) => this.surfaceAt(x, z);
    const canAttack = () => this.npcs.filter((n) => n.isAttacking()).length < danger.maxSlaps;
    this.npcs = level.npcs.map((spec, i) => {
      const weapon = level.weapons[i % level.weapons.length];
      const npc = new Npc(spec, danger, {
        weapon,
        south: REGIONS[level.region].south,
        tables: this.tables,
        rand,
        getFly: () => this.fly,
        surfaceAt,
        canAttack,
      });
      npc.events.on('swing', (w) => !this.over && this.events.emit('swing', w));
      npc.events.on('slap', (x, z, w) => this.onSlap(x, z, w));
      this.group.add(...npc.objects);
      return npc;
    });

    this.raycaster = new THREE.Raycaster();
    this.projected = new THREE.Vector3();
  }

  surfaceAt(x, z) {
    return this.tables.find((t) => t.contains(x, z)) ?? GROUND;
  }

  // Ready dish under the pointer, if any.
  pick(ndc, camera) {
    this.raycaster.setFromCamera(ndc, camera);
    const hits = this.raycaster.intersectObjects(
      this.foods.filter((f) => f.ready).map((f) => f.model),
      true,
    );
    for (const hit of hits) {
      let o = hit.object;
      while (o && !o.userData.food) o = o.parent;
      if (o) return o.userData.food;
    }
    return null;
  }

  // Ready dish whose centre is drawn nearest the pointer, within `reachPx`
  // CSS px of it on a canvas of `size` ({ width, height } in CSS px).
  pickNear(ndc, camera, reachPx, size) {
    let best = null;
    let bestDist = reachPx;
    for (const food of this.foods) {
      if (!food.ready) continue;
      const p = this.projected.copy(food.model.position).project(camera);
      const dist = Math.hypot(((p.x - ndc.x) * size.width) / 2, ((p.y - ndc.y) * size.height) / 2);
      if (dist <= bestDist) {
        best = food;
        bestDist = dist;
      }
    }
    return best;
  }

  // Lands the fly on the dish under the pointer. With `reachPx` (touch), a
  // tap that misses every dish takes the nearest one within that distance.
  // Returns the dish the fly is now heading to, if any.
  click(ndc, camera, { reachPx = 0, size } = {}) {
    if (this.over) return null;
    const food = this.pick(ndc, camera) ?? (reachPx > 0 ? this.pickNear(ndc, camera, reachPx, size) : null);
    if (!food) return null;
    this.fly.landOn(food);
    return this.fly.state === 'landing' ? food : null;
  }

  // Lands the flying fly on the ready dish it is hovering over (within
  // `radius` m on the ground), if any. Returns that dish.
  landOnDishBelow(radius) {
    const fly = this.fly;
    if (this.over || fly.state !== 'flying') return null;
    let best = null;
    let bestDist = radius;
    for (const food of this.foods) {
      if (!food.ready) continue;
      const dist = Math.hypot(food.x - fly.x, food.z - fly.z);
      if (dist <= bestDist) {
        best = food;
        bestDist = dist;
      }
    }
    if (best) fly.landOn(best);
    return best && fly.state === 'landing' ? best : null;
  }

  onEat(food) {
    if (this.over) return;
    this.score += food.info.points;
    this.events.emit('score', this.score, food);
    if (this.score >= this.level.targetScore) this.end('won');
  }

  // Every weapon hits the same way: anything inside the zone is hit.
  onSlap(x, z, weapon = 'hand') {
    if (this.over) return;
    this.events.emit('slap', x, z, weapon);
    const fly = this.fly;
    if (!inSlapZone(fly.x, fly.z, x, z) || fly.isInvincible(this.time)) return;
    fly.hit(x, z, this.time);
    this.lives -= 1;
    this.events.emit('hit');
    this.events.emit('lives', this.lives);
    if (this.lives <= 0) this.end('lost');
  }

  end(result) {
    this.over = true;
    for (const npc of this.npcs) npc.stop();
    this.events.emit(result);
  }

  // `dir` is the movement input from the keyboard.
  update(dtMs, dir) {
    if (this.over) return;
    this.time += dtMs;
    const dt = dtMs / 1000;
    this.fly.update(this.time, dt, dir, (x, z) => this.surfaceAt(x, z));
    for (const npc of this.npcs) npc.update(this.time, dtMs);
    for (const food of this.foods) food.update(this.time);
  }

  // Keeps the scene alive behind menus and end banners: the fly hovers (or
  // follows `dir`) and the diners eat, but nobody attacks.
  preview(dtMs, dir = { x: 0, z: 0 }) {
    this.time += dtMs;
    this.fly.update(this.time, dtMs / 1000, dir, (x, z) => this.surfaceAt(x, z));
    for (const npc of this.npcs) {
      if (npc.state === 'idle' || npc.state === 'stopped') npc.animateIdle(this.time);
    }
    for (const food of this.foods) food.update(this.time);
  }

  dispose() {
    this.scene.remove(this.group);
    this.group.traverse((o) => {
      if (o.isSprite) o.material.dispose();
    });
  }
}
