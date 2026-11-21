'use client';
import * as React from 'react';

/**
 * Returns a function that forces a rerender.
 */
export function useForcedRerendering(): () => void {
  return React.useReducer(increment, 0)[1];
}

// Must produce a new value on every dispatch: a toggle would let an even number of batched
// dispatches land back on the previous state and React would bail out of the rerender.
function increment(count: number) {
  return count + 1;
}
