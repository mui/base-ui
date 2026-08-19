'use client';
import * as React from 'react';

/**
 * Run an effect only after the first render.
 *
 * @param effect The effect to run after the first render
 * @param deps The dependencies for the effect
 */
export function useEffectAfterFirstRender(
  effect: React.EffectCallback,
  deps?: React.DependencyList,
) {
  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return undefined;
    }
    return effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
