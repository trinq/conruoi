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

// Maps a joystick offset in screen pixels (dy down) to a move vector on the
// ground plane whose length (0..1) is how hard the stick is pushed. Offsets
// inside the dead zone give no input; past it the push ramps up from 0, so
// small careful moves are possible.
export function stickDirection(dx, dy, radius, deadZone) {
  const len = Math.hypot(dx, dy);
  const push = Math.min(1, len / radius);
  if (push <= deadZone) return { x: 0, z: 0 };
  const strength = (push - deadZone) / (1 - deadZone);
  return { x: (dx / len) * strength, z: (dy / len) * strength };
}
