import { expect, vi, describe, it } from 'vitest';
import * as React from 'react';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Listbox } from '@base-ui/react/listbox';
import { act, flushMicrotasks, screen } from '@mui/internal-test-utils';
import { createRenderer, firePointer, isJSDOM } from '#test-utils';

// dnd-kit measures the items to find the drop target, so these tests need a browser.
describe.skipIf(isJSDOM)('<Listbox.Root /> composed with dnd-kit', () => {
  const { render } = createRenderer();

  function SortableItem({ id }: { id: string }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    // The item keeps its own role and tab stop.
    const { role, tabIndex, ...sortableAttributes } = attributes;

    return (
      <Listbox.Item
        ref={setNodeRef}
        value={id}
        {...sortableAttributes}
        {...listeners}
        style={{ height: 20, transform: CSS.Transform.toString(transform), transition }}
      >
        {id}
      </Listbox.Item>
    );
  }

  function SortableList(props: { onValueChange?: (value: string[]) => void }) {
    const [items, setItems] = React.useState(['a', 'b', 'c', 'd']);
    const sensors = useSensors(
      // A small distance keeps a plain click selecting the item.
      useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    );

    function move(id: string, toIndex: number) {
      setItems((previous) => arrayMove(previous, previous.indexOf(id), toIndex));
    }

    function handleDragEnd({ active, over }: DragEndEvent) {
      if (over && active.id !== over.id) {
        move(String(active.id), items.indexOf(String(over.id)));
      }
    }

    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <Listbox.Root multiple onValueChange={props.onValueChange}>
          <Listbox.List
            onKeyDown={(event) => {
              // Alt+Arrow moves the focused item.
              const step = { ArrowDown: 1, ArrowUp: -1 }[event.key];
              if (!event.altKey || step === undefined) {
                return;
              }
              event.preventDefault();
              event.preventBaseUIHandler();
              const id = (event.target as HTMLElement).textContent ?? '';
              const toIndex = items.indexOf(id) + step;
              if (toIndex >= 0 && toIndex < items.length) {
                move(id, toIndex);
              }
            }}
          >
            <SortableContext items={items}>
              {items.map((id) => (
                <SortableItem key={id} id={id} />
              ))}
            </SortableContext>
          </Listbox.List>
        </Listbox.Root>
      </DndContext>
    );
  }

  function getOrder() {
    return screen.getAllByRole('option').map((option) => option.textContent);
  }

  it('reorders items with a pointer drag and keeps the selection', async () => {
    const handleValueChange = vi.fn();
    const { user } = await render(<SortableList onValueChange={handleValueChange} />);

    const itemA = screen.getByRole('option', { name: 'a' });
    await user.click(itemA);
    expect(handleValueChange).toHaveBeenLastCalledWith(['a'], expect.anything());

    const rect = itemA.getBoundingClientRect();
    const x = rect.left + 5;
    let timeStamp = 1;
    firePointer.down(itemA, {
      timeStamp,
      clientX: x,
      clientY: rect.top + 5,
      button: 0,
      isPrimary: true,
    });
    for (const offset of [10, 30, 50, 65]) {
      timeStamp += 1;
      firePointer.move(document.body, {
        timeStamp,
        clientX: x,
        clientY: rect.top + 5 + offset,
        isPrimary: true,
      });
      // dnd-kit updates the drop target as the pointer moves.
      // eslint-disable-next-line no-await-in-loop
      await flushMicrotasks();
    }
    timeStamp += 1;
    firePointer.up(document.body, {
      timeStamp,
      clientX: x,
      clientY: rect.top + 70,
      isPrimary: true,
    });
    await flushMicrotasks();

    expect(getOrder()).toEqual(['b', 'c', 'd', 'a']);
    expect(handleValueChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('option', { name: 'a' })).toHaveAttribute('aria-selected', 'true');
  });

  it('keeps focus and the highlight on an item moved with the keyboard', async () => {
    const { user } = await render(<SortableList />);
    const itemA = screen.getByRole('option', { name: 'a' });

    await act(async () => itemA.focus());
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}');

    expect(getOrder()).toEqual(['b', 'a', 'c', 'd']);
    expect(itemA).toHaveFocus();
    expect(itemA).toHaveAttribute('data-highlighted');
    expect(screen.getByRole('option', { name: 'b' })).not.toHaveAttribute('data-highlighted');

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: 'c' })).toHaveFocus();
  });
});
