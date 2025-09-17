type Listener<T> = (state: T) => void;

/**
 * A data store implementation that allows subscribing to state changes and updating the state.
 * It uses an observer pattern to notify subscribers when the state changes.
 */
export class Store<State> {
  public state: State;

  private listeners: Set<Listener<State>>;

  constructor(state: State) {
    this.state = state;
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
}

/**
 * Configuration for a controlled property
 */
export interface ControlledPropertyConfig<T = unknown, Details = any> {
  /**
   * Whether this property is controlled (true) or uncontrolled (false)
   */
  controlled: boolean;
  /**
   * The current value (for controlled properties)
   */
  value?: T;
  /**
   * The default value (for uncontrolled properties)
   */
  defaultValue?: T;
  /**
   * Callback to call when the value changes (for controlled properties)
   */
  onChange?: (value: T, details?: Details) => void;
  /**
   * Component name for debugging
   */
  name?: string;
  /**
   * Property name for debugging
   */
  state?: string;
}

/**
 * A Store that supports controlled/uncontrolled properties.
 * Unlike the wrapper approach, this store can be shared between components
 * while maintaining controlled property behavior.
 */
export class ControllableStore<State> extends Store<State> {
  private controlledConfigs: Map<keyof State, ControlledPropertyConfig<any>> = new Map();

  private initialControlledStatus: Map<keyof State, boolean> = new Map();

  /**
   * Configure a property as controlled or uncontrolled
   */
  configureControlled<K extends keyof State>(
    key: K,
    config: ControlledPropertyConfig<State[K]>
  ): void {
    const wasAlreadyConfigured = this.controlledConfigs.has(key);
    
    // Store the initial controlled status if not already set
    if (!this.initialControlledStatus.has(key)) {
      this.initialControlledStatus.set(key, config.controlled);
    }

    this.controlledConfigs.set(key, config);

    // Set the initial value
    if (config.controlled && config.value !== undefined) {
      // For controlled properties, always set the current value
      super.set(key, config.value);
    } else if (!config.controlled && config.defaultValue !== undefined && !wasAlreadyConfigured) {
      // For uncontrolled properties, only set the default value when first configuring
      super.set(key, config.defaultValue);
    }
  }

  /**
   * Update multiple controlled property configurations
   */
  updateControlledConfigs(configs: Partial<{ [K in keyof State]: ControlledPropertyConfig<State[K]> }>): void {
    Object.entries(configs).forEach(([key, config]) => {
      if (config && typeof config === 'object' && 'controlled' in config && typeof config.controlled === 'boolean') {
        this.configureControlled(key as keyof State, config as ControlledPropertyConfig<State[keyof State]>);
      }
    });

    // Check for controlled/uncontrolled switching and warn in development
    if (process.env.NODE_ENV !== 'production') {
      this.controlledConfigs.forEach((config, key) => {
        const wasControlled = this.initialControlledStatus.get(key);
        const isCurrentlyControlled = config.controlled;

        if (wasControlled !== isCurrentlyControlled && config.name) {
          console.error(
            [
              `Base UI: A component is changing the ${
                wasControlled ? '' : 'un'
              }controlled ${config.state || String(key)} state of ${config.name} to be ${
                wasControlled ? 'un' : ''
              }controlled.`,
              'Elements should not switch from uncontrolled to controlled (or vice versa).',
              `Decide between using a controlled or uncontrolled ${config.name} ` +
                'element for the lifetime of the component.',
              "The nature of the state is determined during the first render. It's considered controlled if the value is not `undefined`.",
              'More info: https://fb.me/react-controlled-components',
            ].join('\n'),
          );
        }
      });
    }
  }

  /**
   * Override set to respect controlled properties
   */
  set<T>(key: keyof State, value: T): void {
    const config = this.controlledConfigs.get(key);
    
    if (config?.controlled) {
      // Controlled property - warn and ignore
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `ControllableStore: Attempted to set controlled property "${String(key)}". Use the appropriate setter method instead.`
        );
      }
      return;
    }

    // Uncontrolled property or no configuration - proceed normally
    super.set(key, value);
  }

  /**
   * Override apply to respect controlled properties
   */
  apply(changes: Partial<State>): void {
    const filteredChanges: Partial<State> = {};
    
    Object.entries(changes).forEach(([key, value]) => {
      const config = this.controlledConfigs.get(key as keyof State);
      
      if (config?.controlled) {
        // Controlled property - warn and skip
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            `ControllableStore: Attempted to apply change to controlled property "${key}". Use the appropriate setter method instead.`
          );
        }
      } else {
        // Uncontrolled property or no configuration - include in changes
        (filteredChanges as any)[key] = value;
      }
    });

    if (Object.keys(filteredChanges).length > 0) {
      super.apply(filteredChanges);
    }
  }

  /**
   * Create a callback-aware setter for a specific property
   */
  createSetter<K extends keyof State, Details = any>(
    key: K
  ): (value: State[K], details?: Details) => void {
    return (value: State[K], details?: Details) => {
      const config = this.controlledConfigs.get(key);
      
      if (config?.controlled) {
        // Controlled - call the onChange callback
        config.onChange?.(value, details);
      } else {
        // Uncontrolled - update the store state directly
        super.set(key, value);
      }
    };
  }

  /**
   * Check if a property is controlled
   */
  isControlled(key: keyof State): boolean {
    return this.controlledConfigs.get(key)?.controlled ?? false;
  }

  /**
   * Get the configuration for a property
   */
  getConfig<K extends keyof State>(key: K): ControlledPropertyConfig<State[K]> | undefined {
    return this.controlledConfigs.get(key);
  }
}

/**
 * Type utility to generate setter method names for controlled properties
 */
type SetterMethodName<K extends string | number | symbol> = `set${Capitalize<string & K>}`;

/**
 * Type utility to generate callback-aware setter methods
 */
type SetterMethods<State, Keys extends keyof State> = {
  [K in Keys as SetterMethodName<K>]: (value: State[K], details?: any) => void;
};

/**
 * Enhanced ControllableStore with dynamically generated setter methods
 */
export type EnhancedControllableStore<
  State,
  ControlledKeys extends keyof State = never
> = ControllableStore<State> & SetterMethods<State, ControlledKeys>;

/**
 * Creates an enhanced ControllableStore with dynamically generated setter methods
 */
export function createEnhancedControllableStore<
  State,
  ControlledKeys extends keyof State = never
>(
  initialState: State,
  controlledKeys?: ControlledKeys[]
): EnhancedControllableStore<State, ControlledKeys> {
  const store = new ControllableStore<State>(initialState);
  const enhanced = store as EnhancedControllableStore<State, ControlledKeys>;

  // Generate setter methods for controlled properties
  if (controlledKeys) {
    controlledKeys.forEach((key) => {
      const setterName = `set${String(key).charAt(0).toUpperCase()}${String(key).slice(1)}` as SetterMethodName<typeof key>;
      (enhanced as any)[setterName] = store.createSetter(key);
    });
  }

  return enhanced;
}
