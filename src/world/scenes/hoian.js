import * as THREE from 'three';
import { rng, range, pick, mat, mesh } from '../lowpoly.js';
import { stool } from '../models.js';
import { oldTownHouse, bougainvillea, motorbike, brothStation, animateSteam, quangGanh, coconutPalm } from '../kit.js';
import { bakeStatic } from '../bake.js';
import { streetGround, traffic, FACADE_Z } from './street.js';

const SIGNS = ['MÌ QUẢNG', 'BÁNH MÌ', 'CHÈ', 'MAY ĐO', 'CÀ PHÊ', 'TRANH', 'GỐM'];
const SIGN_COLOURS = [
  { bg: '#3b2414', fg: '#f2c14e' },
  { bg: '#c8102e', fg: '#ffd200' },
  { bg: '#2c3a2a', fg: '#f4e3b0' },
];
const YELLOWS = ['#e8b931', '#f0c341', '#e3a92b', '#efcf6a', '#e9b53c'];
const WOODS = ['#5b3a22', '#4a2f1c', '#2f5f5a'];
const SILK = ['#e0312b', '#f2b134', '#f07a24', '#d6336c', '#7b3fa0', '#3f9b4a', '#2f6fb5'];

// Lanterns light up in this many groups, left to right.
const BATCHES = 4;
const UNLIT = 0.03;
const LIT = 2.4;
const FIRST_LIGHT_MS = 700;
const BATCH_GAP_MS = 550;
const RAMP_MS = 700;

// Silk lanterns share one glowing material per colour and batch, so a
// whole batch lights up together and the street still costs few draw calls.
function lanternKit() {
  const materials = new Map();
  const silk = (colour, batch) => {
    const key = `${colour}|${batch}`;
    if (!materials.has(key)) {
      materials.set(
        key,
        new THREE.MeshStandardMaterial({ color: colour, emissive: colour, emissiveIntensity: UNLIT, flatShading: true, roughness: 0.6 }),
      );
    }
    return materials.get(key);
  };
  const gold = mat('#c9962e');
  const tassel = mat('#b8261a');
  const cord = mat('#2a2018');

  // Đèn lồng Hội An: a ribbed silk body between wooden caps, a tassel below
  // and a cord of `drop` metres above, hanging from y = 0.
  function lantern(rand, batch, { drop = 0.3, size = 1 } = {}) {
    const g = new THREE.Group();
    const line = mesh(new THREE.BoxGeometry(0.015, drop, 0.015), cord, { cast: false });
    line.position.y = -drop / 2;
    g.add(line);
    const y = -drop - 0.26 * size;
    const body = mesh(new THREE.IcosahedronGeometry(0.22 * size, 1), silk(pick(rand, SILK), batch), { cast: false });
    body.scale.y = 1.15;
    body.position.y = y;
    g.add(body);
    for (const dy of [0.25, -0.25]) {
      const cap = mesh(new THREE.CylinderGeometry(0.09 * size, 0.11 * size, 0.06, 8), gold, { cast: false });
      cap.position.y = y + dy * size;
      g.add(cap);
    }
    const t = mesh(new THREE.BoxGeometry(0.04, 0.22 * size, 0.04), tassel, { cast: false });
    t.position.y = y - 0.38 * size;
    g.add(t);
    return g;
  }
  return { lantern, materials };
}

const batchOf = (x) => THREE.MathUtils.clamp(Math.floor((x + 16) / 9), 0, BATCHES - 1);

// A cord sagging between two points with lanterns hanging from it.
function lanternString(rand, kit, from, to, spacing = 0.9) {
  const g = new THREE.Group();
  const len = from.distanceTo(to);
  const n = Math.max(2, Math.round(len / spacing));
  const at = (t) => from.clone().lerp(to, t).setY(THREE.MathUtils.lerp(from.y, to.y, t) - Math.sin(t * Math.PI) * 0.45);
  for (let i = 0; i < n; i++) {
    const a = at(i / n);
    const b = at((i + 1) / n);
    const seg = mesh(new THREE.BoxGeometry(0.015, 0.015, a.distanceTo(b)), mat('#2a2018'), { cast: false });
    seg.position.copy(a).lerp(b, 0.5);
    seg.lookAt(b);
    g.add(seg);
    if (i > 0) {
      const l = kit.lantern(rand, batchOf(a.x), { drop: range(rand, 0.05, 0.2) });
      l.position.copy(a);
      g.add(l);
    }
  }
  return g;
}

// Hội An old town at sunset: two-storey yellow houses with tiled roofs,
// wooden shopfronts and bougainvillea spilling down the walls, strings of
// silk lanterns that light up one stretch after another as the level
// starts, and a lantern shop hung with dozens more.
export function buildHoian() {
  const rand = rng(3030);
  const statics = new THREE.Group();
  statics.add(streetGround({ tiles: ['#a8968a', '#9e8c7f', '#b19f92', '#a39083'], line: '#7d6c60' }));
  const kit = lanternKit();

  // Front row; the cao lầu shop sits behind the tables, the lantern shop
  // to its right.
  const fronts = [];
  let x = -32;
  while (x < 32) {
    const width = range(rand, 4.4, 6);
    const centre = x + width / 2;
    let role = null;
    if (!fronts.some((f) => f.role === 'caolau') && centre > -4) role = 'caolau';
    else if (fronts.at(-1)?.role === 'caolau') role = 'lanterns';
    const sign = { caolau: 'CAO LẦU', lanterns: 'ĐÈN LỒNG' }[role] ?? (rand() < 0.55 ? pick(rand, SIGNS) : null);
    const signColours = role === 'caolau' ? SIGN_COLOURS[0] : pick(rand, SIGN_COLOURS);
    const house = oldTownHouse(rand, {
      width,
      depth: 7,
      floors: 2,
      wall: pick(rand, YELLOWS),
      wood: pick(rand, WOODS),
      tile: pick(rand, ['#6e5446', '#7a5646', '#654a3c']),
      moss: range(rand, 0.3, 0.8),
      sign,
      signColours,
    });
    house.position.set(centre, 0, FACADE_Z);
    statics.add(house);
    fronts.push({ centre, width, role });
    x += width;
  }
  // Second row behind, so roofs fill the top of the view.
  x = -34;
  while (x < 34) {
    const width = range(rand, 5, 7);
    const house = oldTownHouse(rand, { width, depth: 6, floors: 3, wall: pick(rand, YELLOWS), moss: range(rand, 0.4, 1) });
    house.position.set(x + width / 2, 0, FACADE_Z - 7.5);
    statics.add(house);
    x += width;
  }

  // Bougainvillea spilling from the top of some walls.
  for (const f of fronts) {
    if (f.role === 'lanterns' || rand() < 0.45) continue;
    const b = bougainvillea(rand, { width: range(rand, 1.4, 2.4), drop: range(rand, 1.6, 2.8) });
    b.position.set(f.centre + (rand() < 0.5 ? -1 : 1) * (f.width / 2 - 1.1), 5.5, FACADE_Z + 0.15);
    statics.add(b);
  }

  // Lantern strings in front of the shops, anchored to brackets on the walls.
  const anchors = [];
  for (let ax = -26; ax <= 26; ax += range(rand, 4, 5.5)) anchors.push(new THREE.Vector3(ax, 5.6, FACADE_Z + 1.3));
  for (const a of anchors) {
    const bracket = mesh(new THREE.BoxGeometry(0.08, 0.08, 1.3), mat('#3b2618'));
    bracket.position.set(a.x, a.y, FACADE_Z + 0.65);
    statics.add(bracket);
  }
  for (let i = 0; i < anchors.length - 1; i++) statics.add(lanternString(rand, kit, anchors[i], anchors[i + 1]));
  // The lantern shop: rows of lanterns hung across its front.
  const shop = fronts.find((f) => f.role === 'lanterns');
  if (shop) {
    for (let row = 0; row < 3; row++) {
      for (let lx = -shop.width / 2 + 0.5; lx <= shop.width / 2 - 0.5; lx += 0.55) {
        const l = kit.lantern(rand, batchOf(shop.centre), { drop: 0.05, size: range(rand, 0.6, 0.85) });
        l.position.set(shop.centre + lx + (row % 2) * 0.25, 2.75 - row * 0.62, FACADE_Z + 0.55 + row * 0.12);
        statics.add(l);
      }
    }
  }

  const caolau = fronts.find((f) => f.role === 'caolau');
  const kitchen = brothStation(rand);
  kitchen.position.set((caolau?.centre ?? -2) - 0.8, 0.04, FACADE_Z + 1.0);
  statics.add(kitchen);
  for (let i = 0; i < 3; i++) {
    const s = stool(i % 2 ? '#2f6fdf' : '#e2483d');
    s.position.set((caolau?.centre ?? -2) - 2.6, 0.04 + i * 0.12, FACADE_Z + 0.8);
    statics.add(s);
  }

  for (const bx of [-13.2, -11.9, 11.6, 12.9]) {
    const bike = motorbike(rand);
    bike.position.set(bx, 0.04, FACADE_Z + 1.1);
    bike.rotation.y = Math.PI / 2 + range(rand, -0.25, 0.25);
    statics.add(bike);
  }
  for (const [px, pz, ry] of [
    [-9.6, FACADE_Z + 1.6, 0],
    [15.5, FACADE_Z + 1.5, 2.2],
  ]) {
    const palm = coconutPalm(rand);
    palm.position.set(px, 0.04, pz);
    palm.rotation.y = ry;
    statics.add(palm);
  }
  // Quang gánh vendors resting on the pavement.
  for (const [vx, vz, ry] of [
    [-8.6, 4.0, 0.5],
    [8.8, 3.6, -0.3],
  ]) {
    const v = quangGanh(rand);
    v.position.set(vx, 0.04, vz);
    v.rotation.y = ry;
    statics.add(v);
  }

  const steamHolder = new THREE.Group();
  steamHolder.position.copy(kitchen.position);
  for (const puff of kitchen.userData.steam) steamHolder.add(puff);

  // Warm light pooling under the lanterns once they are lit.
  const lights = [-7, 0, 7].map((lx) => {
    const light = new THREE.PointLight('#ffb05a', 0, 10, 1.6);
    light.position.set(lx, 3.2, FACADE_Z + 1.8);
    return light;
  });

  const root = bakeStatic(statics);
  const road = traffic(rand, (r) => motorbike(r, { rider: true }), 4);
  root.add(road.group, steamHolder, ...lights);

  let litFrom = null;
  return {
    root,
    // Every time the level starts the lanterns come on again, one stretch
    // of street after another.
    show() {
      litFrom = null;
    },
    update(timeMs, dt) {
      road.update(dt);
      animateSteam(kitchen.userData.steam, timeMs);
      litFrom ??= timeMs;
      const since = timeMs - litFrom;
      let total = 0;
      for (const [key, m] of kit.materials) {
        const batch = Number(key.split('|')[1]);
        const on = THREE.MathUtils.clamp((since - FIRST_LIGHT_MS - batch * BATCH_GAP_MS) / RAMP_MS, 0, 1);
        const flicker = 1 + 0.06 * Math.sin(timeMs * 0.011 + batch * 1.7) * on;
        m.emissiveIntensity = (UNLIT + (LIT - UNLIT) * on) * flicker;
        total += on;
      }
      const glow = total / kit.materials.size;
      for (const [i, l] of lights.entries()) l.intensity = glow * 14 * (1 + 0.05 * Math.sin(timeMs * 0.013 + i));
    },
  };
}
