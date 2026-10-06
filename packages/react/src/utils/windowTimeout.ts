type TimeoutId = number;

const EMPTY = 0 as TimeoutId;

/**
 * A single replaceable timeout tied to one window.
 * Unlike the shared `Timeout`, it schedules on the element's owner window, so
 * closing an iframe also drops its pending work. `clear` tolerates a closed window.
 */
export class WindowTimeout {
  constructor(private readonly ownerWindow: Window) {}

  currentId: TimeoutId = EMPTY;

  /** Whether a timeout is armed and has not fired or been cleared. A method, as on `Timeout`. */
  isStarted(): boolean {
    return this.currentId !== EMPTY;
  }

  start(delay: number, fn: () => void) {
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
