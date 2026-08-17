import { useStore } from './useStore';

type Listener<T> = (state: T) => void;

/**
 * A data store implementation that allows subscribing to state changes and updating the state.
 * It uses an observer pattern to notify subscribers when the state changes.
 */
export class Store<State> {
  /**
   * Creates a store with the given initial state, constructing the class it is called on.
   */
  static create<T, This extends Store<T>>(this: new (state: T) => This, state: T): This {
    return new this(state);
  }

  /**
   * The current state of the store.
   * This property is updated immediately when the state changes as a result of calling {@link setState}, {@link update}, or {@link set}.
   * To subscribe to state changes, use the {@link useState} method. The value returned by {@link useState} is updated after the component renders (similarly to React's useState).
   * The values can be used directly (to avoid subscribing to the store) in effects or event handlers.
   *
   * Do not modify properties in state directly. Instead, use the provided methods to ensure proper state management and listener notification.
   */
  state: State;

  private listeners: Set<Listener<State>>;

  // Internal state to handle recursive `setState()` calls
  private updateTick: number;

  constructor(state: State) {
    this.state = state;
    this.listeners = new Set();
    this.updateTick = 0;
  }

  /**
   * Registers a listener that will be called whenever the store's state changes.
   *
   * @param fn The listener function to be called on state changes.
   * @returns A function to unsubscribe the listener.
   */
  subscribe = (fn: Listener<State>) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  /**
   * Returns the current state of the store.
   */
  getSnapshot = () => {
    return this.state;
  };

  /**
   * Updates the entire store's state and notifies all registered listeners.
   *
   * @param newState The new state to set for the store.
   */
  setState(newState: State) {
    if (this.state === newState) {
      return;
    }

    this.state = newState;
    this.updateTick += 1;

    const currentTick = this.updateTick;
    for (const listener of this.listeners) {
      if (currentTick !== this.updateTick) {
        // If the tick has changed, a recursive `setState` call has been made,
        // and it has already notified all listeners.
        return;
      }
      listener(newState);
    }
  }

  /**
   * Merges the provided changes into the current state and notifies listeners if there are changes.
   * Each value must match its state key. Pass an exact known subset rather than a broad
   * `Partial<State>`, which may contain `undefined` for required state fields.
   *
   * @param changes An object containing the changes to apply to the current state.
   */
  update<const Key extends keyof State>(changes: Pick<State, Key>) {
    for (const key in changes) {
      if (!Object.is(this.state[key], changes[key])) {
        this.setState({ ...this.state, ...changes });
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
  set<Key extends keyof State>(key: Key, value: State[Key]) {
    if (!Object.is(this.state[key], value)) {
      this.setState({ ...this.state, [key]: value });
    }
  }

  /**
   * Gives the state a new reference and updates all registered listeners.
   */
  notifyAll() {
    const newState = { ...this.state };
    this.setState(newState);
  }

  use<F extends (...args: any) => any>(selector: F, ...args: SelectorArgs<F>): ReturnType<F>;

  use(selector: any, a1?: unknown, a2?: unknown, a3?: unknown) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useStore(this, selector, a1, a2, a3);
  }
}

export type ReadonlyStore<State> = Pick<Store<State>, 'getSnapshot' | 'subscribe' | 'state'>;

type SelectorArgs<Selector> = Selector extends (...params: infer Params) => any
  ? Tail<Params>
  : never;

type Tail<T extends readonly any[]> = T extends readonly [any, ...infer Rest] ? Rest : [];
