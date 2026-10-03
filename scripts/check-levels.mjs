// Sanity checks for src/levels.js: layout geometry and difficulty curve.
import { LEVELS } from '../src/levels.js';
import { FOOD_TYPES } from '../src/food/foodTypes.js';

const WIDTH = 960;
const HEIGHT = 540;
const HUD_BOTTOM = 80; // keep tall things below the HUD row
const NPC_HEIGHT = 72;
const FOOD_MARGIN = 0.75; // dishes stay well inside the footprint (0..1)

const errors = [];
const fail = (level, msg) => errors.push(`Level ${level + 1}: ${msg}`);

const footprint = (t, x, y) => Math.abs(x - t.x) / t.halfWidth + Math.abs(y - t.y) / (t.halfWidth / 2);
const inside = (t, x, y, limit = 1) => footprint(t, x, y) <= limit;

LEVELS.forEach((level, li) => {
  const { tables, npcs, danger } = level;
  for (const key of ['name', 'targetScore', 'flyStart', 'tables', 'npcs', 'danger']) {
    if (level[key] === undefined) fail(li, `missing ${key}`);
  }

  tables.forEach((t, ti) => {
    const hd = t.halfWidth / 2;
    if (t.x - t.halfWidth < 0 || t.x + t.halfWidth > WIDTH || t.y + hd > HEIGHT || t.y - hd - 28 < HUD_BOTTOM) {
      fail(li, `table ${ti} is off screen or under the HUD`);
    }
    t.foods.forEach((f, fi) => {
      if (!FOOD_TYPES[f.type]) fail(li, `table ${ti} food ${fi}: unknown type ${f.type}`);
      if (!inside(t, t.x + f.dx, t.y + f.dy, FOOD_MARGIN)) fail(li, `table ${ti} food ${fi} is too close to the edge`);
    });
    // Tables must not overlap: sample this footprint against the others.
    tables.forEach((o, oi) => {
      if (oi <= ti) return;
      for (let sx = -1; sx <= 1; sx += 0.1) {
        for (let sy = -1; sy <= 1; sy += 0.1) {
          const x = t.x + sx * t.halfWidth;
          const y = t.y + sy * hd;
          if (inside(t, x, y) && inside(o, x, y)) {
            fail(li, `tables ${ti} and ${oi} overlap`);
            return;
          }
        }
      }
    });
  });

  npcs.forEach((n, ni) => {
    if (tables.some((t) => inside(t, n.x, n.y))) fail(li, `npc ${ni} stands inside a table`);
    if (n.y - NPC_HEIGHT < HUD_BOTTOM - 30) fail(li, `npc ${ni} pokes into the HUD`);
    const foods = tables.flatMap((t) => t.foods.map((f) => ({ x: t.x + f.dx, y: t.y + f.dy })));
    if (!foods.some((f) => Math.hypot(f.x - n.x, f.y - n.y) <= danger.reach)) {
      fail(li, `npc ${ni} cannot reach any food`);
    }
  });

  if (tables.some((t) => inside(t, level.flyStart.x, level.flyStart.y))) fail(li, 'fly starts inside a table');
  if (danger.maxSlaps > npcs.length) fail(li, 'maxSlaps exceeds the number of npcs');

  const prev = LEVELS[li - 1];
  if (prev) {
    if (level.targetScore <= prev.targetScore) fail(li, 'target score should increase');
    if (danger.windupMs > prev.danger.windupMs) fail(li, 'wind-up should not get slower');
    if (danger.cooldownMs[0] > prev.danger.cooldownMs[0]) fail(li, 'cooldown should not get longer');
    if (npcs.length < prev.npcs.length) fail(li, 'npc count should not drop');
  }
});

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`${LEVELS.length} levels OK`);
