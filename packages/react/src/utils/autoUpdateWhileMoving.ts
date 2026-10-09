import { AnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { autoUpdate } from '../floating-ui-react';
import type { AutoUpdateOptions, FloatingElement, ReferenceElement } from '../floating-ui-react';

/**
 * Still frames to check after the anchor rect last changed before per-frame polling stops.
 */
export const SETTLE_FRAMES = 3;

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
  let prevRect: string | undefined;
  let stillFrames = 0;

  function poll(force?: boolean) {
    const { x, y, width, height } = reference.getBoundingClientRect();
    const rect = `${x} ${y} ${width} ${height}`;
    if (force || rect !== prevRect) {
      prevRect = rect;
      stillFrames = 0;
      update();
    }
    stillFrames += 1;
    if (stillFrames <= SETTLE_FRAMES) {
      frame.request(poll);
    }
  }

  const cleanup = autoUpdate(
    reference,
    floating,
    // `ancestorScroll` is off only when anchor tracking is disabled.
    options.ancestorScroll ? () => poll(true) : update,
    options,
  );

  return () => {
    cleanup();
    frame.cancel();
  };
}
