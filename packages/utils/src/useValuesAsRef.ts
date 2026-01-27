'use client';
import { useIsoLayoutEffect } from './useIsoLayoutEffect';
import { useRefWithInit } from './useRefWithInit';
import { warn } from './warn';

type LatestRef<T> = {
  current: T;
  next: T;
  effect: () => void;
};

type LatestRefs<T extends readonly unknown[]> = {
  [K in keyof T]: LatestRef<T[K]>;
};

type StableState<T extends readonly unknown[]> = {
  refs: LatestRefs<T>;
  effect: () => void;
};

/**
 * Untracks multiple values by turning each into a ref to remove reactivity.
 */
export function useValuesAsRef<T extends readonly unknown[]>(...values: T): LatestRefs<T> {
  const stable = useRefWithInit(createLatestRefs, values).current;
  const { refs, effect } = stable;

  if (process.env.NODE_ENV !== 'production' && values.length !== refs.length) {
    warn('useValuesAsRef expects a stable number of values between renders.');
  }

  for (let index = 0; index < refs.length; index += 1) {
    refs[index].next = values[index];
  }

  useIsoLayoutEffect(effect);

  return refs;
}

function createLatestRefs<T extends readonly unknown[]>(values: T): StableState<T> {
  const refs = values.map(createLatestRef) as LatestRefs<T>;
  return {
    refs,
    effect: () => {
      for (const ref of refs) {
        ref.current = ref.next;
      }
    },
  };
}

function createLatestRef<T>(value: T): LatestRef<T> {
  const latest = {
    current: value,
    next: value,
    effect: () => {
      latest.current = latest.next;
    },
  };
  return latest;
}
