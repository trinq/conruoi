> **Lưu ý:** phần hình ảnh và giao diện của spec này đã được thay bằng [`.scratch/con-ruoi-viet/SPEC.md`](.scratch/con-ruoi-viet/SPEC.md) (bản 3D low-poly "Hành trình xuyên Việt"). Luật chơi bên dưới vẫn giữ nguyên.

# 🪰 Game "Con Ruồi" - Spec

## Problem Statement

Người chơi muốn một game web đơn giản, vui nhộn, nơi họ nhập vai một con ruồi bay quanh quán ăn vỉa hè Việt Nam, đậu lên thức ăn để kiếm điểm, đồng thời phải né tránh bàn tay đập của con người. Hiện chưa có game nào khai thác góc nhìn "làm con ruồi" với bối cảnh văn hóa Việt Nam đặc trưng.

## Solution

Xây dựng một game web 2D isometric sử dụng Phaser.js, phong cách pixel art Việt Nam tươi sáng và hài hước. Người chơi điều khiển con ruồi bằng WASD + chuột, bay quanh các quán ăn vỉa hè, đậu lên thức ăn (phở, bún, cơm) để ghi điểm. Người ngồi ăn sẽ đập tay để giết ruồi - có cảnh báo để người chơi né. Game có hệ thống level cố định (3-5 levels MVP), 3 mạng sống, và hiệu ứng âm thanh.

## User Stories

1. As a player, I want to control a fly using WASD keys, so that I can navigate around the food stall environment freely.
2. As a player, I want to click on food items to land on them, so that I can earn points by "eating" the food.
3. As a player, I want to see my fly from an isometric/2.5D perspective, so that the game world feels immersive with depth.
4. As a player, I want to see a Vietnamese street food stall scene (quán ăn vỉa hè), so that the game has a unique cultural setting.
5. As a player, I want to land on different Vietnamese dishes (phở, bún, cơm), so that I feel the cultural authenticity of the game.
6. As a player, I want each food type to give different point values, so that I have strategic choices about which food to target.
7. As a player, I want to see a warning indicator when a hand is about to slap, so that I have a chance to dodge.
8. As a player, I want to move my fly away from the danger zone after seeing the warning, so that I can survive by reacting quickly.
9. As a player, I want to have 3 lives, so that I get multiple chances before game over.
10. As a player, I want to see a visual life counter on screen, so that I know how many lives I have remaining.
11. As a player, I want to earn enough points to advance to the next level, so that I feel a sense of progression.
12. As a player, I want each level to be a different food stall/table arrangement, so that the game stays fresh across levels.
13. As a player, I want to hear a buzzing sound when flying, so that the fly experience feels authentic.
14. As a player, I want to hear a slapping sound when a hand strikes, so that I feel the danger.
15. As a player, I want to hear an eating/munching sound when landing on food, so that scoring feels satisfying.
16. As a player, I want to see a score counter on screen, so that I can track my progress in the current level.
17. As a player, I want to see a target score for the current level, so that I know how much more I need to eat.
18. As a player, I want to see a game over screen when I lose all 3 lives, so that I know the game has ended.
19. As a player, I want to see my final score on the game over screen, so that I can compare with previous attempts.
20. As a player, I want a "Play Again" button on the game over screen, so that I can restart quickly.
21. As a player, I want to see a level complete screen when I reach the target score, so that I feel accomplished.
22. As a player, I want a start/menu screen, so that I can begin the game when I'm ready.
23. As a player, I want pixel art graphics in a bright Vietnamese style, so that the game looks charming and fun.
24. As a player, I want the fly to have smooth animations (flying, landing, eating), so that the character feels alive.
25. As a player, I want the hand slap to have a wind-up animation before striking, so that the warning feels natural and fair.
26. As a player, I want the game difficulty to increase across levels (faster/more frequent slaps), so that later levels feel challenging.
27. As a player, I want the fly to visually react when hit (stunned animation), so that getting hit feels impactful.
28. As a player, I want to see people (NPCs) sitting at the food stall, so that the scene feels populated and lively.
29. As a player, I want the game to run in my web browser without installation, so that I can play instantly.
30. As a player, I want the game to load quickly, so that I don't have to wait long to start playing.

## Implementation Decisions

### Architecture

- **Game Engine**: Phaser.js (v3) - chosen for its mature 2D game engine capabilities, built-in physics, sprite management, audio system, and large community.
- **Rendering**: Phaser's WebGL renderer with Canvas fallback for broad browser support.
- **View**: Isometric/2.5D perspective achieved through isometric sprite positioning and depth sorting.

### Scene Structure

- **BootScene**: Preload all assets (sprites, spritesheets, audio).
- **MenuScene**: Title screen with "Play" button and game title.
- **GameScene**: Main gameplay loop - this is the primary scene containing all game logic.
- **LevelCompleteScene**: Displayed when player reaches the target score for a level.
- **GameOverScene**: Displayed when player loses all 3 lives, shows final score and restart option.

### Game Mechanics Module

- **Fly Controller**: Handles WASD movement input, translates to isometric movement. Click-to-land mechanic targets food objects in the scene.
- **Food System**: Each food item is a sprite with a point value, a landing zone, and a "being eaten" state with a timer. Food types: Phở (high points), Bún (medium-high), Cơm (medium). Points are awarded after the fly successfully lands and "eats" for a short duration.
- **Danger System**: NPC hands that target the fly's position. Each attack follows a pattern: (1) Warning indicator appears near the fly, (2) Short wind-up delay (~1-1.5 seconds), (3) Hand slaps down on the warned area. If the fly is still in the zone, it loses a life.
- **Level Progression**: Each level has a target score. Reaching it triggers LevelCompleteScene. Levels differ in: food arrangement, NPC count, slap speed/frequency, table layout.

### Level Design (MVP: 3-5 Levels)

- **Level 1**: Single small table, 1 NPC, slow slaps, low target score. Tutorial-like.
- **Level 2**: Larger table, 2 NPCs, moderate slap speed, more food variety.
- **Level 3**: Multiple tables, 2-3 NPCs, faster slaps, higher target score.
- **Level 4** (stretch): Crowded food stall, 3+ NPCs, fast slaps, bonus food items.
- **Level 5** (stretch): Night market scene, maximum difficulty.

### Art Style

- Pixel art (16x16 or 32x32 base tiles).
- Color palette: Warm, vibrant Vietnamese aesthetic - reds, yellows, greens, wood tones.
- Character sprites: Simple but expressive pixel art NPCs and fly.

### Audio

- SFX only (no background music in MVP): fly buzzing loop, slap impact, eating/munching, life lost sting, level complete jingle.
- Generated/sourced as free sound effects.

### State Management

- Game state tracked in GameScene: current score, target score, lives remaining, current level index, fly position, active dangers.
- Level configs stored as a data array defining each level's parameters.

## Testing Decisions

- **Primary test seam**: GameScene - all gameplay logic flows through this scene. Tests should verify external behavior (score changes, life loss, level transitions) rather than internal sprite positions.
- **Good tests**: Verify that landing on food increments score by the correct amount. Verify that being hit by a slap decrements lives. Verify that reaching target score triggers level transition. Verify that 0 lives triggers game over.
- **Manual testing focus for MVP**: Since this is a game with heavy visual/interactive elements, manual playtesting will be the primary QA method for the MVP. Automated tests can be added later for the game logic layer.
- **Browser testing**: Verify the game runs on Chrome, Firefox, and Safari.

## Out of Scope

- Multiplayer/online features
- Mobile/touch controls (future enhancement)
- Background music
- Leaderboard/online high scores
- In-app purchases or monetization
- Landing on people's faces (deferred to post-MVP)
- Multiple food categories with different point tiers (MVP uses single tier: Vietnamese dishes)
- Save/load game progress
- Settings menu (volume, controls remapping)
- Localization/i18n (game will be in Vietnamese with some English UI)
- Advanced particle effects
- Power-ups or special abilities

## Further Notes

- The game name "Con Ruồi" (The Fly) is distinctly Vietnamese and should be prominently displayed in pixel art on the title screen.
- The isometric perspective should give a "looking down at the table from above at an angle" feel - similar to classic isometric games but simpler.
- NPCs should have idle animations (eating, chatting) to make the scene feel alive before they notice the fly and start slapping.
- The warning system is critical for fair gameplay - players must always have enough time to react and escape.
- Consider adding a brief invincibility period after being hit (i-frames) so the player doesn't lose multiple lives in quick succession.
- The MVP should be fully playable as a standalone HTML page served from a simple web server.
