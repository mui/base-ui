'use client';
import * as React from 'react';

const emptySubscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/** Returns true after hydration is done on the client. */
export function useIsHydrated() {
  return React.useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);
}
