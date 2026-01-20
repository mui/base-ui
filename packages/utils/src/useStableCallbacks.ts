'use client';
import * as React from 'react';
import { useRefWithInit } from './useRefWithInit';

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
  const stable = useRefWithInit(createStableCallbacks<T>, Object.keys(callbacksObj)).current;

  // Update next values
  for (const key in callbacksObj) {
    if (Object.hasOwn(callbacksObj, key)) {
      stable.next[key] = callbacksObj[key];
    }
  }

  useSafeInsertionEffect(stable.effect);

  return stable.trampolines;
}

function createStableCallbacks<T extends Record<string, Callback | undefined>>(
  keys: string[],
): StableState<T> {
  const next = {} as T;
  const callbacks = {} as { [K in keyof T]: T[K] | typeof assertNotCalled };
  const trampolines = {} as StableCallbacks<T>;

  for (const key of keys) {
    callbacks[key as keyof T] = assertNotCalled;
    // Create a trampoline for each key
    trampolines[key as keyof T] = ((...args: any[]) =>
      (callbacks[key as keyof T] as Callback)?.(...args)) as any;
  }

  const effect = () => {
    for (const key in next) {
      if (Object.hasOwn(next, key)) {
        callbacks[key] = next[key] as any;
      }
    }
  };

  return { next, callbacks, trampolines, effect };
}

function assertNotCalled() {
  if (process.env.NODE_ENV !== 'production') {
    throw /* minify-error-disabled */ new Error(
      'Base UI: Cannot call an event handler while rendering.',
    );
  }
}
