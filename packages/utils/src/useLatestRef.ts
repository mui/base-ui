'use client';
import { useModernLayoutEffect } from './useModernLayoutEffect';
import { useLazyRef } from './useLazyRef';

export function useLatestRef<T>(value: T) {
  const latest = useLazyRef(createLatestRef, value).current;

  latest.next = value;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useModernLayoutEffect(latest.effect);

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
