import * as React from 'react';
/* We need to import the shim because React 17 does not support the `useSyncExternalStore` API.
 * More info: https://github.com/mui/mui-x/issues/18303#issuecomment-2958392341 */
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import type { Store } from './Store';

export function useStore<State, Value>(
  store: Store<State>,
  selector: (state: State) => Value,
): Value;
export function useStore<State, Value, A1>(
  store: Store<State>,
  selector: (state: State, a1: A1) => Value,
  a1: A1,
): Value;
export function useStore<State, Value, A1, A2>(
  store: Store<State>,
  selector: (state: State, a1: A1, a2: A2) => Value,
  a1: A1,
  a2: A2,
): Value;
export function useStore<State, Value, A1, A2, A3>(
  store: Store<State>,
  selector: (state: State, a1: A1, a2: A2, a3: A3) => Value,
  a1: A1,
  a2: A2,
  a3: A3,
): Value;
export function useStore(
  store: Store<unknown>,
  selector: Function,
  a1?: unknown,
  a2?: unknown,
  a3?: unknown,
): unknown {
  const getSelection = React.useMemo(
    () => () => selector(store.getSnapshot(), a1, a2, a3),
    [store, selector, a1, a2, a3],
  );

  return useSyncExternalStore(store.subscribe, getSelection, getSelection);
}
