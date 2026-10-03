import * as THREE from 'three';
import { mat, mesh, jitter, range, pick, textTexture } from './lowpoly.js';

// Low-poly model factories. Units are metres-ish; every model's origin sits
// on the ground (or on the surface it stands on) and faces +z.

const GREENS = ['#6cc644', '#5fb83b', '#7fd34e', '#58ad36'];
const PINKS = ['#f6a8c4', '#f39bbb', '#f8b8cf'];

// ----- scenery -------------------------------------------------------------

export function tree(rand, { blossom = false, pinkCanopy = false } = {}) {
  const g = new THREE.Group();
  const h = range(rand, 1.0, 1.6);
  const trunk = mesh(new THREE.CylinderGeometry(0.1, 0.17, h, 6), mat('#8a5a33'));
  trunk.position.y = h / 2;
  g.add(trunk);

  const colors = pinkCanopy ? PINKS : GREENS;
  const blobs = pinkCanopy ? 3 : 1 + Math.floor(rand() * 3);
  for (let i = 0; i < blobs; i++) {
    const r = range(rand, 0.7, 1.05) * (i === 0 ? 1 : 0.7);
    const canopy = mesh(jitter(new THREE.IcosahedronGeometry(r, 0), r * 0.18, rand), mat(pick(rand, colors)));
    canopy.position.set(range(rand, -0.4, 0.4) * (i > 0), h + r * 0.7 + i * 0.25, range(rand, -0.4, 0.4) * (i > 0));
    canopy.rotation.set(rand() * 3, rand() * 3, rand() * 3);
    g.add(canopy);
    if (blossom) {
      for (let k = 0; k < 6; k++) {
        const dot = mesh(new THREE.IcosahedronGeometry(0.07, 0), mat('#fbe3ec'), { cast: false });
        const dir = new THREE.Vector3(rand() - 0.5, rand() * 0.8, rand() - 0.5).normalize();
        dot.position.copy(canopy.position).addScaledVector(dir, r * 0.95);
        g.add(dot);
      }
    }
  }
  return g;
}

export function pine(rand) {
  const g = new THREE.Group();
  const trunk = mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.6, 6), mat('#7a4b2a'));
  trunk.position.y = 0.3;
  g.add(trunk);
  const color = pick(rand, ['#2f8f4e', '#2a7f45', '#379a55']);
  for (let i = 0; i < 3; i++) {
    const r = 0.9 - i * 0.22;
    const cone = mesh(new THREE.ConeGeometry(r, 1.0, 7), mat(color));
    cone.position.y = 0.9 + i * 0.55;
    cone.rotation.y = rand() * 3;
    g.add(cone);
  }
  g.scale.setScalar(range(rand, 0.9, 1.3));
  return g;
}

export function bush(rand) {
  const r = range(rand, 0.35, 0.6);
  const b = mesh(jitter(new THREE.IcosahedronGeometry(r, 0), r * 0.15, rand), mat(pick(rand, GREENS)));
  b.scale.y = 0.7;
  b.position.y = r * 0.5;
  return b;
}

export function rock(rand) {
  const r = range(rand, 0.15, 0.4);
  const m = mesh(jitter(new THREE.DodecahedronGeometry(r, 0), r * 0.25, rand), mat(pick(rand, ['#9aa1a6', '#8a9196', '#b0b6ba'])));
  m.scale.y = 0.6;
  m.position.y = r * 0.3;
  m.rotation.y = rand() * 6;
  return m;
}

export function crate() {
  const g = new THREE.Group();
  const box = mesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), mat('#b9824a'));
  box.position.y = 0.2;
  g.add(box);
  const band = mesh(new THREE.BoxGeometry(0.52, 0.06, 0.52), mat('#8a5a33'));
  band.position.y = 0.3;
  g.add(band);
  return g;
}

export function barrel() {
  const g = new THREE.Group();
  const body = mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.55, 8), mat('#a86b3c'));
  body.position.y = 0.275;
  g.add(body);
  for (const y of [0.12, 0.43]) {
    const hoop = mesh(new THREE.CylinderGeometry(0.255, 0.255, 0.05, 8), mat('#5b5f63'));
    hoop.position.y = y;
    g.add(hoop);
  }
  return g;
}

// Food stall with a striped awning and a name board.
export function stall(name) {
  const g = new THREE.Group();
  const wood = mat('#b77a45');
  const darkWood = mat('#7d4f2b');

  const counter = mesh(new THREE.BoxGeometry(3.4, 0.9, 0.8), wood);
  counter.position.set(0, 0.45, 0.2);
  g.add(counter);
  const top = mesh(new THREE.BoxGeometry(3.6, 0.08, 0.95), darkWood);
  top.position.set(0, 0.94, 0.2);
  g.add(top);
  const back = mesh(new THREE.BoxGeometry(3.4, 2.2, 0.15), mat('#e9d7b5'));
  back.position.set(0, 1.1, -0.6);
  g.add(back);

  for (const x of [-1.7, 1.7]) {
    for (const z of [-0.6, 0.6]) {
      const post = mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 6), darkWood);
      post.position.set(x, 1.2, z);
      g.add(post);
    }
  }

  // Awning: alternating stripes tilted toward the customer.
  const stripes = 9;
  const width = 3.9 / stripes;
  for (let i = 0; i < stripes; i++) {
    const s = mesh(new THREE.BoxGeometry(width, 0.06, 1.7), mat(i % 2 ? '#fff4e0' : '#3d7fd6'));
    s.position.set(-1.95 + width * (i + 0.5), 2.45, 0.15);
    s.rotation.x = 0.28;
    g.add(s);
    const flap = mesh(new THREE.BoxGeometry(width, 0.28, 0.05), mat(i % 2 ? '#fff4e0' : '#3d7fd6'));
    flap.position.set(s.position.x, 2.1, 1.0);
    g.add(flap);
  }

  const board = mesh(new THREE.BoxGeometry(2.4, 0.55, 0.08), darkWood);
  board.position.set(0, 2.95, -0.3);
  g.add(board);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(2.3, 0.48),
    new THREE.MeshBasicMaterial({
      map: textTexture(name, {
        width: 768,
        height: 160,
        font: '60px "Paytone One", sans-serif',
        background: '#7d4f2b',
        color: '#ffe9b0',
      }),
    }),
  );
  label.position.set(0, 2.95, -0.25);
  g.add(label);

  // A big pot of broth and some bowls on the counter.
  const pot = mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.45, 10), mat('#aeb6bd', { roughness: 0.4 }));
  pot.position.set(-0.9, 1.2, 0.15);
  g.add(pot);
  const broth = mesh(new THREE.CircleGeometry(0.29, 10), mat('#d9a85b'), { cast: false });
  broth.rotation.x = -Math.PI / 2;
  broth.position.set(-0.9, 1.43, 0.15);
  g.add(broth);
  for (let i = 0; i < 3; i++) {
    const b = bowlShell('#3a6fb0');
    b.position.set(0.3 + i * 0.45, 0.98, 0.25);
    b.scale.setScalar(0.8);
    g.add(b);
  }
  return g;
}

export function lantern() {
  const g = new THREE.Group();
  const body = mesh(
    new THREE.IcosahedronGeometry(0.2, 1),
    new THREE.MeshStandardMaterial({ color: '#e2483d', emissive: '#ff5a2a', emissiveIntensity: 1.2, flatShading: true }),
    { cast: false },
  );
  body.scale.y = 1.25;
  g.add(body);
  for (const y of [-0.24, 0.24]) {
    const cap = mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 8), mat('#ffd23f'), { cast: false });
    cap.position.y = y;
    g.add(cap);
  }
  return g;
}

// Irregular pond with a sandy shore and lily pads.
export function pond(rand, radius) {
  const g = new THREE.Group();
  const outline = (scale) => {
    const shape = new THREE.Shape();
    const n = 22;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = radius * scale * (1 + 0.12 * Math.sin(a * 3 + 1) + 0.06 * Math.sin(a * 5));
      const p = [Math.cos(a) * r, Math.sin(a) * r * 0.75];
      if (i === 0) shape.moveTo(...p);
      else shape.lineTo(...p);
    }
    return new THREE.ShapeGeometry(shape);
  };
  const shore = mesh(outline(1.12), mat('#e8cf98'), { cast: false });
  shore.rotation.x = -Math.PI / 2;
  shore.position.y = 0.015;
  g.add(shore);
  const water = mesh(
    outline(1),
    new THREE.MeshStandardMaterial({ color: '#4fb8e8', roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.92 }),
    { cast: false },
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.03;
  g.add(water);
  g.userData.pads = [];
  for (let i = 0; i < 7; i++) {
    const pad = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.02, 8, 1, false, 0.3, Math.PI * 1.8), mat('#4caf50'), { cast: false });
    const a = rand() * Math.PI * 2;
    const r = rand() * radius * 0.75;
    pad.position.set(Math.cos(a) * r, 0.05, Math.sin(a) * r * 0.7);
    pad.rotation.y = rand() * 6;
    pad.userData.phase = rand() * 6;
    g.add(pad);
    g.userData.pads.push(pad);
    if (rand() < 0.5) {
      const flower = mesh(new THREE.IcosahedronGeometry(0.06, 0), mat('#f8b8cf'), { cast: false });
      flower.position.set(0.05, 0.05, 0);
      pad.add(flower);
    }
  }
  return g;
}

// ----- furniture -----------------------------------------------------------

// Low stainless-steel (inox) table, the street-food standard.
export function table(w, d, h) {
  const g = new THREE.Group();
  const steel = mat('#e1e6ea', { roughness: 0.3, metalness: 0.45 });
  const top = mesh(new THREE.BoxGeometry(w, 0.05, d), steel);
  top.position.y = h - 0.025;
  g.add(top);
  const lip = mesh(new THREE.BoxGeometry(w + 0.04, 0.07, d + 0.04), mat('#aeb5bb', { roughness: 0.35, metalness: 0.55 }));
  lip.position.y = h - 0.07;
  g.add(lip);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = mesh(new THREE.CylinderGeometry(0.03, 0.03, h - 0.08, 6), mat('#9aa2a8', { roughness: 0.35, metalness: 0.5 }));
      leg.position.set(sx * (w / 2 - 0.12), (h - 0.08) / 2, sz * (d / 2 - 0.12));
      g.add(leg);
    }
  }
  // Shelf rail near the floor.
  for (const sz of [-1, 1]) {
    const rail = mesh(new THREE.CylinderGeometry(0.02, 0.02, w - 0.24, 5), mat('#9aa2a8', { roughness: 0.35, metalness: 0.5 }));
    rail.rotation.z = Math.PI / 2;
    rail.position.set(0, 0.12, sz * (d / 2 - 0.12));
    g.add(rail);
  }
  return g;
}

// Red plastic stool, the icon of Vietnamese street food.
export function stool(color = '#e2483d') {
  const g = new THREE.Group();
  const seat = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 10), mat(color, { roughness: 0.5 }));
  seat.position.y = 0.4;
  g.add(seat);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const leg = mesh(new THREE.BoxGeometry(0.05, 0.4, 0.05), mat(color, { roughness: 0.5 }));
    leg.position.set(Math.cos(a) * 0.15, 0.2, Math.sin(a) * 0.15);
    leg.rotation.set(Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12);
    g.add(leg);
  }
  return g;
}

// ----- food ----------------------------------------------------------------

function bowlShell(band) {
  const g = new THREE.Group();
  const porcelain = mat('#f7f4ec', { roughness: 0.5 });
  const wall = mesh(
    new THREE.CylinderGeometry(0.3, 0.17, 0.18, 12, 1, true),
    mat('#f7f4ec', { roughness: 0.5, side: THREE.DoubleSide }),
  );
  wall.position.y = 0.11;
  g.add(wall);
  const base = mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.03, 10), porcelain);
  base.position.y = 0.015;
  g.add(base);
  const rim = mesh(new THREE.CylinderGeometry(0.305, 0.29, 0.04, 12, 1, true), mat(band));
  rim.position.y = 0.18;
  g.add(rim);
  return g;
}

function bits(rand, group, count, makeGeometry, color, y, spread) {
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * spread;
    const m = mesh(makeGeometry(), mat(color), { cast: false });
    m.position.set(Math.cos(a) * r, y + rand() * 0.02, Math.sin(a) * r);
    m.rotation.set(rand() * 0.4, rand() * 6, rand() * 0.4);
    group.add(m);
  }
}

// Noodle soup bowl. `contents` is hidden once the dish has been eaten.
function noodleBowl(rand, broth, band) {
  const g = bowlShell(band);
  const contents = new THREE.Group();
  const soup = mesh(new THREE.CircleGeometry(0.27, 12), mat(broth), { cast: false });
  soup.rotation.x = -Math.PI / 2;
  soup.position.y = 0.16;
  contents.add(soup);
  bits(rand, contents, 7, () => new THREE.BoxGeometry(0.2, 0.02, 0.025), '#fff6d8', 0.165, 0.15);
  bits(rand, contents, 3, () => new THREE.BoxGeometry(0.11, 0.025, 0.08), '#b5654a', 0.17, 0.14);
  bits(rand, contents, 6, () => new THREE.IcosahedronGeometry(0.035, 0), '#43a047', 0.175, 0.18);
  bits(rand, contents, 2, () => new THREE.CylinderGeometry(0.025, 0.025, 0.01, 6), '#e53935', 0.18, 0.15);
  g.add(contents);
  g.userData.contents = contents;
  return g;
}

function comTam(rand) {
  const g = new THREE.Group();
  const plate = mesh(new THREE.CylinderGeometry(0.34, 0.26, 0.05, 14), mat('#f7f4ec', { roughness: 0.5 }));
  plate.position.y = 0.025;
  g.add(plate);
  const contents = new THREE.Group();
  const rice = mesh(jitter(new THREE.IcosahedronGeometry(0.15, 1), 0.015, rand), mat('#ffffff'));
  rice.scale.y = 0.55;
  rice.position.set(-0.09, 0.08, 0.02);
  contents.add(rice);
  const white = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 10), mat('#ffffff'));
  white.position.set(0.12, 0.06, 0.11);
  contents.add(white);
  const yolk = mesh(new THREE.SphereGeometry(0.045, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), mat('#ffc22e'));
  yolk.position.set(0.12, 0.07, 0.11);
  contents.add(yolk);
  const pork = mesh(new THREE.BoxGeometry(0.24, 0.04, 0.13), mat('#a5562e'));
  pork.position.set(0.12, 0.075, -0.09);
  pork.rotation.y = 0.4;
  contents.add(pork);
  bits(rand, contents, 3, () => new THREE.CylinderGeometry(0.04, 0.04, 0.015, 8), '#7cc96b', 0.06, 0.25);
  g.add(contents);
  g.userData.contents = contents;
  return g;
}

// Chè ba màu in a tall glass.
function che() {
  const g = new THREE.Group();
  const contents = new THREE.Group();
  const layers = [
    ['#8e2f2f', 0.11],
    ['#5fbf5a', 0.1],
    ['#f4c542', 0.08],
  ];
  let y = 0.02;
  for (const [color, h] of layers) {
    const layer = mesh(new THREE.CylinderGeometry(0.105, 0.1, h, 10), mat(color));
    layer.position.y = y + h / 2;
    contents.add(layer);
    y += h;
  }
  const ice = mesh(new THREE.IcosahedronGeometry(0.1, 0), mat('#eaf6ff', { roughness: 0.3 }));
  ice.scale.y = 0.6;
  ice.position.y = y + 0.04;
  contents.add(ice);
  const straw = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 5), mat('#e53935'));
  straw.position.set(0.04, 0.32, 0);
  straw.rotation.z = -0.25;
  contents.add(straw);
  g.add(contents);
  g.userData.contents = contents;

  const glass = mesh(
    new THREE.CylinderGeometry(0.13, 0.11, 0.42, 12, 1, true),
    new THREE.MeshStandardMaterial({ color: '#dff3ff', transparent: true, opacity: 0.35, roughness: 0.1, side: THREE.DoubleSide, depthWrite: false }),
    { cast: false },
  );
  glass.position.y = 0.21;
  g.add(glass);
  return g;
}

export function dish(type, rand) {
  if (type === 'pho') return noodleBowl(rand, '#d9a85b', '#3a6fb0');
  if (type === 'bun') return noodleBowl(rand, '#d9542b', '#2e8b57');
  if (type === 'com') return comTam(rand);
  if (type === 'che') return che();
  throw new Error(`unknown dish ${type}`);
}

// ----- characters ----------------------------------------------------------

const SHIRTS = ['#4a7bd0', '#e07a3f', '#5aa65a', '#c94f7c', '#f2c94c', '#8a6fd1'];

// A diner sitting on a stool, facing +z. Exposes the right arm pivot for the
// eating animation and the wind-up pose.
export function person(rand) {
  const g = new THREE.Group();
  const shirt = pick(rand, SHIRTS);
  const skin = pick(rand, ['#f1c27d', '#e0ac69', '#f6d0a4']);
  g.add(stool());

  const pants = mat(pick(rand, ['#2f3e5c', '#3b3b44', '#5b4636']));
  const thigh = mesh(new THREE.BoxGeometry(0.36, 0.14, 0.42), pants);
  thigh.position.set(0, 0.5, 0.15);
  g.add(thigh);
  const shin = mesh(new THREE.BoxGeometry(0.32, 0.44, 0.14), pants);
  shin.position.set(0, 0.24, 0.34);
  g.add(shin);

  const torso = mesh(new THREE.BoxGeometry(0.48, 0.52, 0.3), mat(shirt));
  torso.position.y = 0.84;
  g.add(torso);

  const head = new THREE.Group();
  head.position.y = 1.28;
  const face = mesh(new THREE.IcosahedronGeometry(0.21, 1), mat(skin));
  head.add(face);
  for (const x of [-0.07, 0.07]) {
    const eye = mesh(new THREE.BoxGeometry(0.04, 0.05, 0.02), mat('#2b2b2b'), { cast: false });
    eye.position.set(x, 0.02, 0.19);
    head.add(eye);
  }
  if (rand() < 0.5) {
    // Nón lá.
    const hat = mesh(new THREE.ConeGeometry(0.4, 0.24, 10), mat('#e8d08a'));
    hat.position.y = 0.2;
    head.add(hat);
  } else {
    const hair = mesh(new THREE.SphereGeometry(0.22, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2), mat('#2b211c'));
    hair.position.set(0, 0.03, -0.02);
    hair.rotation.x = -0.25;
    head.add(hair);
  }
  g.add(head);

  const arm = (side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.3, 1.04, 0);
    const upper = mesh(new THREE.BoxGeometry(0.12, 0.42, 0.12), mat(shirt));
    upper.position.y = -0.2;
    pivot.add(upper);
    const hand = mesh(new THREE.BoxGeometry(0.11, 0.11, 0.11), mat(skin));
    hand.position.y = -0.44;
    pivot.add(hand);
    g.add(pivot);
    return pivot;
  };
  const leftArm = arm(-1);
  const rightArm = arm(1);
  leftArm.rotation.x = -1.1; // holding a bowl up
  const heldBowl = bowlShell('#3a6fb0');
  heldBowl.scale.setScalar(0.55);
  heldBowl.position.set(0, -0.5, 0.05);
  leftArm.add(heldBowl);
  const chopsticks = mesh(new THREE.BoxGeometry(0.02, 0.02, 0.35), mat('#c8a165'), { cast: false });
  chopsticks.position.set(0, -0.48, 0.15);
  rightArm.add(chopsticks);

  g.userData = { head, leftArm, rightArm, skin, shirt };
  return g;
}

// Open palm seen from above, used for the slap.
export function slapHand(skin, shirt) {
  const g = new THREE.Group();
  const palm = mesh(new THREE.BoxGeometry(0.34, 0.08, 0.36), mat(skin));
  g.add(palm);
  for (let i = 0; i < 4; i++) {
    const finger = mesh(new THREE.BoxGeometry(0.07, 0.07, 0.22), mat(skin));
    finger.position.set(-0.12 + i * 0.08, 0, 0.27);
    g.add(finger);
  }
  const thumb = mesh(new THREE.BoxGeometry(0.08, 0.07, 0.18), mat(skin));
  thumb.position.set(-0.22, 0, 0.08);
  thumb.rotation.y = 0.6;
  g.add(thumb);
  const cuff = mesh(new THREE.BoxGeometry(0.3, 0.14, 0.2), mat(shirt));
  cuff.position.set(0, 0.02, -0.26);
  g.add(cuff);
  g.scale.setScalar(1.35);
  return g;
}

// Tiny nón lá for the fly mascot; origin at the brim's centre.
export function flyHat() {
  const g = new THREE.Group();
  const cone = mesh(new THREE.ConeGeometry(0.2, 0.13, 12), mat('#ecd38c'), { cast: false });
  cone.position.y = 0.065;
  g.add(cone);
  const band = mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.025, 12), mat('#c9452f'), { cast: false });
  band.position.y = 0.035;
  g.add(band);
  return g;
}

// The fly mascot, facing +z: a big head with big glossy eyes, a small body,
// six legs and two wings. userData exposes the wing pivots, where the hat
// sits, and setExpression('normal' | 'happy' | 'dizzy').
export function fly() {
  const g = new THREE.Group();
  const shell = mat('#22262b', { roughness: 0.35 });
  const sheen = mat('#3d4a45', { roughness: 0.4 });

  const abdomen = mesh(new THREE.SphereGeometry(0.1, 8, 6), shell);
  abdomen.scale.set(1, 0.85, 1.35);
  abdomen.position.set(0, -0.02, -0.12);
  g.add(abdomen);
  for (const z of [-0.08, -0.15]) {
    const stripe = mesh(new THREE.TorusGeometry(0.083, 0.012, 4, 10), mat('#4f5d57'));
    stripe.position.set(0, -0.02, z);
    g.add(stripe);
  }
  const thorax = mesh(new THREE.SphereGeometry(0.085, 8, 6), sheen);
  thorax.position.set(0, 0, 0.0);
  g.add(thorax);

  // Head bigger than the body, cartoon style.
  const head = new THREE.Group();
  head.position.set(0, 0.07, 0.15);
  g.add(head);
  head.add(mesh(new THREE.SphereGeometry(0.15, 10, 8), shell));

  const eyes = [];
  for (const side of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(side * 0.085, 0.03, 0.1);
    const ball = mesh(new THREE.SphereGeometry(0.085, 10, 8), mat('#b3262b', { roughness: 0.25 }));
    eye.add(ball);
    const sparkle = mesh(new THREE.SphereGeometry(0.025, 6, 4), mat('#ffffff', { roughness: 0.2 }));
    sparkle.position.set(side * -0.02, 0.035, 0.07);
    eye.add(sparkle);
    // Spiral ring shown while dizzy.
    const swirl = mesh(new THREE.TorusGeometry(0.045, 0.01, 4, 12), mat('#ffffff'));
    swirl.position.z = 0.08;
    swirl.visible = false;
    eye.add(swirl);
    eye.userData = { ball, sparkle, swirl };
    head.add(eye);
    eyes.push(eye);
  }

  const mouths = {
    normal: mesh(new THREE.BoxGeometry(0.05, 0.012, 0.01), mat('#f2d0c4')),
    happy: mesh(new THREE.TorusGeometry(0.035, 0.01, 4, 10, Math.PI), mat('#f2d0c4')),
    dizzy: mesh(new THREE.TorusGeometry(0.022, 0.009, 4, 10), mat('#f2d0c4')),
  };
  mouths.normal.position.set(0, -0.07, 0.135);
  mouths.happy.position.set(0, -0.055, 0.135);
  mouths.happy.rotation.z = Math.PI; // smile
  mouths.dizzy.position.set(0, -0.07, 0.135);
  for (const m of Object.values(mouths)) head.add(m);

  // Dizzy stars circling the head.
  const stars = new THREE.Group();
  stars.position.y = 0.2;
  for (let i = 0; i < 3; i++) {
    const star = mesh(new THREE.OctahedronGeometry(0.035, 0), mat('#ffd23f', { emissive: '#ffb000', emissiveIntensity: 0.6 }));
    const a = (i / 3) * Math.PI * 2;
    star.position.set(Math.cos(a) * 0.17, 0, Math.sin(a) * 0.17);
    stars.add(star);
  }
  stars.visible = false;
  head.add(stars);

  // Hat anchor on top of the head.
  const hatAnchor = new THREE.Object3D();
  hatAnchor.position.set(0, 0.12, -0.01);
  hatAnchor.rotation.x = -0.15;
  head.add(hatAnchor);

  for (const side of [-1, 1]) {
    for (const z of [-0.05, 0.0, 0.05]) {
      const leg = mesh(new THREE.CylinderGeometry(0.008, 0.006, 0.12, 4), shell);
      leg.position.set(side * 0.06, -0.08, z);
      leg.rotation.z = side * 0.5;
      g.add(leg);
    }
  }

  const wingMat = new THREE.MeshStandardMaterial({
    color: '#e3f1ff',
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide,
    roughness: 0.2,
    depthWrite: false,
  });
  const wings = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.05, 0.07, -0.02);
    const wing = new THREE.Mesh(new THREE.CircleGeometry(0.18, 10), wingMat);
    wing.scale.set(1, 0.55, 1);
    wing.rotation.x = -Math.PI / 2;
    wing.rotation.z = side * 0.35;
    wing.position.set(side * 0.16, 0, -0.06);
    pivot.add(wing);
    pivot.userData.side = side;
    g.add(pivot);
    wings.push(pivot);
  }

  // The game draws a blob shadow right under the fly instead; a sun shadow
  // off to one side makes its position harder to read.
  g.traverse((o) => {
    if (o.isMesh) o.castShadow = false;
  });

  let current = null;
  const setExpression = (name) => {
    if (name === current) return;
    current = name;
    for (const [key, m] of Object.entries(mouths)) m.visible = key === name;
    for (const eye of eyes) {
      // Happy eyes squeeze shut into arcs; dizzy eyes show spirals.
      eye.scale.set(1, name === 'happy' ? 0.35 : 1, 1);
      eye.userData.sparkle.visible = name === 'normal';
      eye.userData.swirl.visible = name === 'dizzy';
    }
    stars.visible = name === 'dizzy';
  };
  setExpression('normal');

  g.userData = { wings, hatAnchor, stars, swirls: eyes.map((e) => e.userData.swirl), setExpression };
  g.scale.setScalar(1.7);
  return g;
}
