import { createPixelTexture } from '../art/pixelArt.js';

const PALETTE = {
  k: '#1f1a17', // hair
  s: '#f1c27d', // skin
  S: '#d9a066', // skin shade
  o: '#6b3e26', // outline / eyes
  m: '#a0522d', // mouth
  t: '#4a7bd0', // shirt
  d: '#2f3e5c', // trousers
  b: '#f4f1ea', // bowl
  c: '#c8a165', // chopsticks
  r: '#d63a2f', // red plastic stool
};

// Seated diner holding a bowl, on a red plastic stool. 16x24.
const BODY = [
  '....tttttttt....',
  '...tttttttttt...',
  '..sttttttttttc..',
  '..sttttttttttc..',
  '...sbbbbbbbbc...',
  '...obbbbbbbbo...',
  '....tttttttt....',
  '....dddddddd....',
  '...dddddddddd...',
  '...dd......dd...',
  '..rrrrrrrrrrrr..',
  '...r........r...',
  '...r........r...',
  '...r........r...',
  '...rr......rr...',
  '................',
];

const HEAD = [
  '.....kkkkkk.....',
  '....kkkkkkkk....',
  '....kssssssk....',
  '....ssossoss....',
  '....ssssssss....',
  '.....ssmmss.....',
  '......ssss......',
];

const BLANK = '................';

// Idle frame 0: head up. Frame 1: head dipped toward the bowl (eating).
const IDLE_UP = [BLANK, ...HEAD, ...BODY];
const IDLE_DOWN = [BLANK, BLANK, ...HEAD.slice(0, 6), ...BODY];

// Frame 2: wind-up, right arm raised and mouth open.
const WINDUP = [
  '.............ss.',
  '.....kkkkkk..ss.',
  '....kkkkkkkk.ss.',
  '....kssssssk.ss.',
  '....ssossoss.ss.',
  '....ssssssss.tt.',
  '.....ssoos..ttt.',
  '......ssss.ttt..',
  '....tttttttttt..',
  '...tttttttttt...',
  '..stttttttttt...',
  '..sttttttttt....',
  '...sbbbbbbbb....',
  '...obbbbbbbbo...',
  ...BODY.slice(6),
];

// Open palm seen from above, with a shirt cuff. 16x16.
const HAND = [
  '................',
  '....ososososo...',
  '....osSsSsSso...',
  '....osSsSsSso...',
  '....osSsSsSso...',
  '..oooosssssso...',
  '..ossssssssso...',
  '...oossssssso...',
  '....ossssssso...',
  '....ossssssso...',
  '.....osssssso...',
  '.....osssssso...',
  '.....otttttto...',
  '.....otttttto...',
  '................',
  '................',
];

const HEART_PALETTE = { r: '#e53935', R: '#ff8a80', g: '#5b4a42', G: '#7d6a60' };
const HEART_FULL = ['.rr.rr.', 'rRrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'];
const HEART_EMPTY = HEART_FULL.map((row) => row.replace(/r/g, 'g').replace(/R/g, 'G'));

export function createDangerTextures(scene) {
  createPixelTexture(scene, 'npc', [IDLE_UP, IDLE_DOWN, WINDUP], PALETTE);
  createPixelTexture(scene, 'hand', [HAND], PALETTE);
  createPixelTexture(scene, 'heart', [HEART_FULL, HEART_EMPTY], HEART_PALETTE);
}
