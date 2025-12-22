/* False positives - ESLint thinks we're calling a hook from a class component. */
/* eslint-disable react-hooks/rules-of-hooks */
import * as React from 'react';
import { Store } from './Store';
import { useStore } from './useStore';
import { useStableCallback } from '../useStableCallback';
import { useIsoLayoutEffect } from '../useIsoLayoutEffect';
import { NOOP } from '../empty';

/**
 * A Store that supports controlled state keys, non-reactive values and provides utility methods for React.
 */
export class ReactStore<
  State extends object,
  Context = Record<string, never>,
  Selectors extends Record<string, SelectorFunction<State>> = Record<string, never>,
> extends Store<State> {
  /**
   * Creates a new ReactStore instance.
   *
   * @param state Initial state of the store.
   * @param context Non-reactive context values.
   * @param selectors Optional selectors for use with `useState`.
   */
  constructor(state: State, context: Context = {} as Context, selectors?: Selectors) {
    super(state);
    this.context = context;
    this.selectors = selectors;
  }

  /**
   * Non-reactive values such as refs, callbacks, etc.
   */
  public readonly context: Context;

  /**
   * Keeps track of which properties are controlled.
   */
  private controlledValues: Map<keyof State, boolean> = new Map();

  private selectors: Selectors | undefined;

  /**
   * Synchronizes a single external value into the store.
   *
   * Note that the while the value in `state` is updated immediately, the value returned
   * by `useState` is updated before the next render (similarly to React's `useState`).
   */
  public useSyncedValue<Key extends keyof State, Value extends State[Key]>(
    key: keyof State,
    value: Value,
  ) {
    React.useDebugValue(key);
    useIsoLayoutEffect(() => {
      if (this.state[key] !== value) {
        this.set(key, value);
      }
    }, [key, value]);
  }

  /**
   * Synchronizes a single external value into the store and
   * cleans it up (sets to `undefined`) on unmount.
   *
   * Note that the while the value in `state` is updated immediately, the value returned
   * by `useState` is updated before the next render (similarly to React's `useState`).
   */
  public useSyncedValueWithCleanup<Key extends KeysAllowingUndefined<State>>(
    key: Key,
    value: State[Key],
  ) {
    useIsoLayoutEffect(() => {
      if (this.state[key] !== value) {
        this.set(key, value);
      }

      return () => {
        this.set(key, undefined as State[Key]);
      };
    }, [key, value]);
  }

  /**
   * Synchronizes multiple external values into the store.
   *
   * Note that the while the values in `state` are updated immediately, the values returned
   * by `useState` are updated before the next render (similarly to React's `useState`).
   */
  public useSyncedValues(statePart: Partial<State>) {
    if (process.env.NODE_ENV !== 'production') {
      // Check that an object with the same shape is passed on every render
      React.useDebugValue(statePart, (p) => Object.keys(p));
      const keys = React.useRef<Array<keyof State>>(
        Object.keys(statePart) as Array<keyof State>,
      ).current;

      const nextKeys = Object.keys(statePart);
      if (keys.length !== nextKeys.length || keys.some((key, index) => key !== nextKeys[index])) {
        console.error(
          'ReactStore.useSyncedValues expects the same prop keys on every render. Keys should be stable.',
        );
      }
    }

    const dependencies = Object.values(statePart);

    useIsoLayoutEffect(() => {
      this.update(statePart);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies);
  }

  /**
   * Registers a controllable prop pair (`controlled`, `defaultValue`) for a specific key.
   * - If `controlled` is non-undefined, the key is marked as controlled and the store's
   *   state at `key` is updated to match `controlled`. Local writes to that key are ignored.
   * - If `controlled` is undefined, the key is marked as uncontrolled. The store's state
   *   is initialized to `defaultValue` on first render and can be updated with local writes.
   */
  public useControlledProp<Key extends keyof State, Value extends State[Key]>(
    key: keyof State,
    controlled: Value | undefined,
    defaultValue: Value,
  ): void {
    React.useDebugValue(key);
    const isControlled = controlled !== undefined;

    if (process.env.NODE_ENV !== 'production') {
      const previouslyControlled = this.controlledValues.get(key);
      if (previouslyControlled !== undefined && previouslyControlled !== isControlled) {
        console.error(
          `A component is changing the ${
            isControlled ? '' : 'un'
          }controlled state of ${key.toString()} to be ${isControlled ? 'un' : ''}controlled. Elements should not switch from uncontrolled to controlled (or vice versa).`,
        );
      }
    }

    if (!this.controlledValues.has(key)) {
      // First time initialization
      this.controlledValues.set(key, isControlled);

      if (!isControlled && !Object.is(this.state[key], defaultValue)) {
        super.setState({ ...this.state, [key]: defaultValue });
      }
    }

    useIsoLayoutEffect(() => {
      if (isControlled && !Object.is(this.state[key], controlled)) {
        // Set the internal state to match the controlled value.
        super.setState({ ...this.state, [key]: controlled });
      }
    }, [key, controlled, defaultValue, isControlled]);
  }

  /**
   * Sets a specific key in the store's state to a new value and notifies listeners if the value has changed.
   * If the key is controlled (registered via {@link useControlledProp} with a non-undefined value),
   * the update is ignored and no listeners are notified.
   *
   * @param key The state key to update.
   * @param value The new value to set for the specified key.
   */
  public set<T>(key: keyof State, value: T): void {
    if (this.controlledValues.get(key) === true) {
      // Ignore updates to controlled values
      return;
    }

    super.set(key, value);
  }

  /**
   * Merges the provided changes into the current state and notifies listeners if there are changes.
   * Controlled keys are filtered out and not updated.
   *
   * @param values An object containing the changes to apply to the current state.
   */
  public update(values: Partial<State>): void {
    const newValues = { ...values };
    for (const key in newValues) {
      if (!Object.hasOwn(newValues, key)) {
        continue;
      }

      if (this.controlledValues.get(key) === true) {
        // Ignore updates to controlled values
        delete newValues[key];
        continue;
      }
    }

    super.update(newValues);
  }

  /**
   * Updates the entire store's state and notifies all registered listeners.
   * Controlled keys are left unchanged; only uncontrolled keys from `newState` are applied.
   *
   * @param newState The new state to set for the store.
   */
  public setState(newState: State) {
    const newValues = { ...newState };
    for (const key in newValues) {
      if (!Object.hasOwn(newValues, key)) {
        continue;
      }

      if (this.controlledValues.get(key) === true) {
        // Ignore updates to controlled values
        delete newValues[key];
        continue;
      }
    }

    super.setState({ ...this.state, ...newValues });
  }

  /** Gets the current value from the store using a selector with the provided key.
   *
   * @param key Key of the selector to use.
   */
  public select = ((key: keyof Selectors, a1?: unknown, a2?: unknown, a3?: unknown) => {
    const selector = this.selectors![key];
    return selector(this.state, a1, a2, a3);
  }) as ReactStoreSelectorMethod<Selectors>;

  /**
   * Returns a value from the store's state using a selector function.
   * Used to subscribe to specific parts of the state.
   * This methods causes a rerender whenever the selected state changes.
   *
   * @param key Key of the selector to use.
   */
  public useState = ((key: keyof Selectors, a1?: unknown, a2?: unknown, a3?: unknown) => {
    React.useDebugValue(key);
    const selector = this.selectors![key];
    const value = useStore(this, selector, a1, a2, a3);
    return value;
  }) as ReactStoreSelectorMethod<Selectors>;

  /**
   * Wraps a function with `useStableCallback` to ensure it has a stable reference
   * and assigns it to the context.
   *
   * @param key Key of the event callback. Must be a function in the context.
   * @param fn Function to assign.
   */
  public useContextCallback<Key extends ContextFunctionKeys<Context>>(
    key: Key,
    fn: ContextFunction<Context, Key> | undefined,
  ) {
    React.useDebugValue(key);
    const stableFunction = useStableCallback(fn ?? (NOOP as ContextFunction<Context, Key>));
    (this.context as Record<Key, ContextFunction<Context, Key>>)[key] = stableFunction;
  }

  /**
   * Returns a stable setter function for a specific key in the store's state.
   * It's commonly used to pass as a ref callback to React elements.
   *
   * @param key Key of the state to set.
   */
  public useStateSetter<const Key extends keyof State, Value extends State[Key]>(key: keyof State) {
    const ref = React.useRef<(v: Value) => void>(undefined as any);
    if (ref.current === undefined) {
      ref.current = (value: Value) => {
        this.set(key, value);
      };
    }
    return ref.current;
  }

  /**
   * Observes changes derived from the store's selectors and calls the listener when the selected value changes.
   *
   * @param key Key of the selector to observe.
   * @param listener Listener function called when the selector result changes.
   */
  public observe<Key extends keyof Selectors>(
    selector: Key,
    listener: (
      newValue: ReturnType<Selectors[Key]>,
      oldValue: ReturnType<Selectors[Key]>,
      store: this,
    ) => void,
  ): () => void;

  public observe<Selector extends ObserveSelector<State>>(
    selector: Selector,
    listener: (newValue: ReturnType<Selector>, oldValue: ReturnType<Selector>, store: this) => void,
  ): () => void;

  public observe(
    selector: keyof Selectors | ObserveSelector<State>,
    listener: (newValue: any, oldValue: any, store: this) => void,
  ) {
    let selectFn: ObserveSelector<State>;

    if (typeof selector === 'function') {
      selectFn = selector;
    } else {
      selectFn = this.selectors![selector] as ObserveSelector<State>;
    }

    let prevValue = selectFn(this.state);

    listener(prevValue, prevValue, this);

    return this.subscribe((nextState) => {
      const nextValue = selectFn(nextState);
      if (!Object.is(prevValue, nextValue)) {
        const oldValue = prevValue;
        prevValue = nextValue;
        listener(nextValue, oldValue, this);
      }
    });
  }
}

type MaybeCallable = (...args: any[]) => any;

type ContextFunctionKeys<Context> = {
  [Key in keyof Context]-?: Extract<Context[Key], MaybeCallable> extends never ? never : Key;
}[keyof Context];

type ContextFunction<Context, Key extends keyof Context> = Extract<Context[Key], MaybeCallable>;

type KeysAllowingUndefined<State> = {
  [Key in keyof State]-?: undefined extends State[Key] ? Key : never;
}[keyof State];

type ReactStoreSelectorMethod<Selectors extends Record<PropertyKey, SelectorFunction<any>>> = <
  Key extends keyof Selectors,
>(
  key: Key,
  ...args: SelectorArgs<Selectors[Key]>
) => ReturnType<Selectors[Key]>;

type ObserveSelector<State> = (state: State) => any;

type SelectorFunction<State> = (state: State, ...args: any[]) => any;

type Tail<T extends readonly any[]> = T extends readonly [any, ...infer Rest] ? Rest : [];

type SelectorArgs<Selector> = Selector extends (...params: infer Params) => any
  ? Tail<Params>
  : never;
