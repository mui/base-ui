import useEnhancedEffect from '@mui/utils/useEnhancedEffect';
import * as React from 'react';
import type { TransitionStatus } from './useTransitionStatus.types';

/**
 * Provides a status string for CSS transitions and animations for conditionally-rendered
 * components.
 * @param isRendered - a boolean that determines if the component is rendered.
 * @ignore - internal hook.
 */
export function useTransitionStatus(isRendered: boolean) {
  const [transitionStatus, setTransitionStatus] = React.useState<TransitionStatus>('unmounted');
  const [mounted, setMounted] = React.useState(isRendered);

  if (isRendered && !mounted) {
    setMounted(true);
  }

  useEnhancedEffect(() => {
    if (isRendered) {
      setTransitionStatus('initial');

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

  return {
    mounted,
    setMounted,
    transitionStatus,
  };
}
