import Phaser from 'phaser';
import { drawFloor } from '../ui/floor.js';
import { addButton } from '../ui/Button.js';
import { addPixelTitle } from '../ui/title.js';
import { TEXT_STYLE } from '../ui/style.js';
import { fadeIn, fadeTo } from '../ui/transition.js';
import { newGame } from '../gameState.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    this.leaving = false;
    const { width, height } = this.scale;
    drawFloor(this);
    this.add.rectangle(0, 0, width, height, 0x000000, 0.25).setOrigin(0);

    addPixelTitle(this, width / 2, 130, 'Con Ruồi');
    this.add
      .text(width / 2, 205, 'Làm con ruồi ở quán ăn vỉa hè', { ...TEXT_STYLE, fontSize: '28px' })
      .setOrigin(0.5);

    // A fly buzzing in a loop around the title.
    const fly = this.add.sprite(width / 2, 130, 'fly').setScale(3).play('fly-move');
    this.tweens.addCounter({
      from: 0,
      to: Math.PI * 2,
      duration: 3200,
      repeat: -1,
      onUpdate: (tw) => {
        const a = tw.getValue();
        fly.setPosition(width / 2 + Math.cos(a) * 230, 130 + Math.sin(a * 2) * 40);
        fly.setFlipX(Math.sin(a) > 0);
      },
    });

    this.add
      .text(
        width / 2,
        300,
        'WASD / mũi tên: bay  ·  Click món ăn: đậu xuống ăn\nThấy vùng đỏ thì bay đi ngay!  ·  M: tắt/bật tiếng',
        { ...TEXT_STYLE, fontSize: '26px', align: 'center', lineSpacing: 8 },
      )
      .setOrigin(0.5);

    addButton(this, width / 2, 410, 'Chơi', () => fadeTo(this, 'GameScene', newGame()), {
      key: 'ENTER',
    });

    // Browsers block audio until the first click or key press.
    if (this.sound.locked) {
      const hint = this.add
        .text(width / 2, height - 40, 'Click hoặc bấm phím bất kỳ để bật âm thanh', {
          ...TEXT_STYLE,
          fontSize: '22px',
          color: '#d8c6a5',
        })
        .setOrigin(0.5);
      this.sound.once('unlocked', () => hint.destroy());
    }

    fadeIn(this);
  }
}
