import * as ReactDOM from 'react-dom';
import { useAnimationsFinished } from './useAnimationsFinished';
import { useEnhancedEffect } from './useEnhancedEffect';
import { useLatestRef } from './useLatestRef';

export function useUnmountAfterExitAnimation(parameters: useUnmountAfterExitAnimation.Parameters) {
  const {
    open,
    animated,
    animatedElementRef,
    setMounted,
    flushUpdatesSynchronously = false,
  } = parameters;

  const runOnceAnimationsFinish = useAnimationsFinished(animatedElementRef);

  const openRef = useLatestRef(open);

  useEnhancedEffect(() => {
    function unmount() {
      if (flushUpdatesSynchronously) {
        ReactDOM.flushSync(() => {
          if (!openRef.current) {
            setMounted(false);
          }
        });
      } else if (!openRef.current) {
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
  }, [animated, open, openRef, runOnceAnimationsFinish, setMounted, flushUpdatesSynchronously]);
}

export namespace useUnmountAfterExitAnimation {
  export interface Parameters {
    open: boolean;
    animated: boolean;
    animatedElementRef: React.RefObject<HTMLElement | null>;
    setMounted: (mounted: boolean) => void;
    flushUpdatesSynchronously?: boolean;
  }
}
