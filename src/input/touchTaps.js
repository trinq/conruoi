const SLOP = 14; // CSS px a finger may wander and still count as a tap
const STICK_TAP_MS = 500;

// Touches that lift with little movement on `element` call `onTap(event)`
// with the lifting pointer event. Every finger is tracked by its pointerId,
// so a tap counts while another finger is down (say, on the joystick); a
// finger that drags is not a tap. A touch that brought up the joystick
// (`onStick(pointerId)`) only taps when it is short, so a thumb resting on
// the stick and lifted later does not land the fly.
export class TouchTaps {
  constructor(element, onTap, { onStick = () => false } = {}) {
    this.down = new Map();
    element.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch') return;
      this.down.set(e.pointerId, { x: e.clientX, y: e.clientY, t: e.timeStamp, stick: onStick(e.pointerId) });
    });
    element.addEventListener('pointermove', (e) => {
      const d = this.down.get(e.pointerId);
      if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > SLOP) this.down.delete(e.pointerId);
    });
    element.addEventListener('pointerup', (e) => {
      const d = this.down.get(e.pointerId);
      this.down.delete(e.pointerId);
      if (d && (!d.stick || e.timeStamp - d.t <= STICK_TAP_MS)) onTap(e);
    });
    element.addEventListener('pointercancel', (e) => this.down.delete(e.pointerId));
  }
}
