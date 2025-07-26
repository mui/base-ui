'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { AnimationFrame } from '@base-ui-components/utils/useAnimationFrame';

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
  const [transitionStatus, setTransitionStatus] = React.useState<TransitionStatus>(
    open && enableIdleState ? 'idle' : undefined,
  );
  const [mounted, setMounted] = React.useState(open);

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

  useIsoLayoutEffect(() => {
    if (!open && mounted && transitionStatus !== 'ending' && deferEndingState) {
      const frame = AnimationFrame.request(() => {
        setTransitionStatus('ending');
      });

      return () => {
        AnimationFrame.cancel(frame);
      };
    }

    return undefined;
  }, [open, mounted, transitionStatus, deferEndingState]);

  useIsoLayoutEffect(() => {
    if (!open || enableIdleState) {
      return undefined;
    }

    const frame = AnimationFrame.request(() => {
      ReactDOM.flushSync(() => {
        setTransitionStatus(undefined);
      });
    });

    return () => {
      AnimationFrame.cancel(frame);
    };
  }, [enableIdleState, open]);

  useIsoLayoutEffect(() => {
    if (!open || !enableIdleState) {
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

  return React.useMemo(
    () => ({
      mounted,
      setMounted,
      transitionStatus,
    }),
    [mounted, transitionStatus],
  );
}
