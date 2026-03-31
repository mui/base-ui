import { afterEach, beforeEach, expect, vi } from 'vitest';
import * as React from 'react';
import { act, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { Listbox } from '@base-ui/react/listbox';

const dndMocks = vi.hoisted(() => ({
  draggableConfigs: new Map<HTMLElement, any>(),
  dropTargetConfigs: new Map<HTMLElement, any>(),
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
  dropTargetForElements(config: any) {
    dndMocks.dropTargetConfigs.set(config.element, config);
    return () => {
      dndMocks.dropTargetConfigs.delete(config.element);
    };
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

function reorder(
  prev: string[],
  event: { items: string[]; referenceItem: string; edge: 'before' | 'after' },
) {
  const movedValues = new Set(event.items);
  const movedItems = prev.filter((item) => movedValues.has(item));
  const rest = prev.filter((item) => !movedValues.has(item));
  const refIndex = rest.indexOf(event.referenceItem);
  rest.splice(event.edge === 'after' ? refIndex + 1 : refIndex, 0, ...movedItems);
  return rest;
}

describe('<Listbox.DragAndDropProvider />', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
    dndMocks.draggableConfigs.clear();
    dndMocks.dropTargetConfigs.clear();
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
    dndMocks.dropTargetConfigs.clear();
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  const { render } = createRenderer();

  it('highlights the dragged item after a multi-drag drop', async () => {
    function TestComponent() {
      const [items, setItems] = React.useState(['a', 'b', 'c', 'd']);

      return (
        <Listbox.Root selectionMode="multiple" defaultValue={['a', 'b']}>
          <Listbox.DragAndDropProvider
            onItemsReorder={(event) => {
              setItems((prev) => reorder(prev, event));
            }}
          >
            <Listbox.List>
              {items.map((item) => (
                <Listbox.Item key={item} value={item} draggable>
                  {item}
                </Listbox.Item>
              ))}
            </Listbox.List>
          </Listbox.DragAndDropProvider>
        </Listbox.Root>
      );
    }

    await render(<TestComponent />);
    await flushMicrotasks();

    const itemB = screen.getByRole('option', { name: 'b' });
    const itemD = screen.getByRole('option', { name: 'd' });
    const draggableConfig = dndMocks.draggableConfigs.get(itemB);
    const dropTargetConfig = dndMocks.dropTargetConfigs.get(itemD);
    const sourceData = draggableConfig.getInitialData();

    await act(async () => {
      dropTargetConfig.onDrop({
        source: { data: sourceData },
        self: { data: { edge: 'bottom' } },
      });
    });
    await flushMicrotasks();

    await act(async () => {
      draggableConfig.onDrop({ source: { data: sourceData } });
    });

    await waitFor(() => {
      expect(screen.getAllByRole('option').map((el) => el.textContent)).toEqual([
        'c',
        'd',
        'a',
        'b',
      ]);
      expect(screen.getByRole('option', { name: 'b' })).toBe(document.activeElement);
    });
  });
});
