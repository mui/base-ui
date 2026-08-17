import { NOOP } from '@base-ui/utils/empty';
import type { FocusableElement } from './tabbable';

interface Options {
  preventScroll?: boolean | undefined;
  sync?: boolean | undefined;
  // Called when the frame runs to decide whether focus should still be applied.
  shouldFocus?: (() => boolean) | undefined;
  // Called with the element right after it was focused, in the same frame.
  onFocused?: ((element: FocusableElement) => void) | undefined;
}

let rafId = 0;
export function enqueueFocus(el: FocusableElement | null, options: Options = {}) {
  const { preventScroll = false, sync = false, shouldFocus, onFocused } = options;

  cancelAnimationFrame(rafId);

  function exec() {
    if (shouldFocus && !shouldFocus()) {
      return;
    }
    el?.focus({ preventScroll });
    if (el && onFocused) {
      onFocused(el);
    }
  }

  if (sync) {
    exec();
    return NOOP;
  }

  const currentRafId = requestAnimationFrame(exec);
  rafId = currentRafId;
  return () => {
    if (rafId === currentRafId) {
      cancelAnimationFrame(currentRafId);
      rafId = 0;
    }
  };
}
