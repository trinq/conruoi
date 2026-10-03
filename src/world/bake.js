import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Merges every static mesh under `root` into one mesh per material, so a
// street of hundreds of little boxes costs a few dozen draw calls. Meshes
// that share a textured material (signs drawn from one atlas) are merged
// too, keeping their UVs. Transparent meshes are kept as they are.
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
    const keepUv = Boolean(m.map);
    for (const name of Object.keys(g.attributes)) {
      if (name !== 'position' && name !== 'normal' && !(keepUv && name === 'uv')) g.deleteAttribute(name);
    }
    if (!g.attributes.normal) g.computeVertexNormals();
    g.applyMatrix4(o.matrixWorld);
    const key = `${m.uuid}|${o.castShadow}`;
    if (!buckets.has(key)) buckets.set(key, { material: m, cast: o.castShadow, geometries: [] });
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
