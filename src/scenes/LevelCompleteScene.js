import Phaser from 'phaser';
import { addButton } from '../ui/Button.js';
import { addPixelTitle } from '../ui/title.js';
import { TEXT_STYLE } from '../ui/style.js';
import { fadeIn, fadeTo } from '../ui/transition.js';
import { newGame } from '../gameState.js';
import { LEVELS } from '../levels.js';
import { playSfx } from '../audio/sounds.js';

// Shown after reaching a level's target score. After the last level it
// doubles as the victory screen.
export class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super('LevelCompleteScene');
  }

  create({ levelIndex = 0, levelScore = 0, totalScore = 0, lives = 0 } = {}) {
    this.leaving = false;
    const { width } = this.scale;
    const last = levelIndex >= LEVELS.length - 1;
    this.cameras.main.setBackgroundColor(last ? '#2b1640' : '#1d2a14');

    addPixelTitle(this, width / 2, 110, last ? 'Chiến thắng!' : `Xong màn ${levelIndex + 1}!`, {
      scale: 4,
    });

    const fly = this.add.sprite(width / 2, 200, 'fly').setScale(4).play('fly-move');
    this.tweens.add({ targets: fly, y: 185, duration: 400, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    const lines = last
      ? [`Ăn sạch cả ${LEVELS.length} quán!`, `Tổng điểm: ${totalScore}`]
      : [`Điểm màn này: ${levelScore}`, `Tổng điểm: ${totalScore}`, `Mạng còn: ${lives}`];
    this.add
      .text(width / 2, 300, lines.join('\n'), {
        ...TEXT_STYLE,
        fontSize: '32px',
        align: 'center',
        lineSpacing: 10,
      })
      .setOrigin(0.5);

    if (last) {
      addButton(this, width / 2 - 125, 440, 'Chơi Lại', () => fadeTo(this, 'GameScene', newGame()), {
        key: 'ENTER',
      });
      addButton(this, width / 2 + 125, 440, 'Menu', () => fadeTo(this, 'MenuScene'));
    } else {
      const next = { levelIndex: levelIndex + 1, lives, totalScore };
      addButton(this, width / 2, 440, 'Tiếp Tục', () => fadeTo(this, 'GameScene', next), {
        key: 'ENTER',
      });
    }

    playSfx(this, 'jingle');
    fadeIn(this);
  }
}
