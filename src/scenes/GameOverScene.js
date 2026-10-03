import Phaser from 'phaser';
import { addButton } from '../ui/Button.js';
import { addPixelTitle } from '../ui/title.js';
import { TEXT_STYLE } from '../ui/style.js';
import { fadeIn, fadeTo } from '../ui/transition.js';
import { newGame } from '../gameState.js';
import { LEVELS } from '../levels.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create({ totalScore = 0, levelIndex = 0 } = {}) {
    this.leaving = false;
    const { width } = this.scale;
    this.cameras.main.setBackgroundColor('#1d1410');

    addPixelTitle(this, width / 2, 120, 'Bị đập rồi!', { color: '#ff6b5b', scale: 4 });
    this.add
      .sprite(width / 2, 210, 'fly', 1)
      .setScale(4)
      .setAngle(180); // belly up

    this.add
      .text(width / 2, 280, `Điểm: ${totalScore}`, { ...TEXT_STYLE, fontSize: '42px' })
      .setOrigin(0.5);
    this.add
      .text(width / 2, 322, `Dừng ở màn ${levelIndex + 1} / ${LEVELS.length}`, {
        ...TEXT_STYLE,
        fontSize: '26px',
        color: '#d8c6a5',
      })
      .setOrigin(0.5);

    addButton(this, width / 2 - 125, 420, 'Chơi Lại', () => fadeTo(this, 'GameScene', newGame()), {
      key: 'ENTER',
    });
    addButton(this, width / 2 + 125, 420, 'Menu', () => fadeTo(this, 'MenuScene'));

    fadeIn(this);
  }
}
