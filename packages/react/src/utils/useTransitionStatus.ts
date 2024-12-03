'use client';
import * as React from 'react';
import { useEnhancedEffect } from './useEnhancedEffect';

export type TransitionStatus = 'starting' | 'ending' | undefined;

/**
 * Provides a status string for CSS animations.
 * @param open - a boolean that determines if the element is open.
 * @param enabled - a boolean that determines if the logic is enabled.
 * @param delayStartingStatus - a boolean that set the `starting` status one
 *     tick later. Example use-case: collapsible needs an extra frame in order
 *     to measure the panel contents.
 * @ignore - internal hook.
 */
export function useTransitionStatus(open: boolean, enabled = true, delayStartingStatus = false) {
  const [transitionStatus, setTransitionStatus] = React.useState<TransitionStatus>();
  const [mounted, setMounted] = React.useState(open);

  const derivedMounted = enabled ? mounted : open;

  if (enabled) {
    if (open && !mounted) {
      setMounted(true);
      if (transitionStatus !== 'starting' && !delayStartingStatus) {
        setTransitionStatus('starting');
      }
    }

    if (!open && mounted && transitionStatus !== 'ending') {
      setTransitionStatus('ending');
    }

    if (!open && !mounted && transitionStatus === 'ending') {
      setTransitionStatus(undefined);
    }
  }

  useEnhancedEffect(() => {
    if (!enabled || !open) {
      return undefined;
    }

    if (delayStartingStatus) {
      setTransitionStatus('starting');
    }

    const frame = requestAnimationFrame(() => {
      setTransitionStatus(undefined);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [enabled, open, delayStartingStatus]);

  return React.useMemo(
    () => ({
      mounted: derivedMounted,
      setMounted,
      transitionStatus,
    }),
    [derivedMounted, transitionStatus],
  );
}
