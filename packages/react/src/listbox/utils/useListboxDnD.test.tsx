import { afterEach, beforeEach, expect, vi } from 'vitest';
import * as React from 'react';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { ListboxStore } from '../store';
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
      clearTimeout(
        id as unknown as ReturnType<typeof setTimeout>,
      )) as typeof globalThis.cancelAnimationFrame;
  });

  afterEach(() => {
    dndMocks.draggableConfigs.clear();
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  const { render } = createRenderer();

  it('highlights the dragged item after a multi-drag drop', async () => {
    const store = new ListboxStore({
      id: 'test-listbox',
      selectionMode: 'multiple',
      isItemEqualToValue: Object.is,
      value: ['a', 'b'],
      orientation: 'vertical',
    });

    const valuesRef = { current: ['a', 'b', 'c', 'd'] } as React.RefObject<string[]>;

    store.context.valuesRef = valuesRef;
    store.context.groupIdsRef = { current: [] };
    store.context.pointerMoveSuppressedRef = { current: false };

    function TestComponent() {
      const listRef = React.useRef<HTMLDivElement | null>(null);
      const itemRef = React.useRef<HTMLDivElement | null>(null);
      const dragHandleRef = React.useRef<HTMLElement | null>(null);

      useListboxItemDnD({
        store,
        index: 1,
        itemValue: 'b',
        itemRef,
        dragHandleRef,
        dragEnabled: true,
        dropTargetEnabled: false,
        groupId: undefined,
      });

      React.useEffect(() => {
        store.set('listElement', listRef.current);
      }, []);

      return (
        <div ref={listRef}>
          <div role="option" aria-selected="false" tabIndex={-1}>
            c
          </div>
          <div role="option" aria-selected="false" tabIndex={-1}>
            d
          </div>
          <div role="option" aria-selected="false" tabIndex={-1}>
            a
          </div>
          <div ref={itemRef} role="option" aria-selected="true" tabIndex={-1}>
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
