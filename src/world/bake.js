import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Plain materials that differ only in colour are baked onto one shared
// material that takes its colour from the vertices, so a street (or a dish,
// or a diner) of many colours still costs a handful of draw calls.
const painted = new Map();

// Materials with any emissive colour may glow or be animated later, so
// only those without one are repainted.
function isPlain(m) {
  return m.isMeshStandardMaterial && !m.map && !m.vertexColors && m.emissive.getHex() === 0;
}

function paintedMaterial(m) {
  const key = `${m.roughness}|${m.metalness}|${m.side}|${m.flatShading}`;
  if (!painted.has(key)) {
    painted.set(
      key,
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: m.roughness, metalness: m.metalness, side: m.side, flatShading: m.flatShading }),
    );
  }
  return painted.get(key);
}

// Merges every static mesh under `root` into one mesh per material, so a
// street of hundreds of little boxes costs a few dozen draw calls. Plain
// colours share one vertex-coloured material (see above); meshes that share
// a textured material (signs drawn from one atlas) are merged too, keeping
// their UVs. Transparent and glowing meshes keep their own material, so
// their opacity or glow can still be animated.
export function bakeStatic(root) {
  root.updateMatrixWorld(true);
  const buckets = new Map();
  const keep = [];
  root.traverse((o) => {
    if (!o.isMesh) return;
    const m = o.material;
    if (Array.isArray(m) || m.transparent || o.isInstancedMesh || (m.map && !o.geometry.attributes.uv)) {
      keep.push(o);
      return;
    }
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    // Keep UVs for textures and colours for meshes baked once already.
    const wanted = new Set(['position', 'normal', ...(m.map ? ['uv'] : []), ...(m.vertexColors ? ['color'] : [])]);
    for (const name of Object.keys(g.attributes)) {
      if (!wanted.has(name)) g.deleteAttribute(name);
    }
    if (!g.attributes.normal) g.computeVertexNormals();
    g.applyMatrix4(o.matrixWorld);
    let material = m;
    if (isPlain(m)) {
      material = paintedMaterial(m);
      const n = g.attributes.position.count;
      const colours = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) colours.set([m.color.r, m.color.g, m.color.b], i * 3);
      g.setAttribute('color', new THREE.BufferAttribute(colours, 3));
    }
    const key = `${material.uuid}|${o.castShadow}`;
    if (!buckets.has(key)) buckets.set(key, { material, cast: o.castShadow, geometries: [] });
    buckets.get(key).geometries.push(g);
  });

  const out = new THREE.Group();
  for (const { material, cast, geometries } of buckets.values()) {
    const merged = new THREE.Mesh(mergeGeometries(geometries), material);
    merged.castShadow = cast;
    merged.receiveShadow = true;
    out.add(merged);
  }
  for (const o of keep) {
    const copy = o.clone(false);
    o.matrixWorld.decompose(copy.position, copy.quaternion, copy.scale);
    out.add(copy);
  }
  return out;
}
