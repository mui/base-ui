'use client';
import * as React from 'react';

/**
 * A wrapper around React.useMemo that calls the underlying hook directly.
 */
export function useMemo<T>(factory: () => T, deps?: React.DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps -- This is a pass-through wrapper
  return React.useMemo(factory, deps!);
}
