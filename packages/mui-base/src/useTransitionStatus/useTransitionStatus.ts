'use client';
import * as React from 'react';
import { useEnhancedEffect } from '../utils/useEnhancedEffect';
import type { TransitionStatus } from './useTransitionStatus.types';

/**
 * Provides a status string for CSS transitions and animations for conditionally-rendered
 * components.
 * @param isRendered - a boolean that determines if the component is rendered.
 * @ignore - internal hook.
 */
export function useTransitionStatus(isRendered: boolean) {
  const [transitionStatus, setTransitionStatus] = React.useState<TransitionStatus>();
  const [mounted, setMounted] = React.useState(isRendered);

  if (isRendered && !mounted) {
    setMounted(true);

    if (transitionStatus === 'closing') {
      setTransitionStatus(undefined);
    }
  }

  useEnhancedEffect(() => {
    if (isRendered) {
      const frame = requestAnimationFrame(() => {
        setTransitionStatus('opening');
      });

      return () => {
        cancelAnimationFrame(frame);
      };
    }

    setTransitionStatus('closing');

    return undefined;
  }, [isRendered]);

  return React.useMemo(
    () => ({
      mounted,
      setMounted,
      transitionStatus,
    }),
    [mounted, transitionStatus],
  );
}
