import { Store } from '@base-ui/utils/store';
import { expect, vi } from 'vitest';
import { setVirtualizationRenderAllRows } from './store';

describe('Combobox store', () => {
  it('publishes a render-all pass only when the flag changes', () => {
    const store = new Store<{ renderAllRows: boolean }>({ renderAllRows: false });
    const listener = vi.fn();
    store.subscribe(listener);

    setVirtualizationRenderAllRows(store, false);
    expect(store.state.renderAllRows).toBe(false);
    expect(listener).toHaveBeenCalledTimes(0);

    setVirtualizationRenderAllRows(store, true);
    expect(store.state.renderAllRows).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);

    // A repeated request is not a new pass: the virtualizer restores its viewport on the
    // transition back to windowed, so a redundant notification would arm a restore for a
    // suspension that never happened.
    setVirtualizationRenderAllRows(store, true);
    expect(listener).toHaveBeenCalledTimes(1);

    setVirtualizationRenderAllRows(store, false);
    expect(store.state.renderAllRows).toBe(false);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
