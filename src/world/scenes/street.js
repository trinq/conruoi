import * as THREE from 'three';
import { mat, mesh } from '../lowpoly.js';

// Shared street layout: shop houses along the back, a pavement (the play
// area sits on it) and a road along the front where motorbikes pass.
export const FACADE_Z = -5.7;
export const CURB_Z = 5.1;
export const ROAD_FAR_Z = 12;

// Square pavement tiles in a canvas texture.
function tileTexture(colours, line, repeat) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const n = 4;
  const size = canvas.width / n;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      ctx.fillStyle = colours[(x * 3 + y * 5) % colours.length];
      ctx.fillRect(x * size, y * size, size, size);
    }
  }
  ctx.strokeStyle = line;
  ctx.lineWidth = 3;
  for (let i = 0; i <= n; i++) {
    ctx.beginPath();
    ctx.moveTo(i * size, 0);
    ctx.lineTo(i * size, canvas.height);
    ctx.moveTo(0, i * size);
    ctx.lineTo(canvas.width, i * size);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(...repeat);
  tex.anisotropy = 8;
  return tex;
}

function roadTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#4c5056';
  ctx.fillRect(0, 0, 512, 256);
  // Speckle so the asphalt is not a flat fill.
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = Math.random() < 0.5 ? '#565a60' : '#43474c';
    ctx.fillRect(Math.random() * 512, Math.random() * 256, 3, 3);
  }
  ctx.fillStyle = '#f2f2ea';
  for (let x = 0; x < 512; x += 128) ctx.fillRect(x + 20, 122, 70, 10);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 1);
  tex.anisotropy = 8;
  return tex;
}

// Ground for a street scene: pavement from the facades to the curb, a curb
// and the road. `tiles` sets the pavement colours; `back` is the z where the
// pavement stops behind the play area (a riverbank stops it early).
export function streetGround({ tiles = ['#c9b7a0', '#bfa98f', '#d1c0a8'], line = '#9c8a74', back = FACADE_Z - 1 } = {}) {
  const g = new THREE.Group();
  const width = 90;
  const depth = CURB_Z - back;
  const pavement = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.08, depth),
    new THREE.MeshStandardMaterial({ map: tileTexture(tiles, line, [width / 2.4, depth / 2.4]), roughness: 0.95 }),
  );
  pavement.receiveShadow = true;
  pavement.position.set(0, 0, (back + CURB_Z) / 2);
  g.add(pavement);

  const curb = mesh(new THREE.BoxGeometry(width, 0.18, 0.3), mat('#cfccc4'), { cast: false });
  curb.position.set(0, 0.0, CURB_Z);
  g.add(curb);

  const roadDepth = ROAD_FAR_Z - CURB_Z;
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(width, roadDepth),
    new THREE.MeshStandardMaterial({ map: roadTexture(), roughness: 0.9 }),
  );
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, -0.05, CURB_Z + roadDepth / 2);
  road.receiveShadow = true;
  g.add(road);

  const far = mesh(new THREE.BoxGeometry(width, 0.1, 6), mat('#bfb3a0'), { cast: false });
  far.position.set(0, -0.02, ROAD_FAR_Z + 3);
  g.add(far);
  return g;
}

// Motorbikes riding along the road in both directions, looping forever.
export function traffic(rand, makeBike, count = 6) {
  const bikes = [];
  const group = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const dir = i % 2 === 0 ? 1 : -1;
    const bike = makeBike(rand);
    bike.position.set(-35 + rand() * 70, 0, dir > 0 ? 8.4 : 6.6);
    bike.rotation.y = dir > 0 ? 0 : Math.PI;
    bike.userData.speed = dir * (5 + rand() * 4);
    group.add(bike);
    bikes.push(bike);
  }
  return {
    group,
    update(dt) {
      for (const b of bikes) {
        b.position.x += b.userData.speed * dt;
        if (b.position.x > 36) b.position.x = -36;
        if (b.position.x < -36) b.position.x = 36;
        // A little bounce on the road.
        b.position.y = Math.abs(Math.sin(b.position.x * 1.7)) * 0.02;
      }
    },
  };
}
