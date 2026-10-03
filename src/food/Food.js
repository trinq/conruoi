import { FOOD_TYPES } from './foodTypes.js';

const SCALE = 3;
const RESPAWN_MS = 6000;
const BAR_W = 40;
const BAR_H = 6;

// A dish sitting on a table. (x, y) is its ground-plane position; the sprite
// is drawn at the table's surface height.
export class Food {
  constructor(scene, table, type, dx, dy) {
    this.scene = scene;
    this.table = table;
    this.type = type;
    this.info = FOOD_TYPES[type];
    this.x = table.x + dx;
    this.y = table.y + dy;
    this.surfaceHeight = table.height;
    this.ready = true;
    // Above the table, sorted among other dishes by ground y.
    this.depth = table.depth + 1 + (this.y - table.y + table.hd) / 1000;

    this.sprite = scene.add
      .image(this.x, this.y - table.height, `food-${type}`)
      .setOrigin(0.5, 13 / 16) // bottom of the bowl sits on the table
      .setScale(SCALE)
      .setDepth(this.depth)
      .setInteractive({ useHandCursor: true });

    this.bar = scene.add.graphics().setDepth(10000);

    // Bonus dishes bob to catch the eye.
    if (this.info.bonus) {
      scene.tweens.add({
        targets: this.sprite,
        y: this.sprite.y - 4,
        duration: 450,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }
  }

  // Draws the eating progress bar above the dish; 0 hides it.
  setProgress(p) {
    this.bar.clear();
    if (p <= 0) return;
    const x = this.x - BAR_W / 2;
    const y = this.sprite.y - 48;
    this.bar.fillStyle(0x000000, 0.6);
    this.bar.fillRect(x - 1, y - 1, BAR_W + 2, BAR_H + 2);
    this.bar.fillStyle(0x7ed957, 1);
    this.bar.fillRect(x, y, BAR_W * Math.min(1, p), BAR_H);
  }

  // Marks the dish as eaten; it fades and comes back after a while.
  consume() {
    this.ready = false;
    this.setProgress(0);
    this.sprite.setAlpha(0.3);
    this.scene.time.delayedCall(RESPAWN_MS, () => {
      this.ready = true;
      this.sprite.setAlpha(1);
    });
  }
}
