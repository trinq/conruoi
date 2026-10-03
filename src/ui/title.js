import Phaser from 'phaser';
import { TEXT_STYLE } from './style.js';

// Renders text small and scales it up with nearest-neighbour filtering so it
// reads as chunky pixel art.
export function addPixelTitle(scene, x, y, text, { size = 20, scale = 5, color = '#ffd23f' } = {}) {
  const title = scene.add
    .text(x, y, text, {
      ...TEXT_STYLE,
      fontSize: `${size}px`,
      color,
      stroke: '#3b2412',
      strokeThickness: 2,
      resolution: 1,
    })
    .setOrigin(0.5)
    .setScale(scale);
  title.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  return title;
}
