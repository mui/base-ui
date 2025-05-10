'use client';
import * as React from 'react';
import { useLazyRef } from './useLazyRef';

// https://github.com/mui/material-ui/issues/41190#issuecomment-2040873379
const useInsertionEffect =
  (React as any)[`useInsertionEffect${Math.random()}`.slice(0, 5)] || ((fn: any) => fn());

const ASSERT_NOT_CALLED = () => {
  throw new Error('Cannot call an event handler while rendering.');
};

type Callback = (...args: any[]) => any;

export function useEventCallback<T extends Callback>(callback: T | undefined): T {
  const stable = useLazyRef(createStableCallback).current;

  if (process.env.NODE_ENV === 'production') {
    // It's unsafe to call it while rendering, but as long as it's asserted
    // that it's not being called while rendering, then we can safely assume
    // that updating the ref during the render phase is equivalent to updating
    // it during the insertion phase.
    stable.callback = callback;
  } else {
    // In development, we enable strict assertion that the event callback is
    // never called during the render phase.
    stable.callback = ASSERT_NOT_CALLED as unknown as T;

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useInsertionEffect(() => {
      stable.callback = callback;
    });
  }

  return stable.trampoline as unknown as T;
}

function createStableCallback<T extends Callback | undefined>() {
  const stable = {
    callback: undefined as T,
    trampoline: (...args: []) => stable.callback?.(...args),
  };
  return stable;
}
