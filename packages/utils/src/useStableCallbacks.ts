'use client';
import * as React from 'react';
import { useRefWithInit } from './useRefWithInit';
import { warn } from './warn';

// https://github.com/mui/material-ui/issues/41190#issuecomment-2040873379
const useInsertionEffect = (React as any)[
  `useInsertionEffect${Math.random().toFixed(1)}`.slice(0, -3)
];
const useSafeInsertionEffect =
  // React 17 doesn't have useInsertionEffect.
  useInsertionEffect &&
  // Preact replaces useInsertionEffect with useLayoutEffect and fires too late.
  useInsertionEffect !== React.useLayoutEffect
    ? useInsertionEffect
    : (fn: any) => fn();

type Callback = (...args: any[]) => any;

type StableCallbacks<T extends Record<string, Callback | undefined>> = {
  [K in keyof T]: T[K] extends Callback ? T[K] : never;
};

type StableState<T extends Record<string, Callback | undefined>> = {
  /** Captured keys */
  keys: string[];
  /** The next values for callbacks */
  next: T;
  /** The current callbacks to be called by trampolines */
  callbacks: { [K in keyof T]: T[K] | typeof assertNotCalled };
  /** The stable trampolines */
  trampolines: StableCallbacks<T>;
  /** Effect to sync next -> callbacks */
  effect: () => void;
};

/**
 * Stabilizes multiple functions passed so they're always the same between renders.
 * This is a batched version of `useStableCallback` that reduces hook overhead
 * when you need multiple stable callbacks.
 *
 * Note: the set of keys is captured on the first render and must remain stable.
 * If a key is removed, keep it in the object with an explicit `undefined` value.
 *
 * @example
 * const callbacks = useStableCallbacks({
 *   onClick: (e) => console.log(e),
 *   onHover: (e) => console.log(e),
 * });
 * // callbacks.onClick and callbacks.onHover are stable references
 */
export function useStableCallbacks<T extends Record<string, Callback | undefined>>(
  callbacksObj: T,
): StableCallbacks<T> {
  const stableCallbacks = useRefWithInit(
    createStableCallbacks<T>,
    Object.keys(callbacksObj),
  ).current;
  const { keys } = stableCallbacks;

  if (process.env.NODE_ENV !== 'production') {
    const currentKeys = Object.keys(callbacksObj);
    if (currentKeys.length !== keys.length) {
      warn('useStableCallbacks expects a stable set of keys between renders.');
    } else {
      for (let i = 0; i < currentKeys.length; i += 1) {
        if (!Object.hasOwn(stableCallbacks.trampolines, currentKeys[i])) {
          warn('useStableCallbacks expects a stable set of keys between renders.');
          break;
        }
      }
    }
  }

  // Update next values
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i] as keyof T;
    stableCallbacks.next[key] = callbacksObj[key];
  }

  useSafeInsertionEffect(stableCallbacks.effect);

  return stableCallbacks.trampolines;
}

function createStableCallbacks<T extends Record<string, Callback | undefined>>(
  keys: string[],
): StableState<T> {
  const next = {} as T;
  const callbacks = {} as { [K in keyof T]: T[K] | typeof assertNotCalled };
  const trampolines = {} as StableCallbacks<T>;

  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i] as keyof T;
    callbacks[key] = assertNotCalled;
    // Create a trampoline for each key
    trampolines[key] = ((...args: any[]) => (callbacks[key] as Callback)?.(...args)) as any;
  }

  const effect = () => {
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i] as keyof T;
      callbacks[key] = next[key] as any;
    }
  };

  return { keys, next, callbacks, trampolines, effect };
}

function assertNotCalled() {
  if (process.env.NODE_ENV !== 'production') {
    throw /* minify-error-disabled */ new Error(
      'Base UI: Cannot call an event handler while rendering.',
    );
  }
}
