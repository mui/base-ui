import { NOOP } from '@base-ui/utils/empty';
import { ReactStore } from '@base-ui/utils/store';

type SelectorFunction<State> = (state: State, ...args: any[]) => any;

/**
 * A `ReactStore` whose state never changes.
 *
 * Useful for fallback stores that need to support normal store reads while detached from the
 * component that owns real state. Context values may still contain mutable refs or maps.
 */
export class NullStore<
  State extends object,
  Context = Record<string, never>,
  Selectors extends Record<string, SelectorFunction<State>> = Record<string, never>,
> extends ReactStore<State, Context, Selectors> {
  constructor(state: State, context?: Context, selectors?: Selectors) {
    super(
      Object.freeze(state),
      context !== undefined ? Object.freeze(context) : undefined,
      selectors,
    );
  }

  setOpen = NOOP;

  // `update`/`set`/`notifyAll` funnel through `setState` in the base `Store`, so overriding
  // `setState` alone would neutralize them today. They are overridden explicitly so the store stays
  // inert even if a future base-class change stops routing a mutator through `setState`.
  setState(_newState: State) {}

  update<const Key extends keyof State>(_changes: Pick<State, Key>) {}

  set<Key extends keyof State>(_key: Key, _value: State[Key]) {}

  notifyAll() {}
}
