// The best total score ("Kỷ lục"), kept in this browser. Storage can be
// missing or throw (private mode, blocked cookies, full quota), so every
// access is guarded and the game falls back to remembering it for the
// session only.
const KEY = 'conruoi.best';

let sessionBest = 0;

function stored() {
  try {
    const n = Number(window.localStorage.getItem(KEY));
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

export function readBest() {
  return Math.max(sessionBest, stored());
}

// Records `score` if it beats the best; returns true when it did.
export function saveBest(score) {
  if (score <= readBest()) return false;
  sessionBest = score;
  try {
    window.localStorage.setItem(KEY, String(score));
  } catch {
    // Not saved across reloads, but still shown for this session.
  }
  return true;
}
