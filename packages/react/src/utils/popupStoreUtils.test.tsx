import * as React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Store } from '@base-ui-components/utils/store';
import { useTriggerRegistration, PopupTriggerMap } from './popupStoreUtils';

type TestStoreState = {
  triggers: PopupTriggerMap;
};

function createStore() {
  return new Store<TestStoreState>({
    triggers: new Map(),
  });
}

function TestTrigger({
  id,
  store,
  element,
  repeat = 1,
}: {
  id: string;
  store: Store<TestStoreState>;
  element: HTMLElement;
  repeat?: number;
}) {
  const register = useTriggerRegistration(id, store);

  React.useLayoutEffect(() => {
    for (let i = 0; i < repeat; i += 1) {
      register(element);
    }
    return () => {
      register(null);
    };
  }, [register, repeat, element]);

  return null;
}

describe('useTriggerRegistration', () => {
  it('does not update the store when the same element is provided repeatedly', () => {
    const store = createStore();
    const spy = vi.spyOn(store, 'set');
    const element = document.createElement('button');

    const { unmount } = render(
      <TestTrigger id="trigger" store={store} element={element} repeat={3} />,
    );

    expect(store.state.triggers.get('trigger')).to.equal(element);
    expect(spy).toHaveBeenCalledTimes(1); // only first call

    unmount();
    expect(spy).toHaveBeenCalledTimes(2); // unregister
    expect(store.state.triggers.size).to.equal(0);
  });

  it('updates the store when the trigger id changes', () => {
    const store = createStore();
    const spy = vi.spyOn(store, 'set');
    const element = document.createElement('button');

    const { rerender, unmount } = render(
      <TestTrigger id="first" store={store} element={element} />,
    );

    expect(store.state.triggers.has('first')).to.equal(true);
    expect(store.state.triggers.get('first')).to.equal(element);
    expect(spy).toHaveBeenCalledTimes(1);

    rerender(<TestTrigger id="second" store={store} element={element} />);

    expect(store.state.triggers.has('first')).to.equal(false);
    expect(store.state.triggers.get('second')).to.equal(element);
    expect(spy).toHaveBeenCalledTimes(2);

    unmount();
    expect(spy).toHaveBeenCalledTimes(3);
    expect(store.state.triggers.size).to.equal(0);
  });
});
