// Slap zones are ellipses on the ground plane, twice as wide as they are
// deep to match the isometric projection.
export const SLAP_RADIUS = 44;

export function inSlapZone(px, py, zx, zy, radius = SLAP_RADIUS) {
  return Math.hypot(px - zx, (py - zy) * 2) <= radius;
}
