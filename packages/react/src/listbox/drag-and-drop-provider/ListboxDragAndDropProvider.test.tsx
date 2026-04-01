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
    const handleCanDrop = vi.fn(() => true);

    function TestComponent() {
      const [items, setItems] = React.useState(['a', 'b', 'c', 'd']);

      return (
        <Listbox.Root selectionMode="multiple" defaultValue={['a', 'b']}>
          <Listbox.DragAndDropProvider
            canDrop={handleCanDrop}
            onItemsReorder={(event) => {
              setItems((prev) => reorder(prev, event));
            }}
          >
            <Listbox.List>
              {items.map((item) => (
                <Listbox.Item key={item} value={item}>
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

    expect(handleCanDrop).toHaveBeenCalledWith(
      [
        { value: 'a', index: 0, groupId: undefined, disabled: false },
        { value: 'b', index: 1, groupId: undefined, disabled: false },
      ],
      { value: 'd', index: 3, groupId: undefined, disabled: false },
      'after',
    );

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

  it('uses the default canDrag behavior to block disabled items from dragging', async () => {
    await render(
      <Listbox.Root>
        <Listbox.DragAndDropProvider onItemsReorder={vi.fn()}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b" disabled>
              b
            </Listbox.Item>
          </Listbox.List>
        </Listbox.DragAndDropProvider>
      </Listbox.Root>,
    );

    await flushMicrotasks();

    expect(dndMocks.draggableConfigs.has(screen.getByRole('option', { name: 'a' }))).toBe(true);
    expect(dndMocks.draggableConfigs.has(screen.getByRole('option', { name: 'b' }))).toBe(false);
  });

  it('allows overriding canDrag for a disabled item', async () => {
    await render(
      <Listbox.Root>
        <Listbox.DragAndDropProvider
          canDrag={(item) => item.value === 'b'}
          onItemsReorder={vi.fn()}
        >
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b" disabled>
              b
            </Listbox.Item>
          </Listbox.List>
        </Listbox.DragAndDropProvider>
      </Listbox.Root>,
    );

    await flushMicrotasks();

    expect(dndMocks.draggableConfigs.has(screen.getByRole('option', { name: 'a' }))).toBe(false);
    expect(dndMocks.draggableConfigs.has(screen.getByRole('option', { name: 'b' }))).toBe(true);
  });

  it('blocks all pointer drag-and-drop when the listbox is disabled', async () => {
    await render(
      <Listbox.Root disabled>
        <Listbox.DragAndDropProvider
          canDrag={() => true}
          canDrop={() => true}
          onItemsReorder={vi.fn()}
        >
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.DragAndDropProvider>
      </Listbox.Root>,
    );

    await flushMicrotasks();

    expect(dndMocks.draggableConfigs.size).toBe(0);
    expect(dndMocks.dropTargetConfigs.size).toBe(0);
  });

  it('blocks pointer reordering when canDrop returns false', async () => {
    const handleItemsReorder = vi.fn();
    const handleCanDrop = vi.fn(() => false);

    await render(
      <Listbox.Root>
        <Listbox.DragAndDropProvider canDrop={handleCanDrop} onItemsReorder={handleItemsReorder}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.DragAndDropProvider>
      </Listbox.Root>,
    );

    await flushMicrotasks();

    const itemB = screen.getByRole('option', { name: 'b' });
    const itemC = screen.getByRole('option', { name: 'c' });
    const draggableConfig = dndMocks.draggableConfigs.get(itemB);
    const dropTargetConfig = dndMocks.dropTargetConfigs.get(itemC);
    const sourceData = draggableConfig.getInitialData();

    await act(async () => {
      dropTargetConfig.onDrop({
        source: { data: sourceData },
        self: { data: { edge: 'bottom' } },
      });
    });

    expect(handleCanDrop).toHaveBeenCalledWith(
      [{ value: 'b', index: 1, groupId: undefined, disabled: false }],
      { value: 'c', index: 2, groupId: undefined, disabled: false },
      'after',
    );
    expect(handleItemsReorder).not.toHaveBeenCalled();
  });
});
