// Maps held movement keys to a unit vector on the ground plane. The camera
// looks north from the south, so W/up moves away from the viewer (-z).
export function moveDirection({ up, down, left, right }) {
  let x = 0;
  let z = 0;
  if (up) z -= 1;
  if (down) z += 1;
  if (left) x -= 1;
  if (right) x += 1;
  const len = Math.hypot(x, z);
  return len === 0 ? { x: 0, z: 0 } : { x: x / len, z: z / len };
}
