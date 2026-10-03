export const MAX_LIVES = 3;

// Where a new game starts. Lives and total score carry across levels.
export function newGame() {
  return { levelIndex: 0, lives: MAX_LIVES, totalScore: 0 };
}
