'use client';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { AnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { useState } from '@base-ui/utils/useState';
import { useMemo } from '@base-ui/utils/useMemo';

export type TransitionStatus = 'starting' | 'ending' | 'idle' | undefined;

/**
 * Provides a status string for CSS animations.
 * @param open - a boolean that determines if the element is open.
 * @param enableIdleState - a boolean that enables the `'idle'` state between `'starting'` and `'ending'`
 */
export function useTransitionStatus(
  open: boolean,
  enableIdleState: boolean = false,
  deferEndingState: boolean = false,
) {
  const [transitionStatus, setTransitionStatus] = useState<TransitionStatus>(
    open && enableIdleState ? 'idle' : undefined,
  );
  const [mounted, setMounted] = useState(open);

  if (open && !mounted) {
    setMounted(true);
    setTransitionStatus('starting');
  }

  if (!open && mounted && transitionStatus !== 'ending' && !deferEndingState) {
    setTransitionStatus('ending');
  }

  if (!open && !mounted && transitionStatus === 'ending') {
    setTransitionStatus(undefined);
  }

  if (deferEndingState) {
    useIsoLayoutEffect(() => {
      if (!open && mounted && transitionStatus !== 'ending') {
        const frame = AnimationFrame.request(() => {
          setTransitionStatus('ending');
        });

        return () => {
          AnimationFrame.cancel(frame);
        };
      }
    }, [open, mounted, transitionStatus, deferEndingState]);
  }

  if (enableIdleState) {
    useIsoLayoutEffect(() => {
      if (!open) {
        return undefined;
      }

      if (open && mounted && transitionStatus !== 'idle') {
        setTransitionStatus('starting');
      }

      const frame = AnimationFrame.request(() => {
        setTransitionStatus('idle');
      });

      return () => {
        AnimationFrame.cancel(frame);
      };
    }, [enableIdleState, open, mounted, setTransitionStatus, transitionStatus]);
  } else {
    useIsoLayoutEffect(() => {
      if (!open) {
        return undefined;
      }

      const frame = AnimationFrame.request(() => {
        // Avoid `flushSync` here due to Firefox.
        // See https://github.com/mui/base-ui/pull/3424
        setTransitionStatus(undefined);
      });

      return () => {
        AnimationFrame.cancel(frame);
      };
    }, [enableIdleState, open]);
  }

  return useMemo(
    () => ({
      mounted,
      setMounted,
      transitionStatus,
    }),
    [mounted, transitionStatus],
  );
}
