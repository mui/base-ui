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
  // `update`/`set`/`notifyAll` funnel through `setState` in the base `Store`, so overriding
  // `setState` alone would neutralize them today. They are overridden explicitly so the store stays
  // inert even if a future base-class change stops routing a mutator through `setState`.
  setState(_newState: State) {}

  update(_changes: Partial<State>) {}

  set<T>(_key: keyof State, _value: T) {}

  notifyAll() {}
}
