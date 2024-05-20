'use client';
import * as React from 'react';

/**
 * Provides a status string for CSS transitions and animations for conditionally-rendered
 * components.
 * @param shouldOpen - a boolean that determines if the component should be visible.
 * @ignore - internal hook.
 */
export function useTransitionStatus(shouldOpen: boolean): UseTransitionStatusReturnValue {
  const [mounted, setMounted] = React.useState(shouldOpen);

  if (shouldOpen && !mounted) {
    setMounted(true);
  }

  const onTransitionEnded = React.useCallback(() => {
    setMounted(false);
  }, []);

  return {
    mounted,
    onTransitionEnded,
  };
}

export interface UseTransitionStatusReturnValue {
  mounted: boolean;
  onTransitionEnded: () => void;
}
