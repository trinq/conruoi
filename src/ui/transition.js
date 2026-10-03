const FADE_MS = 350;

export function fadeIn(scene) {
  scene.cameras.main.fadeIn(FADE_MS, 0, 0, 0);
}

// Fades the current scene to black, then starts `key` with `data`.
export function fadeTo(scene, key, data) {
  if (scene.leaving) return;
  scene.leaving = true;
  scene.cameras.main.fadeOut(FADE_MS, 0, 0, 0);
  scene.cameras.main.once('camerafadeoutcomplete', () => scene.scene.start(key, data));
}
