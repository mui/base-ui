type Listener<T> = (state: T) => void;

/**
 * A data store implementation that allows subscribing to state changes and updating the state.
 * It uses an observer pattern to notify subscribers when the state changes.
 */
export class Store<State> {
  /**
   * The internal state of the store.
   * This property is mutable only within this class methods.
   */
  private internalState: State;

  /**
   * The current state of the store.
   * This property is updated immediately when the state changes as a result of calling {@link update}, {@link apply}, or {@link set}.
   * To subscribe to state changes, use the {@link useState} method. The value returned by {@link useState} is updated after the component renders (similarly to React's useState).
   * The values can be used directly (to avoid subscribing to the store) in effects or event handlers.
   *
   * Do not modify properties in state directly. Instead, use the provided methods to ensure proper state management and listener notification.
   */
  public get state() {
    return this.internalState;
  }

  private listeners: Set<Listener<State>>;

  constructor(state: State) {
    this.internalState = state;
    this.listeners = new Set();
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
    return this.internalState;
  };

  /**
   * Updates the entire store's state and notifies all registered listeners.
   *
   * @param newState The new state to set for the store.
   */
  public update(newState: State) {
    if (this.internalState !== newState) {
      this.internalState = newState;
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
      if (!Object.is(this.internalState[key], changes[key])) {
        this.update({ ...this.internalState, ...changes });
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
    if (!Object.is(this.internalState[key], value)) {
      this.update({ ...this.internalState, [key]: value });
    }
  }
}
