import { table as tableModel } from '../world/models.js';
import { bakeStatic } from '../world/bake.js';

export const TABLE_HEIGHT = 0.62;

// A table top the fly can land on. (x, z) is the centre of its footprint.
export class Table {
  constructor({ x, z, w, d }) {
    this.x = x;
    this.z = z;
    this.w = w;
    this.d = d;
    this.height = TABLE_HEIGHT;
    this.model = bakeStatic(tableModel(w, d, TABLE_HEIGHT));
    this.model.position.set(x, 0, z);
  }

  contains(px, pz) {
    return Math.abs(px - this.x) <= this.w / 2 && Math.abs(pz - this.z) <= this.d / 2;
  }

  // Closest point of the footprint to (px, pz).
  closestPoint(px, pz) {
    return {
      x: Math.min(this.x + this.w / 2, Math.max(this.x - this.w / 2, px)),
      z: Math.min(this.z + this.d / 2, Math.max(this.z - this.d / 2, pz)),
    };
  }
}
