import { useIsoLayoutEffect } from '../useIsoLayoutEffect';
import { Store } from './Store';

export class ControllableStore<State> extends Store<State> {
  /**
   * Keeps track of which properties are controlled.
   */
  #controlledValues: Map<keyof State, boolean> = new Map();

  #changeCallbacks: Map<keyof State, (value: any, ...rest: any) => void> = new Map();

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
    changeCallback?: (newValue: Value, ...rest: any) => void,
  ): void {
    const isControlled = controlled !== undefined;

    this.#changeCallbacks.set(key, changeCallback as (value: any, ...rest: any) => void);

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

      if (isControlled && this.state[key] !== controlled) {
        // Set the internal state to match the controlled value
        super.set(key, controlled as State[typeof key]);
      }
    }, [key, controlled, defaultValue, isControlled]);
  }

  public set<T>(key: keyof State, value: T, ...additionalArgs: any[]): void {
    this.#changeCallbacks.get(key)?.(value, ...additionalArgs);
    if (this.#controlledValues.get(key) === true) {
      // Ignore updates to controlled values
      return;
    }

    super.set(key, value);
  }

  // Component-specific stores can add strongly type convenience methods
  // such as `setOpen(open: boolean, reason: string)`.
}
