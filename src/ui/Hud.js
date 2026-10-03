const STYLE = {
  fontFamily: 'monospace',
  fontSize: '22px',
  fontStyle: 'bold',
  color: '#fff6d5',
  stroke: '#3b2412',
  strokeThickness: 5,
};

export class Hud {
  constructor(scene) {
    this.scene = scene;
    this.scoreText = scene.add.text(16, 12, '', STYLE).setDepth(20000).setScrollFactor(0);
  }

  setScore(score, target) {
    this.scoreText.setText(`Điểm: ${score} / ${target}`);
  }

  // Floating "+N" popup that drifts up and fades out.
  popup(x, y, text) {
    const t = this.scene.add
      .text(x, y, text, { ...STYLE, fontSize: '18px', color: '#ffe066' })
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
