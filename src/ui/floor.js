const TILE_W = 64;
const TILE_H = 32;
const THEMES = {
  day: { tiles: [0xd9a35b, 0xc98f48], background: '#f2d9a0' },
  night: { tiles: [0x4a3f5c, 0x40364f], background: '#241d33' },
};

// Fills the screen with a checkerboard of isometric diamond tiles.
// The night theme also strings red lanterns across the top.
export function drawFloor(scene, theme = 'day') {
  const { tiles, background } = THEMES[theme];
  const { width, height } = scene.scale;
  scene.cameras.main.setBackgroundColor(background);
  const g = scene.add.graphics().setDepth(-10000);
  const n = Math.ceil(width / TILE_W + height / TILE_H) + 2;
  for (let i = -n; i < 2 * n; i++) {
    for (let j = -n; j < 2 * n; j++) {
      const cx = width / 2 + (i - j) * (TILE_W / 2);
      const cy = (i + j) * (TILE_H / 2);
      if (cx < -TILE_W || cx > width + TILE_W || cy < -TILE_H || cy > height + TILE_H) continue;
      g.fillStyle(tiles[(i + j) & 1], 1);
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
  if (theme === 'night') drawLanterns(scene);
  return g;
}

function drawLanterns(scene) {
  const { width } = scene.scale;
  const g = scene.add.graphics().setDepth(-9000);
  const sag = (x) => 58 + Math.sin((x / width) * Math.PI) * 22;

  g.lineStyle(2, 0x1a1424, 1);
  g.beginPath();
  g.moveTo(0, sag(0));
  for (let x = 0; x <= width; x += 16) g.lineTo(x, sag(x));
  g.strokePath();

  for (let x = 60; x < width; x += 120) {
    const y = sag(x) + 16;
    g.fillStyle(0xffc94d, 0.12);
    g.fillCircle(x, y, 34);
    g.fillStyle(0xd63a2f, 1);
    g.fillEllipse(x, y, 22, 26);
    g.fillStyle(0xffd23f, 1);
    g.fillRect(x - 6, y - 15, 12, 3);
    g.fillRect(x - 6, y + 12, 12, 3);
  }
}
