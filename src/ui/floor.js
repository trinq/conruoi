const TILE_W = 64;
const TILE_H = 32;
const COLORS = [0xd9a35b, 0xc98f48];

// Fills the screen with a checkerboard of isometric diamond tiles.
export function drawFloor(scene) {
  const { width, height } = scene.scale;
  scene.cameras.main.setBackgroundColor('#f2d9a0');
  const g = scene.add.graphics().setDepth(-10000);
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
  return g;
}
