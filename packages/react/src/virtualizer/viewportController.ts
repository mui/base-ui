/**
 * How a write hands its position to the engine: always, only once the scrollport accepted it, or
 * not at all, for a list that is not windowing and so has no window to recompute.
 */
export type ViewportSync = 'always' | 'if-accepted' | 'never';

export interface ViewportEnvironment {
  /**
   * Hands the position just written to the engine, which the browser tells only a task later, and
   * would otherwise read a correction as the user scrolling in whichever direction it went.
   */
  syncEngine: () => void;
}

/**
 * Owns the scroll position the virtualizer writes on the user's behalf.
 *
 * Every position this component writes goes through here, so a scroll event can be told apart
 * from the echo of a write, and the engine learns of each write in the same place.
 */
export class ViewportController {
  /**
   * The last `scrollTop` written here, so user-driven scrolling can be told apart from the scroll
   * events of the corrective writes.
   */
  private lastWrittenScrollTop: number | null = null;

  constructor(private readonly environment: ViewportEnvironment) {}

  /**
   * Writes a scroll position and reports whether the scrollport accepted it. A scrollport without
   * the overflow to scroll there clamps the write, as a popup does on the frame it opens.
   */
  write(scrollElement: HTMLElement, scrollTop: number, sync: ViewportSync): boolean {
    this.lastWrittenScrollTop = scrollTop;
    scrollElement.scrollTo({ behavior: 'instant' as ScrollBehavior, top: scrollTop });
    const accepted = Math.abs(scrollElement.scrollTop - scrollTop) <= 1;

    if (sync === 'always' || (sync === 'if-accepted' && accepted)) {
      this.environment.syncEngine();
    }

    return accepted;
  }

  /** Whether a scroll event reports the position last written here. */
  isEcho(scrollTop: number) {
    return (
      this.lastWrittenScrollTop != null && Math.abs(scrollTop - this.lastWrittenScrollTop) <= 1
    );
  }
}
