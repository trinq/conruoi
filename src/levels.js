// Level layouts. Table positions are ground-plane centres; food offsets are
// relative to their table's centre and must stay inside its footprint.
export const LEVELS = [
  {
    targetScore: 100,
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
  },
];
