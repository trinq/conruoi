import * as THREE from 'three';
import { rng, range, pick } from '../lowpoly.js';
import { stool } from '../models.js';
import { tubeHouse, powerPole, cables, motorbike, brothStation, animateSteam, quangGanh, bangTree } from '../kit.js';
import { bakeStatic } from '../bake.js';
import { streetGround, traffic, FACADE_Z } from './street.js';

const SIGNS = [
  'BÚN CHẢ',
  'BÁNH CUỐN',
  'TẠP HÓA',
  'CẮT TÓC',
  'SỬA XE MÁY',
  'TRÀ ĐÁ',
  'THUỐC TÂY',
  'NHÀ NGHỈ',
  'CÀ PHÊ',
  'XÔI XÉO',
  'BÁNH MÌ',
];
const SIGN_COLOURS = [
  { bg: '#c8102e', fg: '#ffd200' },
  { bg: '#ffd200', fg: '#c8102e' },
  { bg: '#1f4e9c', fg: '#ffffff' },
  { bg: '#c8102e', fg: '#ffffff' },
];

// Old Quarter street in Hà Nội: tube houses with tiled roofs and balconies,
// a phở kitchen on the pavement, parked motorbikes, a bàng tree, power poles
// with tangled cables and traffic on the road in front.
export function buildHanoi() {
  const rand = rng(1010);
  const statics = new THREE.Group();
  statics.add(streetGround());

  // Front row of houses, the phở shop just behind the play area centre.
  let x = -32;
  while (x < 32) {
    const width = range(rand, 3.2, 4.8);
    const centre = x + width / 2;
    const isPhoShop = centre > -4 && centre < 0 && !statics.userData.phoShop;
    const house = tubeHouse(rand, {
      width,
      floors: 2 + Math.floor(rand() * 3),
      roof: rand() < 0.7 ? 'tile' : 'flat',
      sign: isPhoShop ? 'PHỞ GIA TRUYỀN' : rand() < 0.65 ? pick(rand, SIGNS) : null,
      signColours: isPhoShop ? SIGN_COLOURS[0] : pick(rand, SIGN_COLOURS),
    });
    if (isPhoShop) statics.userData.phoShop = centre;
    house.position.set(centre, 0, FACADE_Z);
    statics.add(house);
    x += width;
  }
  // Taller second row behind, so roofs fill the top of the view.
  x = -34;
  while (x < 34) {
    const width = range(rand, 4, 6);
    const house = tubeHouse(rand, { width, floors: 4 + Math.floor(rand() * 2), roof: rand() < 0.5 ? 'tile' : 'flat' });
    house.position.set(x + width / 2, 0, FACADE_Z - 7.5);
    statics.add(house);
    x += width;
  }

  // Phở kitchen on the pavement in front of the shop.
  const kitchen = brothStation(rand);
  kitchen.position.set((statics.userData.phoShop ?? -2) - 0.6, 0.04, FACADE_Z + 0.75);
  statics.add(kitchen);
  // Spare stools stacked by the shop.
  for (let i = 0; i < 3; i++) {
    const s = stool(i % 2 ? '#2f6fdf' : '#e2483d');
    s.position.set((statics.userData.phoShop ?? -2) + 1.6, 0.04 + i * 0.12, FACADE_Z + 0.5);
    s.scale.setScalar(0.95);
    statics.add(s);
  }

  // Motorbikes parked nose-in along the shopfronts.
  for (const bx of [-12.5, -11.2, -9.9, 4.4, 5.6, 9.8, 11.1, 12.4, 14.0]) {
    const bike = motorbike(rand);
    bike.position.set(bx, 0.04, FACADE_Z + 1.0);
    bike.rotation.y = Math.PI / 2 + range(rand, -0.25, 0.25);
    statics.add(bike);
  }

  const tree = bangTree(rand);
  tree.position.set(8.4, 0.04, -4.4);
  statics.add(tree);
  const tree2 = bangTree(rand);
  tree2.position.set(-9.2, 0.04, -4.4);
  tree2.rotation.y = 1.3;
  statics.add(tree2);

  const vendor = quangGanh(rand);
  vendor.position.set(-8.4, 0.04, 4.2);
  vendor.rotation.y = 0.4;
  statics.add(vendor);

  // Power poles and the famous tangle of cables.
  const poles = [-10.5, 1.5, 10.5].map((px) => {
    const p = powerPole(rand);
    p.position.set(px, 0, FACADE_Z + 0.35);
    statics.add(p);
    return new THREE.Vector3(px, 7.3, FACADE_Z + 0.35);
  });
  for (let i = 0; i < poles.length - 1; i++) statics.add(cables(rand, poles[i], poles[i + 1], 7));
  statics.add(cables(rand, poles[0], new THREE.Vector3(-26, 6.5, FACADE_Z + 0.2), 5));
  statics.add(cables(rand, poles[2], new THREE.Vector3(26, 6.5, FACADE_Z + 0.2), 5));
  // Drops from the poles into houses.
  for (const p of poles) {
    for (let k = 0; k < 3; k++) {
      statics.add(cables(rand, p, new THREE.Vector3(p.x + range(rand, -4, 4), range(rand, 3.5, 5.5), FACADE_Z + 0.05), 1));
    }
  }

  // The steam is animated, so take it out before the statics are merged.
  const steamHolder = new THREE.Group();
  steamHolder.position.copy(kitchen.position);
  for (const puff of kitchen.userData.steam) steamHolder.add(puff);

  const root = bakeStatic(statics);
  const road = traffic(rand, (r) => motorbike(r, { rider: true }), 7);
  root.add(road.group, steamHolder);

  return {
    root,
    update(timeMs, dt) {
      road.update(dt);
      animateSteam(kitchen.userData.steam, timeMs);
    },
  };
}
