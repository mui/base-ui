import type { Timeout } from '@base-ui/utils/useTimeout';
import type { AnimationFrame } from '@base-ui/utils/useAnimationFrame';

/**
 * Schedules `callback` after the DOM has settled following a reorder.
 *
 * The sequence — `setTimeout(0)` → `rAF` → `rAF` — ensures:
 * 1. MutationObserver fires and React schedules a re-render.
 * 2. React commits updated indices and paints (two frames).
 */
export function afterDomSettle(
  timeout: Timeout,
  frame: AnimationFrame,
  callback: () => void,
): void {
  timeout.start(0, () => {
    frame.request(() => {
      frame.request(callback);
    });
  });
}
