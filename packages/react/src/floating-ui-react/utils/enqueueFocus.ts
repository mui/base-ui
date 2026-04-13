import type { FocusableElement } from './tabbable';
import { NOOP } from '../../utils/noop';

interface Options {
  preventScroll?: boolean | undefined;
  cancelPrevious?: boolean | undefined;
  sync?: boolean | undefined;
}

let rafId = 0;
export function enqueueFocus(el: FocusableElement | null, options: Options = {}) {
  const { preventScroll = false, cancelPrevious = true, sync = false } = options;
  if (cancelPrevious) {
    cancelAnimationFrame(rafId);
  }
  const exec = () => el?.focus({ preventScroll });
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
