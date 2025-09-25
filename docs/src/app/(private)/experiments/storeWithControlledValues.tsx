'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui-components/utils/useRefWithInit';
import { useStore } from '@base-ui-components/utils/store/useStore';
import { ControllableStore } from '@base-ui-components/utils/store';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';

export default function Playground() {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState(0);

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
          value={value}
        />
      </div>

      <h2 className="text-lg mb-4">Uncontrolled mode (open by default)</h2>
      <div className="flex gap-2 mb-16 items-baseline">
        <ControllableComponent
          defaultOpen={true}
          onOpenChange={(_, reason) => {
            console.log('reason', reason);
          }}
          value={value}
        />
      </div>

      <h2 className="text-lg mb-4">Uncontrolled mode (closed by default)</h2>
      <div className="flex gap-2 mb-16 items-baseline">
        <ControllableComponent
          defaultOpen={false}
          onOpenChange={(_, reason) => {
            console.log('reason', reason);
          }}
          value={value}
        />
      </div>

      <h2>Value updater</h2>
      <div className="flex gap-2 mb-16 items-baseline">
        <input
          type="number"
          value={value}
          onChange={(event) => setValue(event.target.valueAsNumber)}
        />
      </div>
    </div>
  );
}

interface Props {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, reason: string) => void;
  value?: number;
}

function ControllableComponent(props: Props) {
  const store = useRefWithInit(
    () => new ControllableStore<State>({ open: props.defaultOpen ?? false, value: 0 }),
  ).current;

  store.useControlledProp('open', props.open, props.defaultOpen ?? false);
  store.useProp('value', props.value ?? 0);

  const open = useStore(store, (state) => state.open);
  const value = useStore(store, (state) => state.value);

  const handleClick = useEventCallback(() => {
    store.set('open', !open);
    props.onOpenChange?.(!open, 'toggle-button');
  });

  return (
    <React.Fragment>
      <span>open: {open?.toString() ?? 'undefined'}</span>
      <ChildComponent store={store} />
      <button
        type="button"
        className="border-1 border-gray-300 px-4 py-1 rounded-sm"
        onClick={handleClick}
      >
        Toggle internally
      </button>
      <span>value: {value}</span>
    </React.Fragment>
  );
}

interface ChildProps {
  store: ControllableStore<State>;
}

function ChildComponent(props: ChildProps) {
  const open = useStore(props.store, (state) => state.open);
  return <span>child sees open: {open.toString()}</span>;
}

interface State {
  open: boolean;
  value: number;
}
