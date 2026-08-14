import { expect, vi } from 'vitest';
import { clickHighlightedItem, getIndexAfterChipRemoval } from './parts';
import type { ComboboxStore } from '../store';

describe('Combobox part utilities', () => {
  it('returns no index after removing the only chip', () => {
    expect(getIndexAfterChipRemoval(0, 1)).toBe(undefined);
  });

  it('does nothing when the highlighted item is not rendered', () => {
    const nativeEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    const store = {
      state: {
        listRef: { current: [] },
        selectionEventRef: { current: null },
      },
    } as unknown as ComboboxStore;

    clickHighlightedItem(store, 1, nativeEvent);

    expect(store.state.selectionEventRef.current).toBe(null);
  });

  it('clicks the rendered highlighted item with the originating event', () => {
    const click = vi.fn();
    const nativeEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    let selectionEventAtClick: Event | null = null;
    const store = {
      state: {
        listRef: { current: [{ click }] },
        selectionEventRef: { current: null },
      },
    } as unknown as ComboboxStore;
    click.mockImplementation(() => {
      selectionEventAtClick = store.state.selectionEventRef.current;
    });

    clickHighlightedItem(store, 0, nativeEvent);

    expect(click).toHaveBeenCalledOnce();
    expect(selectionEventAtClick).toBe(nativeEvent);
    expect(store.state.selectionEventRef.current).toBe(null);
  });
});
