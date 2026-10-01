import { expect, vi, describe, it } from 'vitest';
import { Store } from './Store';

type State = { value: number; label: string };

describe('Store', () => {
  describe('Store.create', () => {
    it('returns a Store instance seeded with the given state', () => {
      const store = Store.create({ value: 1, label: 'a' });

      expect(store).toBeInstanceOf(Store);
      expect(store.state).toEqual({ value: 1, label: 'a' });
    });

    it('produces an independent instance per call', () => {
      const first = Store.create({ value: 0 });
      const second = Store.create({ value: 0 });

      first.set('value', 1);

      expect(first.state.value).toBe(1);
      expect(second.state.value).toBe(0);
    });

    it('constructs an instance of the subclass it is called on', () => {
      class SubStore extends Store<{ count: number }> {
        increment() {
          this.set('count', this.state.count + 1);
        }
      }

      const store = SubStore.create({ count: 1 });

      expect(store).toBeInstanceOf(SubStore);
      store.increment();
      expect(store.state.count).toBe(2);
    });
  });

  it('notifies subscribers with the new state', () => {
    const store = new Store<State>({ value: 0, label: 'a' });
    const listener = vi.fn();
    store.subscribe(listener);

    store.setState({ value: 1, label: 'a' });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ value: 1, label: 'a' });
    expect(store.state.value).toBe(1);
  });

  it('does not notify when setState receives the current state reference', () => {
    const store = new Store<State>({ value: 0, label: 'a' });
    const listener = vi.fn();
    store.subscribe(listener);

    store.setState(store.state);

    expect(listener).not.toHaveBeenCalled();
  });

  it('unsubscribing stops notifications', () => {
    const store = new Store<State>({ value: 0, label: 'a' });
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    unsubscribe();
    store.set('value', 1);

    expect(listener).not.toHaveBeenCalled();
  });

  it('set() writes a single key and skips same-value writes', () => {
    const store = new Store<State>({ value: 0, label: 'a' });
    const listener = vi.fn();
    store.subscribe(listener);

    store.set('value', 1);
    expect(store.state).toEqual({ value: 1, label: 'a' });
    expect(listener).toHaveBeenCalledTimes(1);

    store.set('value', 1);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('update() merges changed keys and skips no-op updates', () => {
    const store = new Store<State>({ value: 0, label: 'a' });
    const listener = vi.fn();
    store.subscribe(listener);

    store.update({ value: 2, label: 'b' });
    expect(store.state).toEqual({ value: 2, label: 'b' });
    expect(listener).toHaveBeenCalledTimes(1);

    store.update({ value: 2, label: 'b' });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('notifyAll() renews the state reference and notifies', () => {
    const store = new Store<State>({ value: 0, label: 'a' });
    const listener = vi.fn();
    store.subscribe(listener);
    const previous = store.state;

    store.notifyAll();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.state).not.toBe(previous);
    expect(store.state).toEqual(previous);
  });

  it('a nested setState from a listener stops the outer notification pass', () => {
    const store = new Store<State>({ value: 0, label: 'a' });

    const first = vi.fn((state: State) => {
      if (state.value === 1) {
        store.set('value', 2);
      }
    });
    const second = vi.fn();
    store.subscribe(first);
    store.subscribe(second);

    store.set('value', 1);

    // The nested set() notified every listener with the final state; the outer
    // pass detected it and did not deliver the stale state to `second`.
    expect(store.state.value).toBe(2);
    expect(first).toHaveBeenCalledTimes(2);
    expect(second).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledWith({ value: 2, label: 'a' });
  });
});
