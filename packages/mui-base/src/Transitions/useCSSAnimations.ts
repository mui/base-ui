'use client';
import * as React from 'react';
import { useTransitionStateManager } from '../useTransition';

export function useCSSAnimations(enabled: boolean) {
  const { requestedEnter, onExited, transitionStatus } = useTransitionStateManager(enabled);

  const handleTransitionAndAnimationEnd = React.useCallback(() => {
    if (!requestedEnter) {
      onExited();
    }
  }, [onExited, requestedEnter]);

  const props = React.useMemo(
    () => ({
      onAnimationEnd: handleTransitionAndAnimationEnd,
      onTransitionEnd: handleTransitionAndAnimationEnd,
      'data-status': transitionStatus,
    }),
    [handleTransitionAndAnimationEnd, transitionStatus],
  );

  if (!enabled) {
    return null;
  }

  return props;
}
