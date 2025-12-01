'use client';
import * as React from 'react';
import { useCallback } from './useCallback';

/**
 * Returns a function that forces a rerender.
 */
export function useForcedRerendering() {
  const [, setState] = React.useState({});

  return useCallback(() => {
    setState({});
  }, []);
}
