import Phaser from 'phaser';
import { TEXT_STYLE } from './style.js';

const W = 220;
const H = 56;
const FACE = 0xd63a2f;
const FACE_HOVER = 0xf0533f;
const EDGE = 0x7a1c14;

// Chunky red button. `key` (e.g. 'ENTER') also triggers it from the keyboard.
export function addButton(scene, x, y, label, onClick, { key } = {}) {
  const g = scene.add.graphics();
  const draw = (color, pressed) => {
    g.clear();
    const dy = pressed ? 4 : 0;
    if (!pressed) {
      g.fillStyle(EDGE, 1);
      g.fillRoundedRect(-W / 2, -H / 2 + 6, W, H, 10);
    }
    g.fillStyle(color, 1);
    g.fillRoundedRect(-W / 2, -H / 2 + dy, W, H, 10);
    text.setY(dy);
  };
  const text = scene.add.text(0, 0, label, { ...TEXT_STYLE, fontSize: '34px' }).setOrigin(0.5);
  const button = scene.add.container(x, y, [g, text]).setSize(W, H + 6).setDepth(30000);
  draw(FACE, false);

  let fired = false;
  const fire = () => {
    if (fired) return;
    fired = true;
    onClick();
  };

  button
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => draw(FACE_HOVER, false))
    .on('pointerout', () => draw(FACE, false))
    .on('pointerdown', () => draw(FACE_HOVER, true))
    .on('pointerup', () => {
      draw(FACE_HOVER, false);
      fire();
    });

  if (key) scene.input.keyboard.once(`keydown-${key}`, fire);

  // Gentle idle pulse so the main action stands out.
  scene.tweens.add({
    targets: button,
    scale: 1.04,
    duration: 700,
    yoyo: true,
    repeat: -1,
    ease: Phaser.Math.Easing.Sine.InOut,
  });
  return button;
}
