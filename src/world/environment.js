import { buildHanoi } from './scenes/hanoi.js';
import { buildHue } from './scenes/hue.js';
import { buildHoian } from './scenes/hoian.js';
import { buildSaigon } from './scenes/saigon.js';
import { buildNightMarket } from './scenes/nightmarket.js';

const SCENES = { hanoi: buildHanoi, hue: buildHue, hoian: buildHoian, saigon: buildSaigon, nightmarket: buildNightMarket };

// Owns the scenery for every region. Each region's scene is built the first
// time it is needed and kept, so switching levels back and forth is cheap.
export function buildEnvironment(scene) {
  const built = new Map();
  let active = null;
  return {
    setRegion(region) {
      if (!SCENES[region]) throw new Error(`no scene for region ${region}`);
      if (!built.has(region)) {
        const s = SCENES[region]();
        built.set(region, s);
        scene.add(s.root);
      }
      for (const [k, s] of built) s.root.visible = k === region;
      active = built.get(region);
      active.show?.();
    },
    update(timeMs, dt) {
      active?.update(timeMs, dt);
    },
  };
}
