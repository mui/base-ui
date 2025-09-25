import { useIsoLayoutEffect } from '../useIsoLayoutEffect';
import { Store } from './Store';

export class ControllableStore<State> extends Store<State> {
  /**
   * Keeps track of which properties are controlled.
   */
  #controlledValues: Map<keyof State, boolean> = new Map();

  useProp<Key extends keyof State, Value extends State[Key]>(key: keyof State, value: Value) {
    // False positive - ESLint thinks we're calling a hook from a class component.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useIsoLayoutEffect(() => {
      if (this.state[key] !== value) {
        this.set(key, value);
      }
    }, [key, value]);
  }

  useProps(props: Partial<State>) {
    // False positive - ESLint thinks we're calling a hook from a class component.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useIsoLayoutEffect(() => {
      this.apply(props);
    }, [props]);
  }

  useControlledProp<Key extends keyof State, Value extends State[Key]>(
    key: keyof State,
    controlled: Value | undefined,
    defaultValue: Value,
  ): void {
    const isControlled = controlled !== undefined;

    if (process.env.NODE_ENV !== 'production') {
      const previoslyControlled = this.#controlledValues.get(key);
      if (previoslyControlled !== undefined && previoslyControlled !== isControlled) {
        console.error(
          `A component is changing the ${
            isControlled ? '' : 'un'
          }controlled state of ${key.toString()} to be ${isControlled ? 'un' : ''}controlled. Elements should not switch from uncontrolled to controlled (or vice versa).`,
        );
      }
    }

    // False positive - ESLint thinks we're calling a hook from a class component.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useIsoLayoutEffect(() => {
      if (!this.#controlledValues.has(key)) {
        // First time initialization
        this.#controlledValues.set(key, isControlled);

        if (!isControlled && defaultValue !== undefined) {
          super.set(key, defaultValue as State[typeof key]);
        }
      }

      if (isControlled && !Object.is(this.state[key], controlled)) {
        // Set the internal state to match the controlled value.
        super.update({ ...(this.state as State), [key]: controlled } as State);
      }
    }, [key, controlled, defaultValue, isControlled]);
  }

  /**
   * Sets a specific key in the store's state to a new value and notifies listeners if the value has changed.
   *
   * @param key The key in the store's state to update.
   * @param value The new value to set for the specified key.
   */
  public set<T>(key: keyof State, value: T): void {
    if (this.#controlledValues.get(key) === true) {
      // Ignore updates to controlled values
      return;
    }

    super.set(key, value);
  }

  /**
   * Merges the provided changes into the current state and notifies listeners if there are changes.
   *
   * @param changes An object containing the changes to apply to the current state.
   */
  public apply(values: Partial<State>): void {
    const newValues = { ...values };
    for (const key in newValues) {
      if (this.#controlledValues.get(key) === true) {
        // Ignore updates to controlled values
        delete newValues[key];
      }
    }

    super.apply(newValues);
  }

  /**
   * Updates the entire store's state and notifies all registered listeners.
   *
   * @param newState The new state to set for the store.
   */
  public update(newState: State) {
    const newValues = { ...newState };
    for (const key in newValues) {
      if (this.#controlledValues.get(key) === true) {
        // Ignore updates to controlled values
        delete newValues[key];
      }
    }

    super.update({ ...this.state, ...newValues });
  }
}
