import Phaser from 'phaser';
import '@fontsource/vt323';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { LevelCompleteScene } from './scenes/LevelCompleteScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

const config = {
  type: Phaser.AUTO, // WebGL with Canvas fallback
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#1d1410',
  pixelArt: true,
  scene: [BootScene, MenuScene, GameScene, LevelCompleteScene, GameOverScene],
};

// Canvas text needs the font loaded before it is first drawn. Loading a
// Vietnamese sample pulls in the vietnamese unicode-range subset too.
document.fonts
  .load('28px VT323', 'Con Ruồi ăn phở')
  .catch(() => {})
  .then(() => {
    const game = new Phaser.Game(config);
    // Handy for debugging and browser-driven checks during development.
    if (import.meta.env.DEV) window.__game = game;
  });
