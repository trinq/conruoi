import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { GameScene } from './scenes/GameScene.js';

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

const game = new Phaser.Game({
  type: Phaser.AUTO, // WebGL with Canvas fallback
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#1d1410',
  pixelArt: true,
  scene: [BootScene, GameScene],
});

// Handy for debugging and browser-driven checks during development.
if (import.meta.env.DEV) window.__game = game;
