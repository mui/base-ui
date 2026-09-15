'use client';

type AnimationFrameId = number;

const EMPTY = null;

/** A single replaceable animation-frame callback tied to one window. */
export class WindowAnimationFrame {
  static request(fn: FrameRequestCallback, ownerWindow: Window) {
    return ownerWindow.requestAnimationFrame(fn);
  }

  static cancel(id: AnimationFrameId, ownerWindow: Window) {
    try {
      ownerWindow.cancelAnimationFrame(id);
    } catch {
      // The window may have closed.
    }
  }

  constructor(private readonly ownerWindow: Window) {}

  currentId: AnimationFrameId | null = EMPTY;

  request(fn: Function) {
    this.cancel();
    this.currentId = WindowAnimationFrame.request(() => {
      this.currentId = EMPTY;
      fn();
    }, this.ownerWindow);
  }

  cancel = () => {
    if (this.currentId !== EMPTY) {
      const id = this.currentId;
      this.currentId = EMPTY;
      WindowAnimationFrame.cancel(id, this.ownerWindow);
    }
  };
}
