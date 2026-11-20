import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent } from '@mui/internal-test-utils';
import { describeTree } from '../../../test/describeTree';
import type { TreeItemId } from '../store/types';

/**
 * All tests related to keyboard navigation (e.g.: expanding using "Enter" and "ArrowRight")
 * are located in the `TreeRoot.keyboard.test.tsx` file.
 */
describeTree('TreeRoot - Expansion', ({ render }) => {
  describe('model props (expandedItems, defaultExpandedItems, onExpandedItemsChange)', () => {
    it('should not expand items when no default state and no control state are defined', async () => {
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }, { id: '2' }],
      });

      expect(view.isItemExpanded('1')).toBe(false);
      expect(view.getAllTreeItemIds()).toEqual(['1', '2']);
    });

    it('should use the default state when defined', async () => {
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }, { id: '2' }],
        defaultExpandedItems: ['1'],
      });

      expect(view.isItemExpanded('1')).toBe(true);
      expect(view.getAllTreeItemIds()).toEqual(['1', '1.1', '2']);
    });

    it('should use the controlled state when defined', async () => {
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }, { id: '2' }],
        expandedItems: ['1'],
      });

      expect(view.isItemExpanded('1')).toBe(true);
    });

    it('should use the controlled state instead of the default state when both are defined', async () => {
      const view = await render({
        items: [
          { id: '1', children: [{ id: '1.1' }] },
          { id: '2', children: [{ id: '2.1' }] },
        ],
        expandedItems: ['1'],
        defaultExpandedItems: ['2'],
      });

      expect(view.isItemExpanded('1')).toBe(true);
      expect(view.isItemExpanded('2')).toBe(false);
    });

    it('should react to controlled state update', async () => {
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }],
        expandedItems: [],
      });

      await view.setProps({ expandedItems: ['1'] });
      expect(view.isItemExpanded('1')).toBe(true);
    });

    it('should call onExpandedItemsChange when expanding an item (add to empty list)', async () => {
      const onExpandedItemsChange = vi.fn();

      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }],
        expandOnClick: true,
        onExpandedItemsChange,
      });

      fireEvent.click(view.getItemRoot('1'));

      expect(onExpandedItemsChange.mock.calls.length).toBe(1);
      expect(onExpandedItemsChange.mock.calls.at(-1)![0]).toEqual(['1']);
      expect(onExpandedItemsChange.mock.calls.at(-1)![1]).toHaveProperty('reason', 'item-press');
    });

    it('should call onExpandedItemsChange when expanding an item (add to non-empty list)', async () => {
      const onExpandedItemsChange = vi.fn();

      const view = await render({
        items: [
          { id: '1', children: [{ id: '1.1' }] },
          { id: '2', children: [{ id: '2.1' }] },
        ],
        expandOnClick: true,
        onExpandedItemsChange,
        defaultExpandedItems: ['1'],
      });

      fireEvent.click(view.getItemRoot('2'));

      expect(onExpandedItemsChange.mock.calls.length).toBe(1);
      expect(onExpandedItemsChange.mock.calls.at(-1)![0]).toEqual(['2', '1']);
      expect(onExpandedItemsChange.mock.calls.at(-1)![1]).toHaveProperty('reason', 'item-press');
    });

    it('should call onExpandedItemsChange when collapsing an item', async () => {
      const onExpandedItemsChange = vi.fn();

      const view = await render({
        items: [
          { id: '1', children: [{ id: '1.1' }] },
          { id: '2', children: [{ id: '2.1' }] },
        ],
        expandOnClick: true,
        onExpandedItemsChange,
        defaultExpandedItems: ['1'],
      });

      fireEvent.click(view.getItemRoot('1'));

      expect(onExpandedItemsChange.mock.calls.length).toBe(1);
      expect(onExpandedItemsChange.mock.calls.at(-1)![0]).toEqual([]);
      expect(onExpandedItemsChange.mock.calls.at(-1)![1]).toHaveProperty('reason', 'item-press');
    });

    it('should not expand when onExpandedItemsChange cancels the event', async () => {
      const onExpandedItemsChange = vi.fn((_expandedItems: string[], eventDetails: any) => {
        eventDetails.cancel();
      });

      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }],
        expandOnClick: true,
        onExpandedItemsChange,
      });

      fireEvent.click(view.getItemRoot('1'));

      expect(onExpandedItemsChange.mock.calls.length).toBe(1);
      expect(view.isItemExpanded('1')).toBe(false);
    });

    it('should pass reason "imperative-action" when using setItemExpansion', async () => {
      const onExpandedItemsChange = vi.fn();

      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }],
        onExpandedItemsChange,
      });

      act(() => {
        view.actionsRef.current!.setItemExpansion('1', true);
      });

      expect(onExpandedItemsChange.mock.calls.length).toBe(1);
      expect(onExpandedItemsChange.mock.calls.at(-1)![1]).toHaveProperty(
        'reason',
        'imperative-action',
      );
    });
  });

  // A controlled component must not mutate its own state; only the parent's
  // prop should drive it. These tests interact under a STATIC controlled
  // `expandedItems={[]}` prop (with handlers that never feed the change back):
  // the intent is reported via the callbacks, but the item stays collapsed
  // because `TreeExpansionPlugin` only writes `expandedItems` when the prop is
  // uncontrolled (`state.expandedItemsProp === undefined`), matching the
  // Calendar/DateField `valueProp` pattern.
  describe('controlled mode', () => {
    it('should report the intended toggle when clicking the expansion trigger while controlled', async () => {
      const onExpandedItemsChange = vi.fn();
      const onItemExpansionToggle = vi.fn();

      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }, { id: '2' }],
        expandedItems: [],
        onExpandedItemsChange,
        onItemExpansionToggle,
      });

      expect(view.isItemExpanded('1')).toBe(false);

      fireEvent.click(view.getItemExpansionTrigger('1')!);

      expect(onExpandedItemsChange.mock.calls.length).toBe(1);
      expect(onExpandedItemsChange.mock.calls.at(-1)![0]).toEqual(['1']);
      expect(onExpandedItemsChange.mock.calls.at(-1)![1]).toHaveProperty('reason', 'trigger-press');
      expect(onItemExpansionToggle.mock.calls.length).toBe(1);
      expect(onItemExpansionToggle.mock.calls.at(-1)![0]).toEqual({
        itemId: '1',
        expanded: true,
      });
      expect(onItemExpansionToggle.mock.calls.at(-1)![1]).toHaveProperty('reason', 'trigger-press');
    });

    it('should report the intended toggle when clicking the item (expandOnClick) while controlled', async () => {
      const onExpandedItemsChange = vi.fn();
      const onItemExpansionToggle = vi.fn();

      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }, { id: '2' }],
        expandedItems: [],
        expandOnClick: true,
        onExpandedItemsChange,
        onItemExpansionToggle,
      });

      expect(view.isItemExpanded('1')).toBe(false);

      fireEvent.click(view.getItemRoot('1'));

      expect(onExpandedItemsChange.mock.calls.length).toBe(1);
      expect(onExpandedItemsChange.mock.calls.at(-1)![0]).toEqual(['1']);
      expect(onItemExpansionToggle.mock.calls.length).toBe(1);
    });

    it('should not expand when clicking the expansion trigger while controlled', async () => {
      const onExpandedItemsChange = vi.fn();

      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }, { id: '2' }],
        expandedItems: [],
        onExpandedItemsChange,
      });

      expect(view.isItemExpanded('1')).toBe(false);

      fireEvent.click(view.getItemExpansionTrigger('1')!);

      // The parent never updated the prop, so it should stay collapsed.
      expect(view.isItemExpanded('1')).toBe(false);
      expect(view.getAllTreeItemIds()).toEqual(['1', '2']);
    });

    it('should not expand when clicking the item (expandOnClick) while controlled', async () => {
      const onExpandedItemsChange = vi.fn();

      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }, { id: '2' }],
        expandedItems: [],
        expandOnClick: true,
        onExpandedItemsChange,
      });

      expect(view.isItemExpanded('1')).toBe(false);

      fireEvent.click(view.getItemRoot('1'));

      expect(view.isItemExpanded('1')).toBe(false);
      expect(view.getAllTreeItemIds()).toEqual(['1', '2']);
    });
  });

  describe('onItemExpansionToggle prop', () => {
    it('should call onItemExpansionToggle when expanding an item', async () => {
      const onItemExpansionToggle = vi.fn();

      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }],
        expandOnClick: true,
        onItemExpansionToggle,
      });

      fireEvent.click(view.getItemRoot('1'));
      expect(onItemExpansionToggle.mock.calls.length).toBe(1);
      expect(onItemExpansionToggle.mock.calls.at(-1)![0]).toEqual({
        itemId: '1',
        expanded: true,
      });
      expect(onItemExpansionToggle.mock.calls.at(-1)![1]).toHaveProperty('reason', 'item-press');
      expect(onItemExpansionToggle.mock.calls.at(-1)![1]).toHaveProperty('event');
    });

    it('should call onItemExpansionToggle when collapsing an item', async () => {
      const onItemExpansionToggle = vi.fn();

      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }],
        defaultExpandedItems: ['1'],
        expandOnClick: true,
        onItemExpansionToggle,
      });

      fireEvent.click(view.getItemRoot('1'));
      expect(onItemExpansionToggle.mock.calls.length).toBe(1);
      expect(onItemExpansionToggle.mock.calls.at(-1)![0]).toEqual({
        itemId: '1',
        expanded: false,
      });
      expect(onItemExpansionToggle.mock.calls.at(-1)![1]).toHaveProperty('reason', 'item-press');
    });

    it('should not call onItemExpansionToggle when the expansion is canceled', async () => {
      const onItemExpansionToggle = vi.fn();

      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }],
        onItemExpansionToggle,
        onExpandedItemsChange: (_expandedItems: string[], eventDetails: any) => {
          eventDetails.cancel();
        },
      });

      fireEvent.click(view.getItemRoot('1'));
      expect(onItemExpansionToggle.mock.calls.length).toBe(0);
    });

    it('should call onItemExpansionToggle when using the setItemExpansion imperative API', async () => {
      const onItemExpansionToggle = vi.fn();

      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }],
        onItemExpansionToggle,
      });

      act(() => {
        view.actionsRef.current!.setItemExpansion('1', true);
      });

      expect(onItemExpansionToggle.mock.calls.length).toBe(1);
      expect(onItemExpansionToggle.mock.calls.at(-1)![0]).toEqual({
        itemId: '1',
        expanded: true,
      });
      expect(onItemExpansionToggle.mock.calls.at(-1)![1]).toHaveProperty(
        'reason',
        'imperative-action',
      );
    });

    it('should not call onItemExpansionToggle when expanding an already expanded item via API', async () => {
      const onItemExpansionToggle = vi.fn();

      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }],
        defaultExpandedItems: ['1'],
        onItemExpansionToggle,
      });

      act(() => {
        view.actionsRef.current!.setItemExpansion('1', true);
      });

      expect(onItemExpansionToggle.mock.calls.length).toBe(0);
    });
  });

  describe('item click interaction', () => {
    it('should expand collapsed item when clicking on an item', async () => {
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }, { id: '2' }],
        expandOnClick: true,
      });

      expect(view.isItemExpanded('1')).toBe(false);
      fireEvent.click(view.getItemRoot('1'));
      expect(view.isItemExpanded('1')).toBe(true);
    });

    it('should collapse expanded item when clicking on an item', async () => {
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }, { id: '2' }],
        expandOnClick: true,
        defaultExpandedItems: ['1'],
      });

      expect(view.isItemExpanded('1')).toBe(true);
      fireEvent.click(view.getItemRoot('1'));
      expect(view.isItemExpanded('1')).toBe(false);
    });

    it('should not expand collapsed item when clicking on a disabled item', async () => {
      const onExpandedItemsChange = vi.fn();
      const view = await render({
        items: [{ id: '1', disabled: true, children: [{ id: '1.1' }] }, { id: '2' }],
        expandOnClick: true,
        onExpandedItemsChange,
      });

      expect(view.isItemExpanded('1')).toBe(false);
      fireEvent.click(view.getItemRoot('1'));
      expect(view.isItemExpanded('1')).toBe(false);
      expect(onExpandedItemsChange).not.toHaveBeenCalled();
    });

    it('should not collapse expanded item when clicking on a disabled item', async () => {
      const onExpandedItemsChange = vi.fn();
      const view = await render({
        items: [{ id: '1', disabled: true, children: [{ id: '1.1' }] }, { id: '2' }],
        defaultExpandedItems: ['1'],
        expandOnClick: true,
        onExpandedItemsChange,
      });

      expect(view.isItemExpanded('1')).toBe(true);
      fireEvent.click(view.getItemRoot('1'));
      expect(view.isItemExpanded('1')).toBe(true);
      expect(onExpandedItemsChange).not.toHaveBeenCalled();
    });

    it('should toggle expansion once when double-clicking a label', async () => {
      const onExpandedItemsChange = vi.fn();
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }, { id: '2' }],
        expandOnClick: true,
        onExpandedItemsChange,
      });

      const label = view.getItemText('1')!;
      fireEvent.click(label, { detail: 1 });
      fireEvent.click(label, { detail: 2 });
      fireEvent.doubleClick(label, { detail: 2 });

      expect(view.isItemExpanded('1')).toBe(true);
      expect(onExpandedItemsChange).toHaveBeenCalledTimes(1);
    });

    it('should expand collapsed item when clicking on an item label', async () => {
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }, { id: '2' }],
        expandOnClick: true,
      });

      expect(view.isItemExpanded('1')).toBe(false);
      fireEvent.click(view.getItemText('1')!);
      expect(view.isItemExpanded('1')).toBe(true);
    });
  });

  describe('aria-expanded item attribute', () => {
    it('should have the attribute `aria-expanded=false` if collapsed', async () => {
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }],
      });

      expect(view.getItemRoot('1')).toHaveAttribute('aria-expanded', 'false');
    });

    it('should have the attribute `aria-expanded=true` if expanded', async () => {
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }],
        defaultExpandedItems: ['1'],
      });

      expect(view.getItemRoot('1')).toHaveAttribute('aria-expanded', 'true');
    });

    it('should not have the attribute `aria-expanded` if no children are present', async () => {
      const view = await render({
        items: [{ id: '1' }],
      });

      expect(view.getItemRoot('1')).not.toHaveAttribute('aria-expanded');
    });

    it('should not mark an expanded item that has no children as expanded', async () => {
      const view = await render({
        items: [{ id: '1' }],
        defaultExpandedItems: ['1'],
      });

      expect(view.getItemRoot('1')).not.toHaveAttribute('aria-expanded');
      expect(view.getItemRoot('1')).not.toHaveAttribute('data-expanded');
    });
  });

  describe('Tree.ItemExpansionTrigger', () => {
    it('should not render the expansion trigger for items without children', async () => {
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }, { id: '2' }],
      });

      expect(view.getItemExpansionTrigger('1')).not.toBe(null);
      expect(view.getItemExpansionTrigger('2')).toBe(null);
    });

    it('should expand a collapsed item when clicking the expansion trigger', async () => {
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }],
      });

      expect(view.isItemExpanded('1')).toBe(false);
      fireEvent.click(view.getItemExpansionTrigger('1')!);
      expect(view.isItemExpanded('1')).toBe(true);
    });

    it('should collapse an expanded item when clicking the expansion trigger', async () => {
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }],
        defaultExpandedItems: ['1'],
      });

      expect(view.isItemExpanded('1')).toBe(true);
      fireEvent.click(view.getItemExpansionTrigger('1')!);
      expect(view.isItemExpanded('1')).toBe(false);
    });

    it('should not toggle a disabled item when clicking its expansion trigger', async () => {
      const onExpandedItemsChange = vi.fn();
      const view = await render({
        items: [{ id: '1', disabled: true, children: [{ id: '1.1' }] }],
        onExpandedItemsChange,
      });

      fireEvent.click(view.getItemExpansionTrigger('1')!);
      expect(view.isItemExpanded('1')).toBe(false);
      expect(onExpandedItemsChange).not.toHaveBeenCalled();
    });

    it('should not select the item when clicking the expansion trigger', async () => {
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }],
      });

      fireEvent.click(view.getItemExpansionTrigger('1')!);
      expect(view.isItemSelected('1')).toBe(false);
    });

    it('should not double-toggle expansion when expandOnClick is true and clicking the expansion trigger', async () => {
      const onExpandedItemsChange = vi.fn();
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }],
        expandOnClick: true,
        onExpandedItemsChange,
      });

      expect(view.isItemExpanded('1')).toBe(false);
      fireEvent.click(view.getItemExpansionTrigger('1')!);
      // The item should be expanded (not toggled twice back to collapsed)
      expect(view.isItemExpanded('1')).toBe(true);
      // onExpandedItemsChange should only be called once
      expect(onExpandedItemsChange.mock.calls.length).toBe(1);
    });
  });

  describe('collapseAll API method', () => {
    it('reports only the items still in the tree as toggled', async () => {
      const onItemExpansionToggle = vi.fn();
      const view = await render({
        items: [
          { id: '1', children: [{ id: '1.1' }] },
          { id: '2', children: [{ id: '2.1' }] },
        ],
        defaultExpandedItems: ['1', '2'],
        onItemExpansionToggle,
      });

      await view.setItems([{ id: '1', children: [{ id: '1.1' }] }]);
      act(() => view.actionsRef.current!.collapseAll());

      expect(onItemExpansionToggle.mock.calls.map(([value]) => value)).toEqual([
        { itemId: '1', expanded: false },
      ]);
    });
  });

  it('should keep its expansion when onExpandedItemsChange mutates the array it receives', async () => {
    const view = await render({
      items: [{ id: '1', children: [{ id: '1.1' }] }],
      onExpandedItemsChange: (expandedItems: TreeItemId[]) => {
        expandedItems.pop();
      },
    });

    fireEvent.click(view.getItemExpansionTrigger('1')!);
    expect(view.isItemExpanded('1')).toBe(true);
  });

  describe('setItemExpansion API method', () => {
    it('should keep the expansion of an item added later without reporting it', async () => {
      const onExpandedItemsChange = vi.fn();
      const onItemExpansionToggle = vi.fn();
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }],
        onExpandedItemsChange,
        onItemExpansionToggle,
      });

      act(() => {
        view.actionsRef.current!.setItemExpansion('2', true);
      });
      expect(onExpandedItemsChange).not.toHaveBeenCalled();
      expect(onItemExpansionToggle).not.toHaveBeenCalled();

      await act(async () => {
        await view.actionsRef.current!.applyTransaction((transaction) =>
          transaction.add({ id: '2', label: '2', children: [{ id: '2.1', label: '2.1' }] }),
        );
      });
      expect(view.isItemExpanded('2')).toBe(true);
    });

    it('should expand a collapsed item', async () => {
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }],
      });

      act(() => {
        view.actionsRef.current!.setItemExpansion('1', true);
      });

      expect(view.isItemExpanded('1')).toBe(true);
    });

    it('should collapse an expanded item', async () => {
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }],
        defaultExpandedItems: ['1'],
      });

      act(() => {
        view.actionsRef.current!.setItemExpansion('1', false);
      });

      expect(view.isItemExpanded('1')).toBe(false);
    });

    it('should do nothing when expanding an already expanded item', async () => {
      const onExpandedItemsChange = vi.fn();

      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }],
        defaultExpandedItems: ['1'],
        onExpandedItemsChange,
      });

      act(() => {
        view.actionsRef.current!.setItemExpansion('1', true);
      });

      expect(view.isItemExpanded('1')).toBe(true);
      expect(onExpandedItemsChange.mock.calls.length).toBe(0);
    });

    it('should do nothing when collapsing an already collapsed item', async () => {
      const onExpandedItemsChange = vi.fn();

      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }],
        onExpandedItemsChange,
      });

      act(() => {
        view.actionsRef.current!.setItemExpansion('1', false);
      });

      expect(view.isItemExpanded('1')).toBe(false);
      expect(onExpandedItemsChange.mock.calls.length).toBe(0);
    });
  });

  describe('numeric ids', () => {
    it('should support defaultExpandedItems with numeric ids', async () => {
      const view = await render({
        items: [{ id: 1, children: [{ id: 11 }] }, { id: 2 }],
        defaultExpandedItems: [1],
      });

      expect(view.isItemExpanded(1)).toBe(true);
      expect(view.getAllTreeItemIds()).toEqual(['1', '11', '2']);
    });

    it('should support controlled expandedItems with numeric ids', async () => {
      const view = await render({
        items: [{ id: 1, children: [{ id: 11 }] }, { id: 2 }],
        expandedItems: [1],
      });

      expect(view.isItemExpanded(1)).toBe(true);
    });

    it('should call onExpandedItemsChange with numeric ids on click', async () => {
      const onExpandedItemsChange = vi.fn();

      const view = await render({
        items: [{ id: 1, children: [{ id: 11 }] }, { id: 2 }],
        expandOnClick: true,
        onExpandedItemsChange,
      });

      fireEvent.click(view.getItemRoot(1));

      expect(onExpandedItemsChange.mock.calls.length).toBe(1);
      expect(onExpandedItemsChange.mock.calls.at(-1)![0]).toEqual([1]);
    });

    it('should support setItemExpansion with numeric ids', async () => {
      const view = await render({
        items: [{ id: 1, children: [{ id: 11 }] }],
      });

      expect(view.isItemExpanded(1)).toBe(false);
      act(() => {
        view.actionsRef.current!.setItemExpansion(1, true);
      });
      expect(view.isItemExpanded(1)).toBe(true);
    });

    it('should handle rapid expand and collapse of the same item', async () => {
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }, { id: '2' }],
      });

      // Rapidly toggle expansion
      act(() => {
        view.actionsRef.current!.setItemExpansion('1', true);
      });
      act(() => {
        view.actionsRef.current!.setItemExpansion('1', false);
      });
      act(() => {
        view.actionsRef.current!.setItemExpansion('1', true);
      });

      expect(view.isItemExpanded('1')).toBe(true);
      expect(view.getAllTreeItemIds()).toEqual(['1', '1.1', '2']);
    });

    it('should support expandAll with numeric ids', async () => {
      const onExpandedItemsChange = vi.fn();

      const view = await render({
        items: [{ id: 1, children: [{ id: 11 }] }, { id: 2, children: [{ id: 21 }] }, { id: 3 }],
        onExpandedItemsChange,
      });

      act(() => {
        void view.actionsRef.current!.expandAll();
      });

      expect(onExpandedItemsChange.mock.calls.at(-1)![0]).toEqual([1, 2]);
    });
  });
});
