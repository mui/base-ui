import * as React from 'react';
import { expect } from 'chai';
import { act, createRenderer, screen } from '@mui/internal-test-utils';
import { SinonSpy, spy } from 'sinon';
import { ReactStore } from './ReactStore';
import { useRefWithInit } from '../useRefWithInit';
import { createSelector } from './createSelector';

type TestState = { value: number; label: string };

function useStableStore<State extends object>(initial: State) {
  return useRefWithInit(() => new ReactStore<State>(initial)).current;
}

describe('ReactStore', () => {
  const { render } = createRenderer();

  it('syncs internal state from controlled prop', () => {
    let store!: ReactStore<TestState>;

    function Test({ controlled }: { controlled: number | undefined }) {
      store = useStableStore<TestState>({ value: 0, label: '' });
      store.useControlledProp('value', controlled);
      return null;
    }

    const { setProps } = render(<Test controlled={1} />);
    expect(store.state.value).to.equal(1);

    act(() => {
      store.update({ label: 'y' });
    });
    // Non-controlled keys still update
    expect(store.state.label).to.equal('y');

    // Changing the controlled prop updates internal state
    act(() => {
      setProps({ controlled: 7 });
    });
    expect(store.state.value).to.equal(7);
  });

  it('warns on switching from uncontrolled to controlled', () => {
    function Test({ controlled }: { controlled?: number }) {
      const store = useStableStore<TestState>({ value: 0, label: '' });
      store.useControlledProp('value', controlled);
      return null;
    }

    const { setProps } = render(<Test />);

    expect(() => {
      act(() => setProps({ controlled: 1 }));
    }).toErrorDev([
      'A component is changing the controlled state of value to be uncontrolled. Elements should not switch from uncontrolled to controlled (or vice versa).',
      'A component is changing the controlled state of value to be uncontrolled. Elements should not switch from uncontrolled to controlled (or vice versa).',
    ]);
  });

  it('warns on switching from controlled to uncontrolled', () => {
    function Test({ controlled }: { controlled?: number }) {
      const store = useStableStore<TestState>({ value: 0, label: '' });
      store.useControlledProp('value', controlled);
      return null;
    }

    const { setProps } = render(<Test controlled={1} />);

    expect(() => {
      act(() => setProps({ controlled: undefined }));
    }).toErrorDev([
      'A component is changing the uncontrolled state of value to be controlled. Elements should not switch from uncontrolled to controlled (or vice versa).',
      'A component is changing the uncontrolled state of value to be controlled. Elements should not switch from uncontrolled to controlled (or vice versa).',
    ]);
  });

  it('useProp updates a single key when the passed value changes', () => {
    let store!: ReactStore<TestState>;

    function Test({ value }: { value: number }) {
      store = useStableStore<TestState>({ value: 0, label: '' });
      store.useSyncedValue('value', value);
      return null;
    }

    const { setProps } = render(<Test value={1} />);
    expect(store.state.value).to.equal(1);

    act(() => setProps({ value: 2 }));
    expect(store.state.value).to.equal(2);
  });

  it('useProps applies multiple keys from a props object', () => {
    let store!: ReactStore<TestState>;

    function Test({ props }: { props: Partial<TestState> }) {
      store = useStableStore<TestState>({ value: 0, label: '' });
      store.useSyncedValues(props);
      return null;
    }

    const { setProps } = render(<Test props={{ value: 5, label: 'a' }} />);
    expect(store.state.value).to.equal(5);
    expect(store.state.label).to.equal('a');

    act(() => setProps({ props: { value: 6, label: 'b' } }));
    expect(store.state.value).to.equal(6);
    expect(store.state.label).to.equal('b');
  });

  it('useSyncedValues depends on entries instead of object identity', () => {
    let store!: ReactStore<TestState>;
    let updateSpy!: SinonSpy<[Partial<TestState>], void>;

    function Test({ props }: { props: Partial<TestState> }) {
      store = useStableStore<TestState>({ value: 0, label: '' });

      if (!updateSpy) {
        updateSpy = spy(store, 'update');
      }

      store.useSyncedValues(props);
      return null;
    }

    const { setProps } = render(<Test props={{ value: 5, label: 'a' }} />, { strict: false });

    expect(updateSpy.callCount).to.equal(1);

    act(() => {
      setProps({ props: { value: 5, label: 'a' } });
    });

    expect(updateSpy.callCount).to.equal(1);

    act(() => {
      setProps({ props: { value: 6, label: 'a' } });
    });

    expect(updateSpy.callCount).to.equal(2);
    expect(store.state.value).to.equal(6);
  });

  it('warns if useSyncedValues keys change between renders', () => {
    function Test({ props }: { props: Partial<TestState> }) {
      const store = useStableStore<TestState>({ value: 0, label: '' });
      store.useSyncedValues(props);
      return null;
    }

    const { setProps } = render(<Test props={{ value: 1 }} />);

    expect(() => {
      act(() => {
        setProps({ props: { label: 'x' } });
      });
    }).toErrorDev([
      'ReactStore.useSyncedValues expects the same prop keys on every render. Keys should be stable.',
      'ReactStore.useSyncedValues expects the same prop keys on every render. Keys should be stable.',
    ]);
  });

  it('useSyncedValueWithCleanup synchronizes value and resets on cleanup', () => {
    type CleanupState = { node: HTMLDivElement | undefined };
    let store!: ReactStore<CleanupState>;

    const firstNode = document.createElement('div');
    const secondNode = document.createElement('div');

    function Test({ node }: { node: HTMLDivElement | undefined }) {
      store = useStableStore<CleanupState>({ node: undefined });
      store.useSyncedValueWithCleanup('node', node);
      return null;
    }

    const { setProps, unmount } = render(<Test node={firstNode} />);
    expect(store.state.node).to.equal(firstNode);

    act(() => {
      setProps({ node: secondNode });
    });
    expect(store.state.node).to.equal(secondNode);

    act(() => {
      unmount();
    });
    expect(store.state.node).to.equal(undefined);
  });

  it('useStateSetter returns a stable callback that updates the store state', () => {
    type ElementState = { element: HTMLDivElement | null };
    let store!: ReactStore<ElementState>;
    let forceUpdate!: React.Dispatch<React.SetStateAction<number>>;
    let lastSetter!: (element: HTMLDivElement | null) => void;

    const element = document.createElement('div');

    function Test() {
      store = useStableStore<ElementState>({ element: null });
      const setter = store.useStateSetter('element');
      lastSetter = setter;
      const [, setTick] = React.useState(0);
      forceUpdate = setTick;

      React.useEffect(() => {
        setter(element);
      }, [setter]);

      return null;
    }

    render(<Test />);
    const firstSetter = lastSetter;
    expect(store.state.element).to.equal(element);

    act(() => {
      forceUpdate((value) => value + 1);
    });

    expect(lastSetter).to.equal(firstSetter);

    act(() => {
      lastSetter(null);
    });

    expect(store.state.element).to.equal(null);
  });

  it('supports nested stores as state values', async () => {
    type ParentState = { count: number };
    type ChildState = { count: number; parent?: ReactStore<ParentState> };

    const parentSelectors = { count: (state: ParentState) => state.count };
    const childSelectors = {
      count: (state: ChildState) => state.parent?.state.count ?? state.count,
      parent: (state: ChildState) => state.parent,
    };

    const localCountSelector = createSelector((state: ChildState) => state.count);

    const parentStore = new ReactStore<ParentState, Record<string, never>, typeof parentSelectors>(
      { count: 0 },
      undefined,
      parentSelectors,
    );

    const childStore = new ReactStore<ChildState, Record<string, never>, typeof childSelectors>(
      { count: 10 },
      undefined,
      childSelectors,
    );

    let unsubscribeParentHandler: () => void;
    const onParentUpdated = (
      newParent: ReactStore<ParentState> | undefined,
      _: ReactStore<ParentState> | undefined,
      store: ReactStore<ChildState, any, any>,
    ) => {
      if (!newParent) {
        unsubscribeParentHandler?.();
        return;
      }

      unsubscribeParentHandler = newParent.subscribe(() => {
        store.notifyAll();
      });
    };

    const onCountUpdated = (
      newCount: number,
      _: number,
      store: ReactStore<ChildState, any, any>,
    ) => {
      store.state.parent?.set('count', newCount);
    };

    childStore.observe('parent', onParentUpdated);
    childStore.observe(localCountSelector, onCountUpdated);

    function Test() {
      const count = childStore.useState('count');
      return <output data-testid="output">{count}</output>;
    }

    render(<Test />);
    const output = screen.getByTestId('output');

    await act(async () => {
      childStore.set('count', 5);
    });
    expect(childStore.state.count).to.equal(5);
    expect(output.textContent).to.equal('5');

    await act(async () => {
      childStore.set('parent', parentStore);
    });
    expect(childStore.state.count).to.equal(5);
    expect(childStore.select('count')).to.equal(0);
    expect(output.textContent).to.equal('0');

    await act(async () => {
      childStore.set('count', 20);
    });
    expect(childStore.state.count).to.equal(20);
    expect(parentStore.state.count).to.equal(20);
    expect(childStore.select('count')).to.equal(20);
    expect(output.textContent).to.equal('20');

    await act(async () => {
      parentStore.set('count', 15);
    });
    expect(parentStore.state.count).to.equal(15);
    expect(childStore.state.count).to.equal(20);
    expect(childStore.select('count')).to.equal(15);
    expect(output.textContent).to.equal('15');
  });
  describe('observeSelector', () => {
    type CounterState = { count: number; multiplier: number };
    const selectors = {
      count: (state: CounterState) => state.count,
      doubled: (state: CounterState) => state.count * 2,
      multiplied: (state: CounterState) => state.count * state.multiplier,
    };

    it('accepts selector functions', () => {
      const store = new ReactStore<CounterState>({ count: 0, multiplier: 1 });
      const calls: Array<{ newValue: boolean; oldValue: boolean }> = [];

      const unsubscribe = store.observe(
        (state) => state.count > 1,
        (newValue, oldValue) => {
          calls.push({ newValue, oldValue });
        },
      );

      expect(calls).to.have.lengthOf(1);
      expect(calls[0]).to.deep.equal({ newValue: false, oldValue: false });

      store.set('count', 2);
      expect(calls).to.have.lengthOf(2);
      expect(calls[1]).to.deep.equal({ newValue: true, oldValue: false });

      store.set('count', 1);
      expect(calls).to.have.lengthOf(3);
      expect(calls[2]).to.deep.equal({ newValue: false, oldValue: true });

      unsubscribe();

      store.set('count', 3);
      expect(calls).to.have.lengthOf(3);
    });

    it('calls listener immediately with current selector result on subscription', () => {
      const store = new ReactStore<CounterState, Record<string, never>, typeof selectors>(
        { count: 5, multiplier: 3 },
        undefined,
        selectors,
      );
      const calls: Array<{ newValue: number; oldValue: number }> = [];

      store.observe('doubled', (newValue: number, oldValue: number) => {
        calls.push({ newValue, oldValue });
      });

      expect(calls).to.have.lengthOf(1);
      expect(calls[0]).to.deep.equal({ newValue: 10, oldValue: 10 });
    });

    it('calls listener when selector result changes', () => {
      const store = new ReactStore<CounterState, Record<string, never>, typeof selectors>(
        { count: 5, multiplier: 3 },
        undefined,
        selectors,
      );
      const calls: Array<{ newValue: number; oldValue: number }> = [];

      store.observe('doubled', (newValue: number, oldValue: number) => {
        calls.push({ newValue, oldValue });
      });

      store.set('count', 10);
      store.set('count', 7);

      expect(calls).to.have.lengthOf(3);
      expect(calls[1]).to.deep.equal({ newValue: 20, oldValue: 10 });
      expect(calls[2]).to.deep.equal({ newValue: 14, oldValue: 20 });
    });

    it('does not call listener when selector result is unchanged', () => {
      const store = new ReactStore<CounterState, Record<string, never>, typeof selectors>(
        { count: 5, multiplier: 3 },
        undefined,
        selectors,
      );
      const calls: Array<{ newValue: number; oldValue: number }> = [];

      store.observe('doubled', (newValue: number, oldValue: number) => {
        calls.push({ newValue, oldValue });
      });

      store.set('multiplier', 5);

      expect(calls).to.have.lengthOf(1); // Only initial call
    });

    it('calls listener when any dependency of the selector changes', () => {
      const store = new ReactStore<CounterState, Record<string, never>, typeof selectors>(
        { count: 5, multiplier: 3 },
        undefined,
        selectors,
      );
      const calls: Array<{ newValue: number; oldValue: number }> = [];

      store.observe('multiplied', (newValue: number, oldValue: number) => {
        calls.push({ newValue, oldValue });
      });

      store.set('count', 10);
      store.set('multiplier', 2);

      expect(calls).to.have.lengthOf(3);
      expect(calls[0]).to.deep.equal({ newValue: 15, oldValue: 15 });
      expect(calls[1]).to.deep.equal({ newValue: 30, oldValue: 15 });
      expect(calls[2]).to.deep.equal({ newValue: 20, oldValue: 30 });
    });

    it('provides the store instance to the listener', () => {
      const store = new ReactStore<CounterState, Record<string, never>, typeof selectors>(
        { count: 5, multiplier: 3 },
        undefined,
        selectors,
      );
      let receivedStore!: ReactStore<CounterState, Record<string, never>, typeof selectors>;

      store.observe('doubled', (_: number, __: number, storeArg) => {
        receivedStore = storeArg;
      });

      expect(receivedStore).to.equal(store);
    });

    it('returns an unsubscribe function that stops observing', () => {
      const store = new ReactStore<CounterState, Record<string, never>, typeof selectors>(
        { count: 5, multiplier: 3 },
        undefined,
        selectors,
      );
      const calls: Array<{ newValue: number; oldValue: number }> = [];

      const unsubscribe = store.observe('doubled', (newValue: number, oldValue: number) => {
        calls.push({ newValue, oldValue });
      });

      store.set('count', 10);
      expect(calls).to.have.lengthOf(2);

      unsubscribe();

      store.set('count', 15);
      expect(calls).to.have.lengthOf(2); // No new calls after unsubscribe
    });

    it('supports multiple observers on the same selector', () => {
      const store = new ReactStore<CounterState, Record<string, never>, typeof selectors>(
        { count: 5, multiplier: 3 },
        undefined,
        selectors,
      );
      const calls1: number[] = [];
      const calls2: number[] = [];

      store.observe('doubled', (newValue: number) => {
        calls1.push(newValue);
      });

      store.observe('doubled', (newValue: number) => {
        calls2.push(newValue);
      });

      store.set('count', 10);

      expect(calls1).to.deep.equal([10, 20]);
      expect(calls2).to.deep.equal([10, 20]);
    });

    it('supports observers on different selectors', () => {
      const store = new ReactStore<CounterState, Record<string, never>, typeof selectors>(
        { count: 5, multiplier: 3 },
        undefined,
        selectors,
      );
      const doubledCalls: number[] = [];
      const multipliedCalls: number[] = [];

      store.observe('doubled', (newValue: number) => {
        doubledCalls.push(newValue);
      });

      store.observe('multiplied', (newValue: number) => {
        multipliedCalls.push(newValue);
      });

      store.set('count', 10);
      store.set('multiplier', 2);

      expect(doubledCalls).to.deep.equal([10, 20]);
      expect(multipliedCalls).to.deep.equal([15, 30, 20]);
    });
  });
});
