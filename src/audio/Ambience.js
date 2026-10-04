import { AMBIENCE } from './synth.js';
import { REGIONS } from '../regions.js';

const LEVEL = 0.4; // the whole street bed sits well under the effects
const FADE_IN_S = 2.5;
const FADE_OUT_S = 1.2;

// The street sounds under a level: every layer loops all the time it plays,
// at the volume the region's mix gives it. It goes through the engine's
// master gain, so mute and the menu sound item silence it too.
export class Ambience {
  constructor(engine) {
    this.engine = engine;
    this.layers = Object.fromEntries(Object.keys(AMBIENCE).map((name) => [name, engine.loop(name)]));
    this.region = null;
  }

  // Fades in `region`'s mix. Skipped while audio is still locked.
  play(region) {
    if (this.engine.locked) return;
    const mix = REGIONS[region].ambience;
    this.region = region;
    for (const [name, voice] of Object.entries(this.layers)) {
      if (!voice.playing) {
        voice.setVolume(0);
        // Each layer starts somewhere different, so levels don't all open
        // with the same horn.
        voice.start(Math.random());
      }
      voice.fadeTo(mix[name] * LEVEL, FADE_IN_S);
    }
  }

  stop() {
    this.region = null;
    for (const voice of Object.values(this.layers)) voice.fadeOut(FADE_OUT_S);
  }
}
