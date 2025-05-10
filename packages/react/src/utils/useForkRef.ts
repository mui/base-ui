import * as React from 'react';
import { useLazyRef } from './useLazyRef';

type Empty = null | undefined;
type InputRef<I> = React.Ref<I> | Empty;
type Result<I> = React.RefCallback<I> | null;
type Cleanup = () => void;

type ForkRef<I> = {
  callback: React.RefCallback<I> | null;
  cleanup: Cleanup | null;
  refs: InputRef<I>[];
};

/**
 * Merges refs into a single memoized callback ref or `null`.
 */
export function useForkRef<I>(a: InputRef<I>, b: InputRef<I>): Result<I>;
export function useForkRef<I>(a: InputRef<I>, b: InputRef<I>, c: InputRef<I>): Result<I>;
export function useForkRef<I>(
  a: InputRef<I>,
  b: InputRef<I>,
  c: InputRef<I>,
  d: InputRef<I>,
): Result<I>;
export function useForkRef<I>(
  a: InputRef<I>,
  b: InputRef<I>,
  c?: InputRef<I>,
  d?: InputRef<I>,
): Result<I> {
  const forkRef = useLazyRef(createForkRef<I>).current;
  if (didChange(forkRef, a, b, c, d)) {
    update(forkRef, [a, b, c, d]);
  }
  return forkRef.callback;
}

/**
 * Merges variadic amount of refs into a single memoized callback ref or `null`.
 */
export function useForkRefN<I>(...refs: InputRef<I>[]): Result<I> {
  const forkRef = useLazyRef(createForkRef<I>).current;
  if (didChangeN(forkRef, refs)) {
    update(forkRef, refs);
  }
  return forkRef.callback;
}

function createForkRef<I>(): ForkRef<I> {
  return {
    callback: null,
    cleanup: null as Cleanup | null,
    refs: [],
  };
}

function didChange<I>(
  forkRef: ForkRef<I>,
  a: InputRef<I>,
  b: InputRef<I>,
  c: InputRef<I>,
  d: InputRef<I>,
) {
  // prettier-ignore
  return (
    forkRef.refs[0] !== a ||
    forkRef.refs[1] !== b ||
    forkRef.refs[2] !== c ||
    forkRef.refs[3] !== d
  )
}

function didChangeN<I>(forkRef: ForkRef<I>, newRefs: InputRef<I>[]) {
  return (
    forkRef.refs.length !== newRefs.length ||
    forkRef.refs.some((ref, index) => ref !== newRefs[index])
  );
}

function update<I>(forkRef: ForkRef<I>, refs: InputRef<I>[]) {
  forkRef.refs = refs;

  if (refs.every((ref) => ref == null)) {
    forkRef.callback = null;
    return;
  }

  forkRef.callback = (instance: I) => {
    if (forkRef.cleanup) {
      forkRef.cleanup();
      forkRef.cleanup = null;
    }

    if (instance != null) {
      const cleanupCallbacks = Array(refs.length).fill(null) as Array<Cleanup | null>;

      for (let i = 0; i < refs.length; i++) {
        const ref = refs[i];
        if (ref == null) {
          continue;
        }
        switch (typeof ref) {
          case 'function': {
            const refCleanup = ref(instance);
            if (typeof refCleanup === 'function') {
              cleanupCallbacks[i] = refCleanup;
            }
            break;
          }
          case 'object': {
            ref.current = instance;
            break;
          }
        }
      }

      forkRef.cleanup = () => {
        for (let i = 0; i < refs.length; i++) {
          const ref = refs[i];
          if (ref == null) {
            continue;
          }
          switch (typeof ref) {
            case 'function': {
              const cleanupCallback = cleanupCallbacks[i];
              if (typeof cleanupCallback === 'function') {
                cleanupCallback();
              } else {
                ref(null);
              }
              break;
            }
            case 'object': {
              ref.current = null;
              break;
            }
          }
        }
      };
    }
  };
}
