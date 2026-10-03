import * as THREE from 'three';
import { mat, mesh, jitter, range, pick, textTexture } from './lowpoly.js';

// Vietnamese street kit: low-poly props shared by every region. Units are
// metres; each prop stands on y = 0 and faces +z (toward the camera).

const FACADES = ['#e9c46a', '#f1d9a6', '#f3e3c3', '#cfe0c3', '#f2c6b4', '#e8b97a', '#d9d2c3'];
const SHUTTERS = ['#3f7d5a', '#2f6f6a', '#4a7f3f'];

// Canvas texture for a shop sign: coloured board, contrasting lettering.
function signTexture(text, { bg = '#c8102e', fg = '#ffd200', width = 1024, height = 192 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = fg;
  ctx.lineWidth = 8;
  ctx.strokeRect(14, 14, width - 28, height - 28);
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let size = 112;
  do {
    ctx.font = `${size}px "Paytone One", sans-serif`;
    size -= 4;
  } while (ctx.measureText(text).width > width - 80 && size > 30);
  ctx.fillText(text, width / 2, height / 2 + 6);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// Flat sign board with lettering on its front face.
export function shopSign(text, w, h, colours) {
  const g = new THREE.Group();
  const board = mesh(new THREE.BoxGeometry(w, h, 0.08), mat('#5b2a1a'));
  g.add(board);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(w * 0.98, h * 0.94),
    new THREE.MeshStandardMaterial({ map: signTexture(text, colours), roughness: 0.7 }),
  );
  face.position.z = 0.045;
  g.add(face);
  return g;
}

function windowWithShutters(rand, w, h) {
  const g = new THREE.Group();
  const glass = mesh(new THREE.BoxGeometry(w, h, 0.05), mat('#3b4b55', { roughness: 0.3 }), { cast: false });
  g.add(glass);
  const shutter = mat(pick(rand, SHUTTERS));
  const open = rand() < 0.6;
  for (const side of [-1, 1]) {
    const leaf = mesh(new THREE.BoxGeometry(w / 2, h, 0.06), shutter);
    if (open) {
      // Swung back against the wall.
      leaf.position.set(side * (w * 0.75), 0, 0.06);
    } else {
      leaf.position.set(side * (w / 4), 0, 0.05);
    }
    g.add(leaf);
    // Louvre lines.
    for (let i = -2; i <= 2; i++) {
      const slat = mesh(new THREE.BoxGeometry(w / 2 - 0.04, 0.025, 0.02), mat('#2a4d39'), { cast: false });
      slat.position.set(leaf.position.x, (i * h) / 6, leaf.position.z + 0.035);
      g.add(slat);
    }
  }
  return g;
}

function balcony(rand, w) {
  const g = new THREE.Group();
  const slab = mesh(new THREE.BoxGeometry(w, 0.12, 0.8), mat('#d8d0c0'));
  slab.position.set(0, 0, 0.4);
  g.add(slab);
  const railMat = mat('#2f2f33');
  const rail = mesh(new THREE.BoxGeometry(w, 0.05, 0.05), railMat);
  rail.position.set(0, 0.95, 0.78);
  g.add(rail);
  for (let x = -w / 2 + 0.1; x <= w / 2 - 0.1; x += 0.18) {
    const bar = mesh(new THREE.BoxGeometry(0.03, 0.9, 0.03), railMat, { cast: false });
    bar.position.set(x, 0.5, 0.78);
    g.add(bar);
  }
  // Potted plants on the ledge.
  const pots = 1 + Math.floor(rand() * 3);
  for (let i = 0; i < pots; i++) {
    const pot = mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.2, 7), mat('#b5562e'));
    const x = range(rand, -w / 2 + 0.3, w / 2 - 0.3);
    pot.position.set(x, 0.16, 0.55);
    g.add(pot);
    const leaves = mesh(new THREE.IcosahedronGeometry(0.2, 0), mat(pick(rand, ['#4f9e34', '#5fb83b', '#3f8f2c'])));
    leaves.position.set(x, 0.38, 0.55);
    g.add(leaves);
  }
  return g;
}

const AC = () => {
  const g = new THREE.Group();
  const box = mesh(new THREE.BoxGeometry(0.7, 0.5, 0.3), mat('#eef0f0', { roughness: 0.5 }));
  g.add(box);
  const fan = mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 10), mat('#7a8288'), { cast: false });
  fan.rotation.x = Math.PI / 2;
  fan.position.set(-0.1, 0, 0.16);
  g.add(fan);
  return g;
};

function waterTank() {
  const g = new THREE.Group();
  const tank = mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.2, 10), mat('#d6dce0', { roughness: 0.3, metalness: 0.4 }));
  tank.rotation.z = Math.PI / 2;
  tank.position.y = 0.75;
  g.add(tank);
  for (const x of [-0.4, 0.4]) {
    const leg = mesh(new THREE.BoxGeometry(0.08, 0.3, 0.7), mat('#6b6f73'));
    leg.position.set(x, 0.15, 0);
    g.add(leg);
  }
  return g;
}

function flag() {
  const g = new THREE.Group();
  const pole = mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.4, 5), mat('#c9c9c9'));
  pole.position.y = 0.7;
  g.add(pole);
  const cloth = mesh(new THREE.BoxGeometry(0.7, 0.46, 0.02), mat('#da251d'), { cast: false });
  cloth.position.set(0.37, 1.15, 0);
  g.add(cloth);
  const star = mesh(new THREE.CircleGeometry(0.1, 5), mat('#ffde00'), { cast: false });
  star.position.set(0.37, 1.15, 0.015);
  star.rotation.z = Math.PI / 2;
  g.add(star);
  return g;
}

// Nhà ống: a narrow, deep town house with an open shopfront, shuttered
// windows, balconies and either a tiled roof or a flat roof with a water
// tank. `sign` puts a shop sign above the ground floor.
export function tubeHouse(rand, { width = 4, floors = 3, roof = 'tile', sign = null, signColours, depth = 7 } = {}) {
  const g = new THREE.Group();
  const groundH = 3.0;
  const floorH = 2.5;
  const height = groundH + floorH * (floors - 1);
  const wall = mat(pick(rand, FACADES));

  const body = mesh(new THREE.BoxGeometry(width, height, depth), wall);
  body.position.set(0, height / 2, -depth / 2);
  g.add(body);

  // Ground floor: dark shop interior behind a half-raised rolling shutter.
  const interior = mesh(new THREE.BoxGeometry(width - 0.5, groundH - 0.4, 0.1), mat('#3a2e28'), { cast: false });
  interior.position.set(0, (groundH - 0.4) / 2 + 0.1, 0.02);
  g.add(interior);
  const shutterDrop = range(rand, 0.4, 1.1);
  const shutter = mesh(new THREE.BoxGeometry(width - 0.5, shutterDrop, 0.08), mat('#9aa1a6', { roughness: 0.5 }));
  shutter.position.set(0, groundH - 0.3 - shutterDrop / 2, 0.06);
  g.add(shutter);
  for (let y = groundH - 0.35; y > groundH - 0.3 - shutterDrop; y -= 0.12) {
    const groove = mesh(new THREE.BoxGeometry(width - 0.5, 0.02, 0.02), mat('#7b8287'), { cast: false });
    groove.position.set(0, y, 0.11);
    g.add(groove);
  }
  const step = mesh(new THREE.BoxGeometry(width, 0.15, 0.4), mat('#b9b2a6'));
  step.position.set(0, 0.075, 0.2);
  g.add(step);

  if (sign) {
    const s = shopSign(sign, width - 0.3, 0.75, signColours);
    s.position.set(0, groundH - 0.05, 0.12);
    g.add(s);
  }

  // Upper floors.
  for (let f = 1; f < floors; f++) {
    const y = groundH + floorH * (f - 1);
    const winW = Math.min(1.4, width * 0.35);
    const win = windowWithShutters(rand, winW, 1.3);
    win.position.set(0, y + 1.25, 0.03);
    g.add(win);
    if (rand() < 0.7) {
      const b = balcony(rand, width - 0.4);
      b.position.set(0, y + 0.05, 0);
      g.add(b);
    }
    if (rand() < 0.5) {
      const ac = AC();
      ac.position.set((rand() < 0.5 ? -1 : 1) * (width / 2 - 0.5), y + 0.7, 0.2);
      g.add(ac);
    }
    if (f === 1 && rand() < 0.35) {
      const fl = flag();
      fl.position.set(-width / 2 + 0.3, y + 0.9, 0.4);
      fl.rotation.z = -0.5;
      g.add(fl);
    }
  }

  if (roof === 'tile') {
    // Sloping terracotta roof with ridge tiles.
    const tiles = mat(pick(rand, ['#a5482b', '#9a3f25', '#b0552f']));
    const slope = new THREE.Mesh(new THREE.BoxGeometry(width + 0.2, 0.15, 3.2), tiles);
    slope.castShadow = slope.receiveShadow = true;
    slope.position.set(0, height + 0.7, -1.2);
    slope.rotation.x = 0.5;
    g.add(slope);
    for (let x = -width / 2; x <= width / 2; x += 0.35) {
      const row = mesh(new THREE.BoxGeometry(0.06, 0.06, 3.1), mat('#7f3320'), { cast: false });
      row.position.set(x, height + 0.79, -1.15);
      row.rotation.x = 0.5;
      g.add(row);
    }
  } else {
    const parapet = mesh(new THREE.BoxGeometry(width, 0.5, 0.15), wall);
    parapet.position.set(0, height + 0.25, -0.07);
    g.add(parapet);
    if (rand() < 0.7) {
      const tank = waterTank();
      tank.position.set(range(rand, -width / 4, width / 4), height, -1.5);
      g.add(tank);
    }
  }
  return g;
}

// Concrete power pole with a messy coil of cable near the top.
export function powerPole(rand, height = 8) {
  const g = new THREE.Group();
  const pole = mesh(new THREE.CylinderGeometry(0.1, 0.16, height, 6), mat('#a3a5a0'));
  pole.position.y = height / 2;
  g.add(pole);
  for (const y of [height - 0.6, height - 1.2]) {
    const bar = mesh(new THREE.BoxGeometry(1.4, 0.1, 0.1), mat('#8c8e8a'));
    bar.position.y = y;
    g.add(bar);
  }
  for (let i = 0; i < 4; i++) {
    const coil = mesh(new THREE.TorusGeometry(range(rand, 0.25, 0.45), 0.03, 4, 10), mat('#1f1f22'), { cast: false });
    coil.position.set(range(rand, -0.2, 0.2), height - 2 - i * 0.25, 0);
    coil.rotation.set(rand() * 2, rand() * 2, 0);
    g.add(coil);
  }
  const box = mesh(new THREE.BoxGeometry(0.4, 0.5, 0.25), mat('#7d8a7a'));
  box.position.set(0, height - 3.2, 0.2);
  g.add(box);
  return g;
}

// Sagging cables between two points, a few at a time, slightly different.
export function cables(rand, from, to, count = 5) {
  const g = new THREE.Group();
  const black = mat('#1d1d20');
  for (let i = 0; i < count; i++) {
    const a = from.clone().add(new THREE.Vector3(range(rand, -0.3, 0.3), range(rand, -0.6, 0.2), range(rand, -0.2, 0.2)));
    const b = to.clone().add(new THREE.Vector3(range(rand, -0.3, 0.3), range(rand, -0.6, 0.2), range(rand, -0.2, 0.2)));
    const mid = a.clone().lerp(b, 0.5);
    mid.y -= range(rand, 0.4, 1.2);
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.018, 3, false), black);
    tube.castShadow = true;
    g.add(tube);
  }
  return g;
}

// Xe máy, Honda Dream/Wave style. `rider` adds a helmeted rider.
export function motorbike(rand, { rider = false } = {}) {
  const g = new THREE.Group();
  const paint = mat(pick(rand, ['#b3202a', '#2457a6', '#1f1f22', '#e8e8e8', '#7a1f8a', '#1f6e43']), { roughness: 0.45 });
  const black = mat('#18181a');
  const chrome = mat('#c9cdd1', { roughness: 0.3, metalness: 0.5 });
  // Bike faces +x; callers rotate it.
  for (const x of [-0.62, 0.62]) {
    const wheel = mesh(new THREE.TorusGeometry(0.26, 0.07, 6, 12), black);
    wheel.position.set(x, 0.33, 0);
    g.add(wheel);
    const hub = mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 8), chrome);
    hub.rotation.x = Math.PI / 2;
    hub.position.set(x, 0.33, 0);
    g.add(hub);
  }
  const body = mesh(new THREE.BoxGeometry(0.9, 0.28, 0.32), paint);
  body.position.set(-0.05, 0.6, 0);
  g.add(body);
  const front = mesh(new THREE.BoxGeometry(0.28, 0.55, 0.3), paint);
  front.position.set(0.5, 0.75, 0);
  front.rotation.z = -0.35;
  g.add(front);
  const seat = mesh(new THREE.BoxGeometry(0.7, 0.1, 0.3), black);
  seat.position.set(-0.15, 0.8, 0);
  g.add(seat);
  const bar = mesh(new THREE.BoxGeometry(0.08, 0.06, 0.7), chrome);
  bar.position.set(0.6, 1.08, 0);
  g.add(bar);
  const lamp = mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 8), mat('#fff6c8', { emissive: '#fff2a8', emissiveIntensity: 0.4 }));
  lamp.rotation.z = Math.PI / 2;
  lamp.position.set(0.68, 0.98, 0);
  g.add(lamp);
  const exhaust = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.6, 6), chrome);
  exhaust.rotation.z = Math.PI / 2;
  exhaust.position.set(-0.4, 0.38, 0.2);
  g.add(exhaust);

  if (rider) {
    const shirt = mat(pick(rand, ['#4a7bd0', '#e07a3f', '#5aa65a', '#f2f2f2', '#c94f7c']));
    const torso = mesh(new THREE.BoxGeometry(0.32, 0.55, 0.42), shirt);
    torso.position.set(-0.15, 1.15, 0);
    torso.rotation.z = -0.15;
    g.add(torso);
    const head = mesh(new THREE.SphereGeometry(0.17, 8, 6), mat('#e0ac69'));
    head.position.set(-0.08, 1.58, 0);
    g.add(head);
    const helmet = mesh(
      new THREE.SphereGeometry(0.2, 8, 5, 0, Math.PI * 2, 0, Math.PI / 1.8),
      mat(pick(rand, ['#ffd23f', '#e2483d', '#2f6fdf', '#ffffff', '#f08ac0']), { roughness: 0.4 }),
    );
    helmet.position.set(-0.08, 1.6, 0);
    g.add(helmet);
    for (const z of [-0.12, 0.12]) {
      const leg = mesh(new THREE.BoxGeometry(0.4, 0.14, 0.14), mat('#2f3e5c'));
      leg.position.set(0.05, 0.85, z * 1.6);
      g.add(leg);
      const arm = mesh(new THREE.BoxGeometry(0.5, 0.1, 0.1), shirt);
      arm.position.set(0.3, 1.2, z * 2.2);
      arm.rotation.z = -0.3;
      g.add(arm);
    }
  }
  return g;
}

// Bếp than tổ ong with a big pot of broth; returns steam puffs to animate.
export function brothStation(rand) {
  const g = new THREE.Group();
  const stove = mesh(new THREE.CylinderGeometry(0.32, 0.3, 0.45, 10), mat('#b8b2a7'));
  stove.position.y = 0.225;
  g.add(stove);
  const coal = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 10), mat('#ff6a2a', { emissive: '#ff4a10', emissiveIntensity: 0.8 }), {
    cast: false,
  });
  coal.position.y = 0.46;
  g.add(coal);
  const pot = mesh(new THREE.CylinderGeometry(0.42, 0.38, 0.6, 12), mat('#c3c9ce', { roughness: 0.35, metalness: 0.45 }));
  pot.position.y = 0.8;
  g.add(pot);
  const broth = mesh(new THREE.CircleGeometry(0.39, 12), mat('#d9a85b'), { cast: false });
  broth.rotation.x = -Math.PI / 2;
  broth.position.y = 1.08;
  g.add(broth);
  const ladle = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 5), mat('#8a8f93'));
  ladle.position.set(0.15, 1.3, 0);
  ladle.rotation.z = -0.5;
  g.add(ladle);

  // Stack of bowls and a small shelf of condiments beside it.
  const shelf = mesh(new THREE.BoxGeometry(0.9, 0.6, 0.5), mat('#c79a5e'));
  shelf.position.set(1.0, 0.3, 0);
  g.add(shelf);
  for (let i = 0; i < 5; i++) {
    const bowl = mesh(new THREE.CylinderGeometry(0.2, 0.12, 0.08, 10), mat('#f7f4ec'));
    bowl.position.set(0.85, 0.64 + i * 0.07, 0);
    g.add(bowl);
  }
  for (const [x, c] of [
    [1.2, '#d9381e'],
    [1.32, '#f2c94c'],
  ]) {
    const jar = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.18, 7), mat(c));
    jar.position.set(x, 0.69, 0.1);
    g.add(jar);
  }

  const steam = [];
  for (let i = 0; i < 7; i++) {
    const puff = mesh(new THREE.IcosahedronGeometry(0.12, 0), new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.5, flatShading: true }), {
      cast: false,
    });
    puff.userData.phase = i / 7;
    g.add(puff);
    steam.push(puff);
  }
  g.userData.steam = steam;
  return g;
}

// Moves steam puffs up from a pot in a loop.
export function animateSteam(steam, timeMs) {
  for (const puff of steam) {
    const t = (timeMs * 0.0004 + puff.userData.phase) % 1;
    puff.position.set(Math.sin(t * 6 + puff.userData.phase * 9) * 0.15, 1.15 + t * 1.6, Math.cos(t * 5) * 0.1);
    puff.scale.setScalar(0.6 + t * 1.6);
    puff.material.opacity = 0.45 * (1 - t);
  }
}

// Quang gánh: a bamboo carrying pole with two baskets of fruit.
export function quangGanh(rand) {
  const g = new THREE.Group();
  const pole = mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.8, 5), mat('#c9a35a'));
  pole.rotation.z = Math.PI / 2;
  pole.position.y = 0.55;
  pole.rotation.y = 0.2;
  g.add(pole);
  for (const x of [-0.75, 0.75]) {
    const basket = mesh(new THREE.CylinderGeometry(0.35, 0.28, 0.3, 10), mat('#b08850'));
    basket.position.set(x, 0.15, x * 0.15);
    g.add(basket);
    for (let i = 0; i < 6; i++) {
      const fruit = mesh(new THREE.IcosahedronGeometry(0.09, 0), mat(pick(rand, ['#f2c94c', '#e2483d', '#7cc96b', '#f08a24'])));
      fruit.position.set(x + range(rand, -0.18, 0.18), 0.33, x * 0.15 + range(rand, -0.18, 0.18));
      g.add(fruit);
    }
  }
  return g;
}

// ----- trees -----

// Cây bàng: tiers of flat, horizontal canopy, like a pagoda.
export function bangTree(rand) {
  const g = new THREE.Group();
  const trunk = mesh(new THREE.CylinderGeometry(0.16, 0.26, 4.2, 7), mat('#6e4a2f'));
  trunk.position.y = 2.1;
  g.add(trunk);
  const greens = ['#5fae3c', '#4f9e34', '#6cbf45'];
  for (let i = 0; i < 3; i++) {
    const r = 2.0 - i * 0.55;
    const layer = mesh(jitter(new THREE.CylinderGeometry(r, r * 1.05, 0.45, 9), 0.12, rand), mat(pick(rand, greens)));
    layer.position.y = 2.6 + i * 0.95;
    layer.rotation.y = rand() * 3;
    g.add(layer);
    // A few red leaves, as bàng turn red before they fall.
    for (let k = 0; k < 3; k++) {
      const leaf = mesh(new THREE.IcosahedronGeometry(0.16, 0), mat('#c4442a'), { cast: false });
      const a = rand() * Math.PI * 2;
      leaf.position.set(Math.cos(a) * r * 0.9, layer.position.y + 0.15, Math.sin(a) * r * 0.9);
      g.add(leaf);
    }
  }
  // Square tree pit in the pavement.
  const pit = mesh(new THREE.BoxGeometry(1.2, 0.08, 1.2), mat('#7a6a55'), { cast: false });
  pit.position.y = 0.06;
  g.add(pit);
  return g;
}

// Cây phượng: a wide umbrella canopy dotted with red flowers.
export function phuongTree(rand) {
  const g = new THREE.Group();
  const trunk = mesh(new THREE.CylinderGeometry(0.15, 0.24, 3.4, 7), mat('#6a4a33'));
  trunk.position.y = 1.7;
  g.add(trunk);
  const canopy = mesh(jitter(new THREE.SphereGeometry(2.2, 9, 5), 0.2, rand), mat('#5aa83a'));
  canopy.scale.y = 0.45;
  canopy.position.y = 3.8;
  g.add(canopy);
  for (let i = 0; i < 26; i++) {
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * 2.0;
    const f = mesh(new THREE.IcosahedronGeometry(0.17, 0), mat(pick(rand, ['#e8402a', '#f05a2a', '#d9301f'])), { cast: false });
    f.position.set(Math.cos(a) * r, 3.8 + Math.sqrt(Math.max(0, 1 - (r / 2.2) ** 2)) * 0.95, Math.sin(a) * r);
    g.add(f);
  }
  return g;
}

// Khóm tre: a cluster of segmented bamboo canes.
export function bambooClump(rand) {
  const g = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const h = range(rand, 3.5, 6);
    const cane = mesh(new THREE.CylinderGeometry(0.05, 0.07, h, 5), mat(pick(rand, ['#7fae3c', '#8fbf45', '#6f9e34'])));
    const a = rand() * Math.PI * 2;
    cane.position.set(Math.cos(a) * 0.4, h / 2, Math.sin(a) * 0.4);
    cane.rotation.set(range(rand, -0.15, 0.15), 0, range(rand, -0.15, 0.15));
    g.add(cane);
    const tuft = mesh(jitter(new THREE.IcosahedronGeometry(0.6, 0), 0.1, rand), mat('#5f9e30'));
    tuft.scale.set(1, 0.5, 1);
    tuft.position.set(cane.position.x * 2, h, cane.position.z * 2);
    g.add(tuft);
  }
  return g;
}

// Cây dừa: a leaning trunk with drooping fronds and a few coconuts.
export function coconutPalm(rand) {
  const g = new THREE.Group();
  const lean = range(rand, 0.1, 0.25);
  const h = range(rand, 5, 6.5);
  const trunk = mesh(new THREE.CylinderGeometry(0.15, 0.24, h, 7), mat('#8a6a48'));
  trunk.position.set(Math.sin(lean) * h * 0.5, h / 2, 0);
  trunk.rotation.z = -lean;
  g.add(trunk);
  const top = new THREE.Vector3(Math.sin(lean) * h, h, 0);
  for (let i = 0; i < 7; i++) {
    const frond = mesh(new THREE.BoxGeometry(2.2, 0.05, 0.45), mat(pick(rand, ['#4f9e34', '#5fae3c'])));
    const a = (i / 7) * Math.PI * 2;
    frond.position.copy(top).add(new THREE.Vector3(Math.cos(a) * 0.9, -0.3, Math.sin(a) * 0.9));
    frond.rotation.set(0, -a, -0.45);
    g.add(frond);
  }
  for (let i = 0; i < 3; i++) {
    const nut = mesh(new THREE.SphereGeometry(0.14, 6, 5), mat('#6f8f2a'));
    nut.position.copy(top).add(new THREE.Vector3(range(rand, -0.2, 0.2), -0.35, range(rand, -0.2, 0.2)));
    g.add(nut);
  }
  return g;
}

// ----- old town houses -----

const MOSS = ['#4f6a32', '#455f2c', '#5a7438', '#3d5528'];

// Triangular wall that closes the end of a gable roof: base `depth` along
// z, `height` at the ridge, `width` thick along x.
function gableEnd(width, depth, height) {
  const shape = new THREE.Shape();
  shape.moveTo(-depth / 2, 0);
  shape.lineTo(depth / 2, 0);
  shape.lineTo(0, height);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false });
  geo.rotateY(Math.PI / 2);
  geo.translate(-width / 2, 0, 0);
  return geo;
}

// One slope of old clay tiles: rows of ridged tiles, darker where they are
// weathered, and patches of moss. `len` runs down the slope (local z).
function tiledSlope(rand, width, len, { tile, moss }) {
  const slope = mesh(new THREE.BoxGeometry(width, 0.14, len), mat(tile));
  const rowMat = mat('#4f3a2e');
  for (let x = -width / 2 + 0.15; x < width / 2; x += 0.3) {
    const row = mesh(new THREE.BoxGeometry(0.09, 0.07, len), rowMat, { cast: false });
    row.position.set(x, 0.09, 0);
    slope.add(row);
  }
  const patches = Math.round(moss * width * len * 0.6);
  for (let i = 0; i < patches; i++) {
    const r = range(rand, 0.18, 0.42);
    const patch = mesh(jitter(new THREE.IcosahedronGeometry(r, 0), r * 0.25, rand), mat(pick(rand, MOSS)), { cast: false });
    patch.scale.set(1.4, 0.08, 1);
    patch.position.set(range(rand, -width / 2 + r, width / 2 - r), 0.1, range(rand, -len / 2 + r, len / 2 - r));
    slope.add(patch);
  }
  return slope;
}

// Gable roof over walls running from z = front back to z = rear, with its
// ridge along x halfway between them and the slopes meeting the wall tops
// at y = wallTop. The front slope overhangs to z = eave; ridge ends curl up.
// Returns the roof and the ridge's height above the wall tops.
function gableRoof(rand, { width, wallTop, front, rear, eave, pitch = 0.5, tile, moss, ridgeColour = '#e3dccb' }) {
  const g = new THREE.Group();
  const ridge = (front + rear) / 2;
  const tan = Math.tan(pitch);
  const rise = (front - ridge) * tan;
  const top = wallTop + rise;
  const slope = (from, to, mossiness) => {
    const run = Math.abs(to - from);
    const s = tiledSlope(rand, width + 0.5, run / Math.cos(pitch) + 0.1, { tile, moss: mossiness });
    s.position.set(0, top - (run / 2) * tan, (from + to) / 2);
    s.rotation.x = Math.sign(to - from) * pitch;
    return s;
  };
  g.add(slope(ridge, eave, moss), slope(ridge, rear - 0.4, moss * 0.5));
  const ridgeMat = mat(ridgeColour);
  const crest = mesh(new THREE.BoxGeometry(width + 0.3, 0.2, 0.3), ridgeMat);
  crest.position.set(0, top + 0.1, ridge);
  g.add(crest);
  for (const side of [-1, 1]) {
    const curl = mesh(new THREE.BoxGeometry(0.5, 0.16, 0.26), ridgeMat);
    curl.position.set(side * (width / 2 + 0.3), top + 0.22, ridge);
    curl.rotation.z = side * 0.5;
    g.add(curl);
  }
  return { roof: g, rise, ridge };
}

// A row of wooden panel doors across a shopfront, some taken down so the
// dark inside shows (cửa bức bàn).
function panelDoors(rand, width, height, wood) {
  const g = new THREE.Group();
  const inside = mesh(new THREE.BoxGeometry(width, height, 0.06), mat('#2e221b'), { cast: false });
  inside.position.y = height / 2;
  g.add(inside);
  const n = Math.max(4, Math.round(width / 0.55));
  const w = width / n;
  const open = new Set([Math.floor(n / 2) - 1, Math.floor(n / 2), ...(rand() < 0.5 ? [0] : [])]);
  const panel = mat(wood);
  const frame = mat('#3b2618');
  for (let i = 0; i < n; i++) {
    if (open.has(i)) continue;
    const p = mesh(new THREE.BoxGeometry(w - 0.03, height, 0.06), panel);
    p.position.set(-width / 2 + w * (i + 0.5), height / 2, 0.05);
    g.add(p);
    const inset = mesh(new THREE.BoxGeometry(w * 0.6, height * 0.35, 0.02), frame, { cast: false });
    inset.position.set(p.position.x, height * 0.72, 0.09);
    g.add(inset);
  }
  const lintel = mesh(new THREE.BoxGeometry(width + 0.2, 0.18, 0.18), frame);
  lintel.position.set(0, height + 0.09, 0.06);
  g.add(lintel);
  return g;
}

// Old town house with a tiled gable roof, the kind seen in Huế and Hội An.
//
// - verandah: one storey set back behind a row of wooden columns, the roof
//   running down over them (Huế nhà rường). Otherwise the house has a
//   panel-door shopfront under a little tiled awning, and upper floors with
//   shuttered windows (Hội An).
// - wall, wood: colours of the walls and of the doors and columns.
// - moss: 0..1, how mossy the tiles are.
export function oldTownHouse(
  rand,
  { width = 5, depth = 6, floors = 1, verandah = false, wall = '#e8e1cc', wood = '#6b3b24', tile = '#7a5646', moss = 0.5, sign = null, signColours } = {},
) {
  const g = new THREE.Group();
  const groundH = verandah ? 2.7 : 3.0;
  const height = groundH + 2.6 * (floors - 1);
  const front = verandah ? -1.4 : 0;
  const wallMat = mat(wall);

  const body = mesh(new THREE.BoxGeometry(width, height, depth + front), wallMat);
  body.position.set(0, height / 2, (front - depth) / 2);
  g.add(body);
  // Damp, darker plinth along the bottom of the wall.
  const plinth = mesh(new THREE.BoxGeometry(width + 0.02, 0.45, 0.05), mat('#9c968a'), { cast: false });
  plinth.position.set(0, 0.225, front + 0.01);
  g.add(plinth);

  const doors = panelDoors(rand, width - (verandah ? 1.2 : 0.6), groundH - 0.5, wood);
  doors.position.set(0, 0.05, front);
  g.add(doors);

  if (verandah) {
    const floor = mesh(new THREE.BoxGeometry(width, 0.2, -front + 0.3), mat('#a59a86'));
    floor.position.set(0, 0.1, front / 2 + 0.15);
    g.add(floor);
    const post = mat(wood);
    const n = Math.max(2, Math.round(width / 2) + 1);
    for (let i = 0; i < n; i++) {
      const col = mesh(new THREE.CylinderGeometry(0.11, 0.12, groundH, 7), post);
      col.position.set(-width / 2 + 0.3 + (i * (width - 0.6)) / (n - 1), groundH / 2 + 0.2, -0.05);
      g.add(col);
      const base = mesh(new THREE.BoxGeometry(0.3, 0.16, 0.3), mat('#8d8679'));
      base.position.set(col.position.x, 0.28, -0.05);
      g.add(base);
    }
    const beam = mesh(new THREE.BoxGeometry(width, 0.2, 0.2), post);
    beam.position.set(0, groundH + 0.15, -0.05);
    g.add(beam);
  } else {
    // Small tiled awning over the shopfront on carved brackets.
    const awning = tiledSlope(rand, width + 0.2, 1.2, { tile, moss: moss * 0.6 });
    awning.position.set(0, groundH + 0.05, 0.5);
    awning.rotation.x = 0.35;
    g.add(awning);
    for (const x of [-width / 2 + 0.3, width / 2 - 0.3]) {
      const bracket = mesh(new THREE.BoxGeometry(0.12, 0.12, 0.9), mat(wood));
      bracket.position.set(x, groundH - 0.25, 0.4);
      bracket.rotation.x = 0.5;
      g.add(bracket);
    }
    for (let f = 1; f < floors; f++) {
      const y = groundH + 2.6 * (f - 1);
      const winW = Math.min(1.3, width * 0.28);
      const count = width > 4.4 ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const win = windowWithShutters(rand, winW, 1.25);
        win.position.set(count === 1 ? 0 : (i - 0.5) * width * 0.48, y + 1.55, 0.03);
        g.add(win);
      }
      if (!sign && rand() < 0.6) {
        // Wooden balcony rail.
        const rail = mesh(new THREE.BoxGeometry(width - 0.4, 0.08, 0.08), mat(wood));
        rail.position.set(0, y + 1.1, 0.55);
        g.add(rail);
        const slab = mesh(new THREE.BoxGeometry(width - 0.3, 0.1, 0.6), mat(wood));
        slab.position.set(0, y + 0.35, 0.3);
        g.add(slab);
        for (let x = -width / 2 + 0.3; x <= width / 2 - 0.3; x += 0.22) {
          const bar = mesh(new THREE.BoxGeometry(0.04, 0.75, 0.04), mat(wood), { cast: false });
          bar.position.set(x, y + 0.75, 0.55);
          g.add(bar);
        }
      }
    }
  }

  if (sign) {
    // Hung from the verandah beam, or above the awning.
    const s = shopSign(sign, Math.min(width - 0.6, 3.6), verandah ? 0.6 : 0.5, signColours);
    if (verandah) s.position.set(0, groundH - 0.25, 0.08);
    else s.position.set(0, groundH + 0.6, 0.15);
    g.add(s);
  }

  const { roof, rise, ridge } = gableRoof(rand, {
    width,
    wallTop: height,
    front,
    rear: -depth,
    eave: verandah ? 0.5 : front + 0.35,
    tile,
    moss,
  });
  g.add(roof);
  for (const side of [-1, 1]) {
    const gable = mesh(gableEnd(0.1, depth + front, rise), wallMat);
    gable.position.set(side * (width / 2 - 0.05), height, ridge);
    g.add(gable);
  }
  return g;
}

// Hoa giấy: bougainvillea spilling over a wall, mostly magenta bracts with
// some leaves. Spreads `width` along x and hangs `drop` down from y = 0.
export function bougainvillea(rand, { width = 2, drop = 1.8 } = {}) {
  const g = new THREE.Group();
  const pinks = ['#d6247a', '#e0368a', '#c41f6e', '#f05aa0', '#b81c63'];
  const leaves = ['#3f7d2c', '#4f9036'];
  const n = Math.round(width * 9);
  for (let i = 0; i < n; i++) {
    const x = range(rand, -width / 2, width / 2);
    // Fuller at the top, trailing off lower down.
    const y = -drop * rand() ** 1.8;
    const r = range(rand, 0.14, 0.3) * (1 + y / drop / 2);
    const leaf = rand() < 0.25;
    const blob = mesh(jitter(new THREE.IcosahedronGeometry(r, 0), r * 0.2, rand), mat(pick(rand, leaf ? leaves : pinks)), { cast: false });
    blob.position.set(x, y, range(rand, 0, 0.25));
    g.add(blob);
  }
  const stem = mesh(new THREE.CylinderGeometry(0.04, 0.05, drop + 0.5, 5), mat('#5a4030'));
  stem.position.set(range(rand, -width / 3, width / 3), -drop / 2, 0.05);
  g.add(stem);
  return g;
}
