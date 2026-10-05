// Short vibrations on a hit and on game over, through the native haptics
// plugin in the Android app and navigator.vibrate in a browser. The "Rung" setting is
// on by default and kept in this browser the same defensive way as the
// best score: storage may be missing or throw, and then it lasts for the
// session only.
import { isNative, nativeVibrate } from './native.js';

const KEY = 'conruoi.vibrate';
const HIT = 60;
const GAME_OVER = [90, 70, 90];

let sessionOn = null;

// Vibration only makes sense on a touch device that offers it.
export const canVibrate =
  isNative || (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function' && navigator.maxTouchPoints > 0);

export function vibrateOn() {
  if (sessionOn !== null) return sessionOn;
  try {
    return window.localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setVibrate(on) {
  sessionOn = on;
  try {
    window.localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    // Remembered for this session only.
  }
}

function buzz(pattern) {
  if (!canVibrate || !vibrateOn()) return;
  if (isNative) nativeVibrate(pattern);
  else navigator.vibrate(pattern);
}

export const vibrateHit = () => buzz(HIT);
export const vibrateGameOver = () => buzz(GAME_OVER);
