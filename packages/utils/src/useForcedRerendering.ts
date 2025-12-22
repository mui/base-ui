'use client';
import * as React from 'react';
import { useCallback } from './useCallback';
import { useState } from './useState';

/**
 * Returns a function that forces a rerender.
 */
export function useForcedRerendering() {
  const [, setState] = useState({});

  return useCallback(() => {
    setState({});
  }, []);
}
