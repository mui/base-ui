'use client';
import * as React from 'react';
import { useEnhancedEffect } from '../utils/useEnhancedEffect';
import type { TransitionStatus } from './useTransitionStatus.types';

/**
 * Provides a status string for CSS animations.
 * @param isRendered - a boolean that determines if the component is rendered.
 * @ignore - internal hook.
 */
export function useTransitionStatus(isOpen: boolean) {
  const [transitionStatus, setTransitionStatus] = React.useState<TransitionStatus>();
  const [mounted, setMounted] = React.useState(isOpen);

  if (isOpen && !mounted) {
    setMounted(true);
  }

  if (!isOpen && mounted && transitionStatus !== 'exiting') {
    setTransitionStatus('exiting');
  }

  if (!isOpen && !mounted && transitionStatus === 'exiting') {
    setTransitionStatus(undefined);
  }

  useEnhancedEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    setTransitionStatus('entering');

    const frame = requestAnimationFrame(() => {
      setTransitionStatus(undefined);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [isOpen]);

  return React.useMemo(
    () => ({
      mounted,
      setMounted,
      transitionStatus,
    }),
    [mounted, transitionStatus],
  );
}
