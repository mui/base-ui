'use client';

type TimeoutId = number;

const EMPTY = 0 as TimeoutId;

/** A single replaceable timeout tied to one window. */
export class WindowTimeout {
  constructor(private readonly ownerWindow: Window) {}

  currentId: TimeoutId = EMPTY;

  start(delay: number, fn: Function) {
    this.clear();
    this.currentId = this.ownerWindow.setTimeout(() => {
      this.currentId = EMPTY;
      fn();
    }, delay);
  }

  clear = () => {
    if (this.currentId !== EMPTY) {
      const id = this.currentId;
      this.currentId = EMPTY;
      try {
        this.ownerWindow.clearTimeout(id);
      } catch {
        // The window may have closed.
      }
    }
  };
}
