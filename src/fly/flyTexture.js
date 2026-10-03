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

export const FLY_SIZE = 16;
const FRAMES = [WINGS_UP, WINGS_DOWN];

export function createFlyTexture(scene, key = 'fly') {
  const tex = scene.textures.createCanvas(key, FLY_SIZE * FRAMES.length, FLY_SIZE);
  const ctx = tex.getContext();
  FRAMES.forEach((rows, f) => {
    rows.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        if (ch === '.') return;
        ctx.fillStyle = PALETTE[ch];
        ctx.fillRect(f * FLY_SIZE + x, y, 1, 1);
      });
    });
    tex.add(f, 0, f * FLY_SIZE, 0, FLY_SIZE, FLY_SIZE);
  });
  tex.refresh();
}
