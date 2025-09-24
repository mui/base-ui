import { useIsoLayoutEffect } from '../useIsoLayoutEffect';
import { Store } from './Store';

export class ControllableStore<State> extends Store<State> {
  /**
   * Keeps track of which properties are controlled.
   */
  #controlledValues: Partial<Record<keyof State, boolean>> = {};

  #changeCallbacks: Partial<Record<keyof State, (value: any, ...rest: any) => void>> = {};

  useProp<Key extends keyof State, Value extends State[Key]>(key: keyof State, value: Value) {
    // False positive - ESLint thinks we're calling a hook from a class component.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useIsoLayoutEffect(() => {
      if (this.state[key] !== value) {
        this.set(key, value);
      }
    });
  }

  useControlledProp<Key extends keyof State, Value extends State[Key]>(
    key: keyof State,
    controlled: Value | undefined,
    defaultValue: Value,
    changeCallback?: (newValue: Value, ...rest: any) => void,
  ): void {
    const isControlled = controlled !== undefined;

    this.#changeCallbacks[key] = changeCallback;

    if (process.env.NODE_ENV !== 'production') {
      if (
        this.#controlledValues[key] !== undefined &&
        this.#controlledValues[key] !== isControlled
      ) {
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
      if (this.#controlledValues[key] === undefined) {
        // First time initialization
        this.#controlledValues[key] = isControlled;

        if (!isControlled && defaultValue !== undefined) {
          super.set(key, defaultValue as State[typeof key]);
        }
      }

      if (isControlled && this.state[key] !== controlled) {
        // Set the internal state to match the controlled value
        super.set(key, controlled as State[typeof key]);
      }
    }, [key, controlled, defaultValue, isControlled]);
  }

  public set<T>(key: keyof State, value: T, ...additionalArgs: any[]): void {
    this.#changeCallbacks[key]?.(value, ...additionalArgs);
    if (this.#controlledValues[key]) {
      // Ignore updates to controlled values
      return;
    }

    super.set(key, value);
  }

  // Component-specific stores can add strongly type convenience methods
  // such as `setOpen(open: boolean, reason: string)`.
}
