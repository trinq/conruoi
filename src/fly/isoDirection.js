// Maps WASD to isometric screen directions:
// W = up-right, S = down-left, D = down-right, A = up-left.
// Returns a unit vector in screen space, or {x: 0, y: 0} when idle.
export function isoDirection({ up, down, left, right }) {
  let x = 0;
  let y = 0;
  if (up) { x += 1; y -= 0.5; }
  if (down) { x -= 1; y += 0.5; }
  if (right) { x += 1; y += 0.5; }
  if (left) { x -= 1; y -= 0.5; }
  const len = Math.hypot(x, y);
  return len === 0 ? { x: 0, y: 0 } : { x: x / len, y: y / len };
}
