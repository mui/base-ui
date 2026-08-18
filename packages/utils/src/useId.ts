'use client';
import * as React from 'react';
import { SafeReact } from './safeReact';
import { useForcedRerendering } from './useForcedRerendering';

let globalId = 0;

// TODO React 17: Remove `useGlobalId` once React 17 support is removed
function useGlobalId(idOverride?: string, prefix: string = 'mui'): string | undefined {
  const defaultId = React.useRef<string | undefined>(undefined);
  const forceRerender = useForcedRerendering();
  const id = idOverride ?? defaultId.current;
  React.useEffect(() => {
    if (defaultId.current == null) {
      // Fallback to this default id when possible.
      // Use the incrementing value for client-side rendering only.
      // We can't use it server-side.
      // If you want to use random values please consider the Birthday Problem: https://en.wikipedia.org/wiki/Birthday_problem
      globalId += 1;
      defaultId.current = `${prefix}-${globalId}`;
      // Generate the fallback even while `idOverride` is set.
      // Removing the override then swaps in the existing id within the same commit.
      // Deferring generation would leave one commit with no id, breaking `htmlFor` and `aria-labelledby` links.
      // Only rerender when the fallback is the value being rendered.
      if (idOverride == null) {
        forceRerender();
      }
    }
  }, [idOverride, prefix, forceRerender]);
  return id;
}

const maybeReactUseId: undefined | (() => string) = SafeReact.useId;

/**
 *
 * @example <div id={useId()} />
 * @param idOverride
 * @returns {string}
 */
export function useId(idOverride?: string, prefix?: string): string | undefined {
  // React.useId() is only available from React 18.0.0.
  if (maybeReactUseId !== undefined) {
    const reactId = maybeReactUseId();
    return idOverride ?? (prefix ? `${prefix}-${reactId}` : reactId);
  }

  // TODO: uncomment once we enable eslint-plugin-react-compiler // eslint-disable-next-line react-compiler/react-compiler
  // eslint-disable-next-line react-hooks/rules-of-hooks -- `React.useId` is invariant at runtime.
  return useGlobalId(idOverride, prefix);
}
