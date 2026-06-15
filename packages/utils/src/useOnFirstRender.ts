'use client';
import * as React from 'react';

/**
 * Calls the function during the first render of the component instance (render phase, before
 * commit). Unlike an effect, it is not re-invoked by StrictMode's simulated unmount/remount
 * cycle, which only re-runs effects. StrictMode's double render shares the instance's refs,
 * so the function still runs only once.
 *
 * Because it runs during render, the function must not set React state of other components.
 * Callers must also tolerate React discarding the render: the function may run again on the
 * retry (a discarded mount attempt rebuilds hook state, recreating the ref) or not at all
 * (StrictMode's second render pass reuses the instance's refs), so its side effects must be
 * idempotent.
 */
export function useOnFirstRender(fn: Function) {
  const ref = React.useRef(true);
  if (ref.current) {
    ref.current = false;
    fn();
  }
}
