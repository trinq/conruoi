// Sanity checks for src/levels.js: regions and dishes, weapon schedule,
// layout geometry and difficulty curve.
import { LEVELS } from '../src/levels.js';
import { REGIONS, dishFor } from '../src/regions.js';
import { DISHES } from '../src/game/dishes.js';
import { PAVING as AREA } from '../src/world/area.js';

const FOOD_MARGIN = 0.3; // dishes keep this far from a table edge (m)
const NPC_GAP = 0.25; // a diner's stool must be at least this far from any table
const NPC_MAX_GAP = 1.2; // ...and no further than this from the table they face
const MIN_FOOD_SPACING = 0.55; // dishes on a table must not overlap
const TIMES = ['morning', 'noon', 'sunset', 'afternoon', 'night'];
const WEAPONS = ['hand', 'fan', 'swatter'];
// Earliest level (1-based) each weapon may appear in.
const WEAPON_FROM = { hand: 1, fan: 3, swatter: 4 };
const ROUTE = ['hanoi', 'hue', 'hoian', 'saigon', 'nightmarket'];

const errors = [];
const fail = (level, msg) => errors.push(`Level ${level + 1}: ${msg}`);

const distToTable = (t, x, z) => {
  const dx = Math.max(Math.abs(x - t.x) - t.w / 2, 0);
  const dz = Math.max(Math.abs(z - t.z) - t.d / 2, 0);
  return Math.hypot(dx, dz);
};
const inArea = (x, z, pad = 0) => x >= AREA.minX + pad && x <= AREA.maxX - pad && z >= AREA.minZ + pad && z <= AREA.maxZ - pad;

LEVELS.forEach((level, li) => {
  const { tables, npcs, danger } = level;
  for (const key of ['region', 'timeOfDay', 'weapons', 'targetScore', 'flyStart', 'tables', 'npcs', 'danger']) {
    if (level[key] === undefined) fail(li, `missing ${key}`);
  }

  // Region, lighting and weapons.
  const region = REGIONS[level.region];
  if (!region) fail(li, `unknown region ${level.region}`);
  if (level.region !== ROUTE[li]) fail(li, `region should be ${ROUTE[li]} to follow the route north to south`);
  if (!TIMES.includes(level.timeOfDay)) fail(li, `unknown timeOfDay ${level.timeOfDay}`);
  if (!level.weapons?.length) fail(li, 'needs at least one weapon');
  for (const w of level.weapons ?? []) {
    if (!WEAPONS.includes(w)) fail(li, `unknown weapon ${w}`);
    else if (li + 1 < WEAPON_FROM[w]) fail(li, `${w} must not appear before level ${WEAPON_FROM[w]}`);
  }
  if (li === LEVELS.length - 1 && !WEAPONS.every((w) => level.weapons?.includes(w))) {
    fail(li, 'the last level mixes all three weapons');
  }

  // Dishes: the region serves one dish per tier, and the level puts each
  // tier on the tables; bonus dishes must belong to the region.
  if (region) {
    for (const tier of ['high', 'medium', 'low']) {
      const id = region.dishes[tier];
      if (!DISHES[id]) fail(li, `region ${level.region} serves unknown ${tier} dish ${id}`);
      else if (DISHES[id].tier !== tier) fail(li, `${id} is a ${DISHES[id].tier} dish, not ${tier}`);
    }
    for (const id of region.bonus) {
      if (DISHES[id]?.tier !== 'bonus') fail(li, `region bonus ${id} is not a bonus dish`);
    }
    const served = tables.flatMap((t) => t.foods);
    for (const tier of ['high', 'medium', 'low']) {
      if (!served.some((f) => f.tier === tier)) fail(li, `no ${tier} dish on the tables`);
    }
    for (const f of served) {
      if (f.bonus && !region.bonus.includes(f.bonus)) fail(li, `bonus ${f.bonus} is not served in ${level.region}`);
      if (!f.bonus && !['high', 'medium', 'low'].includes(f.tier)) fail(li, `food needs a tier or a bonus dish`);
      if (!DISHES[dishFor(level.region, f)]) fail(li, `food resolves to unknown dish`);
    }
  }

  tables.forEach((t, ti) => {
    if (!inArea(t.x - t.w / 2, t.z - t.d / 2, 0.3) || !inArea(t.x + t.w / 2, t.z + t.d / 2, 0.3)) {
      fail(li, `table ${ti} sticks out of the play area`);
    }
    const spots = [];
    t.foods.forEach((f, fi) => {
      if (Math.abs(f.dx) > t.w / 2 - FOOD_MARGIN || Math.abs(f.dz) > t.d / 2 - FOOD_MARGIN) {
        fail(li, `table ${ti} food ${fi} is too close to the edge`);
      }
      for (const s of spots) {
        if (Math.hypot(s.dx - f.dx, s.dz - f.dz) < MIN_FOOD_SPACING) fail(li, `table ${ti} food ${fi} overlaps another dish`);
      }
      spots.push(f);
    });
    tables.forEach((o, oi) => {
      if (oi <= ti) return;
      const gapX = Math.abs(t.x - o.x) - (t.w + o.w) / 2;
      const gapZ = Math.abs(t.z - o.z) - (t.d + o.d) / 2;
      if (gapX < 0.8 && gapZ < 0.8) fail(li, `tables ${ti} and ${oi} are too close to fly between`);
    });
  });

  npcs.forEach((n, ni) => {
    const gaps = tables.map((t) => distToTable(t, n.x, n.z));
    const nearest = Math.min(...gaps);
    if (nearest < NPC_GAP) fail(li, `npc ${ni} sits inside or on a table`);
    if (nearest > NPC_MAX_GAP) fail(li, `npc ${ni} is too far from any table`);
    if (!inArea(n.x, n.z)) fail(li, `npc ${ni} is outside the play area`);
    const foods = tables.flatMap((t) => t.foods.map((f) => ({ x: t.x + f.dx, z: t.z + f.dz })));
    if (!foods.some((f) => Math.hypot(f.x - n.x, f.z - n.z) <= danger.reach)) fail(li, `npc ${ni} cannot reach any food`);
  });

  const { x, z } = level.flyStart;
  if (!inArea(x, z, 0.4)) fail(li, 'fly starts outside the play area');
  if (tables.some((t) => distToTable(t, x, z) < 0.5)) fail(li, 'fly starts on or next to a table');
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
