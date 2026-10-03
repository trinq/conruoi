import { createPixelTexture } from '../art/pixelArt.js';

// Pixel art fly, drawn at runtime so there is no binary asset to manage.
// Each frame is 16x16; '.' is transparent.
const PALETTE = {
  k: '#1b1b1f', // body
  g: '#3d4a45', // body highlight (greenish sheen)
  r: '#c0392b', // eyes
  w: '#e3f1ff', // wing
  W: '#9cc7ef', // wing edge
};

const WINGS_UP = [
  '................',
  '...WW......WW...',
  '..Wwww....wwwW..',
  '..Wwwww..wwwwW..',
  '...Wwwww.wwwW...',
  '....WWwkkwWW....',
  '.....rkggkr.....',
  '.....rkkkkr.....',
  '......kggk......',
  '......kkkk......',
  '......kggk......',
  '.......kk.......',
  '......k..k......',
  '................',
  '................',
  '................',
];

const WINGS_DOWN = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '.......kk.......',
  '.....rkggkr.....',
  '.WWwwrkkkkrwwWW.',
  'WwwwwwkggkwwwwwW',
  '.WWWw.kkkk.wWWW.',
  '......kggk......',
  '.......kk.......',
  '......k..k......',
  '................',
  '................',
  '................',
];

export function createFlyTexture(scene, key = 'fly') {
  createPixelTexture(scene, key, [WINGS_UP, WINGS_DOWN], PALETTE);
}
