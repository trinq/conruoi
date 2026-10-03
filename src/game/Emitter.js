// Minimal event emitter.
export class Emitter {
  constructor() {
    this.handlers = new Map();
  }

  on(event, fn) {
    if (!this.handlers.has(event)) this.handlers.set(event, []);
    this.handlers.get(event).push(fn);
    return this;
  }

  emit(event, ...args) {
    for (const fn of this.handlers.get(event) ?? []) fn(...args);
  }
}
