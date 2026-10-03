import { createPixelTexture } from '../art/pixelArt.js';

// Points and eating time per dish. Richer dishes pay more but keep the fly
// sitting still for longer.
export const FOOD_TYPES = {
  pho: { name: 'Phở', points: 30, eatMs: 2200 },
  bun: { name: 'Bún', points: 20, eatMs: 1600 },
  com: { name: 'Cơm', points: 10, eatMs: 1000 },
};

const PALETTE = {
  o: '#4a3326', // outline
  b: '#f4f1ea', // porcelain
  B: '#3a6fb0', // blue bowl pattern
  G: '#2e8b57', // green bowl pattern
  r: '#d9a85b', // phở broth
  R: '#d9542b', // bún bò broth
  n: '#fff8dc', // noodles
  h: '#4caf50', // herbs
  c: '#e53935', // chili
  m: '#b5654a', // meat
  y: '#ffcc33', // egg yolk
  w: '#ffffff', // rice
  p: '#e8e8e8', // plate
  P: '#a9b4bf', // plate rim
};

const PHO = [
  '................',
  '................',
  '................',
  '....oooooooo....',
  '..oornnrrhrroo..',
  '.orrnmmnnrhcrro.',
  '.ornnmmrrnnrhro.',
  '.orhrrnnmmnrrro.',
  '..oorrrnnrrroo..',
  '.obboooooooobbo.',
  '.obBbBbBbBbBbbo.',
  '..obBbBbBbBbbo..',
  '...obbbbbbbbo...',
  '....oooooooo....',
  '................',
  '................',
];

// Bún bò: same bowl shape, red broth, green-patterned bowl.
const BUN = PHO.map((row) => row.replace(/r/g, 'R').replace(/B/g, 'G'));

// Cơm tấm: rice, fried egg and grilled pork on a plate.
const COM = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '....PPPPPPPP....',
  '..PPpwwwwmmmpPP.',
  '.PpwwwwwwmmmmpP.',
  '.PpwwwyywwmmhhpP',
  '.PpwwyyyywwmhhpP',
  '..PpwwyywwwwhhP.',
  '...PPPPPPPPPPP..',
  '................',
  '................',
  '................',
];

export function createFoodTextures(scene) {
  createPixelTexture(scene, 'food-pho', [PHO], PALETTE);
  createPixelTexture(scene, 'food-bun', [BUN], PALETTE);
  createPixelTexture(scene, 'food-com', [COM], PALETTE);
}
