'use client';
import * as React from 'react';

import { useEffect } from './useEffect';

const EMPTY = [] as unknown[];

/**
 * A React.useEffect equivalent that runs once, when the component is mounted.
 */
export function useOnMount(fn: React.EffectCallback) {
  // TODO: uncomment once we enable eslint-plugin-react-compiler // eslint-disable-next-line react-compiler/react-compiler -- no need to put `fn` in the dependency array
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(fn, EMPTY);
  /* eslint-enable react-hooks/exhaustive-deps */
}
