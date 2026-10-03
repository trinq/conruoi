import * as THREE from 'three';
import { mat, mesh, jitter, range, pick } from './lowpoly.js';
import { bakeStatic } from './bake.js';

// Low-poly model factories. Units are metres-ish; every model's origin sits
// on the ground (or on the surface it stands on) and faces +z.

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

function soup(contents, color, radius = 0.27, y = 0.16) {
  const surface = mesh(new THREE.CircleGeometry(radius, 12), mat(color), { cast: false });
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = y;
  contents.add(surface);
}

function smallPlate(radius = 0.34) {
  const plate = mesh(new THREE.CylinderGeometry(radius, radius * 0.78, 0.04, 14), mat('#f7f4ec', { roughness: 0.5 }));
  plate.position.y = 0.02;
  return plate;
}

// Phở bò: clear golden broth, rare beef, rice noodles, spring onion.
function phoBo(rand) {
  const g = bowlShell('#3a6fb0');
  const contents = new THREE.Group();
  soup(contents, '#e7c27c');
  bits(rand, contents, 8, () => new THREE.BoxGeometry(0.2, 0.02, 0.025), '#fff6d8', 0.165, 0.15);
  bits(rand, contents, 4, () => new THREE.BoxGeometry(0.13, 0.015, 0.09), '#c97b6a', 0.172, 0.13);
  bits(rand, contents, 9, () => new THREE.CylinderGeometry(0.018, 0.018, 0.012, 6), '#5fbf3a', 0.18, 0.2);
  bits(rand, contents, 3, () => new THREE.IcosahedronGeometry(0.03, 0), '#2f8f3a', 0.18, 0.16);
  g.add(contents);
  g.userData.contents = contents;
  return g;
}

// Bún chả: a bowl of dipping sauce with grilled pork patties and papaya,
// beside a plate of white vermicelli and herbs.
function bunCha(rand) {
  const g = new THREE.Group();
  const bowl = bowlShell('#c8102e');
  bowl.scale.setScalar(0.72);
  bowl.position.set(0.13, 0, -0.06);
  g.add(bowl);
  const plate = smallPlate(0.2);
  plate.position.set(-0.17, 0.02, 0.1);
  g.add(plate);

  const contents = new THREE.Group();
  const sauce = new THREE.Group();
  soup(sauce, '#c98a3c');
  bits(rand, sauce, 4, () => new THREE.IcosahedronGeometry(0.055, 0), '#6b3a1f', 0.18, 0.12);
  bits(rand, sauce, 4, () => new THREE.BoxGeometry(0.06, 0.012, 0.03), '#f2c36b', 0.185, 0.14);
  sauce.scale.setScalar(0.72);
  sauce.position.copy(bowl.position);
  contents.add(sauce);
  const noodles = mesh(jitter(new THREE.IcosahedronGeometry(0.12, 1), 0.02, rand), mat('#ffffff'), { cast: false });
  noodles.scale.set(1, 0.45, 1);
  noodles.position.set(-0.19, 0.07, 0.1);
  contents.add(noodles);
  const herbs = mesh(jitter(new THREE.IcosahedronGeometry(0.08, 0), 0.02, rand), mat('#4caf50'));
  herbs.position.set(-0.05, 0.08, 0.2);
  contents.add(herbs);
  g.add(contents);
  g.userData.contents = contents;
  return g;
}

// Bánh cuốn: rolled rice sheets with fried shallots and chả lụa slices,
// and a little bowl of fish sauce.
function banhCuon(rand) {
  const g = new THREE.Group();
  g.add(smallPlate(0.34));
  const dip = bowlShell('#3a6fb0');
  dip.scale.setScalar(0.45);
  dip.position.set(0.24, 0, -0.18);
  g.add(dip);
  const contents = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const roll = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.26, 7), mat('#f4f1e6', { roughness: 0.4 }));
    // Lying flat on the plate, angled a little.
    roll.rotation.set(0, 0.5, Math.PI / 2, 'YXZ');
    roll.position.set(-0.08 + (i % 2) * 0.02, 0.07 + Math.floor(i / 2) * 0.07, -0.12 + (i % 2) * 0.1 + Math.floor(i / 2) * 0.05);
    contents.add(roll);
  }
  bits(rand, contents, 14, () => new THREE.IcosahedronGeometry(0.014, 0), '#c98a2e', 0.15, 0.14);
  for (let i = 0; i < 3; i++) {
    const cha = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 9), mat('#f1d3c2'));
    cha.position.set(0.16 + i * 0.03, 0.05 + i * 0.012, 0.12 - i * 0.04);
    cha.rotation.x = 0.3;
    contents.add(cha);
  }
  const fishSauce = new THREE.Group();
  soup(fishSauce, '#d9893a');
  fishSauce.scale.setScalar(0.45);
  fishSauce.position.copy(dip.position);
  contents.add(fishSauce);
  g.add(contents);
  g.userData.contents = contents;
  return g;
}

// Scatters bits over a mound (a heap of rice) of radius `radius` whose top
// is `rise` above `y`, so they sit on its surface.
function moundBits(rand, group, count, makeGeometry, color, y, radius, rise) {
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * radius * 0.85;
    const m = mesh(makeGeometry(), mat(color), { cast: false });
    m.position.set(Math.cos(a) * r, y + rise * Math.sqrt(1 - (r / radius) ** 2), Math.sin(a) * r);
    m.rotation.set(rand() * 0.6, rand() * 6, rand() * 0.6);
    group.add(m);
  }
}

const lyingNoodle = (length, radius = 0.013) => () => new THREE.CylinderGeometry(radius, radius, length, 5).rotateZ(Math.PI / 2);

// Bún bò Huế: red, chilli-oiled broth with thick round noodles, beef, a
// slice of pork knuckle, cubes of blood cake and a wedge of lime.
function bunBoHue(rand) {
  const g = bowlShell('#8a2a1e');
  const contents = new THREE.Group();
  soup(contents, '#d2552a');
  bits(rand, contents, 7, () => new THREE.CircleGeometry(0.035, 6).rotateX(-Math.PI / 2), '#a8261a', 0.162, 0.22);
  bits(rand, contents, 9, lyingNoodle(0.2, 0.016), '#fbf3e0', 0.17, 0.14);
  bits(rand, contents, 3, () => new THREE.BoxGeometry(0.12, 0.015, 0.08), '#7a3f30', 0.175, 0.14);
  bits(rand, contents, 3, () => new THREE.BoxGeometry(0.06, 0.05, 0.06), '#5a1e1e', 0.18, 0.15);
  const knuckle = mesh(new THREE.TorusGeometry(0.055, 0.03, 5, 9), mat('#f0d9b8'), { cast: false });
  knuckle.rotation.x = -Math.PI / 2;
  knuckle.position.set(-0.06, 0.185, 0.05);
  contents.add(knuckle);
  const bone = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 7), mat('#e3b49a'), { cast: false });
  bone.position.set(-0.06, 0.185, 0.05);
  contents.add(bone);
  bits(rand, contents, 8, () => new THREE.CylinderGeometry(0.018, 0.018, 0.012, 6), '#5fbf3a', 0.19, 0.2);
  const lime = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 8, 1, false, 0, Math.PI), mat('#7cc242'), { cast: false });
  lime.rotation.set(Math.PI / 2, 0, 0.4);
  lime.position.set(0.24, 0.2, -0.12);
  contents.add(lime);
  g.add(contents);
  g.userData.contents = contents;
  return g;
}

// Cơm hến: a small bowl of rice heaped with baby clams, crackling, peanuts
// and herbs, with a cup of clam broth on the side.
function comHen(rand) {
  const g = new THREE.Group();
  const bowl = bowlShell('#3a6fb0');
  bowl.scale.setScalar(0.8);
  g.add(bowl);
  const cup = bowlShell('#3a6fb0');
  cup.scale.setScalar(0.42);
  cup.position.set(0.27, 0, -0.17);
  g.add(cup);

  const contents = new THREE.Group();
  const rice = mesh(jitter(new THREE.IcosahedronGeometry(0.19, 1), 0.012, rand), mat('#fbfaf2'));
  rice.scale.y = 0.45;
  rice.position.y = 0.13;
  contents.add(rice);
  const [y, r, rise] = [0.13, 0.19, 0.085];
  moundBits(rand, contents, 28, () => new THREE.IcosahedronGeometry(0.026, 0).scale(1.3, 0.6, 1), pick(rand, ['#6b5a3a', '#7a6642']), y, r, rise);
  moundBits(rand, contents, 8, () => new THREE.BoxGeometry(0.04, 0.03, 0.04), '#e8b04a', y, r, rise);
  moundBits(rand, contents, 8, () => new THREE.IcosahedronGeometry(0.018, 0), '#c9925a', y, r, rise);
  moundBits(rand, contents, 10, () => new THREE.BoxGeometry(0.06, 0.01, 0.018), '#4caf50', y, r, rise);
  moundBits(rand, contents, 4, () => new THREE.CylinderGeometry(0.014, 0.014, 0.008, 6), '#e53935', y, r, rise);
  const broth = new THREE.Group();
  soup(broth, '#d8cfa4');
  broth.scale.setScalar(0.42);
  broth.position.copy(cup.position);
  contents.add(broth);
  g.add(contents);
  g.userData.contents = contents;
  return g;
}

// Bánh bèo: a tray of little saucers, each with a steamed rice cake topped
// with shrimp floss and crackling.
function banhBeo(rand) {
  const g = new THREE.Group();
  const tray = mesh(new THREE.CylinderGeometry(0.34, 0.32, 0.03, 16), mat('#b08850'));
  tray.position.y = 0.015;
  g.add(tray);
  const contents = new THREE.Group();
  const spots = [[0, 0]];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    spots.push([Math.cos(a) * 0.2, Math.sin(a) * 0.2]);
  }
  for (const [x, z] of spots) {
    const saucer = mesh(new THREE.CylinderGeometry(0.08, 0.055, 0.035, 10), mat('#f7f4ec', { roughness: 0.5 }));
    saucer.position.set(x, 0.048, z);
    g.add(saucer);
    const rim = mesh(new THREE.TorusGeometry(0.078, 0.006, 3, 10), mat('#3a6fb0'), { cast: false });
    rim.rotation.x = -Math.PI / 2;
    rim.position.set(x, 0.066, z);
    g.add(rim);
    const cake = mesh(new THREE.CylinderGeometry(0.062, 0.055, 0.018, 10), mat('#f4f1e6'), { cast: false });
    cake.position.set(x, 0.07, z);
    contents.add(cake);
    const floss = mesh(jitter(new THREE.IcosahedronGeometry(0.03, 0), 0.006, rand), mat('#e8743a'), { cast: false });
    floss.scale.y = 0.5;
    floss.position.set(x, 0.085, z);
    contents.add(floss);
    const rind = mesh(new THREE.BoxGeometry(0.022, 0.018, 0.022), mat('#f2d27a'), { cast: false });
    rind.position.set(x + 0.03, 0.088, z - 0.02);
    contents.add(rind);
  }
  g.add(contents);
  g.userData.contents = contents;
  return g;
}

// Cao lầu: thick amber noodles in a little dark sauce, slices of xá xíu,
// square crackers stood up in the bowl and fresh greens.
function caoLau(rand) {
  const g = bowlShell('#5a3a22');
  const contents = new THREE.Group();
  soup(contents, '#8a5a2e', 0.25, 0.13);
  bits(rand, contents, 10, lyingNoodle(0.2, 0.02), '#dcaa58', 0.15, 0.13);
  bits(rand, contents, 4, () => new THREE.BoxGeometry(0.13, 0.02, 0.08), '#b3503e', 0.175, 0.12);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    const cracker = mesh(new THREE.BoxGeometry(0.09, 0.012, 0.09), mat('#e8c070'), { cast: false });
    cracker.position.set(Math.cos(a) * 0.15, 0.21, Math.sin(a) * 0.15);
    cracker.rotation.set(0.9, -a, 0, 'YXZ');
    contents.add(cracker);
  }
  bits(rand, contents, 6, () => new THREE.IcosahedronGeometry(0.045, 0), '#5cae3a', 0.19, 0.12);
  bits(rand, contents, 6, lyingNoodle(0.07, 0.008), '#f4f1e0', 0.19, 0.14);
  g.add(contents);
  g.userData.contents = contents;
  return g;
}

// Mì Quảng: wide turmeric noodles in a shallow broth with shrimp, pork,
// quail eggs, peanuts and herbs, and a sesame rice cracker on the rim.
function miQuang(rand) {
  const g = bowlShell('#2e8b57');
  const contents = new THREE.Group();
  soup(contents, '#e2a03a', 0.26, 0.14);
  bits(rand, contents, 8, () => new THREE.BoxGeometry(0.2, 0.008, 0.045), '#f2cf5a', 0.155, 0.13);
  bits(rand, contents, 3, () => new THREE.TorusGeometry(0.035, 0.016, 4, 8, Math.PI * 1.3).rotateX(Math.PI / 2), '#f07a3a', 0.17, 0.13);
  bits(rand, contents, 2, () => new THREE.BoxGeometry(0.1, 0.018, 0.07), '#c9785a', 0.168, 0.12);
  for (let i = 0; i < 2; i++) {
    const egg = mesh(new THREE.SphereGeometry(0.03, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), mat('#fbf8ee'), { cast: false });
    egg.position.set(-0.08 + i * 0.1, 0.16, 0.08 - i * 0.05);
    contents.add(egg);
    const yolk = mesh(new THREE.CircleGeometry(0.014, 7).rotateX(-Math.PI / 2), mat('#f5b82e'), { cast: false });
    yolk.position.set(egg.position.x, 0.19, egg.position.z);
    contents.add(yolk);
  }
  bits(rand, contents, 8, () => new THREE.IcosahedronGeometry(0.016, 0), '#c9925a', 0.175, 0.16);
  bits(rand, contents, 5, () => new THREE.IcosahedronGeometry(0.035, 0), '#4caf50', 0.18, 0.15);
  const cracker = mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.012, 12), mat('#e6c78a'), { cast: false });
  cracker.position.set(0.2, 0.25, -0.1);
  cracker.rotation.set(0, 0.4, 0.95, 'YXZ');
  for (let i = 0; i < 12; i++) {
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * 0.14;
    const seed = mesh(new THREE.BoxGeometry(0.014, 0.006, 0.008), mat('#2a2420'), { cast: false });
    seed.position.set(Math.cos(a) * r, 0.008, Math.sin(a) * r);
    cracker.add(seed);
  }
  contents.add(cracker);
  g.add(contents);
  g.userData.contents = contents;
  return g;
}

// Bánh mì on its paper: a crusty loaf split open along the side, showing
// pâté, ham, pickled carrot, herbs and chilli.
function banhMi(rand) {
  const g = new THREE.Group();
  const paper = mesh(new THREE.BoxGeometry(0.46, 0.008, 0.32), mat('#efe6d0'));
  paper.position.y = 0.004;
  paper.rotation.y = 0.15;
  g.add(paper);
  const contents = new THREE.Group();
  const loaf = mesh(new THREE.CapsuleGeometry(0.075, 0.28, 3, 8), mat('#d9963a', { roughness: 0.7 }));
  loaf.rotation.z = Math.PI / 2;
  loaf.scale.set(0.85, 1, 1);
  loaf.position.y = 0.075;
  contents.add(loaf);
  for (let i = 0; i < 3; i++) {
    const cut = mesh(new THREE.BoxGeometry(0.02, 0.01, 0.09), mat('#b8742a'), { cast: false });
    cut.position.set(-0.1 + i * 0.1, 0.14, -0.01);
    cut.rotation.y = 0.5;
    contents.add(cut);
  }
  const fillings = [
    ['#7a4a35', 0.012, 0.05],
    ['#e8a0a0', 0.02, 0.065],
    ['#f08a24', 0.03, 0.075],
    ['#4caf50', 0.035, 0.085],
  ];
  for (const [colour, , z] of fillings) {
    for (let i = 0; i < 5; i++) {
      const bit = mesh(new THREE.BoxGeometry(0.07, 0.025, 0.02), mat(colour), { cast: false });
      bit.position.set(-0.16 + i * 0.08 + range(rand, -0.02, 0.02), 0.085 + range(rand, -0.01, 0.01), z);
      bit.rotation.y = range(rand, -0.3, 0.3);
      contents.add(bit);
    }
  }
  bits(rand, contents, 3, () => new THREE.CylinderGeometry(0.01, 0.01, 0.04, 5).rotateZ(Math.PI / 2), '#e53935', 0.1, 0.08);
  contents.children.at(-1).position.z = 0.08;
  g.add(contents);
  g.userData.contents = contents;
  return g;
}

// Hủ tiếu Nam Vang: clear pork broth over thin, glassy rice noodles,
// topped with shrimp, sliced pork, minced pork, quail eggs, chives and
// fried garlic.
function huTieu(rand) {
  const g = bowlShell('#e07a1f');
  const contents = new THREE.Group();
  soup(contents, '#e9d9a6');
  bits(rand, contents, 14, lyingNoodle(0.2, 0.007), '#f6f2e6', 0.165, 0.15);
  // Shrimp curled into pink half-rings.
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + rand();
    const shrimp = mesh(new THREE.TorusGeometry(0.04, 0.017, 4, 8, Math.PI * 1.4), mat('#f2875a'), { cast: false });
    shrimp.rotation.set(-Math.PI / 2, 0, a);
    shrimp.position.set(Math.cos(a) * 0.13, 0.18, Math.sin(a) * 0.13);
    contents.add(shrimp);
    const tail = mesh(new THREE.BoxGeometry(0.025, 0.012, 0.03), mat('#e2563a'), { cast: false });
    tail.position.set(shrimp.position.x + Math.cos(a + 1.2) * 0.04, 0.185, shrimp.position.z + Math.sin(a + 1.2) * 0.04);
    contents.add(tail);
  }
  bits(rand, contents, 3, () => new THREE.BoxGeometry(0.11, 0.014, 0.07), '#f0d0c0', 0.172, 0.12);
  bits(rand, contents, 10, () => new THREE.IcosahedronGeometry(0.018, 0), '#9a6448', 0.172, 0.1);
  for (let i = 0; i < 2; i++) {
    const egg = mesh(new THREE.SphereGeometry(0.032, 8, 5), mat('#f6f0de'), { cast: false });
    egg.scale.y = 0.8;
    egg.position.set(-0.05 + i * 0.09, 0.18, -0.09 + i * 0.03);
    contents.add(egg);
  }
  bits(rand, contents, 10, lyingNoodle(0.06, 0.008), '#3f9a32', 0.182, 0.18);
  bits(rand, contents, 12, () => new THREE.IcosahedronGeometry(0.01, 0), '#d9a23a', 0.185, 0.16);
  // A few torn lettuce leaves at the side of the bowl.
  for (let i = 0; i < 3; i++) {
    const leaf = mesh(new THREE.BoxGeometry(0.07, 0.008, 0.05), mat('#8fd15a'), { cast: false });
    leaf.position.set(0.17 + i * 0.02, 0.19 + i * 0.006, 0.06 + i * 0.03);
    leaf.rotation.set(0.3, rand() * 3, 0.2);
    contents.add(leaf);
  }
  g.add(contents);
  g.userData.contents = contents;
  return g;
}

// Cơm tấm sườn bì chả: broken rice on a plate with a grilled pork chop,
// shredded pork skin, a slab of steamed egg meatloaf, a fried egg, pickles
// and cucumber, scallion oil on the rice, and a cup of fish sauce.
function comTamSuon(rand) {
  const g = new THREE.Group();
  const plate = mesh(new THREE.CylinderGeometry(0.36, 0.28, 0.04, 16), mat('#f7f4ec', { roughness: 0.5 }));
  plate.scale.z = 0.82;
  plate.position.y = 0.02;
  g.add(plate);
  const cup = bowlShell('#3a6fb0');
  cup.scale.setScalar(0.32);
  cup.position.set(0.3, 0, -0.24);
  g.add(cup);

  const contents = new THREE.Group();
  const rice = mesh(jitter(new THREE.IcosahedronGeometry(0.14, 1), 0.012, rand), mat('#fbfaf0'));
  rice.scale.set(1.1, 0.5, 1);
  rice.position.set(-0.12, 0.07, 0.03);
  contents.add(rice);
  moundBits(rand, contents, 8, () => new THREE.BoxGeometry(0.03, 0.01, 0.012), '#5fbf3a', 0.07, 0.13, 0.07);
  // Sườn: a grilled chop with the bone along one edge and char marks.
  const chop = mesh(new THREE.BoxGeometry(0.24, 0.035, 0.14), mat('#9a4a22'));
  chop.position.set(0.1, 0.06, -0.06);
  chop.rotation.y = 0.35;
  contents.add(chop);
  for (let i = 0; i < 3; i++) {
    const mark = mesh(new THREE.BoxGeometry(0.02, 0.008, 0.13), mat('#4a2412'), { cast: false });
    mark.position.set(-0.07 + i * 0.07, 0.02, 0);
    chop.add(mark);
  }
  const bone = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 5), mat('#efe2c8'), { cast: false });
  bone.rotation.z = Math.PI / 2;
  bone.position.set(0, 0.012, -0.07);
  chop.add(bone);
  // Bì: a nest of pale shredded skin.
  bits(rand, contents, 12, lyingNoodle(0.08, 0.006), '#efe0b8', 0.05, 0.05);
  for (const c of contents.children.slice(-12)) c.position.add(new THREE.Vector3(-0.05, 0, -0.17));
  // Chả trứng: steamed egg meatloaf with its yellow top.
  const cha = mesh(new THREE.BoxGeometry(0.1, 0.045, 0.08), mat('#c99a6a'));
  cha.position.set(0.17, 0.06, 0.1);
  contents.add(cha);
  const chaTop = mesh(new THREE.BoxGeometry(0.1, 0.012, 0.08), mat('#f2b43a'), { cast: false });
  chaTop.position.set(0.17, 0.088, 0.1);
  contents.add(chaTop);
  // Trứng ốp la on the rice.
  const white = mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.012, 10), mat('#ffffff'), { cast: false });
  white.position.set(-0.13, 0.135, 0.06);
  white.rotation.x = -0.15;
  contents.add(white);
  const yolk = mesh(new THREE.SphereGeometry(0.032, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), mat('#ffb21e'), { cast: false });
  yolk.position.set(-0.13, 0.14, 0.06);
  contents.add(yolk);
  // Đồ chua and cucumber slices along the rim.
  for (let i = 0; i < 6; i++) {
    const stick = mesh(new THREE.BoxGeometry(0.06, 0.012, 0.012), mat(i % 2 ? '#f08a24' : '#f4f0e0'), { cast: false });
    stick.position.set(0.02 + range(rand, -0.03, 0.03), 0.05, 0.2 + range(rand, -0.02, 0.02));
    stick.rotation.y = range(rand, -0.6, 0.6);
    contents.add(stick);
  }
  for (let i = 0; i < 3; i++) {
    const slice = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.012, 8), mat('#a8d878'), { cast: false });
    slice.position.set(-0.26 + i * 0.04, 0.05 + i * 0.004, -0.1 + i * 0.05);
    contents.add(slice);
  }
  const sauce = new THREE.Group();
  soup(sauce, '#d9893a');
  sauce.scale.setScalar(0.32);
  sauce.position.copy(cup.position);
  contents.add(sauce);
  g.add(contents);
  g.userData.contents = contents;
  return g;
}

// Lẩu: a hot pot of sour, chilli-red broth on a little gas stove, full of
// shrimp, squid rings, mushrooms, tomato and greens.
function lau(rand) {
  const g = new THREE.Group();
  const stove = mesh(new THREE.BoxGeometry(0.4, 0.09, 0.34), mat('#2b2b30', { roughness: 0.4 }));
  stove.position.y = 0.045;
  g.add(stove);
  const knob = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.03, 8), mat('#d62a1e'), { cast: false });
  knob.rotation.x = Math.PI / 2;
  knob.position.set(0.12, 0.045, 0.18);
  g.add(knob);
  const grate = mesh(new THREE.TorusGeometry(0.13, 0.012, 4, 10), mat('#55595e'), { cast: false });
  grate.rotation.x = -Math.PI / 2;
  grate.position.y = 0.095;
  g.add(grate);
  const steel = mat('#c9cfd4', { roughness: 0.3, metalness: 0.5, side: THREE.DoubleSide });
  const pot = mesh(new THREE.CylinderGeometry(0.29, 0.26, 0.17, 16, 1, true), steel);
  pot.position.y = 0.185;
  g.add(pot);
  const bottom = mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.02, 16), mat('#aeb5bb', { roughness: 0.3, metalness: 0.5 }));
  bottom.position.y = 0.11;
  g.add(bottom);
  for (const side of [-1, 1]) {
    const handle = mesh(new THREE.TorusGeometry(0.05, 0.012, 4, 8, Math.PI), mat('#2b2b30'));
    handle.rotation.set(0, side * (Math.PI / 2), 0);
    handle.position.set(side * 0.3, 0.24, 0);
    g.add(handle);
  }

  const contents = new THREE.Group();
  soup(contents, '#d9502a', 0.275, 0.24);
  // Chilli oil floating on top.
  bits(rand, contents, 8, () => new THREE.CircleGeometry(0.03, 6).rotateX(-Math.PI / 2), '#b8261a', 0.243, 0.22);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + rand();
    const shrimp = mesh(new THREE.TorusGeometry(0.045, 0.018, 4, 8, Math.PI * 1.4), mat('#f2875a'), { cast: false });
    shrimp.rotation.set(-Math.PI / 2, 0, a);
    shrimp.position.set(Math.cos(a) * 0.17, 0.255, Math.sin(a) * 0.17);
    contents.add(shrimp);
  }
  bits(rand, contents, 5, () => new THREE.TorusGeometry(0.03, 0.012, 4, 8).rotateX(Math.PI / 2), '#f6f0e4', 0.25, 0.16);
  // Enoki: a bunch of thin white stems with tiny caps.
  for (let i = 0; i < 7; i++) {
    const stem = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.12, 4), mat('#f4efe0'), { cast: false });
    stem.position.set(-0.08 + i * 0.012, 0.275, 0.05 + (i % 2) * 0.01);
    stem.rotation.z = 1.2 + (i % 3) * 0.08;
    contents.add(stem);
  }
  bits(rand, contents, 4, () => new THREE.SphereGeometry(0.03, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2), '#8a5a36', 0.248, 0.18);
  bits(rand, contents, 3, () => new THREE.CylinderGeometry(0.045, 0.045, 0.02, 3, 1, false, 0, Math.PI), '#e8402a', 0.252, 0.15);
  bits(rand, contents, 6, () => new THREE.BoxGeometry(0.09, 0.012, 0.04), '#3f9a32', 0.255, 0.2);
  bits(rand, contents, 4, () => new THREE.CylinderGeometry(0.01, 0.01, 0.006, 6), '#e53935', 0.262, 0.2);
  g.add(contents);
  g.userData.contents = contents;
  return g;
}

// Ốc len xào dừa: a heap of spiral snail shells in a creamy coconut sauce
// with rau răm and chilli, and a saucer of salt, pepper and lime.
function ocXao(rand) {
  const g = new THREE.Group();
  const plate = mesh(new THREE.CylinderGeometry(0.33, 0.26, 0.04, 16), mat('#f7f4ec', { roughness: 0.5 }));
  plate.scale.z = 0.78;
  plate.position.y = 0.02;
  g.add(plate);
  const saucer = mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.025, 10), mat('#f7f4ec', { roughness: 0.5 }));
  saucer.position.set(0.3, 0.0125, -0.22);
  g.add(saucer);

  const contents = new THREE.Group();
  const sauce = mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.012, 14), mat('#f0c06a'), { cast: false });
  sauce.scale.z = 0.78;
  sauce.position.y = 0.045;
  contents.add(sauce);
  // Each shell: a long, thin, twisted cone with a pale band, lying in a
  // loose heap.
  const shellGeo = new THREE.ConeGeometry(0.03, 0.12, 6, 3);
  shellGeo.rotateX(Math.PI / 2);
  for (let i = 0; i < 18; i++) {
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * 0.17;
    const layer = r < 0.08 ? 1 : 0;
    const shell = mesh(shellGeo, mat(pick(rand, ['#4a3a2a', '#5c4632', '#3d3026'])), { cast: false });
    shell.position.set(Math.cos(a) * r, 0.075 + layer * 0.04 + rand() * 0.015, Math.sin(a) * r * 0.78);
    shell.rotation.set(range(rand, -0.4, 0.2), rand() * 6, range(rand, -0.3, 0.3));
    contents.add(shell);
    const band = mesh(new THREE.TorusGeometry(0.022, 0.006, 3, 6), mat('#d9c9a8'), { cast: false });
    band.position.copy(shell.position);
    band.rotation.copy(shell.rotation);
    band.translateZ(0.015);
    contents.add(band);
  }
  bits(rand, contents, 10, () => new THREE.BoxGeometry(0.05, 0.008, 0.018), '#3f8f2c', 0.12, 0.18);
  bits(rand, contents, 5, () => new THREE.CylinderGeometry(0.009, 0.009, 0.05, 5).rotateZ(Math.PI / 2), '#e53935', 0.12, 0.16);
  const salt = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.01, 10), mat('#d8d2c2'), { cast: false });
  salt.position.set(0.3, 0.028, -0.22);
  contents.add(salt);
  const lime = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 8, 1, false, 0, Math.PI), mat('#7cc242'), { cast: false });
  lime.rotation.set(Math.PI / 2, 0, 0.6);
  lime.position.set(0.33, 0.045, -0.2);
  contents.add(lime);
  g.add(contents);
  g.userData.contents = contents;
  return g;
}

// Bánh tráng nướng: a round of rice paper grilled crisp over charcoal,
// spread with egg and topped with scallions, dried shrimp, sausage slices
// and zigzags of mayonnaise and chilli sauce, on a square of paper.
function banhTrangNuong(rand) {
  const g = new THREE.Group();
  const paper = mesh(new THREE.BoxGeometry(0.48, 0.008, 0.48), mat('#efe6d0'));
  paper.position.y = 0.004;
  paper.rotation.y = 0.3;
  g.add(paper);
  const contents = new THREE.Group();
  const sheet = mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.012, 16), mat('#f0d9a0'));
  sheet.position.y = 0.014;
  contents.add(sheet);
  // Char spots round the edge.
  for (let i = 0; i < 9; i++) {
    const a = rand() * Math.PI * 2;
    const spot = mesh(new THREE.CircleGeometry(0.02, 5).rotateX(-Math.PI / 2), mat('#8a5a2a'), { cast: false });
    spot.position.set(Math.cos(a) * 0.18, 0.021, Math.sin(a) * 0.18);
    contents.add(spot);
  }
  const egg = mesh(jitter(new THREE.CylinderGeometry(0.16, 0.16, 0.01, 12), 0.015, rand), mat('#f2a72e'), { cast: false });
  egg.position.y = 0.024;
  contents.add(egg);
  bits(rand, contents, 12, () => new THREE.BoxGeometry(0.03, 0.01, 0.012), '#4caf50', 0.032, 0.15);
  bits(rand, contents, 10, () => new THREE.IcosahedronGeometry(0.012, 0), '#e8743a', 0.034, 0.14);
  bits(rand, contents, 5, () => new THREE.CylinderGeometry(0.022, 0.022, 0.01, 8), '#c0392b', 0.034, 0.12);
  for (const [colour, z] of [
    ['#fff5d6', -0.06],
    ['#e53935', 0.06],
  ]) {
    for (let i = 0; i < 5; i++) {
      const zig = mesh(new THREE.BoxGeometry(0.075, 0.008, 0.012), mat(colour), { cast: false });
      zig.position.set(-0.12 + i * 0.06, 0.04, z);
      zig.rotation.y = i % 2 ? 0.7 : -0.7;
      contents.add(zig);
    }
  }
  g.add(contents);
  g.userData.contents = contents;
  return g;
}

// Xiên que: skewers of fried fish balls and scored sausages in a paper
// tray, with a dab of chilli sauce. Eaten, only the bare sticks are left.
function xienQue(rand) {
  const g = new THREE.Group();
  const tray = mesh(new THREE.BoxGeometry(0.4, 0.05, 0.26), mat('#e9dcc0'));
  tray.position.y = 0.025;
  g.add(tray);
  const contents = new THREE.Group();
  const stick = mat('#d9b97a');
  for (let i = 0; i < 4; i++) {
    const z = -0.08 + i * 0.055;
    const yaw = range(rand, -0.15, 0.15);
    const skewer = new THREE.Group();
    skewer.position.set(0, 0.07, z);
    skewer.rotation.y = yaw;
    const s = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.46, 4), stick, { cast: false });
    s.rotation.z = Math.PI / 2;
    skewer.add(s);
    g.add(skewer);
    const food = skewer.clone(false);
    food.position.copy(skewer.position);
    if (i % 2 === 0) {
      for (let k = 0; k < 4; k++) {
        const ball = mesh(new THREE.IcosahedronGeometry(0.03, 1), mat('#c98a3a'), { cast: false });
        ball.position.x = -0.1 + k * 0.065;
        food.add(ball);
      }
    } else {
      for (let k = 0; k < 2; k++) {
        const sausage = mesh(new THREE.CapsuleGeometry(0.022, 0.07, 2, 6).rotateZ(Math.PI / 2), mat('#d0453a'), { cast: false });
        sausage.position.x = -0.07 + k * 0.12;
        food.add(sausage);
        for (let c = 0; c < 3; c++) {
          const cut = mesh(new THREE.BoxGeometry(0.006, 0.01, 0.03), mat('#8a2a20'), { cast: false });
          cut.position.set(sausage.position.x - 0.03 + c * 0.03, 0.02, 0);
          food.add(cut);
        }
      }
    }
    contents.add(food);
  }
  const chilli = mesh(jitter(new THREE.CylinderGeometry(0.04, 0.05, 0.015, 8), 0.008, rand), mat('#d9301f'), { cast: false });
  chilli.position.set(0.15, 0.06, 0.09);
  contents.add(chilli);
  g.add(contents);
  g.userData.contents = contents;
  return g;
}

const DISH_BUILDERS = {
  che: () => che(),
  'pho-bo': phoBo,
  'bun-cha': bunCha,
  'banh-cuon': banhCuon,
  'bun-bo-hue': bunBoHue,
  'com-hen': comHen,
  'banh-beo': banhBeo,
  'cao-lau': caoLau,
  'mi-quang': miQuang,
  'banh-mi': banhMi,
  'hu-tieu': huTieu,
  'com-tam': comTamSuon,
  lau,
  'oc-xao': ocXao,
  'banh-trang-nuong': banhTrangNuong,
  'xien-que': xienQue,
};

// Builds a dish model; every dish exposes `userData.contents`, hidden once
// the dish has been eaten.
export function dish(type, rand) {
  const build = DISH_BUILDERS[type];
  if (!build) throw new Error(`unknown dish ${type}`);
  // A dish is dozens of little pieces; merge them into a few meshes, keeping
  // the contents separate so they can still be hidden.
  const model = build(rand);
  const { contents } = model.userData;
  model.remove(contents);
  const merged = bakeStatic(model);
  merged.userData.contents = bakeStatic(contents);
  merged.add(merged.userData.contents);
  return merged;
}

// ----- characters ----------------------------------------------------------

const SKINS = ['#f1c27d', '#e0ac69', '#f6d0a4', '#d9a066'];

// Who sits at the stalls. Each archetype picks its clothes; `south` weights
// how common it is in the southern regions instead of the default weight.
const ARCHETYPES = {
  // Chú xe ôm: helmet still on, windbreaker, long trousers.
  xeOm: {
    weight: 2,
    south: 2,
    outfit: (rand) => ({
      shirt: pick(rand, ['#2f4a7a', '#55624a', '#7a5a3a']),
      pants: '#3b3b44',
      hair: 'short',
      hat: 'helmet',
      helmet: pick(rand, ['#ffd23f', '#e2483d', '#2f6fdf', '#ffffff', '#f08ac0']),
    }),
  },
  // Cô văn phòng: long hair, blouse, dark trousers.
  vanPhong: {
    weight: 2,
    south: 1.5,
    outfit: (rand) => ({
      shirt: pick(rand, ['#ffffff', '#f6d6e0', '#d6e8f6', '#f3e7c8']),
      pants: pick(rand, ['#2b2b33', '#3a3550']),
      hair: 'long',
    }),
  },
  // Học sinh: white shirt, navy trousers and the red Young Pioneer scarf.
  hocSinh: {
    weight: 1.5,
    south: 1.5,
    outfit: () => ({ shirt: '#f7f7f2', pants: '#1f2f5c', hair: 'short', scarf: true }),
  },
  // Ông áo ba lỗ: white vest, bare arms, shorts, balding.
  ongBaLo: {
    weight: 2,
    south: 2,
    outfit: () => ({ shirt: '#f2f2ec', sleeve: 'skin', pants: '#3f5a7a', shorts: true, hair: 'bald' }),
  },
  // Cô áo bà ba: buttoned blouse, black silk trousers, hair in a bun.
  aoBaBa: {
    weight: 0.5,
    south: 3,
    outfit: (rand) => ({
      shirt: pick(rand, ['#c9a27a', '#d9b8d0', '#9fbfa0', '#e8d2a8']),
      pants: '#1b1b1f',
      hair: 'bun',
      buttons: true,
      hat: rand() < 0.4 ? 'nonla' : null,
    }),
  },
  // Bác đội nón lá.
  bacNonLa: {
    weight: 1.5,
    south: 1,
    outfit: (rand) => ({ shirt: pick(rand, ['#6b6f4a', '#7a5a3a', '#4f6a6a']), pants: '#3a3a30', hair: 'short', hat: 'nonla' }),
  },
};

export const ARCHETYPE_NAMES = Object.keys(ARCHETYPES);

export function pickArchetype(rand, { south = false } = {}) {
  const entries = Object.entries(ARCHETYPES);
  const total = entries.reduce((sum, [, a]) => sum + (south ? a.south : a.weight), 0);
  let r = rand() * total;
  for (const [name, a] of entries) {
    r -= south ? a.south : a.weight;
    if (r <= 0) return name;
  }
  return entries[0][0];
}

function hair(style, colour) {
  const g = new THREE.Group();
  const m = mat(colour);
  if (style === 'bald') {
    // A fringe around the back of the head only.
    const fringe = mesh(new THREE.TorusGeometry(0.17, 0.05, 4, 10, Math.PI), m);
    fringe.rotation.set(Math.PI / 2, 0, Math.PI);
    fringe.position.set(0, -0.02, -0.03);
    g.add(fringe);
    return g;
  }
  const cap = mesh(new THREE.SphereGeometry(0.22, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2), m);
  cap.position.set(0, 0.03, -0.02);
  cap.rotation.x = -0.25;
  g.add(cap);
  if (style === 'long') {
    const back = mesh(new THREE.BoxGeometry(0.36, 0.5, 0.12), m);
    back.position.set(0, -0.2, -0.15);
    g.add(back);
  }
  if (style === 'bun') {
    const bun = mesh(new THREE.SphereGeometry(0.09, 6, 5), m);
    bun.position.set(0, 0.05, -0.22);
    g.add(bun);
  }
  return g;
}

// A diner sitting on a stool, facing +z, dressed as `archetype`. Exposes
// the head and arm pivots for the eating animation and the wind-up pose,
// plus the skin and sleeve colours for the slapping hand.
export function person(rand, archetype = pickArchetype(rand)) {
  const outfit = ARCHETYPES[archetype].outfit(rand);
  const g = new THREE.Group();
  const skin = pick(rand, SKINS);
  const shirt = outfit.shirt;
  const sleeve = outfit.sleeve === 'skin' ? skin : shirt;
  g.add(stool(rand() < 0.5 ? '#e2483d' : '#2f6fdf'));

  const pants = mat(outfit.pants);
  const thigh = mesh(new THREE.BoxGeometry(0.36, 0.14, 0.42), pants);
  thigh.position.set(0, 0.5, 0.15);
  g.add(thigh);
  // Shorts stop at the knee and show bare shins.
  const shin = mesh(new THREE.BoxGeometry(0.32, 0.44, 0.14), outfit.shorts ? mat(skin) : pants);
  shin.position.set(0, 0.24, 0.34);
  g.add(shin);
  for (const x of [-0.09, 0.09]) {
    const sandal = mesh(new THREE.BoxGeometry(0.12, 0.04, 0.22), mat('#3a2a20'));
    sandal.position.set(x, 0.02, 0.38);
    g.add(sandal);
  }

  const torso = mesh(new THREE.BoxGeometry(0.48, 0.52, 0.3), mat(shirt));
  torso.position.y = 0.84;
  g.add(torso);
  if (outfit.sleeve === 'skin') {
    // Vest straps leave the shoulders bare.
    for (const x of [-0.19, 0.19]) {
      const shoulder = mesh(new THREE.BoxGeometry(0.1, 0.1, 0.3), mat(skin));
      shoulder.position.set(x, 1.06, 0);
      g.add(shoulder);
    }
  }
  if (outfit.buttons) {
    for (let i = 0; i < 4; i++) {
      const b = mesh(new THREE.SphereGeometry(0.018, 5, 4), mat('#f4efe2'), { cast: false });
      b.position.set(0.06, 1.0 - i * 0.1, 0.155);
      g.add(b);
    }
  }
  if (outfit.scarf) {
    const scarf = mesh(new THREE.BoxGeometry(0.3, 0.06, 0.32), mat('#d9261c'));
    scarf.position.set(0, 1.08, 0.01);
    g.add(scarf);
    const knot = mesh(new THREE.BoxGeometry(0.08, 0.16, 0.04), mat('#d9261c'));
    knot.position.set(0, 0.98, 0.17);
    knot.rotation.z = 0.2;
    g.add(knot);
  }

  const head = new THREE.Group();
  head.position.y = 1.28;
  head.add(mesh(new THREE.IcosahedronGeometry(0.21, 1), mat(skin)));
  for (const x of [-0.07, 0.07]) {
    const eye = mesh(new THREE.BoxGeometry(0.04, 0.05, 0.02), mat('#2b2b2b'), { cast: false });
    eye.position.set(x, 0.02, 0.19);
    head.add(eye);
  }
  head.add(hair(outfit.hair, pick(rand, ['#1d1714', '#2b211c', '#3a2c22'])));
  if (outfit.hat === 'nonla') {
    const hat = mesh(new THREE.ConeGeometry(0.4, 0.24, 10), mat('#e8d08a'));
    hat.position.y = 0.2;
    head.add(hat);
  } else if (outfit.hat === 'helmet') {
    const shell = mesh(new THREE.SphereGeometry(0.25, 8, 5, 0, Math.PI * 2, 0, Math.PI / 1.9), mat(outfit.helmet, { roughness: 0.35 }));
    shell.position.y = 0.04;
    head.add(shell);
    const strap = mesh(new THREE.TorusGeometry(0.2, 0.012, 3, 10, Math.PI), mat('#222'), { cast: false });
    strap.position.y = -0.02;
    strap.rotation.set(0, Math.PI / 2, Math.PI);
    head.add(strap);
  }
  g.add(head);

  const arm = (side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.3, 1.04, 0);
    const upper = mesh(new THREE.BoxGeometry(0.12, 0.42, 0.12), mat(sleeve));
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

  // Merge the parts that never move apart, keeping the head and arms as
  // pivots for the animations and the chopsticks separate to hide them.
  bakeParts(g, [head, leftArm, rightArm]);
  bakeParts(head);
  bakeParts(leftArm);
  bakeParts(rightArm, [chopsticks]);

  g.userData = { head, leftArm, rightArm, chopsticks, skin, shirt: sleeve, archetype };
  return g;
}

// Replaces `parent`'s children (except `keep`) with their baked meshes.
function bakeParts(parent, keep = []) {
  const loose = new THREE.Group();
  for (const c of [...parent.children]) if (!keep.includes(c)) loose.add(c);
  parent.add(bakeStatic(loose));
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

// Quạt nan: a round fan of woven bamboo strips with a dyed rim and a
// bamboo handle, lying flat with the blade centred on the origin and the
// handle toward -z. The blade hangs from `userData.pivot`, placed at the
// grip, so the fan can be cocked back and swung down from the hand.
export function nanFan() {
  const g = new THREE.Group();
  const pivot = new THREE.Group();
  const R = 0.52;
  const grip = R * 0.9 + 0.38;
  pivot.position.z = -grip;
  g.add(pivot);
  const blade = new THREE.Group();
  // A touch of glow keeps the weave readable when the fan is cocked back
  // and players see its shaded striking face.
  const bamboo = { emissive: '#6b5020', emissiveIntensity: 0.35 };
  const disc = mesh(new THREE.CylinderGeometry(R, R, 0.025, 16), mat('#e2c27e', bamboo));
  disc.scale.z = 0.9;
  blade.add(disc);
  // Woven strips both ways on both faces, giving the lattice of a nan weave.
  const strip = mat('#b88d48', bamboo);
  for (let i = -4; i <= 4; i++) {
    const c = (i / 4.5) * R;
    const len = 2 * Math.sqrt(R * R - c * c) * 0.96;
    for (const side of [-1, 1]) {
      const across = mesh(new THREE.BoxGeometry(len, 0.012, 0.045), strip, { cast: false });
      across.position.set(0, side * 0.016, c * 0.9);
      blade.add(across);
      const along = mesh(new THREE.BoxGeometry(0.045, 0.012, len * 0.9), strip, { cast: false });
      along.position.set(c, side * 0.02, 0);
      blade.add(along);
    }
  }
  const rim = mesh(new THREE.TorusGeometry(R, 0.03, 4, 18), mat('#a3322a'));
  rim.rotation.x = Math.PI / 2;
  rim.scale.y = 0.9;
  blade.add(rim);
  const handle = mesh(new THREE.CylinderGeometry(0.028, 0.034, 0.5, 6), mat('#8a6a3a'));
  handle.rotation.x = Math.PI / 2;
  handle.position.z = -grip + 0.17;
  blade.add(handle);
  // The spine of the handle runs on up through the blade.
  const spine = mesh(new THREE.BoxGeometry(0.04, 0.02, R * 1.5), mat('#9a7840'), { cast: false });
  spine.position.set(0, 0.025, -R * 0.15);
  blade.add(spine);
  const merged = bakeStatic(blade);
  merged.position.z = grip;
  pivot.add(merged);

  g.userData.pivot = pivot;
  return g;
}

// Plastic colours electric swatters come in at every market stall.
export const SWATTER_COLOURS = ['#f2b705', '#2f7fd6', '#e8622a', '#3fae5a'];

// Vợt muỗi điện: an oval plastic frame round a silver wire grid, a neck
// and a chunky handle with the battery box, a red button and an LED. Lies
// flat like the nan fan: head centred on the origin, handle toward -z, the
// head hanging from `userData.pivot` at the grip. The grid has its own
// material (`userData.grid`) so it can glow while the swatter is live.
export function swatter(colour = SWATTER_COLOURS[0]) {
  const g = new THREE.Group();
  const pivot = new THREE.Group();
  const RX = 0.36;
  const RZ = 0.46;
  const grip = RZ + 0.5;
  pivot.position.z = -grip;
  g.add(pivot);

  const head = new THREE.Group();
  const plastic = mat(colour, { roughness: 0.45 });
  // A unit ring stretched into the oval; the tube is about 6 cm wide.
  const frame = mesh(new THREE.TorusGeometry(1, 0.16, 4, 22), plastic);
  frame.rotation.x = Math.PI / 2;
  frame.scale.set(RX, RZ, 0.4);
  head.add(frame);
  // Inside the frame: a fine outer mesh on each face and thicker live
  // wires between them.
  const gridMat = new THREE.MeshStandardMaterial({
    color: '#cfd6dc',
    roughness: 0.3,
    metalness: 0.6,
    flatShading: true,
    emissive: '#7fd4ff',
    emissiveIntensity: 0,
  });
  const span = (c, r, R) => 2 * R * Math.sqrt(Math.max(0, 1 - (c / r) ** 2)) * 0.94;
  for (let c = -RX + 0.05; c < RX - 0.02; c += 0.06) {
    const len = span(c, RX, RZ);
    for (const y of [-0.018, 0.018]) {
      const wire = mesh(new THREE.BoxGeometry(0.008, 0.006, len), gridMat, { cast: false });
      wire.position.set(c, y, 0);
      head.add(wire);
    }
  }
  for (let c = -RZ + 0.05; c < RZ - 0.02; c += 0.06) {
    const len = span(c, RZ, RX);
    for (const y of [-0.018, 0.018]) {
      const wire = mesh(new THREE.BoxGeometry(len, 0.006, 0.008), gridMat, { cast: false });
      wire.position.set(0, y, c);
      head.add(wire);
    }
  }
  for (let c = -RX + 0.11; c < RX - 0.08; c += 0.12) {
    const wire = mesh(new THREE.BoxGeometry(0.014, 0.014, span(c, RX, RZ)), gridMat, { cast: false });
    wire.position.x = c;
    head.add(wire);
  }
  const neck = mesh(new THREE.BoxGeometry(0.12, 0.06, 0.2), plastic);
  neck.position.z = -RZ - 0.06;
  head.add(neck);
  const handle = mesh(new THREE.BoxGeometry(0.1, 0.075, 0.46), plastic);
  handle.position.z = -RZ - 0.38;
  head.add(handle);
  const battery = mesh(new THREE.BoxGeometry(0.12, 0.09, 0.2), mat('#e9e6dc', { roughness: 0.5 }));
  battery.position.set(0, -0.012, -RZ - 0.5);
  head.add(battery);
  const button = mesh(new THREE.BoxGeometry(0.045, 0.03, 0.06), mat('#d62a1e'), { cast: false });
  button.position.set(0, 0.045, -RZ - 0.24);
  head.add(button);
  const led = mesh(new THREE.BoxGeometry(0.025, 0.02, 0.025), mat('#ff3b30', { emissive: '#ff2a1a', emissiveIntensity: 1.2 }), { cast: false });
  led.position.set(0, 0.045, -RZ - 0.13);
  head.add(led);

  const merged = bakeStatic(head);
  merged.position.z = grip;
  pivot.add(merged);

  g.userData.pivot = pivot;
  g.userData.grid = gridMat;
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
