import { stickDirection } from '../game/direction.js';

const LEFT_SHARE = 0.45; // a touch starting in this share of the width flies
const RADIUS = 60; // CSS px the knob can travel from where the thumb landed
const DEAD_ZONE = 0.1;
const HOLD_SLOP = 12; // CSS px the thumb must move to take back control

// Floating joystick: a touch that starts on the left of `element` puts the
// stick under the thumb, and dragging it gives a move direction whose length
// is how hard it is pushed, like the keyboard's but analogue. Lifting the
// thumb hides the stick and stops the fly. Only one thumb drives the stick;
// other touches are left alone.
//
// After a tap lands the fly on a dish, hold() lets the resting thumb go
// quiet: the stick gives no input until the thumb moves again, so the fly
// can land and eat while the thumb stays on the screen.
//
// `view` draws it: show(x, y), move(dx, dy), hide(). `onLift` runs when the
// thumb leaves the stick.
export class TouchStick {
  constructor(element, view, { enabled = () => true, onLift = () => {} } = {}) {
    this.view = view;
    this.enabled = enabled;
    this.stick = null; // { id, x, y, dx, dy }

    element.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch' || this.stick || !this.enabled()) return;
      const r = element.getBoundingClientRect();
      if (e.clientX - r.left > r.width * LEFT_SHARE) return;
      this.stick = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, dy: 0 };
      this.view.show(e.clientX, e.clientY);
      this.view.move(0, 0);
    });
    element.addEventListener('pointermove', (e) => {
      const s = this.stick;
      if (!s || e.pointerId !== s.id) return;
      const dx = e.clientX - s.x;
      const dy = e.clientY - s.y;
      const len = Math.hypot(dx, dy);
      const k = len > RADIUS ? RADIUS / len : 1;
      s.dx = dx * k;
      s.dy = dy * k;
      if (s.held && Math.hypot(s.dx - s.held.dx, s.dy - s.held.dy) > HOLD_SLOP) s.held = null;
      this.view.move(s.dx, s.dy);
    });
    const end = (e) => {
      if (!this.stick || e.pointerId !== this.stick.id) return;
      this.release();
      if (this.enabled()) onLift();
    };
    element.addEventListener('pointerup', end);
    element.addEventListener('pointercancel', end);
    window.addEventListener('blur', () => this.release());
  }

  // True while `pointerId` is the thumb on the stick.
  owns(pointerId) {
    return this.stick?.id === pointerId;
  }

  hold() {
    if (this.stick) this.stick.held = { dx: this.stick.dx, dy: this.stick.dy };
  }

  release() {
    if (!this.stick) return;
    this.stick = null;
    this.view.hide();
  }

  // Move vector on the ground plane, length 0..1 (0 when not touched).
  direction() {
    const s = this.stick;
    if (!s || s.held || !this.enabled()) return { x: 0, z: 0 };
    return stickDirection(s.dx, s.dy, RADIUS, DEAD_ZONE);
  }
}
