import Phaser from 'phaser';
import { Fly } from '../fly/Fly.js';
import { Table } from '../food/Table.js';
import { Food } from '../food/Food.js';
import { Hud } from '../ui/Hud.js';
import { Npc } from '../danger/Npc.js';
import { inSlapZone } from '../danger/slapZone.js';
import { LEVELS } from '../levels.js';
import { drawFloor } from '../ui/floor.js';
import { fadeIn, fadeTo } from '../ui/transition.js';
import { MAX_LIVES, newGame } from '../gameState.js';

const END_DELAY_MS = 900; // let the final hit / last bite play out before fading

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create(data) {
    const { levelIndex, lives, totalScore } = { ...newGame(), ...data };
    const { width, height } = this.scale;
    this.leaving = false;
    drawFloor(this);

    this.levelIndex = levelIndex;
    this.level = LEVELS[levelIndex];
    this.score = 0;
    this.totalScore = totalScore;
    this.lives = lives;
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

    fadeIn(this);
  }

  onSlap(x, y) {
    if (this.over) return;
    const fly = this.fly;
    if (!inSlapZone(fly.x, fly.y, x, y) || fly.isInvincible(this.time.now)) return;
    fly.hit(x, y);
    this.lives -= 1;
    this.hud.setLives(this.lives, MAX_LIVES);
    if (this.lives <= 0) {
      this.endRound('Hết mạng!', 'GameOverScene', {
        totalScore: this.totalScore,
        levelIndex: this.levelIndex,
      });
    }
  }

  addScore(food) {
    if (this.over) return;
    this.score += food.info.points;
    this.totalScore += food.info.points;
    this.hud.setScore(this.score, this.level.targetScore);
    this.hud.popup(food.x, food.sprite.y - 40, `+${food.info.points} ${food.info.name}`);
    if (this.score >= this.level.targetScore) {
      this.endRound('Đủ điểm!', 'LevelCompleteScene', {
        levelIndex: this.levelIndex,
        levelScore: this.score,
        totalScore: this.totalScore,
        lives: this.lives,
      });
    }
  }

  // Freezes play, shows a banner, then fades to the next scene.
  endRound(message, nextScene, data) {
    this.over = true;
    for (const npc of this.npcs) npc.stop();
    this.hud.banner(message);
    this.time.delayedCall(END_DELAY_MS, () => fadeTo(this, nextScene, data));
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
