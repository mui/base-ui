'use client';
import * as React from 'react';
import { useEventCallback } from './useEventCallback';

/**
 * Executes a function once all animations have finished on the provided element.
 * @ignore - internal hook.
 */
export function useAnimationsFinished(ref: React.RefObject<HTMLElement | null>) {
  const frameRef = React.useRef(-1);

  const cancelFrames = useEventCallback(() => {
    cancelAnimationFrame(frameRef.current);
  });

  React.useEffect(() => cancelFrames, [cancelFrames]);

  return useEventCallback((fnToExecute: () => void) => {
    cancelFrames();

    const element = ref.current;

    if (!element) {
      return;
    }

    // Wait for the CSS styles to be applied to determine if the animation has been removed in the
    // [data-instant] state. This allows the close animation to play if the `delay` instantType is
    // applying to the same element.
    frameRef.current = requestAnimationFrame(async () => {
      await Promise.allSettled(element.getAnimations().map((animation) => animation.finished));
      fnToExecute();
    });
  });
}
