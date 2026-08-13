/**
 * Frame handle bound to a specific window. The shared `AnimationFrame` util
 * schedules through the main realm's rAF, which the browser throttles/freezes
 * while that window is hidden — a drag inside a popout window would stall the
 * moment its opener is backgrounded. Mirrors the util's re-arm semantics:
 * `currentId` is reset before the callback runs so the callback can schedule
 * the next frame.
 */
export class WindowAnimationFrame {
  currentId: number | null = null;

  private win: Window;

  constructor(win: Window) {
    this.win = win;
  }

  request(fn: () => void): void {
    this.cancel();
    this.currentId = this.win.requestAnimationFrame(() => {
      this.currentId = null;
      fn();
    });
  }

  cancel(): void {
    if (this.currentId !== null) {
      const id = this.currentId;
      // Clear the handle before reaching into the window. Firefox can throw for
      // a closed popout's dead Window proxy; the browser has already discarded
      // that realm's callbacks, so cancellation is best-effort there. Leaving
      // `currentId` set would be worse: every later request would retry the same
      // dead realm and never arm a replacement frame.
      this.currentId = null;
      try {
        this.win.cancelAnimationFrame(id);
      } catch {
        // The owning browsing context is gone, so there is no live callback to
        // cancel. State was released above.
      }
    }
  }
}
