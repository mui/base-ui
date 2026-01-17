import * as React from 'react';
/* We need to import the shim because React 17 does not support the `useSyncExternalStore` API.
 * More info: https://github.com/mui/mui-x/issues/18303#issuecomment-2958392341 */
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector';
import { isReactVersionAtLeast } from '../reactVersion';
import { register, getInstance, Instance } from '../fastHooks';
import type { ReadonlyStore } from './Store';

/* Some tests fail in R18 with the raw useSyncExternalStore. It may be possible to make it work
 * but for now we only enable it for R19+. */
const canUseRawUseSyncExternalStore = isReactVersionAtLeast(19);
const useStoreImplementation = canUseRawUseSyncExternalStore ? useStoreFast : useStoreLegacy;

/**
 * Subscribes to a store and returns the selected value from the store's state.
 * This hook uses an optimized implementation for React 19+ when used within components
 * wrapped with `fastComponent` or `fastComponentRef`.
 *
 * **Performance Optimization:**
 * In React 19+, when a component is wrapped with `fastComponent`, this hook uses a specialized
 * implementation that batches store subscriptions at the component level rather than creating
 * individual subscriptions for each `useStore` call. This significantly reduces the overhead of
 * multiple store subscriptions within the same component, especially beneficial for components
 * that subscribe to many store values.
 *
 * **How it works:**
 * - Components using `fastComponent` have access to a shared "instance" context
 * - Multiple `useStore` calls within the same component share a single subscription
 * - The hook tracks selector results and only triggers re-renders when selected values change
 * - Falls back to standard `useSyncExternalStore` behavior when not in a fast component
 *
 * **Requirements and limitations:**
 * - For optimal performance in React 19+, the component must be wrapped with `fastComponent`
 * - The selector function should be stable (defined outside the component or memoized)
 * - Additional selector arguments (a1, a2, a3) must be stable or will cause re-subscriptions
 * - Limited to 3 additional selector arguments beyond state
 *
 * **When to use:**
 * - Use this hook whenever you need to subscribe to store state in a component
 * - The performance benefits are most noticeable in components that call `useStore` multiple times
 * - For components not using `fastComponent`, it still works correctly using the standard approach
 *
 * @param store - The store to subscribe to
 * @param selector - A function that extracts a value from the store's state
 * @param a1 - Optional first additional argument to pass to the selector
 * @param a2 - Optional second additional argument to pass to the selector
 * @param a3 - Optional third additional argument to pass to the selector
 * @returns The value selected from the store's state
 *
 * @example
 * ```tsx
 * // Basic usage
 * const value = useStore(store, (state) => state.value);
 *
 * // With additional arguments
 * const item = useStore(store, (state, id) => state.items[id], itemId);
 *
 * // In a fast component (React 19+)
 * const MyComponent = fastComponent((props) => {
 *   // These subscriptions are batched into a single store subscription
 *   const open = useStore(store, (state) => state.open);
 *   const disabled = useStore(store, (state) => state.disabled);
 *   const value = useStore(store, (state) => state.value);
 *   // ...
 * });
 * ```
 */
export function useStore<State, Value>(
  store: ReadonlyStore<State>,
  selector: (state: State) => Value,
): Value;
export function useStore<State, Value, A1>(
  store: ReadonlyStore<State>,
  selector: (state: State, a1: A1) => Value,
  a1: A1,
): Value;
export function useStore<State, Value, A1, A2>(
  store: ReadonlyStore<State>,
  selector: (state: State, a1: A1, a2: A2) => Value,
  a1: A1,
  a2: A2,
): Value;
export function useStore<State, Value, A1, A2, A3>(
  store: ReadonlyStore<State>,
  selector: (state: State, a1: A1, a2: A2, a3: A3) => Value,
  a1: A1,
  a2: A2,
  a3: A3,
): Value;
export function useStore(
  store: ReadonlyStore<unknown>,
  selector: Function,
  a1?: unknown,
  a2?: unknown,
  a3?: unknown,
): unknown {
  return useStoreImplementation(store, selector, a1, a2, a3);
}

/**
 * Standard React 19 implementation using `useSyncExternalStore`.
 * Used as a fallback when the component is not wrapped with `fastComponent`.
 * @internal
 */
function useStoreR19(
  store: ReadonlyStore<unknown>,
  selector: Function,
  a1?: unknown,
  a2?: unknown,
  a3?: unknown,
): unknown {
  const getSelection = React.useCallback(
    () => selector(store.getSnapshot(), a1, a2, a3),
    [store, selector, a1, a2, a3],
  );

  return useSyncExternalStore(store.subscribe, getSelection, getSelection);
}

export type StoreInstance = Instance & {
  syncIndex: number;
  syncTick: number;
  syncHooks: {
    store: any;
    selector: Function;
    a1: unknown;
    a2: unknown;
    a3: unknown;
    value: unknown;
    didChange: boolean;
  }[];
  didChangeStore: boolean;
  subscribe: (onStoreChange: any) => () => void;
  getSnapshot: () => unknown;
};

register({
  before(instance: StoreInstance) {
    instance.syncIndex = 0;

    if (!instance.didInitialize) {
      instance.syncTick = 1;
      instance.syncHooks = [];
      instance.didChangeStore = true;
      instance.getSnapshot = () => {
        let didChange = false;
        for (let i = 0; i < instance.syncHooks.length; i += 1) {
          const hook = instance.syncHooks[i];
          const value = hook.selector(hook.store.state, hook.a1, hook.a2, hook.a3);
          if (hook.didChange || !Object.is(hook.value, value)) {
            didChange = true;
            hook.value = value;
            hook.didChange = false;
          }
        }
        if (didChange) {
          instance.syncTick += 1;
        }
        return instance.syncTick;
      };
    }
  },
  after(instance: StoreInstance) {
    if (instance.syncHooks.length > 0) {
      if (instance.didChangeStore) {
        instance.didChangeStore = false;
        instance.subscribe = (onStoreChange) => {
          const stores = new Set<ReadonlyStore<unknown>>();
          for (const hook of instance.syncHooks) {
            stores.add(hook.store);
          }
          const unsubscribes: Array<() => void> = [];
          for (const store of stores) {
            unsubscribes.push(store.subscribe(onStoreChange));
          }
          return () => {
            for (const unsubscribe of unsubscribes) {
              unsubscribe();
            }
          };
        };
      }
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useSyncExternalStore(instance.subscribe, instance.getSnapshot, instance.getSnapshot);
    }
  },
});

/**
 * Optimized implementation that batches store subscriptions within a fast component.
 * This implementation leverages the `fastHooks` system to share a single store subscription
 * among all `useStore` calls within the same component, reducing subscription overhead.
 * @internal
 */
function useStoreFast(
  store: ReadonlyStore<unknown>,
  selector: Function,
  a1?: unknown,
  a2?: unknown,
  a3?: unknown,
): unknown {
  const instance = getInstance() as StoreInstance | undefined;
  if (!instance) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useStoreR19(store, selector, a1, a2, a3);
  }

  const index = instance.syncIndex;
  instance.syncIndex += 1;

  let hook;
  if (!instance.didInitialize) {
    hook = {
      store,
      selector,
      a1,
      a2,
      a3,
      value: selector(store.getSnapshot(), a1, a2, a3),
      didChange: false,
    };
    instance.syncHooks.push(hook);
  } else {
    hook = instance.syncHooks[index];
    if (
      hook.store !== store ||
      hook.selector !== selector ||
      !Object.is(hook.a1, a1) ||
      !Object.is(hook.a2, a2) ||
      !Object.is(hook.a3, a3)
    ) {
      if (hook.store !== store) {
        instance.didChangeStore = true;
      }
      hook.store = store;
      hook.selector = selector;
      hook.a1 = a1;
      hook.a2 = a2;
      hook.a3 = a3;
      hook.didChange = true;
    }
  }

  return hook.value;
}

/**
 * Legacy implementation for React 17 and 18 using `useSyncExternalStoreWithSelector`.
 * @internal
 */
function useStoreLegacy(
  store: ReadonlyStore<unknown>,
  selector: Function,
  a1?: unknown,
  a2?: unknown,
  a3?: unknown,
): unknown {
  return useSyncExternalStoreWithSelector(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
    (state) => selector(state, a1, a2, a3),
  );
}
