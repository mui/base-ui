'use client';
import * as React from 'react';
import { isReactVersionAtLeast } from './reactVersion';
import { SafeReact } from './safeReact';

const emptySubscribe = () => () => {};
const getTrue = () => true;
const getFalse = () => false;

function useIsHydratedModern() {
  // The server snapshot is what React renders with while hydrating, so this
  // distinguishes a hydration pass from a client-only mount, which reads the
  // client snapshot straight away. Only used on React 18+, which has the hook natively.
  return SafeReact.useSyncExternalStore(emptySubscribe, getTrue, getFalse);
}

/**
 * React 17 path. The shim only forwards to React's own implementation when
 * there is one; its fallback takes `(subscribe, getSnapshot)` and drops
 * `getServerSnapshot`, so a shim-based hook would report `true` on the server —
 * the opposite of what this exists for.
 *
 * `useState` cannot tell hydration from a client-only mount, so both report
 * "not hydrated" for one render before settling.
 */
function useIsHydratedLegacy() {
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}

/** Returns `true` once React has taken over on the client. */
export const useIsHydrated = isReactVersionAtLeast(18) ? useIsHydratedModern : useIsHydratedLegacy;

/**
 * Returns `true` while React is hydrating server-rendered markup and `false`
 * for fresh client-only mounts — the exact inverse of {@link useIsHydrated}.
 */
export function useIsHydrating() {
  return !useIsHydrated();
}
