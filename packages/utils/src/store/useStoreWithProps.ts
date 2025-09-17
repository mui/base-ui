import * as React from 'react';
import { 
  Store,
  type ControllableStore,
  type ControlledPropertyConfig 
} from './Store';
import { useIsoLayoutEffect } from '../useIsoLayoutEffect';

/**
 * A hook that integrates props into the store's state and keeps it updated when props change.
 * The store's state type should include the props as part of its structure.
 *
 * @param store The Store instance to update with props.
 * @param props The props object to merge into the store's state.
 * @returns The updated store instance.
 *
 * @example
 * ```tsx
 * type MyState = {
 *   open: boolean;
 *   disabled: boolean; // This comes from props
 * };
 *
 * const store = new Store<MyState>({ open: false, disabled: false });
 *
 * function MyComponent({ disabled }: { disabled: boolean }) {
 *   useStoreWithProps(store, { disabled });
 *
 *   // Now the store's state includes the updated disabled prop
 *   const isDisabled = useStore(store, (state) => state.disabled);
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useStoreWithProps<State, Props extends Partial<State>>(
  store: Store<State>,
  props: Props,
) {
  useIsoLayoutEffect(() => {
    store.apply(props);
  }, [store, props]);
}

// Legacy type alias for backward compatibility  
export type { ControlledPropertyConfig as ControlledPropConfig } from './Store';

/**
 * Configuration for controlled properties in the new simplified API
 */
type ControlledPropsConfig<State> = {
  [K in keyof State]?: {
    defaultValue?: State[K];
    onChange?: (value: State[K], details?: any) => void;
    name?: string;
    state?: string;
  };
};

/**
 * A hook that configures a ControllableStore to handle controlled/uncontrolled props.
 * This approach works with shared stores - the same store instance can be used by multiple components.
 *
 * @param store The ControllableStore instance to configure
 * @param props The current props containing controlled and uncontrolled values
 * @param controlledConfig Configuration for which props should be treated as controlled/uncontrolled
 *
 * @example
 * ```tsx
 * // Create a shared store (outside components)
 * const sharedStore = new ControllableStore<MyState>({ open: false, value: '', disabled: false });
 *
 * function MyComponent({
 *   open,
 *   defaultOpen,
 *   value,
 *   defaultValue,
 *   onOpenChange,
 *   onValueChange
 * }) {
 *   // Configure the shared store for this component's controlled props
 *   useStoreWithControlledProps(
 *     sharedStore,
 *     { open, value },
 *     {
 *       open: { defaultValue: defaultOpen, onChange: onOpenChange, name: 'MyComponent' },
 *       value: { defaultValue: defaultValue, onChange: onValueChange, name: 'MyComponent' },
 *     }
 *   );
 *
 *   // Both internal and user-facing updates work correctly
 *   const handleInternalUpdate = () => {
 *     sharedStore.set('disabled', true); // Works for uncontrolled props
 *   };
 *
 *   const handleUserAction = () => {
 *     sharedStore.createSetter('open')(true, { reason: 'user-click' }); // Calls onChange if controlled
 *   };
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useStoreWithControlledProps<State>(
  store: ControllableStore<State>,
  props: Partial<State>,
  controlledConfig: ControlledPropsConfig<State>,
): void {
  // Build the configuration for the store
  const storeConfigs = React.useMemo(() => {
    const configs: Partial<{ [K in keyof State]: ControlledPropertyConfig<State[K]> }> = {};
    
    Object.keys(controlledConfig).forEach((key) => {
      const keyName = key as keyof State;
      const config = controlledConfig[keyName];
      
      if (config) {
        const isControlled = props[keyName] !== undefined;
        
        configs[keyName] = {
          controlled: isControlled,
          value: isControlled ? props[keyName] : undefined,
          defaultValue: !isControlled ? config.defaultValue : undefined,
          onChange: config.onChange,
          name: config.name,
          state: config.state || String(keyName),
        };
      }
    });
    
    return configs;
  }, [props, controlledConfig]);

  // Update store configuration when props change
  useIsoLayoutEffect(() => {
    // Configure controlled properties
    store.updateControlledConfigs(storeConfigs);

    // Update regular props (non-controlled)
    const regularProps: Partial<State> = {};
    const controlledKeys = new Set(Object.keys(controlledConfig));
    
    Object.entries(props).forEach(([key, value]) => {
      if (!controlledKeys.has(key) && value !== undefined) {
        (regularProps as any)[key] = value;
      }
    });

    if (Object.keys(regularProps).length > 0) {
      // Use Store.prototype.apply to bypass controlled property checks for regular props
      Store.prototype.apply.call(store, regularProps);
    }
  }, [store, storeConfigs, props, controlledConfig]);
}
