import { Store } from '@base-ui/utils/store';
import { expect, vi } from 'vitest';
import { setVirtualizationRenderAllRows, type VirtualizationState } from './store';

describe('Combobox store', () => {
  it('publishes a render-all pass only when the flag changes', () => {
    const store = new Store<{ virtualizationState: VirtualizationState }>({
      virtualizationState: { renderAllRows: false },
    });
    const listener = vi.fn();
    store.subscribe(listener);

    setVirtualizationRenderAllRows(store, false);
    expect(store.state.virtualizationState).toEqual({ renderAllRows: false });
    expect(listener).toHaveBeenCalledTimes(0);

    setVirtualizationRenderAllRows(store, true);
    expect(store.state.virtualizationState).toEqual({ renderAllRows: true });
    expect(listener).toHaveBeenCalledTimes(1);

    // A repeated request is not a new pass: the virtualizer restores on the transition back to
    // windowed, so a redundant notification here would arm a restore that never had a suspension.
    setVirtualizationRenderAllRows(store, true);
    expect(listener).toHaveBeenCalledTimes(1);

    setVirtualizationRenderAllRows(store, false);
    expect(store.state.virtualizationState).toEqual({ renderAllRows: false });
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
