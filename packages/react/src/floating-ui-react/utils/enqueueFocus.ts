import { NOOP } from '@base-ui/utils/empty';
import type { FocusableElement } from './tabbable';

interface Options {
  preventScroll?: boolean | undefined;
  sync?: boolean | undefined;
  guard?: (() => boolean) | undefined;
}

let rafId = 0;
export function enqueueFocus(el: FocusableElement | null, options: Options = {}) {
  const { preventScroll = false, sync = false, guard } = options;

  cancelAnimationFrame(rafId);

  function exec() {
    if (guard && !guard()) {
      return;
    }
    el?.focus({ preventScroll });
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
