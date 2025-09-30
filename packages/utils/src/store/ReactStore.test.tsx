import * as React from 'react';
import { expect } from 'chai';
import { act, createRenderer } from '@mui/internal-test-utils';
import { ReactStore } from './ReactStore';
import { useRefWithInit } from '../useRefWithInit';

type TestState = { value: number; label: string };

function useStableStore<State>(initial: State) {
  return useRefWithInit(() => new ReactStore<State>(initial)).current;
}

describe('ReactStore', () => {
  const { render } = createRenderer();

  it('initializes uncontrolled key with default value', () => {
    let store!: ReactStore<TestState>;

    function Test() {
      store = useStableStore<TestState>({ value: 0, label: '' });
      store.useControlledProp('value', undefined, 5);
      return null;
    }

    render(<Test />);
    expect(store.state.value).to.equal(5);
  });

  it('syncs internal state from controlled prop and ignores manual mutations for that key', () => {
    let store!: ReactStore<TestState>;

    function Test({ controlled }: { controlled: number | undefined }) {
      store = useStableStore<TestState>({ value: 0, label: '' });
      store.useControlledProp('value', controlled, 1);
      return null;
    }

    const { setProps } = render(<Test controlled={1} />);
    expect(store.state.value).to.equal(1);

    // Attempts to change a controlled key are ignored
    act(() => {
      store.set('value', 2);
    });
    expect(store.state.value).to.equal(1);

    act(() => {
      store.apply({ value: 3, label: 'y' });
    });
    expect(store.state.value).to.equal(1);
    // Non-controlled keys still update
    expect(store.state.label).to.equal('y');

    act(() => {
      store.update({ value: 4, label: 'x' });
    });
    expect(store.state.value).to.equal(1);
    // Non-controlled keys still update
    expect(store.state.label).to.equal('x');

    // Changing the controlled prop updates internal state
    act(() => {
      setProps({ controlled: 7 });
    });
    expect(store.state.value).to.equal(7);
  });

  it('allows set/apply/update on uncontrolled keys', () => {
    let store!: ReactStore<TestState>;

    function Test() {
      store = useStableStore<TestState>({ value: 0, label: '' });
      store.useControlledProp('value', undefined, 1);
      return null;
    }

    render(<Test />);
    expect(store.state.value).to.equal(1);

    act(() => {
      store.set('value', 2);
    });
    expect(store.state.value).to.equal(2);

    act(() => {
      store.apply({ value: 3 });
    });
    expect(store.state.value).to.equal(3);

    act(() => {
      store.update({ value: 4, label: 'updated' });
    });
    expect(store.state.value).to.equal(4);
    expect(store.state.label).to.equal('updated');
  });

  it('warns on switching from uncontrolled to controlled', () => {
    function Test({ controlled }: { controlled?: number }) {
      const store = useStableStore<TestState>({ value: 0, label: '' });
      store.useControlledProp('value', controlled, undefined as any);
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
      store.useControlledProp('value', controlled, undefined as any);
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

  it('getElementSetter returns a stable callback that updates the store state', () => {
    type ElementState = { element: HTMLDivElement | null };
    let store!: ReactStore<ElementState>;
    let forceUpdate!: React.Dispatch<React.SetStateAction<number>>;
    let lastSetter!: (element: HTMLDivElement | null) => void;

    const element = document.createElement('div');

    function Test() {
      store = useStableStore<ElementState>({ element: null });
      const setter = store.getElementSetter('element');
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
});
