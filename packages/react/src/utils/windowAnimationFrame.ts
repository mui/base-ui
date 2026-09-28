type AnimationFrameId = number;

const EMPTY = null;

/**
 * A single replaceable animation-frame callback tied to one window.
 * Unlike the shared utility, this schedules work in the element's owner window,
 * so closing an iframe also stops its pending work. Cleanup tolerates a closed window.
 */
export class WindowAnimationFrame {
  static cancel(id: AnimationFrameId, ownerWindow: Window) {
    try {
      ownerWindow.cancelAnimationFrame(id);
    } catch {
      // The window may have closed.
    }
  }

  constructor(private readonly ownerWindow: Window) {}

  currentId: AnimationFrameId | null = EMPTY;

  request(fn: () => void) {
    this.cancel();
    this.currentId = this.ownerWindow.requestAnimationFrame(() => {
      this.currentId = EMPTY;
      fn();
    });
  }

  cancel = () => {
    if (this.currentId !== EMPTY) {
      const id = this.currentId;
      this.currentId = EMPTY;
      WindowAnimationFrame.cancel(id, this.ownerWindow);
    }
  };
}
