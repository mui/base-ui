'use client';
import * as React from 'react';
/* We need to import the shim because React 17 does not support the `useSyncExternalStore` API. */
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { isReactVersionAtLeast } from './reactVersion';

const emptySubscribe = () => () => {};
const getTrue = () => true;
const getFalse = () => false;

function useIsHydratedModern() {
  return useSyncExternalStore(emptySubscribe, getTrue, getFalse);
}

/**
 * React 17 path. The shim only forwards to React's own implementation when
 * there is one; its fallback takes `(subscribe, getSnapshot)` and drops
 * `getServerSnapshot`, so a shim-based hook would report `true` on the server —
 * the opposite of what this one exists for.
 */
function useIsHydratedLegacy() {
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}

function useIsHydratingModern() {
  return useSyncExternalStore(emptySubscribe, getFalse, getTrue);
}

/**
 * React 17 path. For the same reason as above the server snapshot is
 * unreachable, so this degrades to "never hydrating" — inert, and what this
 * hook already did on React 17 before the two were brought together.
 */
function useIsHydratingLegacy() {
  return false;
}

/** Returns true after hydration is done on the client. */
export const useIsHydrated = isReactVersionAtLeast(18) ? useIsHydratedModern : useIsHydratedLegacy;

/**
 * Returns `true` while React is hydrating server-rendered markup and `false`
 * for fresh client-only mounts.
 */
export const useIsHydrating = isReactVersionAtLeast(18)
  ? useIsHydratingModern
  : useIsHydratingLegacy;
