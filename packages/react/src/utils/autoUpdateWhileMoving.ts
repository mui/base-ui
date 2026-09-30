import { AnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { autoUpdate } from '../floating-ui-react';
import type { AutoUpdateOptions, FloatingElement, ReferenceElement } from '../floating-ui-react';

/**
 * Frames the anchor must stay still before per-frame polling stops.
 */
export const SETTLE_FRAMES = 2;

/**
 * Floating UI's observers report anchor movement a frame late, so the popup trails an anchor inside
 * an animating container (and `--anchor-width` changes can loop the `ResizeObserver`).
 * After any update, this polls the anchor rect every frame while it moves and stops once it has
 * settled, so no frame loop runs while the popup is idle.
 */
export function autoUpdateWhileMoving(
  reference: ReferenceElement,
  floating: FloatingElement,
  update: () => void,
  options: AutoUpdateOptions,
) {
  const frame = AnimationFrame.create();
  let prevRect = '';
  let stableFrames = 0;

  function rectChanged() {
    const { x, y, width, height } = reference.getBoundingClientRect();
    const rect = `${x} ${y} ${width} ${height}`;
    const changed = rect !== prevRect;
    prevRect = rect;
    return changed;
  }

  function poll() {
    if (rectChanged()) {
      stableFrames = 0;
      update();
    } else if (stableFrames > SETTLE_FRAMES) {
      return;
    }
    stableFrames += 1;
    frame.request(poll);
  }

  const cleanup = autoUpdate(
    reference,
    floating,
    // `ancestorScroll` is off only when anchor tracking is disabled.
    options.ancestorScroll
      ? () => {
          update();
          rectChanged();
          stableFrames = 0;
          frame.request(poll);
        }
      : update,
    options,
  );

  return () => {
    cleanup();
    frame.cancel();
  };
}
