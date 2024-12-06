import { useAnimationsFinished } from './useAnimationsFinished';
import { useEnhancedEffect } from './useEnhancedEffect';
import { useEventCallback } from './useEventCallback';
import { useLatestRef } from './useLatestRef';

/**
 * Calls the provided function when the CSS exit animation or transition completes.
 * Useful for unmounting the component after animating out.
 */
export function useAfterExitAnimation(parameters: useAfterExitAnimation.Parameters) {
  const { open, animated, animatedElementRef, onFinished: onFinishedParam } = parameters;

  const onFinished = useEventCallback(onFinishedParam);
  const runOnceAnimationsFinish = useAnimationsFinished(animatedElementRef);
  const openRef = useLatestRef(open);

  useEnhancedEffect(() => {
    function callOnFinished() {
      if (!openRef.current) {
        onFinished();
      }
    }

    if (!open) {
      if (animated) {
        runOnceAnimationsFinish(callOnFinished);
      } else {
        callOnFinished();
      }
    }
  }, [animated, open, openRef, runOnceAnimationsFinish, onFinished]);
}

export namespace useAfterExitAnimation {
  export interface Parameters {
    /**
     * Determines if the component is open.
     * The logic runs when the component goes from open to closed.
     */
    open: boolean;
    /**
     * Determines if the animations are enabled.
     * If set to `false`, `onFinished` is set immediately after `open` turns `false` (in the next layout effect).
     */
    animated: boolean;
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
