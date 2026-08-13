/**
 * Timeout handle bound to a specific window. The shared `Timeout` util
 * schedules through the main realm's `setTimeout`, which the browser throttles
 * to a second or more while that window is hidden — a press-hold inside a
 * popout window would fire late the moment its opener is backgrounded.
 * Mirrors `WindowAnimationFrame`'s shape.
 */
export class WindowTimeout {
  currentId: number | null = null;

  private win: Window;

  constructor(win: Window) {
    this.win = win;
  }

  start(delay: number, fn: () => void): void {
    this.clear();
    this.currentId = this.win.setTimeout(() => {
      this.currentId = null;
      fn();
    }, delay);
  }

  clear(): void {
    if (this.currentId !== null) {
      this.win.clearTimeout(this.currentId);
      this.currentId = null;
    }
  }
}
