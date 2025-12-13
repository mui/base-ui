'use client';
import * as React from 'react';

/**
 * A wrapper around React.useLayoutEffect that calls the underlying hook directly.
 */
export function useLayoutEffect(
  effect: React.EffectCallback,
  deps?: React.DependencyList,
): void {
  React.useLayoutEffect(effect, deps);
}
