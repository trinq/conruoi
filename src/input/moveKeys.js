// Movement keys read by physical key position (KeyboardEvent.code) instead of
// key values. With a Vietnamese input method (Telex/VNI) switched on, W/A/S/D
// arrive as composition keystrokes (keyCode 229, key "Process"), but `code`
// still names the physical key. Arrow keys are accepted too.
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
  constructor(target = window) {
    this.pressed = new Set();
    target.addEventListener('keydown', (e) => {
      if (!(e.code in BINDINGS)) return;
      this.pressed.add(e.code);
      // Keep the input method from inserting text and arrows from scrolling.
      e.preventDefault();
    });
    target.addEventListener('keyup', (e) => this.pressed.delete(e.code));
    // A key released while the window is unfocused never sends keyup.
    window.addEventListener('blur', () => this.pressed.clear());
  }

  // { up, down, left, right } booleans.
  state() {
    const s = { up: false, down: false, left: false, right: false };
    for (const code of this.pressed) s[BINDINGS[code]] = true;
    return s;
  }
}
