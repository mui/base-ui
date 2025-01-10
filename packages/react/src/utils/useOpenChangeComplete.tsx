import { useAnimationsFinished } from './useAnimationsFinished';
import { useEnhancedEffect } from './useEnhancedEffect';
import { useEventCallback } from './useEventCallback';

/**
 * Calls the provided function when the CSS open animation or transition completes.
 */
export function useOpenChangeComplete(parameters: useOpenChangeComplete.Parameters) {
  const { open, ref, onComplete: onCompleteParam } = parameters;

  const onComplete = useEventCallback(onCompleteParam);
  const runOnceAnimationsFinish = useAnimationsFinished(ref, open);

  useEnhancedEffect(() => {
    runOnceAnimationsFinish(onComplete);
  }, [open, onComplete, runOnceAnimationsFinish]);
}

export namespace useOpenChangeComplete {
  export interface Parameters {
    /**
     * Determines if the component is open.
     * The logic runs when the component goes from open to closed.
     */
    open: boolean;
    /**
     * Ref to the element being closed.
     */
    ref: React.RefObject<HTMLElement | null>;
    /**
     * Function to call when the animation completes (or there is no animation).
     */
    onComplete: () => void;
  }
}
