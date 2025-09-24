'use client';
import * as React from 'react';
import { Store } from '@base-ui-components/utils/store/Store';
import { useRefWithInit } from '@base-ui-components/utils/useRefWithInit';
import { useStore } from '@base-ui-components/utils/store/useStore';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';

export default function Playground() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="w-lg mx-auto">
      <h2 className="text-lg mb-4">Controlled mode</h2>
      <div className="flex gap-2 mb-16 items-baseline">
        <button
          type="button"
          className="border-1 border-gray-300 px-4 py-1 rounded-sm"
          onClick={() => setOpen((o) => !o)}
        >
          Toggle externally
        </button>
        <ControllableComponent
          open={open}
          onOpenChange={(nextOpen, reason) => {
            setOpen(nextOpen);
            console.log('reason', reason);
          }}
        />
      </div>

      <h2 className="text-lg mb-4">Uncontrolled mode (open by default)</h2>
      <div className="flex gap-2 mb-16 items-baseline">
        <ControllableComponent
          defaultOpen={true}
          onOpenChange={(_, reason) => {
            console.log('reason', reason);
          }}
        />
      </div>

      <h2 className="text-lg mb-4">Uncontrolled mode (closed by default)</h2>
      <div className="flex gap-2 mb-16 items-baseline">
        <ControllableComponent
          defaultOpen={false}
          onOpenChange={(_, reason) => {
            console.log('reason', reason);
          }}
        />
      </div>
    </div>
  );
}

interface Props {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, reason: string) => void;
}

function ControllableComponent(props: Props) {
  const store = useRefWithInit(() => new ControllableStore()).current;

  store.useControlledProp('open', props.open, props.defaultOpen ?? false, props.onOpenChange);

  const open = useStore(store, (state) => state.open);

  return (
    <React.Fragment>
      <span>open: {open?.toString() ?? 'undefined'}</span>
      <ChildComponent store={store} />
      <button
        type="button"
        className="border-1 border-gray-300 px-4 py-1 rounded-sm"
        onClick={() => store.set('open', !open, 'toggle-button')}
      >
        Toggle internally
      </button>
    </React.Fragment>
  );
}

interface ChildProps {
  store: ControllableStore;
}

function ChildComponent(props: ChildProps) {
  const open = useStore(props.store, (state) => state.open);
  return <span>child sees open: {open.toString()}</span>;
}

interface State {
  open: boolean;
}

class ControllableStore extends Store<State> {
  constructor() {
    super({ open: false });
  }

  /**
   * Keeps track of which properties are controlled.
   */
  #controlledValues: Partial<Record<keyof State, boolean>> = {};

  #callbacks: Partial<Record<keyof State, (value: any, ...rest: any) => void>> = {};

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

    this.#callbacks[key] = changeCallback;

    if (process.env.NODE_ENV !== 'production') {
      if (
        this.#controlledValues[key] !== undefined &&
        this.#controlledValues[key] !== isControlled
      ) {
        console.error(
          `A component is changing the ${
            isControlled ? '' : 'un'
          }controlled state of ${key} to be ${isControlled ? 'un' : ''}controlled. Elements should not switch from uncontrolled to controlled (or vice versa).`,
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
    this.#callbacks[key]?.(value, ...additionalArgs);
    if (this.#controlledValues[key]) {
      // Ignore updates to controlled values
      return;
    }

    super.set(key, value);
  }

  // Component-specific stores can add strongly type convenience methods
  // such as `setOpen(open: boolean, reason: string)`.
}
