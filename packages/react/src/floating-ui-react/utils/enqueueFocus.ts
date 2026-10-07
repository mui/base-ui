import { NOOP } from '@base-ui/utils/empty';
import type { FocusableElement } from './tabbable';

interface Options {
  preventScroll?: boolean | undefined;
  sync?: boolean | undefined;
  // Called when the frame runs to decide whether focus should still be applied.
  shouldFocus?: (() => boolean) | undefined;
}

// Pending focus frames are keyed per element so concurrent callers targeting
// different elements can't cancel each other's queued focus.
const rafIds = new WeakMap<FocusableElement, number>();

export function enqueueFocus(el: FocusableElement | null, options: Options = {}) {
  const { preventScroll = false, sync = false, shouldFocus } = options;

  if (!el) {
    return NOOP;
  }

  const pendingRafId = rafIds.get(el);
  if (pendingRafId !== undefined) {
    cancelAnimationFrame(pendingRafId);
    rafIds.delete(el);
  }

  const exec = () => {
    rafIds.delete(el);
    if (shouldFocus && !shouldFocus()) {
      return;
    }
    el.focus({ preventScroll });
  };

  if (sync) {
    exec();
    return NOOP;
  }

  const currentRafId = requestAnimationFrame(exec);
  rafIds.set(el, currentRafId);
  return () => {
    if (rafIds.get(el) === currentRafId) {
      cancelAnimationFrame(currentRafId);
      rafIds.delete(el);
    }
  };
}
