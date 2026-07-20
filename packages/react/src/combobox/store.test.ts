import { Store } from '@base-ui/utils/store';
import { expect, vi } from 'vitest';
import { setVirtualizationRenderAllRows, type VirtualizationState } from './store';

describe('Combobox store', () => {
  it('increments the restore version after each completed render-all pass', () => {
    const store = new Store<{ virtualizationState: VirtualizationState }>({
      virtualizationState: {
        renderAllRows: false,
        renderAllRowsRestoreVersion: 0,
      },
    });
    const listener = vi.fn();
    store.subscribe(listener);

    setVirtualizationRenderAllRows(store, false);
    expect(store.state.virtualizationState).toEqual({
      renderAllRows: false,
      renderAllRowsRestoreVersion: 0,
    });

    setVirtualizationRenderAllRows(store, true);
    expect(store.state.virtualizationState).toEqual({
      renderAllRows: true,
      renderAllRowsRestoreVersion: 0,
    });

    setVirtualizationRenderAllRows(store, true);
    setVirtualizationRenderAllRows(store, false);
    expect(store.state.virtualizationState).toEqual({
      renderAllRows: false,
      renderAllRowsRestoreVersion: 1,
    });

    setVirtualizationRenderAllRows(store, false);
    setVirtualizationRenderAllRows(store, true);
    setVirtualizationRenderAllRows(store, false);
    expect(store.state.virtualizationState).toEqual({
      renderAllRows: false,
      renderAllRowsRestoreVersion: 2,
    });
    expect(listener).toHaveBeenCalledTimes(4);
  });
});
