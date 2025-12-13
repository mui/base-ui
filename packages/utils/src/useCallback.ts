'use client';
import * as React from 'react';

/**
 * A wrapper around React.useCallback that calls the underlying hook directly.
 */
export function useCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
): T {
  return React.useCallback(callback, deps);
}
