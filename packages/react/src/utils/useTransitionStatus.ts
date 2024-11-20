'use client';
import * as React from 'react';
import { useEnhancedEffect } from './useEnhancedEffect';

export type TransitionStatus = 'entering' | 'exiting' | undefined;

/**
 * Provides a status string for CSS animations.
 * @param open - a boolean that determines if the element is open.
 * @param enabled - a boolean that determines if the logic is enabled.
 * @ignore - internal hook.
 */
export function useTransitionStatus(open: boolean, enabled = true) {
  const [transitionStatus, setTransitionStatus] = React.useState<TransitionStatus>();
  const [mounted, setMounted] = React.useState(open);

  const derivedMounted = enabled ? mounted : open;

  if (enabled) {
    if (open && !mounted) {
      setMounted(true);
      if (transitionStatus !== 'entering') {
        setTransitionStatus('entering');
      }
    }

    if (!open && mounted && transitionStatus !== 'exiting') {
      setTransitionStatus('exiting');
    }

    if (!open && !mounted && transitionStatus === 'exiting') {
      setTransitionStatus(undefined);
    }
  }

  useEnhancedEffect(() => {
    if (!enabled || !open) {
      return undefined;
    }

    const frame = requestAnimationFrame(() => {
      setTransitionStatus(undefined);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [enabled, open]);

  return React.useMemo(
    () => ({
      mounted: derivedMounted,
      setMounted,
      transitionStatus,
    }),
    [derivedMounted, transitionStatus],
  );
}
