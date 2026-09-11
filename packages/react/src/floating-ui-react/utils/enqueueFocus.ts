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

  // `exec` is a hoisted function declaration, so the null-guard narrowing
  // of `el` is not preserved inside it.
  const target = el;
  const pendingRafId = rafIds.get(target);
  if (pendingRafId !== undefined) {
    cancelAnimationFrame(pendingRafId);
    rafIds.delete(target);
  }

  function exec() {
    rafIds.delete(target);
    if (shouldFocus && !shouldFocus()) {
      return;
    }
    target.focus({ preventScroll });
  }

  if (sync) {
    exec();
    return NOOP;
  }

  const currentRafId = requestAnimationFrame(exec);
  rafIds.set(target, currentRafId);
  return () => {
    if (rafIds.get(target) === currentRafId) {
      cancelAnimationFrame(currentRafId);
      rafIds.delete(target);
    }
  };
}
