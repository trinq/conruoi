// Touch or mouse/keyboard, from what the player actually uses. Starts in
// touch mode when the main pointer is coarse, switches to touch on a touch
// pointer and back on a mouse/pen pointer or a key, so a laptop with a
// touchscreen works both ways. The mode is also put on <html data-input> for
// styles.
export class InputMode {
  constructor() {
    this.listeners = [];
    this.set(window.matchMedia?.('(pointer: coarse)').matches ? 'touch' : 'mouse');
    window.addEventListener('pointerdown', (e) => this.set(e.pointerType === 'touch' ? 'touch' : 'mouse'), true);
    window.addEventListener('keydown', () => this.set('mouse'), true);
  }

  get touch() {
    return this.mode === 'touch';
  }

  set(mode) {
    if (mode === this.mode) return;
    this.mode = mode;
    document.documentElement.dataset.input = mode;
    for (const fn of this.listeners) fn(mode);
  }

  onChange(fn) {
    this.listeners.push(fn);
  }
}
