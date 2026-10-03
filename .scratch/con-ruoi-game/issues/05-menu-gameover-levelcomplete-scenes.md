# 05: Menu + Game Over + Level Complete Scenes

**What to build:** The complete game flow from start to finish. A MenuScene with the game title "Con Ruồi" and a Play button. When the player loses all 3 lives, a GameOverScene shows the final score and a "Play Again" button. When the player reaches the target score, a LevelCompleteScene congratulates them and offers a "Next Level" button. The full loop works: Menu → Game → (Game Over OR Level Complete) → back to Menu or next level.

**Blocked by:** 04 - NPC Danger System + Warning + Lives

**Status:** ready-for-agent

- [x] MenuScene displays game title "Con Ruồi" in pixel art style and a "Chơi" (Play) button
- [x] Clicking Play transitions to GameScene at level 1
- [x] When lives reach 0, GameOverScene is shown with final score
- [x] GameOverScene has a "Chơi Lại" (Play Again) button that restarts from level 1
- [x] When score reaches target, LevelCompleteScene is shown
- [x] LevelCompleteScene has a "Tiếp Tục" (Continue) button to advance to next level
- [x] Scene transitions have smooth fade or visual effect
- [x] Game state (score, lives) resets properly on restart
