'use client';
import { useRefWithInit } from './useRefWithInit';
import { useInsertionEffect } from './useInsertionEffect';

type Callback = (...args: any[]) => any;

type Stable<T extends Callback> = {
  /** The next value for callback */
  next: T | undefined;
  /** The function to be called by trampoline. This must fail during the initial render phase. */
  callback: T | undefined;
  trampoline: T;
  effect: () => void;
};

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
  const stable = useRefWithInit(createStableCallback).current;
  stable.next = callback;
  useInsertionEffect(stable.effect);
  return stable.trampoline;
}

function createStableCallback() {
  const stable: Stable<any> = {
    next: undefined,
    callback: assertNotCalled,
    trampoline: (...args: []) => stable.callback?.(...args),
    effect: () => {
      stable.callback = stable.next;
    },
  };
  return stable;
}

function assertNotCalled() {
  if (process.env.NODE_ENV !== 'production') {
    throw /* minify-error-disabled */ new Error(
      'Base UI: Cannot call an event handler while rendering.',
    );
  }
}
