// We need to import the shim because React 17 does not support the `useSyncExternalStore` API.
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector';
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
/**
 * Returns a value from the store. The value is derived from the store's state using the provided selector function.
 * Updates to the store's other properties will not cause re-renders.
 *
 * @param store The Store instance to read from.
 * @param selector A function that selects a value from the store's state.
 * @param a1 Optional first argument for the selector function.
 * @param a2 Optional second argument for the selector function.
 * @param a3 Optional third argument for the selector function.
 */
export function useStore(
  store: Store<unknown>,
  selector: Function,
  a1?: unknown,
  a2?: unknown,
  a3?: unknown,
): unknown {
  const selectorWithArgs = (state: unknown) => selector(state, a1, a2, a3);

  return useSyncExternalStoreWithSelector(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
    selectorWithArgs,
  );
}
