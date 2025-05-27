'use client';
import * as React from 'react';

/**
 * Calls a function during the first render phase.
 */
export function useFirstRender(fn: Function) {
  const ref = React.useRef(true);
  if (ref.current) {
    ref.current = false;
    fn();
  }
}
