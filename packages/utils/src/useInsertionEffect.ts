'use client';
import * as React from 'react';

// Detect useInsertionEffect availability at module load time
// https://github.com/mui/material-ui/issues/41190#issuecomment-2040873379
const reactUseInsertionEffect = (React as any)[
  `useInsertionEffect${Math.random().toFixed(1)}`.slice(0, -3)
];

const safeUseInsertionEffect =
  // React 17 doesn't have useInsertionEffect.
  reactUseInsertionEffect &&
  // Preact replaces useInsertionEffect with useLayoutEffect and fires too late.
  reactUseInsertionEffect !== React.useLayoutEffect
    ? reactUseInsertionEffect
    : React.useLayoutEffect;

/**
 * A wrapper around React.useInsertionEffect that calls the underlying hook directly.
 * Falls back to useLayoutEffect for React 17 compatibility.
 */
export function useInsertionEffect(
  effect: React.EffectCallback,
  deps?: React.DependencyList,
): void {
  safeUseInsertionEffect(effect, deps);
}
