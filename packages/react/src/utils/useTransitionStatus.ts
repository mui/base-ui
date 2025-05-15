'use client';
import * as React from 'react';
import { useLayoutEffect } from './useLayoutEffect';
import { AnimationFrame } from './useAnimationFrame';

export type TransitionStatus = 'starting' | 'ending' | 'idle' | undefined;

/**
 * Provides a status string for CSS animations.
 * @param open - a boolean that determines if the element is open.
 */
export function useTransitionStatus(open: boolean) {
  const [transitionStatus, setTransitionStatus] = React.useState<TransitionStatus>(
    open ? 'idle' : undefined,
  );
  const [mounted, setMounted] = React.useState(open);

  if (open && !mounted) {
    setMounted(true);
    setTransitionStatus('starting');
  }

  if (!open && mounted && transitionStatus !== 'ending') {
    setTransitionStatus('ending');
  }

  if (!open && !mounted && transitionStatus === 'ending') {
    setTransitionStatus(undefined);
  }

  useLayoutEffect(() => {
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
  }, [open, mounted, setTransitionStatus, transitionStatus]);

  return React.useMemo(
    () => ({
      mounted,
      setMounted,
      transitionStatus,
    }),
    [mounted, transitionStatus],
  );
}
