import * as THREE from 'three';

// Small deterministic PRNG so scenery is laid out the same on every load.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const range = (rand, min, max) => min + rand() * (max - min);
export const pick = (rand, list) => list[Math.floor(rand() * list.length)];

const materials = new Map();

// Shared flat-shaded material per colour: the faceted low-poly look comes
// from flat shading rather than from textures.
export function mat(color, { roughness = 0.85, ...extra } = {}) {
  const key = `${color}|${roughness}|${JSON.stringify(extra)}`;
  if (!materials.has(key)) {
    materials.set(
      key,
      new THREE.MeshStandardMaterial({ color, flatShading: true, roughness, metalness: 0, ...extra }),
    );
  }
  return materials.get(key);
}

// Mesh that casts and receives shadows by default.
export function mesh(geometry, material, { cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geometry, material);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

// Nudges every vertex by up to `amount`, moving shared corners together so
// the surface stays closed. Gives primitives a hand-made, faceted look.
export function jitter(geometry, amount, rand) {
  const pos = geometry.attributes.position;
  const offsets = new Map();
  for (let i = 0; i < pos.count; i++) {
    const key = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`;
    if (!offsets.has(key)) {
      offsets.set(key, [range(rand, -amount, amount), range(rand, -amount, amount), range(rand, -amount, amount)]);
    }
    const [dx, dy, dz] = offsets.get(key);
    pos.setXYZ(i, pos.getX(i) + dx, pos.getY(i) + dy, pos.getZ(i) + dz);
  }
  geometry.computeVertexNormals();
  return geometry;
}

// Canvas-backed texture for signs and labels.
export function textTexture(text, { width = 512, height = 128, font = '72px "Paytone One", sans-serif', color = '#fff', background = null } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2 + 4);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
