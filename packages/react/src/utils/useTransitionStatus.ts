'use client';
import * as React from 'react';
import { useEnhancedEffect } from './useEnhancedEffect';

export type TransitionStatus = 'entering' | 'exiting' | undefined;

/**
 * Provides a status string for CSS animations.
 * @param open - a boolean that determines if the element is open.
 * @param enabled - a boolean that determines if the logic is enabled.
 * @param delayEnteringStatus - a boolean that set the `entering` status one
 *     tick later. Example use-case: collapsible needs an extra frame in order
 *     to measure the panel contents.
 * @ignore - internal hook.
 */
export function useTransitionStatus(open: boolean, enabled = true, delayEnteringStatus = false) {
  const [transitionStatus, setTransitionStatus] = React.useState<TransitionStatus>();
  const [mounted, setMounted] = React.useState(open);

  const derivedMounted = enabled ? mounted : open;

  if (enabled) {
    if (open && !mounted) {
      setMounted(true);
      if (transitionStatus !== 'entering' && !delayEnteringStatus) {
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

    if (delayEnteringStatus) {
      setTransitionStatus('entering');
    }

    const frame = requestAnimationFrame(() => {
      setTransitionStatus(undefined);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [enabled, open, delayEnteringStatus]);

  return React.useMemo(
    () => ({
      mounted: derivedMounted,
      setMounted,
      transitionStatus,
    }),
    [derivedMounted, transitionStatus],
  );
}
