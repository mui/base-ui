import * as React from 'react';
import { useEnhancedEffect } from '../utils/useEnhancedEffect';
import type { TransitionStatus } from './useTransitionStatus.types';

/**
 * Provides a status string for CSS animations for conditionally-rendered components.
 * @param isRendered - a boolean that determines if the component is rendered.
 * @ignore - internal hook.
 */
export function useTransitionStatus(isRendered: boolean) {
  const [transitionStatus, setTransitionStatus] = React.useState<TransitionStatus>();
  const [mounted, setMounted] = React.useState(isRendered);

  if (isRendered && !mounted) {
    setMounted(true);
  }

  if (!isRendered && mounted && transitionStatus !== 'exiting') {
    setTransitionStatus('exiting');
  }

  if (!isRendered && !mounted && transitionStatus === 'exiting') {
    setTransitionStatus(undefined);
  }

  useEnhancedEffect(() => {
    if (!isRendered) {
      return undefined;
    }

    setTransitionStatus('entering');

    const frame = requestAnimationFrame(() => {
      setTransitionStatus(undefined);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
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
