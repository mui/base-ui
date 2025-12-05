import * as React from 'react';
/* We need to import the shim because React 17 does not support the `useSyncExternalStore` API.
 * More info: https://github.com/mui/mui-x/issues/18303#issuecomment-2958392341 */
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector';
import { isReactVersionAtLeast } from '../reactVersion';
import { getInstance, Instance } from '../fastHooks';
import type { ReadonlyStore } from './Store';

/* Some tests fail in R18 with the raw useSyncExternalStore. It may be possible to make it work
 * but for now we only enable it for R19+. */
const canUseRawUseSyncExternalStore = isReactVersionAtLeast(19);
const useStoreImplementation = canUseRawUseSyncExternalStore ? useStoreFast : useStoreLegacy;

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

  return useSyncExternalStore(store.subscribe, getSelection, getSelection);
}

type StoreInstance = Instance & {
  tick: number;
  hooks: {
    selector: Function;
    a1: unknown;
    a2: unknown;
    a3: unknown;
    value: unknown;
  }[];
  getSnapshot: () => unknown;
};

function useStoreFast(
  store: ReadonlyStore<unknown>,
  selector: Function,
  a1?: unknown,
  a2?: unknown,
  a3?: unknown,
): unknown {
  const instance = getInstance() as StoreInstance | undefined;
  if (!instance) {
    return useStoreR19(store, selector, a1, a2, a3);
  }

  const index = instance.index;
  instance.index += 1;

  if (index === 0) {
    if (!instance.didInitialize) {
      instance.tick = 1;
      instance.hooks = [];
      instance.getSnapshot = () => {
        const state = store.getSnapshot();
        let didChange = false;
        for (let i = 0; i < instance.hooks.length; i++) {
          const hook = instance.hooks[i];
          const value = hook.selector(state, hook.a1, hook.a2, hook.a3);
          if (!Object.is(hook.value, value)) {
            didChange = true;
            hook.value = value;
          }
        }
        if (didChange) {
          instance.tick += 1;
        }
        return instance.tick;
      };
    }
    useSyncExternalStore(store.subscribe, instance.getSnapshot, instance.getSnapshot);
  }

  let hook;
  if (!instance.didInitialize) {
    hook = {
      selector,
      a1,
      a2,
      a3,
      value: selector(store.getSnapshot(), a1, a2, a3),
    };
    instance.hooks.push(hook);
  } else {
    hook = instance.hooks[index];
    hook.selector = selector;
    hook.a1 = a1;
    hook.a2 = a2;
    hook.a3 = a3;
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
  return useSyncExternalStoreWithSelector(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
    (state) => selector(state, a1, a2, a3),
  );
}
