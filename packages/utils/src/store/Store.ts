import { useEventCallback } from '../useEventCallback';
import { useStore } from './useStore';

type Listener<T> = (state: T) => void;

type MaybeCallable = (...args: any[]) => any;

type ContextFunctionKeys<Context> = {
  [Key in keyof Context]-?: Extract<Context[Key], MaybeCallable> extends never ? never : Key;
}[keyof Context];

type ContextFunction<Context, Key extends keyof Context> = Extract<Context[Key], MaybeCallable>;

/**
 * A data store implementation that allows subscribing to state changes and updating the state.
 * It uses an observer pattern to notify subscribers when the state changes.
 */
export class Store<
  State,
  Context = Record<string, never>,
  Selectors extends Record<string, (state: State) => any> = Record<string, never>,
> {
  /**
   * The current state of the store.
   * This proprerty shouldn't be used directly. Use `useState` to subscribe to state changes.
   */
  public state: State;

  /**
   * Non-reactive values such as refs, callbacks, etc.
   * Unlike `state`, this property can be accessed directly.
   */
  public readonly context: Context;

  private listeners: Set<Listener<State>>;

  private selectors?: Selectors;

  constructor(state: State, context: Context, selectors?: Selectors) {
    this.state = state;
    this.listeners = new Set();
    this.context = context;
    this.selectors = selectors;
  }

  /**
   * Registers a listener that will be called whenever the store's state changes.
   *
   * @param fn The listener function to be called on state changes.
   * @returns A function to unsubscribe the listener.
   */
  public subscribe = (fn: Listener<State>) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  /**
   * Returns the current state of the store.
   */
  public getSnapshot = () => {
    return this.state;
  };

  /**
   * Updates the entire store's state and notifies all registered listeners.
   *
   * @param newState The new state to set for the store.
   */
  public update(newState: State) {
    if (this.state !== newState) {
      this.state = newState;
      this.listeners.forEach((l) => l(newState));
    }
  }

  /**
   * Merges the provided changes into the current state and notifies listeners if there are changes.
   *
   * @param changes An object containing the changes to apply to the current state.
   */
  public apply(changes: Partial<State>) {
    for (const key in changes) {
      if (!Object.is(this.state[key], changes[key])) {
        this.update({ ...this.state, ...changes });
        return;
      }
    }
  }

  /**
   * Sets a specific key in the store's state to a new value and notifies listeners if the value has changed.
   *
   * @param key The key in the store's state to update.
   * @param value The new value to set for the specified key.
   */
  public set<T>(key: keyof State, value: T) {
    if (!Object.is(this.state[key], value)) {
      this.update({ ...this.state, [key]: value });
    }
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
    // False positive
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useStore<State, ReturnType<Selectors[Key]>>(
      this,
      this.selectors[key] as (state: State) => ReturnType<Selectors[Key]>,
    );
  }

  /**
   * Wraps a function with `useEventCallback` to ensure it has a stable reference
   * and assigns it to the context.
   *
   * @param key Key of the event callback. Must be a function in the context.
   * @param fn Function to assign.
   */
  public useEventCallback<Key extends ContextFunctionKeys<Context>>(
    key: Key,
    fn: ContextFunction<Context, Key>,
  ) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const stableFunction = useEventCallback(fn);
    (this.context as Record<Key, ContextFunction<Context, Key>>)[key] = stableFunction;
  }
}
