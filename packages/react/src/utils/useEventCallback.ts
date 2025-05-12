'use client';
import * as React from 'react';
import { unsafe_useLazyDirectRef } from './useLazyRef';

// https://github.com/mui/material-ui/issues/41190#issuecomment-2040873379
const useInsertionEffect =
  (React as any)[`useInsertionEffect${Math.random()}`.slice(0, 5)] || ((fn: any) => fn());

type Callback = (...args: any[]) => any;

type Stable<T extends Callback> = {
  /** The value during render phase */
  current: T | undefined;
  /** The function to be called by trampoline. This must fail during the initial render phase. */
  callback: T | undefined;
  trampoline: T;
  effect: () => void;
};

export function useEventCallback<T extends Callback>(callback: T | undefined): T {
  const stable = unsafe_useLazyDirectRef<Stable<T>>(unsafe_initialize);
  stable.current = callback;
  useInsertionEffect(stable.effect);
  return stable.trampoline;
}

/* eslint-disable-next-line @typescript-eslint/naming-convention */
function unsafe_initialize(ref: React.RefObject<unknown>) {
  const stable = ref as unknown as Stable<any>;
  stable.current = undefined;
  stable.callback = assertNotCalled;
  stable.trampoline = (...args: []) => stable.callback?.(...args);
  stable.effect = () => {
    stable.callback = stable.current;
  };
}

function assertNotCalled() {
  throw new Error('Cannot call an event handler while rendering.');
}
