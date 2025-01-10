import * as React from 'react';
import { useAnimationsFinished } from './useAnimationsFinished';
import { useEventCallback } from './useEventCallback';
import { useLatestRef } from './useLatestRef';

/**
 * Calls the provided function when the CSS exit animation or transition completes.
 * Useful for unmounting the component after animating out.
 */
export function useAfterExitAnimation(parameters: useAfterExitAnimation.Parameters) {
  const { enabled = true, open, animatedElementRef, onFinished: onFinishedParam } = parameters;

  const onFinished = useEventCallback(onFinishedParam);
  const runOnceAnimationsFinish = useAnimationsFinished(animatedElementRef);
  const openRef = useLatestRef(open);

  React.useEffect(() => {
    if (!enabled) {
      return;
    }

    function callOnFinished() {
      if (!openRef.current) {
        onFinished();
      }
    }

    if (!open) {
      runOnceAnimationsFinish(callOnFinished);
    }
  }, [enabled, open, openRef, runOnceAnimationsFinish, onFinished]);
}

export namespace useAfterExitAnimation {
  export interface Parameters {
    enabled?: boolean;
    /**
     * Determines if the component is open.
     * The logic runs when the component goes from open to closed.
     */
    open: boolean;
    /**
     * Ref to the element being closed.
     */
    animatedElementRef: React.RefObject<HTMLElement | null>;
    /**
     * Function to call when the animation finishes (or there is no animation).
     */
    onFinished: () => void;
  }
}
