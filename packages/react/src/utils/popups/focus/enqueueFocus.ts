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
const pendingFocus = new WeakMap<FocusableElement, { rafId: number }>();

export function enqueueFocus(el: FocusableElement | null, options: Options = {}) {
  const { preventScroll = false, sync = false, shouldFocus } = options;

  if (!el) {
    return NOOP;
  }

  const pending = pendingFocus.get(el);
  if (pending) {
    cancelAnimationFrame(pending.rafId);
    pendingFocus.delete(el);
  }

  const exec = () => {
    if (shouldFocus && !shouldFocus()) {
      return;
    }
    el.focus({ preventScroll });
  };

  if (sync) {
    exec();
    return NOOP;
  }

  const request = { rafId: 0 };
  pendingFocus.set(el, request);
  request.rafId = requestAnimationFrame(() => {
    // A cancelled frame can still run where cancelAnimationFrame is a no-op (e.g. the
    // jsdom rAF stub), so only the latest request for this element may focus.
    if (pendingFocus.get(el) !== request) {
      return;
    }
    pendingFocus.delete(el);
    exec();
  });

  return () => {
    if (pendingFocus.get(el) === request) {
      cancelAnimationFrame(request.rafId);
      pendingFocus.delete(el);
    }
  };
}
