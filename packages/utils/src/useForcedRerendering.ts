'use client';
import * as React from 'react';
import { useCallback } from '@base-ui/utils/useCallback';
import { useState } from '@base-ui/utils/useState';

/**
 * Returns a function that forces a rerender.
 */
export function useForcedRerendering() {
  const [, setState] = useState({});

  return useCallback(() => {
    setState({});
  }, []);
}
