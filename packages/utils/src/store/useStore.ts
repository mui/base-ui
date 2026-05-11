'use client';
import * as React from 'react';
import { isReactVersionAtLeast } from '../reactVersion';
import { register, getInstance, Instance } from '../fastHooks';
import { useIsoLayoutEffect } from '../useIsoLayoutEffect';
import type { ReadonlyStore } from './Store';

/* Some tests fail in R18 with the raw useSyncExternalStore. It may be possible to make it work
 * but for now we only enable it for R19+. */
const canUseRawUseSyncExternalStore = isReactVersionAtLeast(19);
const useStoreImplementation = canUseRawUseSyncExternalStore ? useStoreFast : useStoreLegacy;
const NO_SELECTION = {};

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

  return React.useSyncExternalStore(store.subscribe, getSelection, getSelection);
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
      React.useSyncExternalStore(instance.subscribe, instance.getSnapshot, instance.getSnapshot);
    }
  },
});

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

function useStoreLegacy(
  store: ReadonlyStore<unknown>,
  selector: Function,
  a1?: unknown,
  a2?: unknown,
  a3?: unknown,
): unknown {
  const stateRef = React.useRef<{
    store?: ReadonlyStore<unknown> | undefined;
    selector?: Function | undefined;
    a1?: unknown;
    a2?: unknown;
    a3?: unknown;
    state: unknown;
    value: unknown;
  }>({
    state: NO_SELECTION,
    value: null,
  });

  const getSelection = React.useCallback(() => {
    const state = store.getSnapshot();
    const ref = stateRef.current;

    if (
      ref.state !== NO_SELECTION &&
      ref.store === store &&
      ref.selector === selector &&
      Object.is(ref.a1, a1) &&
      Object.is(ref.a2, a2) &&
      Object.is(ref.a3, a3) &&
      Object.is(ref.state, state)
    ) {
      return ref.value;
    }

    const value = selector(state, a1, a2, a3);

    ref.store = store;
    ref.selector = selector;
    ref.a1 = a1;
    ref.a2 = a2;
    ref.a3 = a3;
    ref.state = state;

    if (!Object.is(value, ref.value)) {
      ref.value = value;
    }

    return ref.value;
  }, [store, selector, a1, a2, a3]);

  return useSyncExternalStoreLegacy(store.subscribe, getSelection);
}

function useSyncExternalStoreLegacy(
  subscribe: (onStoreChange: () => void) => () => void,
  getSnapshot: () => unknown,
): unknown {
  const [snapshot, setSnapshot] = React.useState(getSnapshot);

  useIsoLayoutEffect(() => {
    function checkForUpdates() {
      setSnapshot(getSnapshot());
    }

    checkForUpdates();
    return subscribe(checkForUpdates);
  }, [subscribe, getSnapshot]);

  return snapshot;
}
