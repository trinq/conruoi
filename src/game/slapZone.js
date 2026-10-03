// A slap covers a circle on the surface it lands on.
export const SLAP_RADIUS = 0.85;

export function inSlapZone(px, pz, zx, zz, radius = SLAP_RADIUS) {
  return Math.hypot(px - zx, pz - zz) <= radius;
}
