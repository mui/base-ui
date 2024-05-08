'use client';
import * as React from 'react';
import useEnhancedEffect from '@mui/utils/useEnhancedEffect';
import { TransitionContextValue } from './TransitionContext';

enum TransitionState {
  NotStarted,
  InProgress,
  Finished,
}

/**
 * Allows child elements to be transitioned in and out.
 *
 * Demos:
 *
 * - [Transitions](https://mui.com/base-ui/react-transitions/#hooks)
 *
 * API:
 *
 * - [useTransitionTrigger API](https://mui.com/base-ui/react-transitions/hooks-api/#use-transition-trigger)
 */
export function useTransitionTrigger(requestEnter: boolean): UseTransitionTriggerReturnValue {
  const [exitTransitionState, setExitTransitionState] = React.useState<TransitionState>(
    TransitionState.NotStarted,
  );

  const registeredTransitions = React.useRef(0);
  const runningTransitions = React.useRef(0);

  const [hasTransition, setHasTransition] = React.useState(false);

  const previousRequestEnter = React.useRef(requestEnter);

  useEnhancedEffect(() => {
    if (requestEnter) {
      setExitTransitionState(TransitionState.NotStarted);
    } else if (
      // checking registeredTransitions.current instead of hasTransition to avoid this effect re-firing whenever hasTransition changes
      registeredTransitions.current > 0 &&
      // prevents waiting for a pending transition right after mounting
      previousRequestEnter.current !== requestEnter
    ) {
      setExitTransitionState(TransitionState.InProgress);
      runningTransitions.current = registeredTransitions.current;
    }

    previousRequestEnter.current = requestEnter;
  }, [requestEnter]);

  const handleExited = React.useCallback(() => {
    runningTransitions.current -= 1;
    if (runningTransitions.current === 0) {
      setExitTransitionState(TransitionState.Finished);
    }
  }, []);

  const registerTransition = React.useCallback(() => {
    registeredTransitions.current += 1;
    setHasTransition(true);
    return () => {
      registeredTransitions.current -= 1;
      if (registeredTransitions.current === 0) {
        setHasTransition(false);
      }
    };
  }, []);

  let hasExited: boolean;
  if (!hasTransition) {
    // If there are no transitions registered, the `exited` state is opposite of `requestEnter` immediately.
    hasExited = !requestEnter;
  } else if (requestEnter) {
    hasExited = false;
  } else {
    const hasPendingExitTransition =
      registeredTransitions.current > 0 &&
      exitTransitionState !== TransitionState.Finished &&
      previousRequestEnter.current !== requestEnter;

    hasExited = exitTransitionState !== TransitionState.InProgress && !hasPendingExitTransition;
  }

  const contextValue: TransitionContextValue = React.useMemo(
    () => ({
      requestedEnter: requestEnter,
      onExited: handleExited,
      registerTransition,
      hasExited,
    }),
    [handleExited, requestEnter, registerTransition, hasExited],
  );

  return {
    contextValue,
    hasExited,
  };
}

export type UseTransitionTriggerReturnValue = {
  /**
   * The value of a `TransitionContext` to be placed around children that will be transitioned.
   */
  contextValue: TransitionContextValue;
  /**
   * `true`, if the transitioned element has exited completely (or not entered yet).
   */
  hasExited: boolean;
};
