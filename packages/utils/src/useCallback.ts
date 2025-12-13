'use client';
import * as React from 'react';

/**
 * A wrapper around React.useCallback that calls the underlying hook directly.
 */
export function useCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps -- This is a pass-through wrapper
  return React.useCallback(callback, deps);
}
