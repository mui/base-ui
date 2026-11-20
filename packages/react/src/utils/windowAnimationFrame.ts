type AnimationFrameId = number;

const EMPTY = null;

/**
 * A single replaceable animation-frame callback. Unlike the shared `AnimationFrame`,
 * it schedules on the element's owner window, so closing an iframe drops its work.
 */
export class WindowAnimationFrame {
  constructor(private readonly ownerWindow: Window) {}

  currentId: AnimationFrameId | null = EMPTY;

  /** Replaces the pending callback, if any. */
  request(fn: FrameRequestCallback) {
    this.cancel();
    this.currentId = this.ownerWindow.requestAnimationFrame((timestamp) => {
      this.currentId = EMPTY;
      fn(timestamp);
    });
  }

  cancel = () => {
    if (this.currentId !== EMPTY) {
      const id = this.currentId;
      this.currentId = EMPTY;
      try {
        this.ownerWindow.cancelAnimationFrame(id);
      } catch {
        // The window may have closed.
      }
    }
  };
}
