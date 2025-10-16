'use client';
import { useIsoLayoutEffect } from './useIsoLayoutEffect';
import { useRefWithInit } from './useRefWithInit';

/**
 * Untracks the provided value, removing its reactivity by turning it into a ref so it becomes stable between renders.
 *
 * Used to access the passed value inside `React.useEffect` without causing the effect to re-run when the value changes.
 */
export function useUntrackedRef<T>(value: T) {
  const latest = useRefWithInit(createLatestRef, value).current;

  latest.next = value;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useIsoLayoutEffect(latest.effect);

  return latest;
}

function createLatestRef<T>(value: T) {
  const latest = {
    current: value,
    next: value,
    effect: () => {
      latest.current = latest.next;
    },
  };
  return latest;
}
