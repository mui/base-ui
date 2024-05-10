'use client';
import * as React from 'react';
import { useEnhancedEffect } from '../utils/useEnhancedEffect';

export type TransitionStatus = 'unmounted' | 'initial' | 'opening' | 'closing';

/**
 * Provides a status string for CSS transitions and animations for conditionally-rendered
 * components.
 * @param isRendered - a boolean that determines if the component is rendered.
 * @ignore - internal hook.
 */
export function useTransitionStatus(isRendered: boolean, enabled: boolean) {
  const [transitionStatus, setTransitionStatus] = React.useState<TransitionStatus>('unmounted');
  const [mounted, setMounted] = React.useState(isRendered);
  const previouslyRendered = React.useRef(isRendered);

  if (isRendered && !mounted) {
    setMounted(true);
  }

  if (!enabled && !isRendered && mounted) {
    setMounted(false);
  }

  useEnhancedEffect(() => {
    if (!enabled) {
      return undefined;
    }

    if (isRendered) {
      setTransitionStatus('initial');
      previouslyRendered.current = isRendered;

      const frame = requestAnimationFrame(() => {
        setTransitionStatus('opening');
      });

      return () => {
        cancelAnimationFrame(frame);
      };
    }

    if (previouslyRendered.current) {
      setTransitionStatus('closing');
    }

    previouslyRendered.current = isRendered;

    return undefined;
  }, [isRendered, enabled]);

  const handleTransitionAndAnimationEnd = React.useCallback(() => {
    if (!isRendered) {
      setMounted(false);
      setTransitionStatus('unmounted');
    }
  }, [isRendered]);

  const props = React.useMemo(
    () =>
      enabled
        ? {
            onAnimationEnd: handleTransitionAndAnimationEnd,
            onTransitionEnd: handleTransitionAndAnimationEnd,
          }
        : null,
    [handleTransitionAndAnimationEnd, enabled],
  );

  return {
    mounted,
    setMounted,
    props,
    transitionStatus: enabled ? transitionStatus : null,
  };
}
