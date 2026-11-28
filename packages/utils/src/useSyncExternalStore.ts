'use client';
import * as React from 'react';
import { useSyncExternalStore as useSyncExternalStoreShim } from 'use-sync-external-store/shim';
import { useSyncExternalStoreWithSelector as useSyncExternalStoreWithSelectorShim } from 'use-sync-external-store/shim/with-selector';
import { SafeReact } from './safeReact';

// The shim is CommonJS and gets its hooks from `require('react')`. With `react` aliased to
// `preact/compat`, ESM server renders load a second, CommonJS copy of Preact for it whose hooks
// crash, so these hooks must come from the `react` import instead.

export const useSyncExternalStore: typeof useSyncExternalStoreShim =
  SafeReact.useSyncExternalStore ?? useSyncExternalStoreShim;

// Preact replaces useInsertionEffect with useLayoutEffect.
const isPreact =
  SafeReact.useInsertionEffect !== undefined &&
  SafeReact.useInsertionEffect === SafeReact.useLayoutEffect;

export const useSyncExternalStoreWithSelector: <Snapshot, Selection>(
  subscribe: (onStoreChange: () => void) => () => void,
  getSnapshot: () => Snapshot,
  getServerSnapshot: undefined | null | (() => Snapshot),
  selector: (snapshot: Snapshot) => Selection,
) => Selection = isPreact
  ? useSyncExternalStoreWithSelectorCompat
  : useSyncExternalStoreWithSelectorShim;

function useSyncExternalStoreWithSelectorCompat<Snapshot, Selection>(
  subscribe: (onStoreChange: () => void) => () => void,
  getSnapshot: () => Snapshot,
  getServerSnapshot: undefined | null | (() => Snapshot),
  selector: (snapshot: Snapshot) => Selection,
): Selection {
  const [getSelection, getServerSelection] = React.useMemo(() => {
    let hasMemo = false;
    let memoizedSnapshot: Snapshot;
    let memoizedSelection: Selection;
    const memoizedSelector = (nextSnapshot: Snapshot) => {
      if (!hasMemo || !Object.is(memoizedSnapshot, nextSnapshot)) {
        hasMemo = true;
        memoizedSnapshot = nextSnapshot;
        memoizedSelection = selector(nextSnapshot);
      }
      return memoizedSelection;
    };
    return [
      () => memoizedSelector(getSnapshot()),
      getServerSnapshot == null ? undefined : () => memoizedSelector(getServerSnapshot()),
    ];
  }, [getSnapshot, getServerSnapshot, selector]);

  return useSyncExternalStore(subscribe, getSelection, getServerSelection);
}
