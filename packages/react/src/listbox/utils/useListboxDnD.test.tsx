import { afterEach, beforeEach, expect, vi } from 'vitest';
import * as React from 'react';
import { Store } from '@base-ui/utils/store';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import type { State as ListboxStoreState } from '../store';
import { useListboxItemDnD } from './useListboxDnD';

const dndMocks = vi.hoisted(() => ({
  draggableConfigs: new Map<HTMLElement, any>(),
}));

let originalRequestAnimationFrame: typeof globalThis.requestAnimationFrame;
let originalCancelAnimationFrame: typeof globalThis.cancelAnimationFrame;

vi.mock('@atlaskit/pragmatic-drag-and-drop/element/adapter', () => ({
  draggable(config: any) {
    dndMocks.draggableConfigs.set(config.element, config);
    return () => {
      dndMocks.draggableConfigs.delete(config.element);
    };
  },
  dropTargetForElements() {
    return () => {};
  },
}));

vi.mock('@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge', () => ({
  attachClosestEdge(data: any) {
    return data;
  },
  extractClosestEdge(data: any) {
    return data.edge ?? null;
  },
}));

describe('useListboxDnD', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
    dndMocks.draggableConfigs.clear();
    originalRequestAnimationFrame = globalThis.requestAnimationFrame;
    originalCancelAnimationFrame = globalThis.cancelAnimationFrame;
    globalThis.requestAnimationFrame = ((callback: FrameRequestCallback) =>
      setTimeout(() => callback(performance.now()), 0)) as typeof globalThis.requestAnimationFrame;
    globalThis.cancelAnimationFrame = ((id: number) =>
      clearTimeout(id as unknown as ReturnType<typeof setTimeout>)) as typeof globalThis.cancelAnimationFrame;
  });

  afterEach(() => {
    dndMocks.draggableConfigs.clear();
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  const { render } = createRenderer();

  it('highlights the dragged item after a multi-drag drop', async () => {
    const store = new Store<ListboxStoreState>({
      id: 'test-listbox',
      labelId: undefined,
      selectionMode: 'multiple',
      itemToStringLabel: undefined,
      itemToStringValue: undefined,
      isItemEqualToValue: Object.is,
      value: ['a', 'b'],
      activeIndex: null,
      selectedIndex: null,
      listElement: null,
      dragActiveIndices: null,
      dropTargetIndex: null,
      loading: false,
      orientation: 'vertical',
      disabled: false,
    });

    const valuesRef = { current: ['a', 'b', 'c', 'd'] } as React.RefObject<string[]>;

    function TestComponent() {
      const listRef = React.useRef<HTMLDivElement | null>(null);
      const itemRef = React.useRef<HTMLDivElement | null>(null);
      const dragHandleRef = React.useRef<HTMLElement | null>(null);
      const pointerMoveSuppressedRef = React.useRef(false);
      const groupIdsRef = React.useRef<Array<string | undefined>>([]);

      useListboxItemDnD({
        store,
        index: 1,
        itemValue: 'b',
        itemRef,
        dragHandleRef,
        dragEnabled: true,
        dropTargetEnabled: false,
        valuesRef,
        pointerMoveSuppressedRef,
        groupId: undefined,
        groupIdsRef,
        onItemsReorder: undefined,
      });

      React.useEffect(() => {
        store.set('listElement', listRef.current);
      }, []);

      return (
        <div ref={listRef}>
          <div role="option" tabIndex={-1}>
            c
          </div>
          <div role="option" tabIndex={-1}>
            d
          </div>
          <div role="option" tabIndex={-1}>
            a
          </div>
          <div ref={itemRef} role="option" tabIndex={-1}>
            b
          </div>
        </div>
      );
    }

    await render(<TestComponent />);

    const itemB = screen.getByRole('option', { name: 'b' });
    const draggableConfig = dndMocks.draggableConfigs.get(itemB);
    const sourceData = draggableConfig.getInitialData();

    valuesRef.current = ['c', 'd', 'a', 'b'];

    await act(async () => {
      draggableConfig.onDrop({ source: { data: sourceData } });
    });

    await waitFor(() => {
      expect(store.state.activeIndex).toBe(3);
      expect(document.activeElement).toBe(itemB);
    });
  });
});
