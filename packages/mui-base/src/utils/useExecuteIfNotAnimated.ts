'use client';
import * as React from 'react';
import { useEventCallback } from './useEventCallback';
import { ownerWindow } from './owner';

/**
 * Executes the supplied function only if the given element has no CSS animations or transitions.
 * @ignore - internal hook.
 */
export function useExecuteIfNotAnimated(
  fn: () => void,
  getElement: () => Element | null | undefined,
) {
  const frame1Ref = React.useRef(-1);
  const frame2Ref = React.useRef(-1);

  const cancelFrames = useEventCallback(() => {
    cancelAnimationFrame(frame1Ref.current);
    cancelAnimationFrame(frame2Ref.current);
  });

  React.useEffect(() => cancelFrames, [cancelFrames]);

  const unmount = useEventCallback(() => {
    cancelFrames();

    const element = getElement();

    if (!element) {
      return;
    }

    // Wait for the CSS styles to be applied to determine if the animation has been removed in the
    // [data-instant] state. This allows the close animation to play if the `delay` instantType is
    // applying to the same element.
    // Notes:
    // - A single `requestAnimationFrame` is sometimes unreliable.
    // - `queueMicrotask` does not work.
    frame1Ref.current = requestAnimationFrame(() => {
      frame2Ref.current = requestAnimationFrame(() => {
        const computedStyles = ownerWindow(element).getComputedStyle(element);
        const hasNoAnimation =
          ['', 'none'].includes(computedStyles.animationName) ||
          ['', '0s'].includes(computedStyles.animationDuration);
        const hasNoTransition = ['', '0s'].includes(computedStyles.transitionDuration);
        if (hasNoAnimation && hasNoTransition) {
          fn();
        }
      });
    });
  });

  return unmount;
}
