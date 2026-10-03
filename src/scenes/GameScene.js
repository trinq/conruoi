import Phaser from 'phaser';
import { Fly } from '../fly/Fly.js';
import { Table } from '../food/Table.js';
import { Food } from '../food/Food.js';
import { Hud } from '../ui/Hud.js';
import { Npc } from '../danger/Npc.js';
import { inSlapZone } from '../danger/slapZone.js';
import { LEVELS } from '../levels.js';

const TILE_W = 64;
const TILE_H = 32;
const COLORS = [0xd9a35b, 0xc98f48];
const MAX_LIVES = 3;

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#f2d9a0');

    // Checkerboard of isometric diamond tiles covering the screen.
    const g = this.add.graphics().setDepth(-10000);
    const n = Math.ceil(width / TILE_W + height / TILE_H) + 2;
    for (let i = -n; i < 2 * n; i++) {
      for (let j = -n; j < 2 * n; j++) {
        const cx = width / 2 + (i - j) * (TILE_W / 2);
        const cy = (i + j) * (TILE_H / 2);
        if (cx < -TILE_W || cx > width + TILE_W || cy < -TILE_H || cy > height + TILE_H) continue;
        g.fillStyle(COLORS[(i + j) & 1], 1);
        g.fillPoints(
          [
            { x: cx, y: cy - TILE_H / 2 },
            { x: cx + TILE_W / 2, y: cy },
            { x: cx, y: cy + TILE_H / 2 },
            { x: cx - TILE_W / 2, y: cy },
          ],
          true,
        );
      }
    }

    this.level = LEVELS[0];
    this.score = 0;
    this.lives = MAX_LIVES;
    this.over = false;

    this.tables = [];
    this.foods = [];
    for (const t of this.level.tables) {
      const table = new Table(this, t);
      this.tables.push(table);
      for (const f of t.foods) this.foods.push(new Food(this, table, f.type, f.dx, f.dy));
    }

    // Ground-plane bounds; top margin leaves room for the hovering sprite.
    const margin = 24;
    const { flyStart } = this.level;
    this.fly = new Fly(this, flyStart.x, flyStart.y, {
      left: margin,
      top: margin + 56,
      right: width - margin,
      bottom: height - margin,
    });

    for (const food of this.foods) {
      food.sprite.on('pointerdown', () => this.fly.landOn(food));
    }
    this.fly.events.on('eat', (food) => this.addScore(food));

    const surfaceAt = (x, y) => this.surfaceAt(x, y);
    this.npcs = this.level.npcs.map((n) => {
      const npc = new Npc(this, n, this.level.danger, { getFly: () => this.fly, surfaceAt });
      npc.events.on('slap', (x, y) => this.onSlap(x, y));
      return npc;
    });

    this.hud = new Hud(this);
    this.hud.setScore(this.score, this.level.targetScore);
    this.hud.setLives(this.lives, MAX_LIVES);
  }

  onSlap(x, y) {
    if (this.over) return;
    const fly = this.fly;
    if (!inSlapZone(fly.x, fly.y, x, y) || fly.isInvincible(this.time.now)) return;
    fly.hit(x, y);
    this.lives -= 1;
    this.hud.setLives(this.lives, MAX_LIVES);
    if (this.lives <= 0) this.endRound();
  }

  // Placeholder until the game over scene exists (ticket 05).
  endRound() {
    this.over = true;
    for (const npc of this.npcs) npc.stop();
    this.hud.banner('Hết mạng!');
  }

  addScore(food) {
    this.score += food.info.points;
    this.hud.setScore(this.score, this.level.targetScore);
    this.hud.popup(food.x, food.sprite.y - 40, `+${food.info.points} ${food.info.name}`);
  }

  surfaceAt(x, y) {
    return this.tables.find((t) => t.contains(x, y)) ?? null;
  }

  update(time, delta) {
    if (this.over) return;
    this.fly.update(time, delta, (x, y) => this.surfaceAt(x, y));
    for (const npc of this.npcs) npc.update(time, delta);
  }
}
