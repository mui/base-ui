import * as React from 'react';
import { useAnimationsFinished } from './useAnimationsFinished';
import { useTransitionStatus } from './useTransitionStatus';

interface UseAnimatedElementParameters {
  open: boolean;
  ref: React.RefObject<HTMLElement | null>;
  enabled: boolean;
}

/**
 * @ignore - internal hook.
 */
export function useAnimatedElement(params: UseAnimatedElementParameters) {
  const { open, ref, enabled } = params;

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open, enabled);
  const runOnceAnimationsFinish = useAnimationsFinished(ref);

  React.useEffect(() => {
    if (!open) {
      if (enabled) {
        runOnceAnimationsFinish(() => {
          setMounted(false);
        });
      } else {
        setMounted(false);
      }
    }
  }, [enabled, open, runOnceAnimationsFinish, setMounted]);

  return {
    mounted,
    transitionStatus,
  };
}
