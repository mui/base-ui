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

/**
 * Stabilizes the function passed so it's always the same between renders.
 *
 * The function becomes non-reactive to any values it captures.
 * It can safely be passed as a dependency of `React.useMemo` and `React.useEffect` without re-triggering them if its captured values change.
 *
 * The function must only be called inside effects and event handlers, never during render (which throws an error).
 *
 * This hook is a more permissive version of React 19.2's `React.useEffectEvent` in that it can be passed through contexts and called in event handler props, not just effects.
 */
export function useStableCallback<T extends Callback>(callback: T | undefined): T {
  const callbackRef = React.useRef<T | undefined>(assertNotCalled as T);
  const trampoline = useRefWithInit((ref: React.RefObject<T | undefined>) => {
    return ((...args: Parameters<T>) => ref.current?.(...args)) as T;
  }, callbackRef).current;

  useSafeInsertionEffect(() => {
    callbackRef.current = callback;
  });

  return trampoline;
}

function assertNotCalled() {
  if (process.env.NODE_ENV !== 'production') {
    throw /* minify-error-disabled */ new Error(
      'Base UI: Cannot call an event handler while rendering.',
    );
  }
}
