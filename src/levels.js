// Level layouts, easiest first. Run `npm run check:levels` after editing.
//
// World units are roughly metres. x runs left → right on screen, z runs
// back → front (toward the camera); the play area is about x ±7, z -3.8…4.6.
//
// - tables: centre (x, z), width w (along x) and depth d (along z).
// - foods: offsets (dx, dz) from their table's centre; they must sit well
//   inside the table top. Types: pho, bun, com, che (bonus).
// - npcs: where each diner's stool stands, just off a table edge. They turn
//   to face the nearest table.
// - danger.windupMs: warning time before a slap lands.
//   danger.cooldownMs: [min, max] pause between slaps, per diner.
//   danger.reach: how close (in metres) the fly must be for a diner to slap.
//   danger.maxSlaps: how many diners may be winding up / slapping at once.
export const LEVELS = [
  {
    name: 'Quán phở đầu ngõ',
    theme: 'day',
    targetScore: 80,
    flyStart: { x: 0, z: 3.2 },
    tables: [
      {
        x: 0,
        z: 0,
        w: 3.4,
        d: 2.0,
        foods: [
          { type: 'pho', dx: -0.95, dz: 0.1 },
          { type: 'bun', dx: 0.45, dz: -0.4 },
          { type: 'com', dx: 0.65, dz: 0.45 },
        ],
      },
    ],
    npcs: [{ x: 0.8, z: -1.5 }],
    danger: { windupMs: 1500, cooldownMs: [3000, 4500], reach: 4, maxSlaps: 1 },
  },
  {
    name: 'Quán bún chả',
    theme: 'day',
    targetScore: 150,
    flyStart: { x: 0, z: 3.4 },
    tables: [
      {
        x: 0,
        z: 0,
        w: 4.6,
        d: 2.4,
        foods: [
          { type: 'pho', dx: -1.6, dz: 0.1 },
          { type: 'bun', dx: -0.5, dz: -0.55 },
          { type: 'com', dx: 0.6, dz: -0.5 },
          { type: 'bun', dx: 0.3, dz: 0.55 },
          { type: 'pho', dx: 1.6, dz: 0.2 },
        ],
      },
    ],
    npcs: [
      { x: -1.0, z: -1.7 },
      { x: 1.1, z: -1.7 },
    ],
    danger: { windupMs: 1300, cooldownMs: [2600, 4000], reach: 4.2, maxSlaps: 1 },
  },
  {
    name: 'Phố ẩm thực',
    theme: 'day',
    targetScore: 220,
    flyStart: { x: 0, z: 3.4 },
    tables: [
      {
        x: -3.4,
        z: 0,
        w: 3.0,
        d: 1.9,
        foods: [
          { type: 'pho', dx: -0.8, dz: 0.1 },
          { type: 'com', dx: 0.6, dz: -0.4 },
          { type: 'bun', dx: 0.5, dz: 0.45 },
        ],
      },
      {
        x: 3.4,
        z: 0,
        w: 3.0,
        d: 1.9,
        foods: [
          { type: 'bun', dx: -0.8, dz: 0.1 },
          { type: 'pho', dx: 0.6, dz: -0.4 },
          { type: 'com', dx: 0.5, dz: 0.45 },
        ],
      },
    ],
    npcs: [
      { x: -3.0, z: -1.45 },
      { x: 3.0, z: -1.45 },
      { x: 5.4, z: 0 },
    ],
    danger: { windupMs: 1150, cooldownMs: [2300, 3600], reach: 4.2, maxSlaps: 2 },
  },
  {
    name: 'Quán đông khách',
    theme: 'day',
    targetScore: 300,
    flyStart: { x: 0, z: 3.8 },
    tables: [
      {
        x: -4.2,
        z: -1.4,
        w: 2.8,
        d: 1.6,
        foods: [
          { type: 'pho', dx: -0.6, dz: 0 },
          { type: 'che', dx: 0.6, dz: 0.1 },
        ],
      },
      {
        x: 4.2,
        z: -1.4,
        w: 2.8,
        d: 1.6,
        foods: [
          { type: 'bun', dx: -0.6, dz: 0 },
          { type: 'com', dx: 0.6, dz: 0.1 },
        ],
      },
      {
        x: 0,
        z: 1.5,
        w: 3.2,
        d: 1.8,
        foods: [
          { type: 'pho', dx: -0.95, dz: 0 },
          { type: 'bun', dx: 0.1, dz: -0.4 },
          { type: 'che', dx: 0.95, dz: 0.2 },
          { type: 'com', dx: 0, dz: 0.5 },
        ],
      },
    ],
    npcs: [
      { x: -3.8, z: -2.7 },
      { x: 3.8, z: -2.7 },
      { x: -0.7, z: 0.15 },
      { x: 0.8, z: 0.15 },
    ],
    danger: { windupMs: 1000, cooldownMs: [2000, 3200], reach: 4.4, maxSlaps: 2 },
  },
  {
    name: 'Chợ đêm',
    theme: 'night',
    targetScore: 380,
    flyStart: { x: 0, z: 3.9 },
    tables: [
      {
        x: -4.6,
        z: 0.3,
        w: 2.6,
        d: 1.6,
        foods: [
          { type: 'pho', dx: -0.6, dz: 0 },
          { type: 'che', dx: 0.6, dz: 0.1 },
        ],
      },
      {
        x: 0,
        z: -1.6,
        w: 3.0,
        d: 1.7,
        foods: [
          { type: 'bun', dx: -0.8, dz: 0 },
          { type: 'pho', dx: 0.6, dz: -0.3 },
          { type: 'com', dx: 0.35, dz: 0.45 },
        ],
      },
      {
        x: 4.6,
        z: 0.3,
        w: 2.6,
        d: 1.6,
        foods: [
          { type: 'com', dx: -0.6, dz: 0 },
          { type: 'bun', dx: 0.6, dz: 0.1 },
        ],
      },
      {
        x: 0,
        z: 1.9,
        w: 2.6,
        d: 1.5,
        foods: [
          { type: 'che', dx: -0.6, dz: 0 },
          { type: 'pho', dx: 0.6, dz: 0.1 },
        ],
      },
    ],
    npcs: [
      { x: -4.2, z: -0.95 },
      { x: 0.4, z: -2.95 },
      { x: 4.2, z: -0.95 },
      { x: -0.5, z: 0.65 },
      { x: 0.6, z: 0.65 },
    ],
    danger: { windupMs: 900, cooldownMs: [1800, 3000], reach: 4.4, maxSlaps: 3 },
  },
];
