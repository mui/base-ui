'use client';
import { useIsoLayoutEffect } from './useIsoLayoutEffect';
import { useLazyRef } from './useLazyRef';

export function useLatestRef<T>(value: T) {
  const latest = useLazyRef(createLatestRef, value).current;

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
