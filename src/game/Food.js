import * as THREE from 'three';
import { dish } from '../world/models.js';
import { DISHES } from './dishes.js';

const RESPAWN_MS = 6000;
const TAG_HEIGHT = 0.55;

// Little round chalkboard tags showing a dish's points, one texture per value.
const tagTextures = new Map();
function pointsTag(points) {
  if (!tagTextures.has(points)) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#8a5a33';
    ctx.beginPath();
    ctx.arc(64, 64, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#22302a';
    ctx.beginPath();
    ctx.arc(64, 64, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe680';
    ctx.font = '64px "Patrick Hand", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(points), 64, 68);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tagTextures.set(points, tex);
  }
  return tagTextures.get(points);
}

// A dish on a table. Eating empties it; it is refilled a few seconds later.
// `info` is the catalogue entry: name, tier, points and eating time.
export class Food {
  constructor(table, dishId, { dx, dz }, rand) {
    this.info = DISHES[dishId];
    this.x = table.x + dx;
    this.z = table.z + dz;
    this.surfaceHeight = table.height;
    this.ready = true;
    this.refillAt = 0;
    this.progress = 0; // eating progress 0..1, drawn as a bar
    this.model = dish(this.info.model, rand);
    this.model.position.set(this.x, table.height, this.z);
    this.model.rotation.y = rand() * Math.PI * 2;
    this.model.userData.food = this;

    this.tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: pointsTag(this.info.points) }));
    this.tag.scale.setScalar(0.4);
    this.tag.position.set(this.x, table.height + TAG_HEIGHT, this.z);
    this.objects = [this.model, this.tag];
  }

  consume(timeMs) {
    this.ready = false;
    this.refillAt = timeMs + RESPAWN_MS;
    this.model.userData.contents.visible = false;
    this.tag.visible = false;
  }

  update(timeMs) {
    if (!this.ready && timeMs >= this.refillAt) {
      this.ready = true;
      this.model.userData.contents.visible = true;
      this.tag.visible = true;
    }
    // Bonus dishes bob to catch the eye.
    if (this.info.bonus && this.ready) {
      this.model.position.y = this.surfaceHeight + Math.abs(Math.sin(timeMs * 0.005)) * 0.08;
    } else {
      this.model.position.y = this.surfaceHeight;
    }
  }
}
