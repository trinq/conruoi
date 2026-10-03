// Movement keys read by physical key position (KeyboardEvent.code) instead of
// Phaser's keyCode-based keys. With a Vietnamese input method (Telex/VNI)
// switched on, W/A/S/D arrive as composition keystrokes (keyCode 229) that
// Phaser cannot map, but `code` still names the physical key. Arrow keys are
// accepted too and are never touched by input methods.
const BINDINGS = {
  KeyW: 'up',
  ArrowUp: 'up',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
};

export class MoveKeys {
  constructor(scene) {
    this.pressed = new Set();
    const onDown = (e) => {
      if (!(e.code in BINDINGS)) return;
      this.pressed.add(e.code);
      // Keep the input method from inserting text and arrows from scrolling.
      e.preventDefault();
    };
    const onUp = (e) => this.pressed.delete(e.code);
    // A key released while the window is unfocused never sends keyup.
    const onBlur = () => this.pressed.clear();

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', onBlur);
    scene.events.once('shutdown', () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', onBlur);
    });
  }

  // { up, down, left, right } booleans for isoDirection().
  state() {
    const s = { up: false, down: false, left: false, right: false };
    for (const code of this.pressed) s[BINDINGS[code]] = true;
    return s;
  }
}
