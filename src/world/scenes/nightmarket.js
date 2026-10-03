import * as THREE from 'three';
import { rng, range, pick, mat, mesh } from '../lowpoly.js';
import { table, person, dish, pickArchetype } from '../models.js';
import { alleyHouse, foodCart, marketStall, stringLights, nightGlow, SignAtlas, motorbike, animateSteam, coconutPalm } from '../kit.js';
import { bakeStatic } from '../bake.js';
import { streetGround, traffic, FACADE_Z } from './street.js';

const STALL_SIGNS = [
  ['CHÈ THÁI', 'Sầu riêng - Mít'],
  ['TRÀ SỮA', 'Trân châu đường đen'],
  ['BẮP XÀO', 'Bơ - Tép - Hành'],
  ['QUẦN ÁO', 'Đồng giá 50K'],
  ['ĐỒ CHƠI', 'Cho bé'],
  ['KEM BƠ', 'Đà Lạt'],
  ['NƯỚC MÍA', 'Tắc - Sầu riêng'],
  ['PHỤ KIỆN', 'Ốp lưng - Sạc'],
  ['TRÁI CÂY', 'Dĩa 20K'],
  ['GỎI CUỐN', 'Bì cuốn - Bò bía'],
];
const SIGN_COLOURS = [
  { bg: '#fff3c4', fg: '#c8102e', band: '#c8102e' },
  { bg: '#ffffff', fg: '#1f4e9c', band: '#e2483d' },
  { bg: '#ffe0f0', fg: '#b0186a', band: '#b0186a' },
  { bg: '#e0fff4', fg: '#13795b', band: '#f2a12a' },
  { bg: '#e8f0ff', fg: '#3b2fa0', band: '#ffd200' },
];

const STALL_Z = FACADE_Z + 0.85; // centre of the row of stalls behind the tables
const LIGHT_Y = 4.3; // where the string lights hang from

// A table of diners eating, outside the play area. They are part of the
// static scenery, so they do not move.
function crowdTable(rand, statics, x, z, dishes) {
  const w = 1.6;
  const d = 1.0;
  const t = table(w, d, 0.62);
  t.position.set(x, 0.04, z);
  statics.add(t);
  for (const [i, id] of dishes.entries()) {
    const m = dish(id, rand);
    m.position.set(x - 0.4 + i * 0.8, 0.66, z + range(rand, -0.15, 0.15));
    statics.add(m);
  }
  const seats = [
    [x - 0.45, z - d / 2 - 0.45],
    [x + 0.45, z - d / 2 - 0.45],
    [x - w / 2 - 0.45, z],
    [x + w / 2 + 0.45, z],
    [x + 0.3, z + d / 2 + 0.45],
  ];
  for (const [sx, sz] of seats) {
    if (rand() < 0.2) continue;
    const p = person(rand, pickArchetype(rand, { south: true }));
    p.position.set(sx, 0.04, sz);
    const cx = Math.min(x + w / 2, Math.max(x - w / 2, sx));
    const cz = Math.min(z + d / 2, Math.max(z - d / 2, sz));
    p.rotation.y = Math.atan2(cx - sx, cz - sz);
    statics.add(p);
  }
}

// Bếp than for bánh tráng nướng: a clay stove of glowing charcoal with a
// grill and rice papers toasting on it.
function grill(rand) {
  const g = new THREE.Group();
  const stove = mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.5, 10), mat('#b06a3a'));
  stove.position.y = 0.25;
  g.add(stove);
  const coals = mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.04, 10), mat('#ff6a2a', { emissive: '#ff4a10', emissiveIntensity: 1.4 }), { cast: false });
  coals.position.y = 0.5;
  g.add(coals);
  for (let i = -3; i <= 3; i++) {
    const bar = mesh(new THREE.BoxGeometry(0.015, 0.015, 0.56), mat('#3b3b3f'), { cast: false });
    bar.position.set(i * 0.08, 0.54, 0);
    g.add(bar);
  }
  for (const [x, z] of [
    [-0.1, -0.08],
    [0.12, 0.1],
  ]) {
    const paper = mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.01, 12), mat('#f0d9a0'), { cast: false });
    paper.position.set(x, 0.555, z);
    g.add(paper);
    const egg = mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.01, 10), mat('#f2a72e'), { cast: false });
    egg.position.set(x, 0.562, z);
    g.add(egg);
  }
  const stool = mesh(new THREE.BoxGeometry(0.35, 0.3, 0.35), mat('#2f6fdf'));
  stool.position.set(0, 0.15, -0.55);
  g.add(stool);
  return g;
}

// Sài Gòn night market: a row of stalls under coloured tarps with lit
// plastic signs, food carts and a charcoal grill, strings of bulbs criss-
// crossing over the tables, crowded tables of diners on either side, and
// houses with their windows lit behind.
export function buildNightMarket() {
  const rand = rng(5050);
  const statics = new THREE.Group();
  statics.add(streetGround({ tiles: ['#8f8a82', '#857f77', '#99938a', '#8a847b'], line: '#6a655e' }));
  const atlas = new SignAtlas({ glow: true });
  const glow = nightGlow();

  // Houses behind the market, most windows lit.
  let x = -36;
  while (x < 36) {
    const width = range(rand, 3.6, 5);
    const house = alleyHouse(rand, { width, floors: 3 + Math.floor(rand() * 2), lit: 0.6, shutterDown: 2.4 });
    house.position.set(x + width / 2, 0, FACADE_Z - 1.4);
    statics.add(house);
    x += width;
  }
  x = -38;
  while (x < 38) {
    const width = range(rand, 4.5, 6.5);
    const house = alleyHouse(rand, { width, floors: 5 + Math.floor(rand() * 2), roof: 'flat', lit: 0.45 });
    house.position.set(x + width / 2, 0, FACADE_Z - 9);
    statics.add(house);
    x += width;
  }

  // The row of stalls, with two food carts and the grill in the middle.
  const carts = [
    { x: -3.3, label: 'BÁNH TRÁNG NƯỚNG', pot: false, grill: true },
    { x: 3.3, label: 'ỐC LEN XÀO DỪA', pot: true },
  ];
  const steamFrom = [];
  for (const c of carts) {
    const cart = foodCart(rand, { label: c.label, atlas, colours: { bg: '#fff3c4', fg: '#c8102e' }, pot: c.pot });
    cart.position.set(c.x, 0.04, STALL_Z);
    statics.add(cart);
    if (c.pot) steamFrom.push(cart);
    if (c.grill) {
      const gr = grill(rand);
      gr.position.set(c.x + 1.55, 0.04, STALL_Z + 0.1);
      statics.add(gr);
    }
  }
  x = -17;
  let signIndex = Math.floor(rand() * STALL_SIGNS.length);
  while (x < 17) {
    const width = range(rand, 2.3, 2.9);
    const centre = x + width / 2;
    x += width + 0.25;
    if (carts.some((c) => Math.abs(c.x - centre) < 2.2)) continue;
    const [name, sub] = STALL_SIGNS[signIndex++ % STALL_SIGNS.length];
    const stall = marketStall(rand, { width, sign: name, signColours: { ...pick(rand, SIGN_COLOURS), sub }, atlas, glow });
    stall.position.set(centre, 0.04, STALL_Z);
    statics.add(stall);
  }

  // Crowded tables on both sides of the play area.
  const SIDE_DISHES = [
    ['lau', 'xien-que'],
    ['oc-xao', 'che'],
    ['banh-trang-nuong', 'oc-xao'],
    ['che', 'lau'],
  ];
  let k = 0;
  for (const side of [-1, 1]) {
    for (const z of [-1.6, 2.2]) {
      crowdTable(rand, statics, side * 10.4, z, SIDE_DISHES[k++ % SIDE_DISHES.length]);
    }
  }
  // A xiên que cart at the corner by the road, and parked bikes.
  const corner = foodCart(rand, { label: 'XIÊN QUE CHIÊN', atlas, colours: { bg: '#ffe0f0', fg: '#b0186a' }, pot: false });
  corner.position.set(-12.6, 0.04, 4.4);
  statics.add(corner);
  for (let bx = 9; bx < 16; bx += range(rand, 0.65, 0.85)) {
    const bike = motorbike(rand);
    bike.position.set(bx, 0.04, 4.5);
    bike.rotation.y = range(rand, -0.2, 0.2);
    statics.add(bike);
  }
  for (const [px, ry] of [
    [-15.5, 0.4],
    [15.8, 2.2],
  ]) {
    const palm = coconutPalm(rand);
    palm.position.set(px, 0.04, FACADE_Z + 1.9);
    palm.rotation.y = ry;
    statics.add(palm);
  }

  // Poles for the string lights: along the stall row and at the curb.
  const steel = mat('#5b6066', { roughness: 0.4 });
  const back = [-8.4, -2.8, 2.8, 8.4].map((px) => new THREE.Vector3(px, LIGHT_Y, FACADE_Z + 2.2));
  const front = [-8.4, -2.8, 2.8, 8.4].map((px) => new THREE.Vector3(px, LIGHT_Y - 0.3, 5.0));
  for (const p of [...back, ...front]) {
    const pole = mesh(new THREE.CylinderGeometry(0.04, 0.05, p.y + 0.2, 6), steel);
    pole.position.set(p.x, (p.y + 0.2) / 2, p.z);
    statics.add(pole);
  }
  const strand = (a, b, opts) => statics.add(stringLights(a, b, glow, opts));
  for (let i = 0; i < back.length - 1; i++) {
    strand(back[i], back[i + 1], { sag: 0.35, offset: i });
    strand(front[i], front[i + 1], { sag: 0.35, offset: i + 2 });
  }
  // Criss-crossing over the tables.
  for (let i = 0; i < back.length; i++) {
    strand(back[i], front[back.length - 1 - i], { sag: 0.9, offset: i });
    if (i < back.length - 1) strand(back[i], front[i + 1], { sag: 0.8, offset: i + 1 });
  }
  // Out along the stalls beyond the play area.
  strand(back[0], new THREE.Vector3(-17, LIGHT_Y - 0.4, FACADE_Z + 2.2), { sag: 0.5 });
  strand(back.at(-1), new THREE.Vector3(17, LIGHT_Y - 0.4, FACADE_Z + 2.2), { sag: 0.5, offset: 1 });

  const steamHolders = steamFrom.map((cart) => {
    const h = new THREE.Group();
    h.position.copy(cart.position).add(cart.userData.potAt);
    for (const puff of cart.userData.steam) h.add(puff);
    return h;
  });

  // Warm light pooling under the bulbs: only a few lights, the bulbs and
  // signs themselves just glow.
  const lights = [
    [-4.5, -0.6],
    [4.5, -0.6],
    [0, 2.6],
  ].map(([lx, lz]) => {
    const light = new THREE.PointLight('#ffc98a', 16, 12, 1.6);
    light.position.set(lx, 3.6, lz);
    return light;
  });

  const root = bakeStatic(statics);
  const road = traffic(rand, (r) => motorbike(r, { rider: true }), 5);
  root.add(road.group, ...steamHolders, ...lights);

  return {
    root,
    update(timeMs, dt) {
      road.update(dt);
      for (const cart of steamFrom) animateSteam(cart.userData.steam, timeMs);
      // Bulbs of each colour pulse gently, out of step with each other.
      glow.bulbs.forEach((m, i) => {
        m.emissiveIntensity = 1.9 + 0.5 * Math.sin(timeMs * 0.003 + i * 1.7);
      });
    },
  };
}
