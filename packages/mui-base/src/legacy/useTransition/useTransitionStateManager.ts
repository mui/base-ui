'use client';

import * as React from 'react';
import { TransitionContext } from './TransitionContext';

export type UseTransitionStateManagerReturnValue = {
  /**
   * `true`, if the current element should be visible.
   */
  requestedEnter: boolean;
  /**
   * Callback to be called when the element has completely exited.
   */
  onExited: () => void;
};

/**
 * Allows an element to be transitioned in and out.
 * The transition is triggerred by a `TransitionContext` placed above in the component tree.
 * @ignore - internal hook.
 */
export function useTransitionStateManager(): UseTransitionStateManagerReturnValue {
  const transitionContext = React.useContext(TransitionContext);
  if (!transitionContext) {
    throw new Error('Missing transition context');
  }

  const { registerTransition, requestedEnter, onExited } = transitionContext;

  React.useEffect(() => {
    return registerTransition();
  }, [registerTransition]);

  return {
    onExited,
    requestedEnter,
  };
}
