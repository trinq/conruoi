import * as THREE from 'three';
import { rng, range, pick, mat, mesh } from '../lowpoly.js';
import { stool } from '../models.js';
import { oldTownHouse, motorbike, brothStation, animateSteam, quangGanh, phuongTree, bambooClump } from '../kit.js';
import { bakeStatic } from '../bake.js';
import { streetGround, traffic, FACADE_Z } from './street.js';

// The river opens up behind the play area between these x; old houses
// stand on the bank either side of it.
const GAP = { minX: -6.6, maxX: 8.4 };
const BANK_Z = -6.2; // edge of the stone embankment
const WATER_Y = -0.55;
const FAR_BANK_Z = -15;

const SIGNS = ['CƠM HẾN', 'BÁNH BÈO NẬM LỌC', 'CHÈ HẺM', 'NÓN BÀI THƠ', 'BÁNH ÉP', 'TRÀ', 'MÈ XỬNG'];
const SIGN_COLOURS = [
  { bg: '#c8102e', fg: '#ffd200' },
  { bg: '#ffd200', fg: '#8a1c12' },
  { bg: '#7a1f3d', fg: '#ffe8a8' },
];
const WALLS = ['#e8e1cc', '#e4d9bd', '#d9d3c2', '#efe0b0'];

// Houses side by side from x = from to x = to, facing the street.
function houseRow(rand, statics, from, to, z, signFirst) {
  let x = from;
  let first = true;
  while (x < to - 2) {
    const width = Math.min(range(rand, 4.4, 6.2), to - x);
    const sign = first && signFirst ? signFirst : rand() < 0.5 ? pick(rand, SIGNS) : null;
    const house = oldTownHouse(rand, {
      width,
      depth: 6,
      verandah: true,
      wall: pick(rand, WALLS),
      moss: range(rand, 0.5, 1),
      sign,
      signColours: first && signFirst ? SIGN_COLOURS[0] : pick(rand, SIGN_COLOURS),
    });
    house.position.set(x + width / 2, 0, z);
    statics.add(house);
    x += width;
    first = false;
  }
}

// Stone embankment with a low railing along the river, and steps down to
// the water where a boat is moored.
function embankment(rand, statics) {
  const stone = mat('#9a948a');
  const width = GAP.maxX - GAP.minX + 2;
  const centre = (GAP.minX + GAP.maxX) / 2;
  const wall = mesh(new THREE.BoxGeometry(width, -WATER_Y + 0.2, 0.4), stone);
  wall.position.set(centre, (WATER_Y - 0.2) / 2 + 0.04, BANK_Z - 0.2);
  statics.add(wall);
  const coping = mesh(new THREE.BoxGeometry(width, 0.12, 0.5), mat('#b5afa2'));
  coping.position.set(centre, 0.08, BANK_Z - 0.15);
  statics.add(coping);
  // Railing posts with gaps for the steps.
  const post = mat('#c9c3b5');
  for (let x = GAP.minX + 0.3; x < GAP.maxX; x += 1.1) {
    if (x > -1.2 && x < 1.4) continue;
    const p = mesh(new THREE.BoxGeometry(0.16, 0.6, 0.16), post);
    p.position.set(x, 0.34, BANK_Z - 0.15);
    statics.add(p);
  }
  for (const [a, b] of [
    [GAP.minX + 0.3, -1.3],
    [1.5, GAP.maxX],
  ]) {
    const rail = mesh(new THREE.BoxGeometry(b - a, 0.1, 0.12), post);
    rail.position.set((a + b) / 2, 0.6, BANK_Z - 0.15);
    statics.add(rail);
  }
  // Bến: steps going down into the river.
  for (let i = 0; i < 4; i++) {
    const step = mesh(new THREE.BoxGeometry(2.4, 0.16, 0.4), stone);
    step.position.set(0.1, -i * 0.16 - 0.04, BANK_Z - 0.6 - i * 0.4);
    statics.add(step);
  }
  // Land under the houses either side of the river opening.
  for (const [a, b] of [
    [-45, GAP.minX],
    [GAP.maxX, 45],
  ]) {
    const land = mesh(new THREE.BoxGeometry(b - a, -WATER_Y + 0.1, 8), stone);
    land.position.set((a + b) / 2, WATER_Y / 2 - 0.01, BANK_Z - 4);
    statics.add(land);
  }
}

// The far bank: grass, bamboo, phượng and a few low houses, with the
// seven-tiered Thiên Mụ pagoda tower rising above them.
function farBank(rand, statics) {
  const grass = mesh(new THREE.BoxGeometry(90, 0.7, 20), mat('#6f9e48'), { cast: false });
  grass.position.set(0, WATER_Y + 0.25, FAR_BANK_Z - 10);
  statics.add(grass);
  const edge = mesh(new THREE.BoxGeometry(90, 0.5, 0.6), mat('#8a7f62'), { cast: false });
  edge.position.set(0, WATER_Y + 0.15, FAR_BANK_Z);
  statics.add(edge);
  for (let i = 0; i < 9; i++) {
    const b = bambooClump(rand);
    b.position.set(range(rand, -30, 30), WATER_Y + 0.6, FAR_BANK_Z - range(rand, 1, 4));
    statics.add(b);
  }
  for (let i = 0; i < 5; i++) {
    const t = phuongTree(rand);
    t.position.set(-24 + i * 12 + range(rand, -3, 3), WATER_Y + 0.6, FAR_BANK_Z - range(rand, 3, 6));
    statics.add(t);
  }
  for (const hx of [-17, 12, 20]) {
    const house = oldTownHouse(rand, { width: 5, depth: 5, verandah: true, moss: 1 });
    house.position.set(hx, WATER_Y + 0.6, FAR_BANK_Z - 6);
    statics.add(house);
  }
  const tower = pagodaTower();
  tower.position.set(-5, WATER_Y + 0.6, FAR_BANK_Z - 8);
  statics.add(tower);
}

function pagodaTower() {
  const g = new THREE.Group();
  const brick = mat('#d9b48c');
  const eaveMat = mat('#6e5446');
  let y = 0;
  for (let i = 0; i < 7; i++) {
    const r = 1.5 - i * 0.15;
    const h = i === 0 ? 2 : 1.25;
    const body = mesh(new THREE.CylinderGeometry(r * 0.95, r, h, 8), brick);
    body.position.y = y + h / 2;
    g.add(body);
    const eave = mesh(new THREE.CylinderGeometry(r + 0.15, r + 0.35, 0.22, 8), eaveMat);
    eave.position.y = y + h + 0.1;
    g.add(eave);
    // A dark arched window on the side facing the river.
    const win = mesh(new THREE.BoxGeometry(0.4, h * 0.5, 0.1), mat('#3a2a22'), { cast: false });
    win.position.set(0, y + h * 0.5, r * 0.95);
    g.add(win);
    y += h + 0.22;
  }
  const spire = mesh(new THREE.ConeGeometry(0.2, 1.6, 6), mat('#c9a24a'));
  spire.position.y = y + 0.8;
  g.add(spire);
  return g;
}

// Thuyền rồng: the dragon boat that takes visitors up the Perfume River.
function dragonBoat() {
  const g = new THREE.Group();
  const red = mat('#b8302a');
  const gold = mat('#e2b23a');
  const green = mat('#2f8a4a');
  const hull = mesh(new THREE.BoxGeometry(5.2, 0.5, 1.3), red);
  hull.position.y = 0.15;
  g.add(hull);
  const stripe = mesh(new THREE.BoxGeometry(5.25, 0.1, 1.35), gold, { cast: false });
  stripe.position.y = 0.3;
  g.add(stripe);
  // Neck and head at the bow, tail at the stern.
  const neck = [
    [2.7, 0.55, 0.0],
    [3.0, 0.95, -0.4],
    [3.15, 1.4, -0.2],
  ];
  for (const [x, y, rz] of neck) {
    const seg = mesh(new THREE.BoxGeometry(0.5, 0.5, 0.45), green);
    seg.position.set(x, y, 0);
    seg.rotation.z = rz;
    g.add(seg);
  }
  const head = mesh(new THREE.BoxGeometry(0.75, 0.42, 0.5), gold);
  head.position.set(3.45, 1.7, 0);
  g.add(head);
  const jaw = mesh(new THREE.BoxGeometry(0.5, 0.12, 0.4), red);
  jaw.position.set(3.7, 1.45, 0);
  g.add(jaw);
  for (const z of [-0.15, 0.15]) {
    const horn = mesh(new THREE.ConeGeometry(0.06, 0.4, 4), gold);
    horn.position.set(3.25, 2.05, z);
    horn.rotation.z = 0.6;
    g.add(horn);
  }
  for (const [x, y, rz] of [
    [-2.8, 0.55, 0.5],
    [-3.1, 0.95, 0.9],
  ]) {
    const tail = mesh(new THREE.BoxGeometry(0.5, 0.35, 0.35), green);
    tail.position.set(x, y, 0);
    tail.rotation.z = rz;
    g.add(tail);
  }
  const cabin = mesh(new THREE.BoxGeometry(2.8, 0.85, 1.1), mat('#f0c84a'));
  cabin.position.set(-0.2, 0.82, 0);
  g.add(cabin);
  for (const x of [-1.5, -0.2, 1.1]) {
    const pillar = mesh(new THREE.BoxGeometry(0.1, 0.9, 1.15), red, { cast: false });
    pillar.position.set(x, 0.82, 0);
    g.add(pillar);
  }
  const roof = mesh(new THREE.BoxGeometry(3.3, 0.14, 1.5), red);
  roof.position.set(-0.2, 1.32, 0);
  g.add(roof);
  const ridge = mesh(new THREE.BoxGeometry(3.0, 0.14, 0.3), gold);
  ridge.position.set(-0.2, 1.45, 0);
  g.add(ridge);
  return g;
}

// Đò: a small wooden boat with a curved rattan canopy and a rower in a
// nón lá standing at the stern.
function sampan(rand, { rower = true } = {}) {
  const g = new THREE.Group();
  const wood = mat('#5a3a26');
  const hull = mesh(new THREE.BoxGeometry(2.2, 0.3, 0.75), wood);
  hull.position.y = 0.1;
  g.add(hull);
  for (const side of [-1, 1]) {
    const tip = mesh(new THREE.BoxGeometry(0.6, 0.25, 0.45), wood);
    tip.position.set(side * 1.3, 0.2, 0);
    tip.rotation.z = side * -0.35;
    g.add(tip);
  }
  const canopy = mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.0, 8, 1, true, -Math.PI / 2, Math.PI), mat('#a0804c', { side: THREE.DoubleSide }));
  canopy.rotation.z = Math.PI / 2;
  canopy.position.set(0.1, 0.25, 0);
  g.add(canopy);
  if (rower) {
    const body = mesh(new THREE.BoxGeometry(0.3, 0.7, 0.3), mat(pick(rand, ['#4f5a7a', '#6b4a3a', '#3f5f4a'])));
    body.position.set(-0.85, 0.6, 0);
    g.add(body);
    const head = mesh(new THREE.SphereGeometry(0.13, 6, 5), mat('#d9a066'));
    head.position.set(-0.85, 1.05, 0);
    g.add(head);
    const hat = mesh(new THREE.ConeGeometry(0.3, 0.2, 10), mat('#e8d08a'));
    hat.position.set(-0.85, 1.2, 0);
    g.add(hat);
    const oar = mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.8, 4), mat('#8a6a48'));
    oar.position.set(-1.25, 0.5, 0.15);
    oar.rotation.z = 0.6;
    g.add(oar);
  }
  return g;
}

// Boats drifting along the river, wrapping around out of sight behind the
// houses at either end.
function river(rand) {
  const group = new THREE.Group();
  const boats = [
    { model: bakeStatic(dragonBoat()), z: -10.2, speed: 0.7, x: -6 },
    { model: bakeStatic(sampan(rand)), z: -8.2, speed: -0.45, x: 5 },
  ];
  for (const b of boats) {
    b.model.position.set(b.x, WATER_Y, b.z);
    if (b.speed < 0) b.model.rotation.y = Math.PI;
    group.add(b.model);
  }
  return {
    group,
    update(timeMs, dt) {
      for (const [i, b] of boats.entries()) {
        const m = b.model;
        m.position.x += b.speed * dt;
        if (m.position.x > 30) m.position.x = -30;
        if (m.position.x < -30) m.position.x = 30;
        m.position.y = WATER_Y + Math.sin(timeMs * 0.002 + i * 2) * 0.03;
        m.rotation.z = Math.sin(timeMs * 0.0015 + i) * 0.02;
      }
    },
  };
}

// Riverside eatery on the Perfume River in Huế at noon: one-storey houses
// with mossy tiled roofs either side, a stone embankment opening onto the
// river with boats going by, phượng trees and the Thiên Mụ tower across
// the water.
export function buildHue() {
  const rand = rng(2020);
  const statics = new THREE.Group();
  statics.add(
    streetGround({ tiles: ['#a39d8e', '#9f998a', '#a8a293', '#9b9586'], line: '#7f796b', back: BANK_Z }),
  );
  embankment(rand, statics);

  // The bún bò eatery is the first house left of the river; more houses run
  // off to either side.
  houseRow(rand, statics, GAP.minX - 6.2, GAP.minX, FACADE_Z, 'BÚN BÒ HUẾ');
  houseRow(rand, statics, -34, GAP.minX - 6.2, FACADE_Z);
  houseRow(rand, statics, GAP.maxX, 34, FACADE_Z, pick(rand, SIGNS));

  const water = mesh(new THREE.PlaneGeometry(90, BANK_Z - FAR_BANK_Z + 2), mat('#3f7f78', { roughness: 0.4 }), { cast: false });
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, WATER_Y, (BANK_Z + FAR_BANK_Z) / 2 - 0.5);
  statics.add(water);
  // Glints on the water.
  for (let i = 0; i < 40; i++) {
    const glint = mesh(new THREE.BoxGeometry(range(rand, 0.4, 1.2), 0.01, 0.05), mat('#a9d8cf'), { cast: false });
    glint.position.set(range(rand, GAP.minX - 4, GAP.maxX + 4), WATER_Y + 0.01, range(rand, FAR_BANK_Z + 0.5, BANK_Z - 0.6));
    statics.add(glint);
  }
  const moored = sampan(rand, { rower: false });
  moored.position.set(2.2, WATER_Y, BANK_Z - 1.2);
  moored.rotation.y = 0.15;
  statics.add(moored);
  farBank(rand, statics);

  // Bún bò kitchen in front of the eatery, stools stacked beside it.
  const kitchen = brothStation(rand);
  kitchen.position.set(GAP.minX - 3.6, 0.04, FACADE_Z + 1.0);
  statics.add(kitchen);
  for (let i = 0; i < 3; i++) {
    const s = stool(i % 2 ? '#2f6fdf' : '#e2483d');
    s.position.set(GAP.minX - 1.2, 0.04 + i * 0.12, FACADE_Z + 0.9);
    statics.add(s);
  }

  for (const bx of [-16.5, -15.2, 10.6, 11.9, 13.2, 16.8]) {
    const bike = motorbike(rand);
    bike.position.set(bx, 0.04, FACADE_Z + 1.1);
    bike.rotation.y = Math.PI / 2 + range(rand, -0.25, 0.25);
    statics.add(bike);
  }

  // Phượng trees at the corners of the river opening.
  // Phượng leaning out over the river, another past the eatery.
  const tree = phuongTree(rand);
  tree.position.set(GAP.maxX - 0.8, 0.04, BANK_Z + 0.7);
  statics.add(tree);
  const tree2 = phuongTree(rand);
  tree2.position.set(-15.2, 0.04, FACADE_Z + 1.4);
  tree2.rotation.y = 2;
  statics.add(tree2);
  const bamboo = bambooClump(rand);
  bamboo.position.set(GAP.minX + 0.5, 0.04, BANK_Z + 0.7);
  bamboo.scale.setScalar(0.8);
  statics.add(bamboo);

  const vendor = quangGanh(rand);
  vendor.position.set(8.6, 0.04, 4.0);
  vendor.rotation.y = -0.5;
  statics.add(vendor);

  const steamHolder = new THREE.Group();
  steamHolder.position.copy(kitchen.position);
  for (const puff of kitchen.userData.steam) steamHolder.add(puff);

  const root = bakeStatic(statics);
  const road = traffic(rand, (r) => motorbike(r, { rider: true }), 5);
  const boats = river(rand);
  root.add(road.group, boats.group, steamHolder);

  return {
    root,
    update(timeMs, dt) {
      road.update(dt);
      boats.update(timeMs, dt);
      animateSteam(kitchen.userData.steam, timeMs);
    },
  };
}
