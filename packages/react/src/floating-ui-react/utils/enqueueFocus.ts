import type { FocusableElement } from 'tabbable';

interface Options {
  preventScroll?: boolean | undefined;
  cancelPrevious?: boolean | undefined;
  sync?: boolean | undefined;
  onFocused?: ((element: FocusableElement) => void) | undefined;
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
