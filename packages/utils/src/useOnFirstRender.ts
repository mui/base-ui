'use client';
import * as React from 'react';

/**
 * Calls the function during the first render of the component instance (render phase, before
 * commit). Unlike an effect, it is not re-invoked by StrictMode's simulated unmount/remount
 * cycle, which only re-runs effects. StrictMode's double render shares the instance's refs,
 * so the function still runs only once.
 *
 * Because it runs during render, the function must not set React state of other components or
 * notify external subscribers, and callers must tolerate React discarding the render (the
 * function is not re-invoked for the retry render).
 */
export function useOnFirstRender(fn: Function) {
  const ref = React.useRef(true);
  if (ref.current) {
    ref.current = false;
    fn();
  }
}
