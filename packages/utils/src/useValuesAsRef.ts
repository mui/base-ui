'use client';
import { useIsoLayoutEffect } from './useIsoLayoutEffect';
import { useRefWithInit } from './useRefWithInit';
import { warn } from './warn';

type LatestRef<T> = {
  current: T;
  next: T;
};

type StableState = {
  refs: LatestRef<unknown>[];
  length: number;
  effect: () => void;
};

export function useValuesAsRef<T1>(value1: T1): [LatestRef<T1>];
export function useValuesAsRef<T1, T2>(value1: T1, value2: T2): [LatestRef<T1>, LatestRef<T2>];
export function useValuesAsRef<T1, T2, T3>(
  value1: T1,
  value2: T2,
  value3: T3,
): [LatestRef<T1>, LatestRef<T2>, LatestRef<T3>];
export function useValuesAsRef<T1, T2, T3, T4>(
  value1: T1,
  value2: T2,
  value3: T3,
  value4: T4,
): [LatestRef<T1>, LatestRef<T2>, LatestRef<T3>, LatestRef<T4>];
export function useValuesAsRef<T1, T2, T3, T4, T5>(
  value1: T1,
  value2: T2,
  value3: T3,
  value4: T4,
  value5: T5,
): [LatestRef<T1>, LatestRef<T2>, LatestRef<T3>, LatestRef<T4>, LatestRef<T5>];
export function useValuesAsRef<T1, T2, T3, T4, T5, T6>(
  value1: T1,
  value2: T2,
  value3: T3,
  value4: T4,
  value5: T5,
  value6: T6,
): [LatestRef<T1>, LatestRef<T2>, LatestRef<T3>, LatestRef<T4>, LatestRef<T5>, LatestRef<T6>];
/**
 * Untracks multiple values by turning each into a ref to remove reactivity.
 */
export function useValuesAsRef(
  value1?: unknown,
  value2?: unknown,
  value3?: unknown,
  value4?: unknown,
  value5?: unknown,
  value6?: unknown,
) {
  const rawLength = arguments.length;
  const length = rawLength > 6 ? 6 : rawLength;

  const stable = useRefWithInit(() =>
    createLatestRefsFromArgs(length, value1, value2, value3, value4, value5, value6),
  ).current;
  const { refs, effect, length: stableLength } = stable;

  if (process.env.NODE_ENV !== 'production') {
    if (rawLength > 6) {
      warn('useValuesAsRef supports up to 6 values. Extra values are ignored.');
    }
    if (length !== stableLength) {
      warn('useValuesAsRef expects a stable number of values between renders.');
    }
  }

  if (stableLength > 0) {
    refs[0].next = value1;
  }
  if (stableLength > 1) {
    refs[1].next = value2;
  }
  if (stableLength > 2) {
    refs[2].next = value3;
  }
  if (stableLength > 3) {
    refs[3].next = value4;
  }
  if (stableLength > 4) {
    refs[4].next = value5;
  }
  if (stableLength > 5) {
    refs[5].next = value6;
  }

  useIsoLayoutEffect(effect);

  return refs;
}

function createLatestRefsFromArgs(
  length: number,
  value1?: unknown,
  value2?: unknown,
  value3?: unknown,
  value4?: unknown,
  value5?: unknown,
  value6?: unknown,
): StableState {
  const refs = new Array(length) as LatestRef<unknown>[];

  if (length > 0) {
    refs[0] = createLatestRef(value1);
  }
  if (length > 1) {
    refs[1] = createLatestRef(value2);
  }
  if (length > 2) {
    refs[2] = createLatestRef(value3);
  }
  if (length > 3) {
    refs[3] = createLatestRef(value4);
  }
  if (length > 4) {
    refs[4] = createLatestRef(value5);
  }
  if (length > 5) {
    refs[5] = createLatestRef(value6);
  }

  return {
    refs,
    length,
    effect: () => {
      for (let index = 0; index < length; index += 1) {
        const ref = refs[index];
        ref.current = ref.next;
      }
    },
  };
}

function createLatestRef<T>(value: T): LatestRef<T> {
  return { current: value, next: value };
}
