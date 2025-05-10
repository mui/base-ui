'use client';
import * as React from 'react';
import { useLazyRef } from './useLazyRef';

const useEffect = typeof document !== 'undefined' ? React.useLayoutEffect : React.useEffect;

export function useLatestRef<T>(value: T) {
  const latest = useLazyRef(createLatestRef, value).current;

  latest.next = value;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(latest.effect);

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
