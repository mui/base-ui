'use client';
import * as React from 'react';
import { useEnhancedEffect } from './useEnhancedEffect';

export type TransitionStatus = 'starting' | 'ending' | undefined;

/**
 * Provides a status string for CSS animations.
 * @param open - a boolean that determines if the element is open.
 * @ignore - internal hook.
 */
export function useTransitionStatus(open: boolean) {
  const [transitionStatus, setTransitionStatus] = React.useState<TransitionStatus>();
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

  useEnhancedEffect(() => {
    if (!open) {
      return undefined;
    }

    const frame = requestAnimationFrame(() => {
      setTransitionStatus(undefined);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [open]);

  return React.useMemo(
    () => ({
      mounted,
      setMounted,
      transitionStatus,
    }),
    [mounted, transitionStatus],
  );
}
