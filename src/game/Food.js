import { dish } from '../world/models.js';
import { FOOD_TYPES } from './foodTypes.js';

const RESPAWN_MS = 6000;

// A dish on a table. Eating empties it; it is refilled a few seconds later.
export class Food {
  constructor(table, { type, dx, dz }, rand) {
    this.type = type;
    this.info = FOOD_TYPES[type];
    this.x = table.x + dx;
    this.z = table.z + dz;
    this.surfaceHeight = table.height;
    this.ready = true;
    this.refillAt = 0;
    this.progress = 0; // eating progress 0..1, drawn as a bar
    this.model = dish(type, rand);
    this.model.position.set(this.x, table.height, this.z);
    this.model.rotation.y = rand() * Math.PI * 2;
    this.model.userData.food = this;
  }

  consume(timeMs) {
    this.ready = false;
    this.refillAt = timeMs + RESPAWN_MS;
    this.model.userData.contents.visible = false;
  }

  update(timeMs) {
    if (!this.ready && timeMs >= this.refillAt) {
      this.ready = true;
      this.model.userData.contents.visible = true;
    }
    // Bonus dishes bob to catch the eye.
    if (this.info.bonus && this.ready) {
      this.model.position.y = this.surfaceHeight + Math.abs(Math.sin(timeMs * 0.005)) * 0.08;
    } else {
      this.model.position.y = this.surfaceHeight;
    }
  }
}
