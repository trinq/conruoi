import * as THREE from 'three';
import { rng, range, pick, mat, mesh } from '../lowpoly.js';
import { stool } from '../models.js';
import { alleyHouse, foodCart, SignAtlas, motorbike, animateSteam, powerPole, cables, bangTree, coconutPalm, corrugated } from '../kit.js';
import { bakeStatic } from '../bake.js';
import { streetGround, traffic, FACADE_Z } from './street.js';

const SIGNS = [
  ['CƠM TẤM', 'Sườn bì chả'],
  ['TẠP HÓA', 'Cô Ba'],
  ['SỬA XE', 'Vá vỏ ruột'],
  ['CÀ PHÊ VỢT', 'Cà phê sữa đá'],
  ['BÁNH MÌ', 'Thịt nguội - Ốp la'],
  ['NƯỚC MÍA', 'Siêu sạch'],
  ['GỘI ĐẦU', 'Uốn - Duỗi - Nhuộm'],
  ['PHOTOCOPY', 'In ấn - Ép plastic'],
  ['ĐIỆN THOẠI', 'Sim - Thẻ cào'],
  ['CHÈ', 'Chè Thái - Sương sa'],
  ['GẠO', 'Đại lý gạo'],
];
const SIGN_COLOURS = [
  { bg: '#ffffff', fg: '#1f4e9c', band: '#d62a1e' },
  { bg: '#1f4e9c', fg: '#ffffff', band: '#f2c94c' },
  { bg: '#ffd200', fg: '#c8102e', band: '#c8102e' },
  { bg: '#e8f4ff', fg: '#d62a1e', band: '#1f4e9c' },
  { bg: '#2e8b57', fg: '#ffffff', band: '#ffd200' },
];
const digits = (rand, n) => String(Math.floor(rand() * 10 ** n)).padStart(n, '0');
const phone = (rand) => `ĐT: 09${digits(rand, 2)} ${digits(rand, 3)} ${digits(rand, 3)}`;

// The alley (hẻm) leads off the street between these x.
const LANE = { minX: -12.2, maxX: -9.8 };

// A row of houses along the street, skipping the alley's mouth.
function frontRow(rand, statics, atlas) {
  const fronts = [];
  let x = -34;
  while (x < 34) {
    if (x < LANE.maxX && x + 3 > LANE.minX) {
      x = LANE.maxX;
      continue;
    }
    const width = Math.min(range(rand, 3.4, 4.8), x < LANE.minX ? LANE.minX - x : 99);
    if (width < 2.5) {
      x = LANE.maxX;
      continue;
    }
    const centre = x + width / 2;
    let role = null;
    if (!fronts.some((f) => f.role === 'hutieu') && centre > -3.5) role = 'hutieu';
    const [name, sub] = pick(rand, SIGNS);
    const house = alleyHouse(rand, {
      width,
      floors: 2 + Math.floor(rand() * 3),
      sign: role === 'hutieu' ? 'HỦ TIẾU NAM VANG' : rand() < 0.75 ? name : null,
      signColours: role === 'hutieu' ? { ...SIGN_COLOURS[2], sub: 'Khô - Nước · Có mì' } : { ...pick(rand, SIGN_COLOURS), sub: rand() < 0.5 ? sub : phone(rand) },
      atlas,
    });
    house.position.set(centre, 0, FACADE_Z);
    statics.add(house);
    fronts.push({ centre, width, role });
    x += width;
  }
  return fronts;
}

// The hẻm: a narrow concrete lane between houses, a number arch over its
// mouth and laundry and cables strung across it.
function alley(rand, statics, atlas) {
  const width = LANE.maxX - LANE.minX;
  const cx = (LANE.minX + LANE.maxX) / 2;
  const depth = 16;
  const lane = mesh(new THREE.BoxGeometry(width + 0.2, 0.08, depth), mat('#9d9a94'), { cast: false });
  lane.position.set(cx, 0, FACADE_Z - depth / 2);
  statics.add(lane);
  for (let i = 0; i < 4; i++) {
    const z = FACADE_Z - 1 - i * 3.6;
    for (const side of [-1, 1]) {
      const house = alleyHouse(rand, { width: 3.4, floors: 2 + Math.floor(rand() * 2), depth: 5, atlas });
      house.rotation.y = -side * (Math.PI / 2);
      house.position.set(cx + side * (width / 2), 0, z - 1.7);
      statics.add(house);
    }
  }
  // House at the far end of the lane closes the view.
  const end = alleyHouse(rand, { width: width + 1, floors: 3, atlas });
  end.position.set(cx, 0, FACADE_Z - depth);
  statics.add(end);

  // Arch: two blue posts and a beam with the alley number.
  const steel = mat('#2f5f9e', { roughness: 0.5 });
  for (const side of [-1, 1]) {
    const post = mesh(new THREE.BoxGeometry(0.16, 4.2, 0.16), steel);
    post.position.set(cx + side * (width / 2 - 0.1), 2.1, FACADE_Z + 0.3);
    statics.add(post);
  }
  const sign = atlas.sign('HẺM 284', width - 0.1, 0.6, { bg: '#1f4e9c', fg: '#ffffff', band: '#ffffff', sub: 'Khu phố 3 · Phường 7' });
  sign.position.set(cx, 4.0, FACADE_Z + 0.3);
  statics.add(sign);
  // Laundry and cables across the lane.
  for (let i = 0; i < 3; i++) {
    const y = range(rand, 3.4, 5.5);
    const z = FACADE_Z - 2 - i * 4;
    statics.add(cables(rand, new THREE.Vector3(LANE.minX, y + 0.5, z), new THREE.Vector3(LANE.maxX, y + 0.4, z), 2));
  }
  // Two bikes parked in the lane.
  for (const [bz, ry] of [
    [FACADE_Z - 2.5, 0.2],
    [FACADE_Z - 6, -0.3],
  ]) {
    const bike = motorbike(rand);
    bike.position.set(cx + range(rand, -0.4, 0.4), 0.04, bz);
    bike.rotation.y = ry;
    statics.add(bike);
  }
}

// Sài Gòn alley in the afternoon: pastel houses with tin awnings and
// roofs, iron grilles and plastic shop signs, motorbikes parked nose-in all
// along the shopfronts, a hủ tiếu cart, bàng and coconut trees, and the
// mouth of a hẻm leading off between the houses.
export function buildSaigon() {
  const rand = rng(4040);
  const statics = new THREE.Group();
  statics.add(streetGround({ tiles: ['#c4beb3', '#b8b2a7', '#cdc8bd', '#bdb6aa'], line: '#8f897e' }));
  const atlas = new SignAtlas();

  const fronts = frontRow(rand, statics, atlas);
  // Taller row behind, flat roofs with water tanks.
  let x = -36;
  while (x < 36) {
    const width = range(rand, 4, 6);
    const house = alleyHouse(rand, { width, floors: 4 + Math.floor(rand() * 2), roof: rand() < 0.6 ? 'flat' : 'tin' });
    house.position.set(x + width / 2, 0, FACADE_Z - 7.5);
    if (x + width < LANE.minX - 0.5 || x > LANE.maxX + 0.5) statics.add(house);
    x += width;
  }
  alley(rand, statics, atlas);

  // The hủ tiếu cart in front of its shop, with a stack of stools and a
  // folding table beside it.
  const shop = fronts.find((f) => f.role === 'hutieu')?.centre ?? -2;
  const cart = foodCart(rand, { label: 'HỦ TIẾU NAM VANG', atlas, colours: { bg: '#fff6d8', fg: '#c8102e' } });
  cart.position.set(shop - 0.6, 0.04, FACADE_Z + 1.25);
  statics.add(cart);
  for (let i = 0; i < 4; i++) {
    const s = stool(i % 2 ? '#2f6fdf' : '#e2483d');
    s.position.set(shop + 2.1, 0.04 + i * 0.12, FACADE_Z + 0.8);
    statics.add(s);
  }

  // Motorbikes parked nose-in, packed along the shopfronts, plus a few
  // more at the sides of the pavement.
  for (let bx = -17; bx < 17; bx += range(rand, 0.62, 0.85)) {
    if (bx > shop - 1.8 && bx < shop + 2.6) continue;
    if (bx > LANE.minX - 0.3 && bx < LANE.maxX + 0.3) continue;
    const bike = motorbike(rand);
    bike.position.set(bx, 0.04, FACADE_Z + 1.0 + range(rand, -0.1, 0.15));
    bike.rotation.y = Math.PI / 2 + range(rand, -0.2, 0.2);
    statics.add(bike);
  }
  for (const side of [-1, 1]) {
    for (let bz = -2.6; bz < 4.2; bz += range(rand, 0.65, 0.9)) {
      const bike = motorbike(rand);
      bike.position.set(side * range(rand, 8.6, 9.1), 0.04, bz);
      bike.rotation.y = (side > 0 ? 0 : Math.PI) + range(rand, -0.25, 0.25);
      statics.add(bike);
    }
  }

  for (const [tx, tz, ry] of [
    [8.6, -4.5, 0.3],
    [-14.6, -4.4, 1.1],
  ]) {
    const tree = bangTree(rand);
    tree.position.set(tx, 0.04, tz);
    tree.rotation.y = ry;
    statics.add(tree);
  }
  for (const [px, pz, ry] of [
    [13.8, -4.5, 2.4],
    [-8.6, -4.5, 0.4],
  ]) {
    const palm = coconutPalm(rand);
    palm.position.set(px, 0.04, pz);
    palm.rotation.y = ry;
    statics.add(palm);
  }

  // A sugar-cane juice stand by the curb under a tin sheet.
  const stand = new THREE.Group();
  const counter = mesh(new THREE.BoxGeometry(1.4, 0.95, 0.6), mat('#2e8b57'));
  counter.position.y = 0.475;
  stand.add(counter);
  for (let i = 0; i < 5; i++) {
    const cane = mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.6, 5), mat('#8a6a3a'));
    cane.position.set(-0.5 + i * 0.05, 1.3, -0.25);
    cane.rotation.z = 0.12;
    stand.add(cane);
  }
  const cover = corrugated(1.8, 1.2, '#3f6fae');
  cover.position.y = 2.2;
  cover.rotation.x = 0.1;
  stand.add(cover);
  for (const sx of [-0.8, 0.8]) {
    const post = mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 5), mat('#8c8f93'));
    post.position.set(sx, 1.1, 0.5);
    stand.add(post);
  }
  const label = atlas.sign('NƯỚC MÍA', 1.3, 0.45, { bg: '#ffffff', fg: '#2e8b57', band: '#2e8b57' });
  label.position.set(0, 0.6, 0.31);
  stand.add(label);
  stand.position.set(-10.2, 0.04, 4.2);
  statics.add(stand);

  // Power poles and cables.
  const poles = [-15.5, -6.5, 4.5, 15.5].map((px) => {
    const p = powerPole(rand);
    p.position.set(px, 0, FACADE_Z + 0.4);
    statics.add(p);
    return new THREE.Vector3(px, 7.3, FACADE_Z + 0.4);
  });
  for (let i = 0; i < poles.length - 1; i++) statics.add(cables(rand, poles[i], poles[i + 1], 6));
  for (const p of poles) {
    for (let k = 0; k < 2; k++) {
      statics.add(cables(rand, p, new THREE.Vector3(p.x + range(rand, -3.5, 3.5), range(rand, 4, 6), FACADE_Z + 0.05), 1));
    }
  }

  const steamHolder = new THREE.Group();
  steamHolder.position.copy(cart.position).add(cart.userData.potAt);
  for (const puff of cart.userData.steam) steamHolder.add(puff);

  const root = bakeStatic(statics);
  const road = traffic(rand, (r) => motorbike(r, { rider: true }), 8);
  root.add(road.group, steamHolder);

  return {
    root,
    update(timeMs, dt) {
      road.update(dt);
      animateSteam(cart.userData.steam, timeMs);
    },
  };
}
