'use client';
import * as React from 'react';
import { useEventCallback } from './useEventCallback';

/**
 * Executes a function once all animations have finished on the provided element.
 * @ignore - internal hook.
 */
export function useAnimationsFinished(getElement: () => Element | null | undefined) {
  const frame1Ref = React.useRef(-1);
  const frame2Ref = React.useRef(-1);

  const cancelFrames = useEventCallback(() => {
    cancelAnimationFrame(frame1Ref.current);
    cancelAnimationFrame(frame2Ref.current);
  });

  React.useEffect(() => cancelFrames, [cancelFrames]);

  return useEventCallback((fnToExecute: () => void) => {
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
      frame2Ref.current = requestAnimationFrame(async () => {
        await Promise.allSettled(element.getAnimations().map((animation) => animation.finished));
        fnToExecute();
      });
    });
  });
}
