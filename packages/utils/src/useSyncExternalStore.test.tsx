import { expect, describe, it, vi, beforeAll, afterAll } from 'vitest';
import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';
import { act, createRenderer } from '@mui/internal-test-utils';
import { useSyncExternalStoreWithSelector as useSyncExternalStoreWithSelectorShim } from 'use-sync-external-store/shim/with-selector';
import { useSyncExternalStore, useSyncExternalStoreWithSelector } from './useSyncExternalStore';

type Module = typeof import('./useSyncExternalStore');

function createStore<T>(initial: T) {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setState: (next: T) => {
      state = next;
      listeners.forEach((listener) => listener());
    },
  };
}

describe('useSyncExternalStore', () => {
  it('uses the React hooks', () => {
    expect(useSyncExternalStore).toBe(React.useSyncExternalStore);
    expect(useSyncExternalStoreWithSelector).toBe(useSyncExternalStoreWithSelectorShim);
  });
});

describe('useSyncExternalStoreWithSelector with Preact', () => {
  const { render } = createRenderer();
  let withSelector: Module['useSyncExternalStoreWithSelector'];

  beforeAll(async () => {
    vi.resetModules();
    vi.doMock('./safeReact', () => ({
      SafeReact: { ...React, useInsertionEffect: React.useLayoutEffect },
    }));
    ({ useSyncExternalStoreWithSelector: withSelector } = await import('./useSyncExternalStore'));
  });

  afterAll(() => {
    vi.doUnmock('./safeReact');
    vi.resetModules();
  });

  it('does not use the shim', () => {
    expect(withSelector).not.toBe(useSyncExternalStoreWithSelectorShim);
  });

  it('selects from the store and rerenders on change', async () => {
    const store = createStore({ count: 1, other: 'a' });
    const selectCount = (state: { count: number }) => ({ count: state.count });
    const selections: Array<{ count: number }> = [];

    function Test() {
      const selection = withSelector(
        store.subscribe,
        store.getSnapshot,
        store.getSnapshot,
        selectCount,
      );
      selections.push(selection);
      return <span>{selection.count}</span>;
    }

    const { container, setProps } = await render(<Test />);
    expect(container.textContent).toBe('1');

    const renders = selections.length;
    await setProps({});
    expect(selections.length).toBeGreaterThan(renders);
    expect(selections.at(-1)).toBe(selections[renders - 1]);

    await act(async () => store.setState({ count: 2, other: 'a' }));
    expect(container.textContent).toBe('2');
  });

  it('renders on the server', () => {
    const store = createStore({ count: 3 });
    function Test() {
      const count = withSelector(
        store.subscribe,
        store.getSnapshot,
        () => ({ count: 4 }),
        (s) => s.count,
      );
      return <span>{count}</span>;
    }
    expect(ReactDOMServer.renderToString(<Test />)).toBe('<span>4</span>');
  });
});
