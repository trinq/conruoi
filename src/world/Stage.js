import * as THREE from 'three';

const FOV = 30;
const PITCH = THREE.MathUtils.degToRad(46); // camera looks down at this angle
const TARGET = new THREE.Vector3(0, 0, -1.0);
// Half extents of the play area the camera must always keep in view.
const HALF_WIDTH = 9.2;
const HALF_HEIGHT = 6.3;

const THEMES = {
  day: {
    background: '#bfe6ff',
    hemi: ['#cfe9ff', '#6aa84a', 0.9],
    sun: ['#fff0d0', 3.2],
    exposure: 1.0,
  },
  night: {
    background: '#151b36',
    hemi: ['#3c4c80', '#1b2a1e', 0.55],
    sun: ['#9fb4ff', 0.7],
    exposure: 1.1,
  },
};

// Owns the renderer, camera and lights. The camera looks down at the stall
// from the south, like a farm sim, and backs off on narrow screens so the
// whole play area stays visible.
export class Stage {
  constructor(container) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(FOV, 16 / 9, 0.5, 200);

    this.hemi = new THREE.HemisphereLight();
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight();
    // Low from the upper left, so shadows fall toward the lower right.
    this.sun.position.set(-9, 16, -5);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const s = this.sun.shadow.camera;
    s.left = -16;
    s.right = 16;
    s.top = 14;
    s.bottom = -14;
    s.near = 1;
    s.far = 50;
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.02;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);

    this.shakeLeft = 0;
    this.shakeAmount = 0;
    this.basePosition = new THREE.Vector3();

    this.setTheme('day');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  setTheme(name) {
    const t = THEMES[name];
    this.scene.background = new THREE.Color(t.background);
    this.scene.fog = new THREE.Fog(t.background);
    this.updateFog();
    this.hemi.color.set(t.hemi[0]);
    this.hemi.groundColor.set(t.hemi[1]);
    this.hemi.intensity = t.hemi[2];
    this.sun.color.set(t.sun[0]);
    this.sun.intensity = t.sun[1];
    this.renderer.toneMappingExposure = t.exposure;
  }

  resize() {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h);
    const aspect = w / h;
    this.camera.aspect = aspect;
    const t = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const dist = Math.max(HALF_WIDTH / (t * aspect), HALF_HEIGHT / t);
    this.basePosition.set(0, Math.sin(PITCH) * dist, Math.cos(PITCH) * dist).add(TARGET);
    this.camera.position.copy(this.basePosition);
    this.camera.lookAt(TARGET);
    this.camera.updateProjectionMatrix();
    this.distance = dist;
    this.updateFog();
  }

  // Fog starts past the play area however far back the camera sits.
  updateFog() {
    if (!this.scene.fog || !this.distance) return;
    this.scene.fog.near = this.distance + 16;
    this.scene.fog.far = this.distance + 52;
  }

  shake(ms, amount = 0.08) {
    this.shakeLeft = ms;
    this.shakeAmount = amount;
  }

  // World point → CSS pixels within the container.
  project(v) {
    const p = v.clone().project(this.camera);
    return {
      x: ((p.x + 1) / 2) * this.container.clientWidth,
      y: ((1 - p.y) / 2) * this.container.clientHeight,
    };
  }

  // Normalised device coordinates for a pointer event, for raycasting.
  pointerNdc(event) {
    const r = this.renderer.domElement.getBoundingClientRect();
    return new THREE.Vector2(((event.clientX - r.left) / r.width) * 2 - 1, -((event.clientY - r.top) / r.height) * 2 + 1);
  }

  render(dtMs) {
    this.camera.position.copy(this.basePosition);
    if (this.shakeLeft > 0) {
      this.shakeLeft -= dtMs;
      const a = this.shakeAmount;
      this.camera.position.x += (Math.random() - 0.5) * a;
      this.camera.position.y += (Math.random() - 0.5) * a;
    }
    this.renderer.render(this.scene, this.camera);
  }
}
