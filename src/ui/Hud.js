import { TEXT_STYLE as STYLE } from './style.js';

export class Hud {
  constructor(scene) {
    this.scene = scene;
    this.scoreText = scene.add.text(16, 12, '', STYLE).setDepth(20000).setScrollFactor(0);
    this.hearts = [];
    this.levelText = scene.add
      .text(scene.scale.width / 2, 12, '', { ...STYLE, fontSize: '24px', color: '#ffe8a8' })
      .setOrigin(0.5, 0)
      .setDepth(20000)
      .setScrollFactor(0);
  }

  setLevel(text) {
    this.levelText.setText(text);
  }

  // Hearts in the top-right corner: full for remaining lives, empty for lost.
  setLives(lives, maxLives) {
    const { width } = this.scene.scale;
    while (this.hearts.length < maxLives) {
      const i = this.hearts.length;
      this.hearts.push(
        this.scene.add
          .image(width - 16 - i * 30, 16, 'heart', 0)
          .setOrigin(1, 0)
          .setScale(3.5)
          .setDepth(20000)
          .setScrollFactor(0),
      );
    }
    // Rightmost heart is lost first.
    this.hearts.forEach((h, i) => h.setFrame(maxLives - 1 - i < lives ? 0 : 1));
  }

  // Big centred message, e.g. when the round ends.
  banner(text) {
    const { width, height } = this.scene.scale;
    this.scene.add
      .text(width / 2, height / 2, text, { ...STYLE, fontSize: '64px', strokeThickness: 8 })
      .setOrigin(0.5)
      .setDepth(20001)
      .setScrollFactor(0);
  }

  setScore(score, target) {
    this.scoreText.setText(`Điểm: ${score} / ${target}`);
  }

  // Floating "+N" popup that drifts up and fades out.
  popup(x, y, text) {
    const t = this.scene.add
      .text(x, y, text, { ...STYLE, fontSize: '24px', color: '#ffe066' })
      .setOrigin(0.5)
      .setDepth(20000);
    this.scene.tweens.add({
      targets: t,
      y: y - 40,
      alpha: 0,
      duration: 900,
      ease: 'Cubic.easeOut',
      onComplete: () => t.destroy(),
    });
  }
}
