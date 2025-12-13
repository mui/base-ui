'use client';
import * as React from 'react';

/**
 * A wrapper around React.useEffect that calls the underlying hook directly.
 */
export function useEffect(effect: React.EffectCallback, deps?: React.DependencyList): void {
  // eslint-disable-next-line react-hooks/exhaustive-deps -- This is a pass-through wrapper
  React.useEffect(effect, deps);
}
