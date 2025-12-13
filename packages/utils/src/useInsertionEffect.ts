'use client';
import * as React from 'react';

/**
 * A wrapper around React.useInsertionEffect that calls the underlying hook directly.
 */
export function useInsertionEffect(
  effect: React.EffectCallback,
  deps?: React.DependencyList,
): void {
  // React 17 doesn't have useInsertionEffect, so we need to check for it
  if ('useInsertionEffect' in React) {
    (React as any).useInsertionEffect(effect, deps);
  } else {
    // Fall back to useLayoutEffect for React 17
    (React as any).useLayoutEffect(effect, deps);
  }
}
