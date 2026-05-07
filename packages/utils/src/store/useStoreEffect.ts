'use client';
import { useRefWithInit } from '../useRefWithInit';
import { useOnMount } from '../useOnMount';
import type { ReadonlyStore } from './Store';

const noop = () => {};

/**
 * An Effect implementation for the Store. This should be used for side-effects only. To
 * compute and store derived state, use `createSelectorMemoized` instead.
 */
export function useStoreEffect<State, Value>(
  store: ReadonlyStore<State>,
  selector: (state: State) => Value,
  effect: (previous: Value, next: Value) => void,
): void {
  const instance = useRefWithInit(initialize, { store, selector }).current;
  instance.effect = effect;
  useOnMount(instance.onMount);
}

function initialize<State, Value>(params: {
  store: ReadonlyStore<State>;
  selector: (state: State) => Value;
}) {
  const { store, selector } = params;

  let previousState = selector(store.state);

  const instance = {
    effect: noop as (previous: Value, next: Value) => void,
    dispose: null as Function | null,
    // We want a single subscription done right away and cleared on unmount only,
    // but React triggers `useOnMount` multiple times in dev, so we need to manage
    // the subscription anyway.
    subscribe: () => {
      instance.dispose ??= store.subscribe((state) => {
        const nextState = selector(state);
        if (!Object.is(previousState, nextState)) {
          const prev = previousState;
          previousState = nextState;
          instance.effect(prev, nextState);
        }
      });
    },
    onMount: () => {
      instance.subscribe();
      return () => {
        instance.dispose?.();
        instance.dispose = null;
      };
    },
  };

  instance.subscribe();

  return instance;
}
