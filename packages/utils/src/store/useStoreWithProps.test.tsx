import * as React from 'react';
import { expect } from 'chai';
import { act, createRenderer } from '@mui/internal-test-utils';
import { Store, ControllableStore } from './Store';
import { useStoreWithProps, useStoreWithControlledProps } from './useStoreWithProps';
import { useStore } from './useStore';

interface TestState {
  open: boolean;
  value: string;
  disabled: boolean;
  count: number;
}

describe('useStoreWithProps', () => {
  const { render } = createRenderer();

  it('should update store state with props', () => {
    const store = new Store<TestState>({ open: false, value: '', disabled: false, count: 0 });
    let storeState: TestState | undefined;

    function TestComponent({ disabled, count }: { disabled: boolean; count: number }) {
      useStoreWithProps(store, { disabled, count });
      storeState = useStore(store, (state) => state);
      return null;
    }

    render(<TestComponent disabled={true} count={5} />);
    expect(storeState!.disabled).to.equal(true);
    expect(storeState!.count).to.equal(5);
    expect(storeState!.open).to.equal(false); // unchanged
    expect(storeState!.value).to.equal(''); // unchanged
  });

  it('should update store state when props change', () => {
    const store = new Store<TestState>({ open: false, value: '', disabled: false, count: 0 });
    let storeState: TestState | undefined;

    function TestComponent({ disabled, count }: { disabled: boolean; count: number }) {
      useStoreWithProps(store, { disabled, count });
      storeState = useStore(store, (state) => state);
      return null;
    }

    const result = render(<TestComponent disabled={false} count={1} />);
    expect(storeState!.disabled).to.equal(false);
    expect(storeState!.count).to.equal(1);

    act(() => {
      result.setProps({ disabled: true, count: 10 });
    });

    expect(storeState!.disabled).to.equal(true);
    expect(storeState!.count).to.equal(10);
  });
});

describe('useStoreWithControlledProps', () => {
  const { render } = createRenderer();

  it('should handle controlled props correctly', () => {
    const store = new ControllableStore<TestState>({ open: false, value: '', disabled: false, count: 0 });
    let storeState: TestState | undefined;

    function TestComponent({ 
      open, 
      value, 
      disabled 
    }: { 
      open: boolean; 
      value: string; 
      disabled: boolean; 
    }) {
      useStoreWithControlledProps(
        store, 
        { open, value, disabled },
        {
          open: { defaultValue: false, name: 'TestComponent', state: 'open' },
          value: { defaultValue: '', name: 'TestComponent', state: 'value' },
        }
      );
      storeState = useStore(store, (state) => state);
      return null;
    }

    render(<TestComponent open={true} value="controlled" disabled={false} />);
    
    // Controlled props should be set from props
    expect(storeState!.open).to.equal(true);
    expect(storeState!.value).to.equal('controlled');
    expect(storeState!.disabled).to.equal(false);
    
    // Store should have createSetter method
    expect(typeof store.createSetter).to.equal('function');
    expect(typeof store.createSetter('open')).to.equal('function');
    expect(typeof store.createSetter('value')).to.equal('function');
  });

  it('should handle uncontrolled props correctly', () => {
    const store = new ControllableStore<TestState>({ open: false, value: '', disabled: false, count: 0 });
    let storeState: TestState | undefined;

    function TestComponent({ 
      disabled 
    }: { 
      disabled: boolean; 
    }) {
      useStoreWithControlledProps(
        store, 
        { disabled },
        {
          open: { defaultValue: true, name: 'TestComponent', state: 'open' },
          value: { defaultValue: 'default', name: 'TestComponent', state: 'value' },
        }
      );
      storeState = useStore(store, (state) => state);
      return null;
    }

    render(<TestComponent disabled={false} />);
    
    // Uncontrolled props should use defaults
    expect(storeState!.open).to.equal(true);
    expect(storeState!.value).to.equal('default');
    expect(storeState!.disabled).to.equal(false); // regular prop
    
    // Store should have createSetter method
    expect(typeof store.createSetter).to.equal('function');
    expect(typeof store.createSetter('open')).to.equal('function');
    expect(typeof store.createSetter('value')).to.equal('function');
  });

  it('should allow uncontrolled props to be updated via store methods', () => {
    const store = new ControllableStore<TestState>({ open: false, value: '', disabled: false, count: 0 });
    let storeState: TestState | undefined;

    function TestComponent() {
      useStoreWithControlledProps(
        store, 
        {},
        {
          open: { defaultValue: false, name: 'TestComponent', state: 'open' },
          value: { defaultValue: 'initial', name: 'TestComponent', state: 'value' },
        }
      );
      storeState = useStore(store, (state) => state);
      return null;
    }

    render(<TestComponent />);
    
    expect(storeState!.open).to.equal(false);
    expect(storeState!.value).to.equal('initial');
    
    const setOpen = store.createSetter('open');
    const setValue = store.createSetter('value');
    
    act(() => {
      setOpen(true);
    });
    
    expect(storeState!.open).to.equal(true);
    
    act(() => {
      setValue('updated');
    });
    
    expect(storeState!.value).to.equal('updated');
  });

  it('should warn when switching from uncontrolled to controlled', () => {
    const store = new ControllableStore<TestState>({ open: false, value: '', disabled: false, count: 0 });

    function TestComponent({ open }: { open?: boolean }) {
      useStoreWithControlledProps(
        store, 
        { open },
        {
          open: { defaultValue: false, name: 'TestComponent', state: 'open' },
        }
      );
      return null;
    }

    let result: any;
    expect(() => {
      result = render(<TestComponent />);
    }).not.toErrorDev();

    expect(() => {
      result.setProps({ open: true });
    }).toErrorDev(
      'Base UI: A component is changing the uncontrolled open state of TestComponent to be controlled.',
    );
  });

  it('should warn when switching from controlled to uncontrolled', () => {
    const store = new ControllableStore<TestState>({ open: false, value: '', disabled: false, count: 0 });

    function TestComponent({ open }: { open?: boolean }) {
      useStoreWithControlledProps(
        store, 
        { open },
        {
          open: { defaultValue: false, name: 'TestComponent', state: 'open' },
        }
      );
      return null;
    }

    let result: any;
    expect(() => {
      result = render(<TestComponent open={true} />);
    }).not.toErrorDev();

    expect(() => {
      result.setProps({ open: undefined });
    }).toErrorDev(
      'Base UI: A component is changing the controlled open state of TestComponent to be uncontrolled.',
    );
  });

  it('should handle mixed controlled and uncontrolled props', () => {
    const store = new ControllableStore<TestState>({ open: false, value: '', disabled: false, count: 0 });
    let storeState: TestState | undefined;

    function TestComponent({ 
      open, 
      disabled 
    }: { 
      open: boolean; 
      disabled: boolean; 
    }) {
      useStoreWithControlledProps(
        store, 
        { open, disabled },
        {
          open: { defaultValue: false, name: 'TestComponent', state: 'open' },
          value: { defaultValue: 'default', name: 'TestComponent', state: 'value' },
        }
      );
      storeState = useStore(store, (state) => state);
      return null;
    }

    render(<TestComponent open={true} disabled={false} />);
    
    // Controlled prop
    expect(storeState!.open).to.equal(true);
    
    // Uncontrolled prop with default
    expect(storeState!.value).to.equal('default');
    expect(typeof store.createSetter('value')).to.equal('function');
    
    // Regular prop (not in controlledConfig)
    expect(storeState!.disabled).to.equal(false);
  });

  it('should call onChange callbacks for controlled props', () => {
    const store = new ControllableStore<TestState>({ open: false, value: '', disabled: false, count: 0 });
    let onOpenChangeCalled = false;
    let onValueChangeCalled = false;

    const onOpenChange = (value: boolean) => {
      onOpenChangeCalled = true;
      expect(value).to.equal(true);
    };

    const onValueChange = (value: string) => {
      onValueChangeCalled = true;
      expect(value).to.equal('test');
    };

    function TestComponent() {
      useStoreWithControlledProps(
        store,
        { open: true, value: 'initial' }, // Controlled props
        {
          open: { defaultValue: false, onChange: onOpenChange, name: 'TestComponent', state: 'open' },
          value: { defaultValue: '', onChange: onValueChange, name: 'TestComponent', state: 'value' },
        }
      );
      return null;
    }

    render(<TestComponent />);

    // Call the setter methods - they should trigger callbacks for controlled props
    const setOpen = store.createSetter('open');
    const setValue = store.createSetter('value');

    act(() => {
      setOpen(true);
    });

    act(() => {
      setValue('test');
    });

    expect(onOpenChangeCalled).to.equal(true);
    expect(onValueChangeCalled).to.equal(true);
  });

  it('should prevent store.set() calls on controlled properties', () => {
    const store = new ControllableStore<TestState>({ open: false, value: '', disabled: false, count: 0 });
    let storeState: TestState | undefined;

    function TestComponent() {
      useStoreWithControlledProps(
        store,
        { open: true }, // Controlled prop
        {
          open: { defaultValue: false, name: 'TestComponent', state: 'open' },
          value: { defaultValue: 'default', name: 'TestComponent', state: 'value' }, // Uncontrolled
        }
      );
      storeState = useStore(store, (state) => state);
      return null;
    }

    render(<TestComponent />);

    // Try to set controlled property directly - should be ignored
    act(() => {
      store.set('open', false);
    });

    // Controlled prop should remain unchanged
    expect(storeState!.open).to.equal(true);

    // Try to set uncontrolled property directly - should work
    act(() => {
      store.set('value', 'changed');
    });

    // Uncontrolled prop should be updated
    expect(storeState!.value).to.equal('changed');
  });

  it('should support shared store between multiple components', () => {
    const sharedStore = new ControllableStore<TestState>({ open: false, value: '', disabled: false, count: 0 });
    let storeStateA: TestState | undefined;
    let storeStateB: TestState | undefined;

    function ComponentA({ open }: { open: boolean }) {
      useStoreWithControlledProps(
        sharedStore, 
        { open },
        {
          open: { defaultValue: false, name: 'ComponentA', state: 'open' },
        }
      );
      storeStateA = useStore(sharedStore, (state) => state);
      return null;
    }

    function ComponentB({ disabled }: { disabled: boolean }) {
      useStoreWithControlledProps(
        sharedStore, 
        { disabled },
        {
          value: { defaultValue: 'shared', name: 'ComponentB', state: 'value' },
        }
      );
      storeStateB = useStore(sharedStore, (state) => state);
      return null;
    }

    function App() {
      return (
        <React.Fragment>
          <ComponentA open={true} />
          <ComponentB disabled={false} />
        </React.Fragment>
      );
    }

    render(<App />);
    
    // Both components should see the shared state
    expect(storeStateA!.open).to.equal(true);
    expect(storeStateA!.value).to.equal('shared');
    expect(storeStateA!.disabled).to.equal(false);
    
    expect(storeStateB!.open).to.equal(true);
    expect(storeStateB!.value).to.equal('shared');
    expect(storeStateB!.disabled).to.equal(false);

    // Changes from one component should affect the other
    const setValue = sharedStore.createSetter('value');
    act(() => {
      setValue('updated');
    });

    expect(storeStateA!.value).to.equal('updated');
    expect(storeStateB!.value).to.equal('updated');
  });
});