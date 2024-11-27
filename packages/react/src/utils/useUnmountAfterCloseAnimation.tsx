import { useAnimationsFinished } from './useAnimationsFinished';
import { useEnhancedEffect } from './useEnhancedEffect';
import { useLatestRef } from './useLatestRef';

/**
 * Unmounts a component (by calling the provided `setMounted` function) when its CSS animation or transition completes.
 */
export function useUnmountAfterExitAnimation(parameters: useUnmountAfterExitAnimation.Parameters) {
  const { open, animated, animatedElementRef, setMounted } = parameters;

  const runOnceAnimationsFinish = useAnimationsFinished(animatedElementRef);
  const openRef = useLatestRef(open);

  useEnhancedEffect(() => {
    function unmount() {
      if (!openRef.current) {
        setMounted(false);
      }
    }

    if (!open) {
      if (animated) {
        runOnceAnimationsFinish(unmount);
      } else {
        unmount();
      }
    }
  }, [animated, open, openRef, runOnceAnimationsFinish, setMounted]);
}

export namespace useUnmountAfterExitAnimation {
  export interface Parameters {
    /**
     * Determines if the component is open.
     * The logic runs when the component goes from open to closed.
     */
    open: boolean;
    /**
     * Determines if the animations are enabled.
     * If set to `false`, `setMounted(false)` is set immediately after `open` turns `false` (in the next layout effect).
     */
    animated: boolean;
    /**
     * Ref to the element being closed.
     */
    animatedElementRef: React.RefObject<HTMLElement | null>;
    /**
     * Function to call when the element should be unmounted.
     * It is always called with a single parameter: `false`.
     */
    setMounted: (mounted: boolean) => void;
  }
}
