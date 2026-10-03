// Level layouts. Table positions are ground-plane centres; food offsets are
// relative to their table's centre and must stay inside its footprint.
// Diners should sit outside every table footprint.
export const LEVELS = [
  {
    targetScore: 100,
    flyStart: { x: 480, y: 470 },
    // Diners sit behind the table; positions are their ground-plane feet.
    npcs: [{ x: 600, y: 222 }],
    danger: {
      windupMs: 1400, // warning time before the slap lands
      cooldownMs: [2500, 4000], // pause between slaps, per diner
      reach: 300, // how close the fly must be for a diner to slap at it
    },
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
  },
];
