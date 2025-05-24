import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';
import type { Store } from './Store';

export function useSelector<State, Value>(
  store: Store<State>,
  selector: (state: State) => Value,
): Value;
export function useSelector<State, Value, A1>(
  store: Store<State>,
  selector: (state: State, a1: A1) => Value,
  a1: A1,
): Value;
export function useSelector<State, Value, A1, A2>(
  store: Store<State>,
  selector: (state: State, a1: A1, a2: A2) => Value,
  a1: A1,
  a2: A2,
): Value;
export function useSelector<State, Value, A1, A2, A3>(
  store: Store<State>,
  selector: (state: State, a1: A1, a2: A2, a3: A3) => Value,
  a1: A1,
  a2: A2,
  a3: A3,
): Value;
export function useSelector(
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
