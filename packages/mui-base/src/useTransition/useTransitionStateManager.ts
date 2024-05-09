'use client';
import * as React from 'react';
import { TransitionContext } from './TransitionContext';
import { useEnhancedEffect } from '../utils/useEnhancedEffect';

export type UseTransitionStateManagerReturnValue = {
  /**
   * `true`, if the current element should be visible.
   */
  requestedEnter: boolean;
  /**
   * Callback to be called when the element has completely exited.
   */
  onExited: () => void;
  /**
   * The current transition status.
   */
  transitionStatus: TransitionStatus;
};

export type TransitionStatus = 'unmounted' | 'initial' | 'opening' | 'closing';

/**
 * Allows an element to be transitioned in and out.
 * The transition is triggerred by a `TransitionContext` placed above in the component tree.
 *
 * Demos:
 *
 * - [Transitions](https://mui.com/base-ui/react-transitions/#hooks)
 *
 * API:
 *
 * - [useTransitionStateManager API](https://mui.com/base-ui/react-transitions/hooks-api/#use-transition-state-manager)
 */
export function useTransitionStateManager(
  enabled: boolean = true,
): UseTransitionStateManagerReturnValue {
  const [transitionStatus, setTransitionStatus] = React.useState<TransitionStatus>('unmounted');
  const transitionContext = React.useContext(TransitionContext);
  if (!transitionContext) {
    throw new Error('Missing transition context');
  }

  const { registerTransition, requestedEnter, onExited } = transitionContext;

  React.useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    return registerTransition();
  }, [registerTransition, enabled]);

  // The `opening` state (which is used to determine the right CSS class to apply)
  // is updated slightly (one animation frame) after the `requestedEnter` state is updated.
  // Thanks to this, elements that are mounted will have their enter transition applied
  // (if the `opening` was applied when the element was mounted, the transition
  // would not be fired unless @starting-style is used).
  useEnhancedEffect(() => {
    if (!enabled) {
      return undefined;
    }

    if (requestedEnter) {
      setTransitionStatus('initial');

      const frame = requestAnimationFrame(() => {
        setTransitionStatus('opening');
      });

      return () => {
        cancelAnimationFrame(frame);
      };
    }

    if (!requestedEnter) {
      setTransitionStatus('closing');
    }

    return undefined;
  }, [requestedEnter, enabled]);

  return {
    transitionStatus,
    onExited,
    requestedEnter,
  };
}
