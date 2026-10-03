// Draws string-based pixel art frames into a canvas texture.
// Each frame is an array of equal-length rows; '.' is transparent and every
// other character is looked up in the palette. Frames are laid out left to
// right and registered as numeric frames 0..n-1.
export function createPixelTexture(scene, key, frames, palette) {
  const h = frames[0].length;
  const w = frames[0][0].length;
  const tex = scene.textures.createCanvas(key, w * frames.length, h);
  const ctx = tex.getContext();
  frames.forEach((rows, f) => {
    rows.forEach((row, y) => {
      if (row.length !== w) throw new Error(`${key} frame ${f} row ${y}: width ${row.length} != ${w}`);
      [...row].forEach((ch, x) => {
        if (ch === '.') return;
        ctx.fillStyle = palette[ch];
        ctx.fillRect(f * w + x, y, 1, 1);
      });
    });
    tex.add(f, 0, f * w, 0, w, h);
  });
  tex.refresh();
}
