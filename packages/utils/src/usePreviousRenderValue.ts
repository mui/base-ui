'use client';
import * as React from 'react';

/**
 * Returns a value from the previous render.
 * @param value Current value.
 */
export function usePreviousRenderValue<T>(value: T): T | null {
  const [state, setState] = React.useState<{ current: T; previous: T | null }>({
    current: value,
    previous: null,
  });

  if (state.current !== value) {
    setState({
      current: value,
      previous: state.current,
    });
  }

  return state.previous;
}
