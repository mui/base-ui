import type { FocusableElement } from 'tabbable';

interface Options {
  preventScroll?: boolean;
  cancelPrevious?: boolean;
  sync?: boolean;
  onFocused?: (element: FocusableElement) => void;
}

let rafId = 0;
export function enqueueFocus(el: FocusableElement | null, options: Options = {}) {
  const { preventScroll = false, cancelPrevious = true, sync = false, onFocused } = options;
  if (cancelPrevious) {
    cancelAnimationFrame(rafId);
  }
  const exec = () => {
    el?.focus({ preventScroll });
    if (el && onFocused) {
      onFocused(el);
    }
  };
  if (sync) {
    exec();
  } else {
    rafId = requestAnimationFrame(exec);
  }
}
