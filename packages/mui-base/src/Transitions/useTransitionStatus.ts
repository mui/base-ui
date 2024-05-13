'use client';
import * as React from 'react';
import { useEnhancedEffect } from '../utils/useEnhancedEffect';

export type OpenState = 'open' | 'closed';

/**
 * Provides a status string for CSS transitions and animations for conditionally-rendered
 * components.
 * @param shouldOpen - a boolean that determines if the component should be visible.
 * @param enabled - determines if the transition logic should be enabled.
 * @ignore - internal hook.
 */
export function useTransitionStatus(
  shouldOpen: boolean,
  enabled: boolean,
): UseTransitionStatusReturnValue {
  const [openState, setOpenState] = React.useState<OpenState>('closed');
  const [mounted, setMounted] = React.useState(shouldOpen);
  const previouslyRendered = React.useRef(shouldOpen);

  if (shouldOpen && !mounted) {
    setMounted(true);
  }

  if (!enabled && !shouldOpen && mounted) {
    setMounted(false);
  }

  useEnhancedEffect(() => {
    if (!enabled) {
      return undefined;
    }

    if (shouldOpen) {
      setOpenState('closed');
      previouslyRendered.current = shouldOpen;

      const frame = requestAnimationFrame(() => {
        setOpenState('open');
      });

      return () => {
        cancelAnimationFrame(frame);
      };
    }

    if (previouslyRendered.current) {
      setOpenState('closed');
    }

    previouslyRendered.current = shouldOpen;

    return undefined;
  }, [shouldOpen, enabled]);

  const notifyTransitionEnded = React.useCallback(() => {
    setMounted(false);
    setOpenState('closed');
  }, []);

  if (!enabled) {
    return {
      mounted,
      notifyTransitionEnded,
      openState: mounted ? 'open' : 'closed',
    };
  }

  return {
    mounted,
    notifyTransitionEnded,
    openState,
  };
}

export interface UseTransitionStatusReturnValue {
  mounted: boolean;
  notifyTransitionEnded: () => void;
  openState: OpenState;
}
