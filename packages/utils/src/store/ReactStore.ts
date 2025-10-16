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
  State,
  Context = Record<string, never>,
  Selectors extends Record<string, (state: State) => any> = Record<string, never>,
> extends Store<State> {
  constructor(state: State, context: Context = {} as Context, selectors?: Selectors) {
    super(state);
    this.context = context;
    this.selectors = selectors;
  }

  /**
   * Non-reactive values such as refs, callbacks, etc.
   * Unlike `state`, this property can be accessed directly.
   */
  public readonly context: Context;

  /**
   * Keeps track of which properties are controlled.
   */
  private controlledValues: Map<keyof State, boolean> = new Map();

  private selectors: Selectors | undefined;

  /**
   * Synchronizes a single external value into the store during layout phase.
   */
  public useSyncedValue<Key extends keyof State, Value extends State[Key]>(
    key: keyof State,
    value: Value,
  ) {
    useIsoLayoutEffect(() => {
      if (this.state[key] !== value) {
        this.set(key, value);
      }
    }, [key, value]);
  }

  /**
   * Synchronizes a single external value into the store during layout phase and
   * cleans it up (sets to `undefined`) on unmount.
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
   * Synchronizes multiple external values into the store during layout phase.
   */
  public useSyncedValues(props: Partial<State>) {
    useIsoLayoutEffect(() => {
      this.apply(props);
    }, [props]);
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
        super.update({ ...this.state, [key]: defaultValue } as State);
      }
    }

    useIsoLayoutEffect(() => {
      if (isControlled && !Object.is(this.state[key], controlled)) {
        // Set the internal state to match the controlled value.
        super.update({ ...this.state, [key]: controlled } as State);
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
  public apply(values: Partial<State>): void {
    const newValues = { ...values };
    for (const key in newValues) {
      if (this.controlledValues.get(key) === true) {
        // Ignore updates to controlled values
        delete newValues[key];
      }
    }

    super.apply(newValues);
  }

  /**
   * Updates the entire store's state and notifies all registered listeners.
   * Controlled keys are left unchanged; only uncontrolled keys from `newState` are applied.
   *
   * @param newState The new state to set for the store.
   */
  public update(newState: State) {
    const newValues = { ...newState };
    for (const key in newValues) {
      if (this.controlledValues.get(key) === true) {
        // Ignore updates to controlled values
        delete newValues[key];
      }
    }

    super.update({ ...this.state, ...newValues });
  }

  /**
   * Returns a value from the store's state using a selector function.
   * Used to subscribe to specific parts of the state.
   * This methods causes a rerender whenever the selected state changes.
   *
   * @param key Key of the selector to use.
   */
  public useState<Key extends keyof Selectors>(key: Key): ReturnType<Selectors[Key]> {
    if (!this.selectors) {
      throw new Error('Base UI: selectors are required to call useState.');
    }
    return useStore<State, ReturnType<Selectors[Key]>>(
      this,
      this.selectors[key] as (state: State) => ReturnType<Selectors[Key]>,
    );
  }

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
    const stableFunction = useStableCallback(fn ?? (NOOP as ContextFunction<Context, Key>));
    (this.context as Record<Key, ContextFunction<Context, Key>>)[key] = stableFunction;
  }

  /**
   * Returns a stable setter function for a specific key in the store's state.
   * It's commonly used to pass as a ref callback to React elements.
   * @param key Key of the state to set.
   */
  public getElementSetter<Key extends keyof State, Value extends State[Key]>(key: keyof State) {
    return React.useCallback(
      (element: Value) => {
        this.set(key, element);
      },
      [key],
    );
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
