import * as React from 'react';

export type TransitionStatus = 'starting' | 'ending' | 'idle' | undefined;
/**
 * Provides a status string for CSS animations.
 * @param open - a boolean that determines if the element is open.
 * @param enableIdleState - a boolean that enables the `'idle'` state between `'starting'` and `'ending'`
 */
export declare function useTransitionStatus(
  open: boolean,
  enableIdleState?: boolean,
  deferEndingState?: boolean,
): {
  mounted: boolean;
  setMounted: React.Dispatch<React.SetStateAction<boolean>>;
  transitionStatus: TransitionStatus;
};
