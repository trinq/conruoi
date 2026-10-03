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
// Events: 'score' (score, food), 'lives' (lives), 'slap' (x, z), 'hit',
//         'won', 'lost'.
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
      npc.events.on('slap', (x, z) => this.onSlap(x, z));
      this.group.add(...npc.objects);
      return npc;
    });

    this.raycaster = new THREE.Raycaster();
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

  click(ndc, camera) {
    if (this.over) return;
    const food = this.pick(ndc, camera);
    if (food) this.fly.landOn(food);
  }

  onEat(food) {
    if (this.over) return;
    this.score += food.info.points;
    this.events.emit('score', this.score, food);
    if (this.score >= this.level.targetScore) this.end('won');
  }

  onSlap(x, z) {
    if (this.over) return;
    this.events.emit('slap', x, z);
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
