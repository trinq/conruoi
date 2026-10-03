import Phaser from 'phaser';
import { createFlyTexture } from '../fly/flyTexture.js';
import { createFoodTextures } from '../food/foodTypes.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.load.svg('placeholder', 'assets/placeholder.svg', { width: 32, height: 32 });
  }

  create() {
    createFlyTexture(this);
    createFoodTextures(this);
    this.anims.create({
      key: 'fly-idle',
      frames: this.anims.generateFrameNumbers('fly', { frames: [0, 1] }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'fly-move',
      frames: this.anims.generateFrameNumbers('fly', { frames: [0, 1] }),
      frameRate: 24,
      repeat: -1,
    });

    this.scene.start('GameScene');
  }
}
