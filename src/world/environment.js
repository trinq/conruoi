import * as THREE from 'three';
import { rng, range, mat, mesh } from './lowpoly.js';
import { tree, pine, bush, rock, crate, barrel, stall, pond, lantern } from './models.js';
import { buildHanoi } from './scenes/hanoi.js';
import { buildHue } from './scenes/hue.js';
import { buildHoian } from './scenes/hoian.js';

import { PAVING } from './area.js';

export { PAVING };

const POND = { x: 10.6, z: 5.6, r: 2.8 };

function insideRect(x, z, r, pad = 0) {
  return x > r.minX - pad && x < r.maxX + pad && z > r.minZ - pad && z < r.maxZ + pad;
}

function nearPond(x, z, pad = 0) {
  return Math.hypot(x - POND.x, (z - POND.z) / 0.75) < POND.r * 1.15 + pad;
}

// Faceted grass with a few colour variations per triangle.
function ground(rand) {
  const geo = new THREE.PlaneGeometry(110, 80, 55, 40).toNonIndexed();
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    if (!insideRect(x, z, PAVING, 2) && !nearPond(x, z, 1)) {
      pos.setY(i, Math.sin(x * 0.7) * Math.cos(z * 0.6) * 0.08);
    }
  }
  const colors = [];
  const palette = ['#79c84f', '#71c049', '#82cf55', '#6cba45'].map((c) => new THREE.Color(c));
  for (let i = 0; i < pos.count; i += 3) {
    const c = palette[Math.floor(rand() * palette.length)];
    for (let k = 0; k < 3; k++) colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const m = mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 }), {
    cast: false,
  });
  return m;
}

// Packed-earth clearing the stall's tables stand on, with a soft wobbly edge.
function clearing(rand) {
  const cx = (PAVING.minX + PAVING.maxX) / 2;
  const cz = (PAVING.minZ + PAVING.maxZ) / 2;
  const hw = (PAVING.maxX - PAVING.minX) / 2;
  const hd = (PAVING.maxZ - PAVING.minZ) / 2;
  const outline = (grow) => {
    const shape = new THREE.Shape();
    const n = 48;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      // Superellipse: a rounded rectangle, nudged so the edge looks hand-made.
      const c = Math.cos(a);
      const s = Math.sin(a);
      const wobble = 1 + 0.025 * Math.sin(a * 7 + 2) + 0.015 * Math.sin(a * 13);
      const x = Math.sign(c) * Math.abs(c) ** 0.35 * (hw + grow) * wobble;
      const z = Math.sign(s) * Math.abs(s) ** 0.35 * (hd + grow) * wobble;
      if (i === 0) shape.moveTo(x, -z);
      else shape.lineTo(x, -z);
    }
    const geo = new THREE.ShapeGeometry(shape);
    geo.rotateX(-Math.PI / 2);
    geo.translate(cx, 0, cz);
    return geo;
  };
  const g = new THREE.Group();
  const edge = mesh(outline(0.35), mat('#c99a5c'), { cast: false });
  edge.position.y = 0.02;
  g.add(edge);
  const earth = mesh(outline(0), mat('#dcb57c'), { cast: false });
  earth.position.y = 0.04;
  g.add(earth);
  // A sprinkle of pebbles so the ground does not look flat-filled.
  for (let i = 0; i < 40; i++) {
    const x = range(rand, PAVING.minX + 0.4, PAVING.maxX - 0.4);
    const z = range(rand, PAVING.minZ + 0.4, PAVING.maxZ - 0.4);
    const p = mesh(new THREE.DodecahedronGeometry(range(rand, 0.03, 0.07), 0), mat('#b8a07a'), { cast: false });
    p.position.set(x, 0.05, z);
    p.scale.y = 0.5;
    g.add(p);
  }
  return g;
}

function dirtPath(x1, z1, x2, z2, width) {
  const len = Math.hypot(x2 - x1, z2 - z1);
  const m = mesh(new THREE.BoxGeometry(len, 0.04, width), mat('#dcae6e'), { cast: false });
  m.position.set((x1 + x2) / 2, 0.01, (z1 + z2) / 2);
  m.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
  return m;
}

// Many small things (grass tufts, flowers) as one instanced mesh each.
function scatter(rand, geometry, material, count, colors) {
  const inst = new THREE.InstancedMesh(geometry, material, count);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  let i = 0;
  while (i < count) {
    const x = range(rand, -24, 24);
    const z = range(rand, -12, 12);
    if (insideRect(x, z, PAVING, 0.4) || nearPond(x, z, 0.2)) continue;
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rand() * 6);
    s.setScalar(range(rand, 0.7, 1.3));
    p.set(x, 0.02, z);
    m.compose(p, q, s);
    inst.setMatrixAt(i, m);
    if (colors) inst.setColorAt(i, new THREE.Color(colors[Math.floor(rand() * colors.length)]));
    i++;
  }
  inst.receiveShadow = true;
  return inst;
}

function grassTuft() {
  const parts = [];
  for (let i = 0; i < 3; i++) {
    const c = new THREE.ConeGeometry(0.06, 0.34, 3);
    c.translate(0, 0.17, 0);
    c.rotateZ((i - 1) * 0.35);
    c.rotateY(i * 2.1);
    parts.push(c);
  }
  const merged = new THREE.BufferGeometry();
  // Merge by hand to avoid pulling in BufferGeometryUtils for three cones.
  const positions = [];
  for (const p of parts) {
    const g = p.toNonIndexed();
    positions.push(...g.attributes.position.array);
  }
  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  merged.computeVertexNormals();
  return merged;
}

// Night-market lanterns strung on poles around the paving.
function lanterns() {
  const g = new THREE.Group();
  const posts = [
    [PAVING.minX + 0.3, PAVING.minZ + 0.3],
    [0, PAVING.minZ + 0.3],
    [PAVING.maxX - 0.3, PAVING.minZ + 0.3],
    [PAVING.minX + 0.3, PAVING.maxZ - 0.3],
    [PAVING.maxX - 0.3, PAVING.maxZ - 0.3],
  ];
  for (const [x, z] of posts) {
    const pole = mesh(new THREE.CylinderGeometry(0.05, 0.06, 3.2, 6), mat('#4a3a30'));
    pole.position.set(x, 1.6, z);
    g.add(pole);
  }
  const strings = [
    [posts[0], posts[1]],
    [posts[1], posts[2]],
    [posts[0], posts[3]],
    [posts[2], posts[4]],
  ];
  for (const [[x1, z1], [x2, z2]] of strings) {
    const n = 6;
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const sag = Math.sin(t * Math.PI) * 0.5;
      const l = lantern();
      l.position.set(x1 + (x2 - x1) * t, 3.0 - sag, z1 + (z2 - z1) * t);
      g.add(l);
    }
  }
  const lights = [
    [-4, -2],
    [4, -2],
    [0, 2.5],
  ];
  for (const [x, z] of lights) {
    const light = new THREE.PointLight('#ffb35c', 14, 11, 1.6);
    light.position.set(x, 2.8, z);
    g.add(light);
  }
  return g;
}

// The original meadow scene, kept as a placeholder for regions whose own
// street scene has not been built yet.
function buildMeadow() {
  const rand = rng(2024);
  const root = new THREE.Group();

  root.add(ground(rand));
  root.add(clearing(rand));
  root.add(dirtPath(-40, -5.0, 40, -5.0, 1.5));
  root.add(dirtPath(PAVING.maxX + 0.5, 1.5, 22, 4.5, 1.4));

  const shop = stall('Quán Phở Bác Ba');
  shop.position.set(-3.2, 0, -7.0);
  root.add(shop);
  const extras = [
    [crate(), -5.6, -6.3],
    [crate(), -5.2, -5.9],
    [barrel(), -0.9, -6.4],
    [barrel(), -0.4, -6.7],
  ];
  for (const [obj, x, z] of extras) {
    obj.position.set(x, 0, z);
    obj.rotation.y = rand();
    root.add(obj);
  }
  const blossom = tree(rand, { pinkCanopy: true });
  blossom.position.set(4.4, 0, -6.9);
  blossom.scale.setScalar(1.3);
  root.add(blossom);

  // Forest behind the road and along both sides.
  const occupied = (x, z) =>
    insideRect(x, z, PAVING, 1.4) || nearPond(x, z, 1) || Math.abs(z + 5.0) < 1.4 || (z > -8.6 && z < -5 && x > -6.5 && x < 6.5);
  let placed = 0;
  let tries = 0;
  while (placed < 120 && tries < 2000) {
    tries++;
    const x = range(rand, -26, 26);
    const z = range(rand, -18, 11);
    if (occupied(x, z)) continue;
    // Keep the open meadow in front of the paving mostly clear.
    if (z > -5 && Math.abs(x) < 10.5) continue;
    const t = rand() < 0.3 ? pine(rand) : tree(rand, { blossom: rand() < 0.35 });
    t.position.set(x, 0, z);
    t.rotation.y = rand() * 6;
    root.add(t);
    placed++;
  }
  for (let i = 0; i < 26; i++) {
    const x = range(rand, -16, 16);
    const z = range(rand, -9, 10);
    if (occupied(x, z)) continue;
    const b = rand() < 0.6 ? bush(rand) : rock(rand);
    b.position.x = x;
    b.position.z = z;
    root.add(b);
  }

  const water = pond(rand, POND.r);
  water.position.set(POND.x, 0, POND.z);
  root.add(water);

  root.add(scatter(rand, grassTuft(), mat('#8bd65a'), 500));
  const flower = new THREE.IcosahedronGeometry(0.06, 0);
  flower.translate(0, 0.12, 0);
  root.add(scatter(rand, flower, new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.8 }), 220, ['#ffffff', '#f8b8cf', '#ffe066', '#c9a7f5']));

  const night = lanterns();
  night.visible = false;
  root.add(night);

  return {
    root,
    setNight(on) {
      night.visible = on;
    },
    update(timeMs) {
      for (const pad of water.userData.pads) {
        pad.position.y = 0.05 + Math.sin(timeMs * 0.0015 + pad.userData.phase) * 0.012;
        pad.rotation.y += 0.0004;
      }
    },
  };
}

const SCENES = { hanoi: buildHanoi, hue: buildHue, hoian: buildHoian };

// Owns the scenery for every region. Each region's scene is built the first
// time it is needed and kept, so switching levels back and forth is cheap.
export function buildEnvironment(scene) {
  const built = new Map();
  let active = null;
  return {
    setRegion(region, timeOfDay) {
      const key = SCENES[region] ? region : 'meadow';
      if (!built.has(key)) {
        const s = key === 'meadow' ? buildMeadow() : SCENES[key]();
        built.set(key, s);
        scene.add(s.root);
      }
      for (const [k, s] of built) s.root.visible = k === key;
      active = built.get(key);
      active.setNight?.(timeOfDay === 'night');
      active.show?.();
    },
    update(timeMs, dt) {
      active?.update(timeMs, dt);
    },
  };
}
