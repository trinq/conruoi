// Level layouts, easiest first. Run `npm run check:levels` after editing.
//
// - Table positions are ground-plane centres; a table's footprint is a
//   diamond `halfWidth` wide and `halfWidth / 2` deep.
// - Food offsets are relative to their table's centre and must stay inside
//   its footprint. Types: pho, bun, com, che (bonus).
// - Diners (npcs) are ground positions of their feet; they sit just behind a
//   table, outside every footprint.
// - danger.windupMs: warning time before a slap lands.
//   danger.cooldownMs: [min, max] pause between slaps, per diner.
//   danger.reach: how close the fly must be for a diner to slap at it.
//   danger.maxSlaps: how many diners may be winding up / slapping at once.
export const LEVELS = [
  {
    name: 'Quán phở đầu ngõ',
    theme: 'day',
    targetScore: 80,
    flyStart: { x: 480, y: 470 },
    tables: [
      {
        x: 480,
        y: 290,
        halfWidth: 170,
        foods: [
          { type: 'pho', dx: -70, dy: 0 },
          { type: 'bun', dx: 40, dy: -25 },
          { type: 'com', dx: 45, dy: 28 },
        ],
      },
    ],
    npcs: [{ x: 600, y: 222 }],
    danger: { windupMs: 1500, cooldownMs: [3000, 4500], reach: 280, maxSlaps: 1 },
  },
  {
    name: 'Quán bún chả',
    theme: 'day',
    targetScore: 150,
    flyStart: { x: 480, y: 480 },
    tables: [
      {
        x: 480,
        y: 300,
        halfWidth: 230,
        foods: [
          { type: 'pho', dx: -110, dy: 0 },
          { type: 'bun', dx: -30, dy: -45 },
          { type: 'com', dx: 60, dy: -30 },
          { type: 'bun', dx: 30, dy: 40 },
          { type: 'pho', dx: 120, dy: 10 },
        ],
      },
    ],
    npcs: [
      { x: 360, y: 215 },
      { x: 610, y: 225 },
    ],
    danger: { windupMs: 1300, cooldownMs: [2600, 4000], reach: 300, maxSlaps: 1 },
  },
  {
    name: 'Phố ẩm thực',
    theme: 'day',
    targetScore: 220,
    flyStart: { x: 480, y: 470 },
    tables: [
      {
        x: 270,
        y: 300,
        halfWidth: 150,
        foods: [
          { type: 'pho', dx: -50, dy: 0 },
          { type: 'com', dx: 40, dy: -20 },
          { type: 'bun', dx: 30, dy: 25 },
        ],
      },
      {
        x: 690,
        y: 300,
        halfWidth: 150,
        foods: [
          { type: 'bun', dx: -50, dy: 0 },
          { type: 'pho', dx: 40, dy: -20 },
          { type: 'com', dx: 30, dy: 25 },
        ],
      },
    ],
    npcs: [
      { x: 310, y: 222 },
      { x: 650, y: 222 },
      { x: 780, y: 250 },
    ],
    danger: { windupMs: 1150, cooldownMs: [2300, 3600], reach: 300, maxSlaps: 2 },
  },
  {
    name: 'Quán đông khách',
    theme: 'day',
    targetScore: 300,
    flyStart: { x: 480, y: 505 },
    tables: [
      {
        x: 220,
        y: 250,
        halfWidth: 130,
        foods: [
          { type: 'pho', dx: -40, dy: 0 },
          { type: 'che', dx: 40, dy: 5 },
        ],
      },
      {
        x: 740,
        y: 250,
        halfWidth: 130,
        foods: [
          { type: 'bun', dx: -40, dy: 0 },
          { type: 'com', dx: 40, dy: 5 },
        ],
      },
      {
        x: 480,
        y: 400,
        halfWidth: 150,
        foods: [
          { type: 'pho', dx: -60, dy: 0 },
          { type: 'bun', dx: 10, dy: -25 },
          { type: 'che', dx: 60, dy: 15 },
          { type: 'com', dx: 0, dy: 30 },
        ],
      },
    ],
    npcs: [
      { x: 250, y: 180 },
      { x: 710, y: 180 },
      { x: 420, y: 322 },
      { x: 520, y: 318 },
    ],
    danger: { windupMs: 1000, cooldownMs: [2000, 3200], reach: 320, maxSlaps: 2 },
  },
  {
    name: 'Chợ đêm',
    theme: 'night',
    targetScore: 380,
    flyStart: { x: 480, y: 505 },
    tables: [
      {
        x: 200,
        y: 300,
        halfWidth: 120,
        foods: [
          { type: 'pho', dx: -35, dy: 0 },
          { type: 'che', dx: 35, dy: 5 },
        ],
      },
      {
        x: 480,
        y: 230,
        halfWidth: 130,
        foods: [
          { type: 'bun', dx: -45, dy: 0 },
          { type: 'pho', dx: 40, dy: -10 },
          { type: 'com', dx: 20, dy: 30 },
        ],
      },
      {
        x: 760,
        y: 300,
        halfWidth: 120,
        foods: [
          { type: 'com', dx: -35, dy: 0 },
          { type: 'bun', dx: 35, dy: 5 },
        ],
      },
      {
        x: 480,
        y: 420,
        halfWidth: 120,
        foods: [
          { type: 'che', dx: -35, dy: 0 },
          { type: 'pho', dx: 35, dy: 5 },
        ],
      },
    ],
    npcs: [
      { x: 230, y: 232 },
      { x: 510, y: 160 },
      { x: 730, y: 232 },
      { x: 450, y: 352 },
      { x: 520, y: 354 },
    ],
    danger: { windupMs: 900, cooldownMs: [1800, 3000], reach: 320, maxSlaps: 3 },
  },
];
