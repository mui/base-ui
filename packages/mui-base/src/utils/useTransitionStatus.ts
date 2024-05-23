'use client';
import * as React from 'react';
import { useEnhancedEffect } from './useEnhancedEffect';

export type TransitionStatus = 'entering' | 'exiting' | undefined;

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
  }

  if (!open && mounted && transitionStatus !== 'exiting') {
    setTransitionStatus('exiting');
  }

  if (!open && !mounted && transitionStatus === 'exiting') {
    setTransitionStatus(undefined);
  }

  useEnhancedEffect(() => {
    if (!open) {
      return undefined;
    }

    setTransitionStatus('entering');

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
