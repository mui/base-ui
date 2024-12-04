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

    if (typeof element.getAnimations === 'function') {
      frameRef.current = requestAnimationFrame(() => {
        Promise.allSettled(element.getAnimations().map((anim) => anim.finished)).then(fnToExecute);
      });
    } else {
      fnToExecute();
    }
  });
}
