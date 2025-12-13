'use client';
import * as React from 'react';

/**
 * A wrapper around React.useEffect that calls the underlying hook directly.
 */
export function useEffect(effect: React.EffectCallback, deps?: React.DependencyList): void {
  React.useEffect(effect, deps);
}
