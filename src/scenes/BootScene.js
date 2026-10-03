import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.load.svg('placeholder', 'assets/placeholder.svg', { width: 32, height: 32 });
  }

  create() {
    this.scene.start('GameScene');
  }
}
