import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent } from '@mui/internal-test-utils';
import { describeTree } from '../../../test/describeTree';
import { TREE_SELECTION_ALL } from '../store/types';

/**
 * All tests related to keyboard navigation (e.g.: selection using "Space")
 * are located in the `TreeRoot.keyboard.test.tsx` file.
 */
describeTree('TreeRoot - Selection', ({ render }) => {
  describe('model props (selectedItems, defaultSelectedItems, onSelectedItemsChange)', () => {
    it('should start and reverse a controlled keyboard range from an empty selection', async () => {
      const onSelectedItemsChange = vi.fn();
      const view = await render({
        items: [{ id: '1' }, { id: '2' }, { id: '3' }],
        selectionMode: 'multiple',
        selectedItems: [],
        onSelectedItemsChange,
      });
      act(() => view.getItemRoot('1').focus());
      fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowDown', shiftKey: true });
      expect(onSelectedItemsChange.mock.lastCall?.[0]).toEqual(['2']);
      await view.setProps({ selectedItems: ['2'] });
      fireEvent.keyDown(view.getItemRoot('2'), { key: 'ArrowDown', shiftKey: true });
      expect(onSelectedItemsChange.mock.lastCall?.[0]).toEqual(['2', '3']);
      await view.setProps({ selectedItems: ['2', '3'] });
      fireEvent.keyDown(view.getItemRoot('3'), { key: 'ArrowUp', shiftKey: true });
      expect(onSelectedItemsChange.mock.lastCall?.[0]).toEqual(['2']);
      await view.setProps({ selectedItems: ['2'] });
      fireEvent.keyDown(view.getItemRoot('2'), { key: 'ArrowUp', shiftKey: true });
      expect(onSelectedItemsChange.mock.lastCall?.[0]).toEqual([]);
    });

    it('should not select items when no default state and no control state are defined', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
      });

      expect(view.isItemSelected('1')).toBe(false);
    });

    it('should use the default state when defined', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
        defaultSelectedItems: ['1'],
      });

      expect(view.isItemSelected('1')).toBe(true);
    });

    it('should use the controlled state when defined', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
        selectedItems: ['1'],
      });

      expect(view.isItemSelected('1')).toBe(true);
    });

    it('should use the controlled state instead of the default state when both are defined', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
        selectedItems: ['1'],
        defaultSelectedItems: ['2'],
      });

      expect(view.isItemSelected('1')).toBe(true);
    });

    it.each(['click', 'keyboard'])(
      'shrinks a controlled Shift-%s range after acceptance',
      async (interaction) => {
        const onSelectedItemsChange = vi.fn();
        const view = await render({
          selectionMode: 'multiple',
          items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
          selectedItems: [],
          onSelectedItemsChange,
        });
        fireEvent.click(view.getItemRoot('1'));
        await view.setProps({ selectedItems: onSelectedItemsChange.mock.calls.at(-1)![0] });
        if (interaction === 'click') {
          fireEvent.click(view.getItemRoot('3'), { shiftKey: true });
        } else {
          fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowDown', shiftKey: true });
          await view.setProps({ selectedItems: onSelectedItemsChange.mock.calls.at(-1)![0] });
          fireEvent.keyDown(view.getItemRoot('2'), { key: 'ArrowDown', shiftKey: true });
        }
        await view.setProps({ selectedItems: onSelectedItemsChange.mock.calls.at(-1)![0] });
        expect(view.getSelectedTreeItems()).toEqual(['1', '2', '3']);

        if (interaction === 'click') {
          fireEvent.click(view.getItemRoot('2'), { shiftKey: true });
        } else {
          fireEvent.keyDown(view.getItemRoot('3'), { key: 'ArrowUp', shiftKey: true });
        }
        await view.setProps({ selectedItems: onSelectedItemsChange.mock.calls.at(-1)![0] });
        expect(view.getSelectedTreeItems()).toEqual(['1', '2']);
      },
    );

    it('should react to controlled state update', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
        selectedItems: [],
      });

      await view.setProps({ selectedItems: ['1'] });
      expect(view.isItemSelected('1')).toBe(true);
    });

    it('should call the onSelectedItemsChange callback when the model is updated (single selection and add selected item)', async () => {
      const onSelectedItemsChange = vi.fn();

      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
        onSelectedItemsChange,
      });

      fireEvent.click(view.getItemRoot('1'));

      expect(onSelectedItemsChange.mock.calls.length).toBe(1);
      expect(onSelectedItemsChange.mock.calls.at(-1)![0]).toEqual('1');
      expect(onSelectedItemsChange.mock.calls.at(-1)![1]).toHaveProperty('reason', 'item-press');
    });

    it('should call the onSelectedItemsChange callback when the model is updated (multi selection and add selected item to empty list)', async () => {
      const onSelectedItemsChange = vi.fn();

      const view = await render({
        selectionMode: 'multiple',
        items: [{ id: '1' }, { id: '2' }],
        onSelectedItemsChange,
      });

      fireEvent.click(view.getItemRoot('1'));

      expect(onSelectedItemsChange.mock.calls.length).toBe(1);
      expect(onSelectedItemsChange.mock.calls.at(-1)![0]).toEqual(['1']);
      expect(onSelectedItemsChange.mock.calls.at(-1)![1]).toHaveProperty('reason', 'item-press');
    });

    it('should call the onSelectedItemsChange callback when the model is updated (multi selection and add selected item to non-empty list)', async () => {
      const onSelectedItemsChange = vi.fn();

      const view = await render({
        selectionMode: 'multiple',
        items: [{ id: '1' }, { id: '2' }],
        onSelectedItemsChange,
        defaultSelectedItems: ['1'],
      });

      fireEvent.click(view.getItemRoot('2'), { ctrlKey: true });

      expect(onSelectedItemsChange.mock.calls.length).toBe(1);
      expect(onSelectedItemsChange.mock.calls.at(-1)![0]).toEqual(['2', '1']);
      expect(onSelectedItemsChange.mock.calls.at(-1)![1]).toHaveProperty('reason', 'item-press');
    });

    it('should call the onSelectedItemsChange callback when the model is updated (multi selection and remove selected item)', async () => {
      const onSelectedItemsChange = vi.fn();

      const view = await render({
        selectionMode: 'multiple',
        items: [{ id: '1' }, { id: '2' }],
        onSelectedItemsChange,
        defaultSelectedItems: ['1'],
      });

      fireEvent.click(view.getItemRoot('1'), { ctrlKey: true });

      expect(onSelectedItemsChange.mock.calls.length).toBe(1);
      expect(onSelectedItemsChange.mock.calls.at(-1)![0]).toEqual([]);
      expect(onSelectedItemsChange.mock.calls.at(-1)![1]).toHaveProperty('reason', 'item-press');
    });

    it('should not select when onSelectedItemsChange cancels the event', async () => {
      const onSelectedItemsChange = vi.fn((_selectedItems: any, eventDetails: any) => {
        eventDetails.cancel();
      });

      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
        onSelectedItemsChange,
      });

      fireEvent.click(view.getItemRoot('1'));

      expect(onSelectedItemsChange.mock.calls.length).toBe(1);
      expect(view.isItemSelected('1')).toBe(false);
    });

    it('should pass reason "imperative-action" when using setItemSelection', async () => {
      const onSelectedItemsChange = vi.fn();

      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
        onSelectedItemsChange,
      });

      act(() => {
        view.actionsRef.current!.setItemSelection('1', true);
      });

      expect(onSelectedItemsChange.mock.calls.length).toBe(1);
      expect(onSelectedItemsChange.mock.calls.at(-1)![1]).toHaveProperty(
        'reason',
        'imperative-action',
      );
    });
  });

  // A controlled component must not mutate its own state; only the parent's
  // prop should drive it. These tests interact under a STATIC controlled
  // `selectedItems` prop (with a `vi.fn()` handler that never feeds the change
  // back): the intent is reported via `onSelectedItemsChange`, but the selection
  // stays put because `TreeSelectionPlugin.setSelectedItems` only writes
  // `selectedItems` when the prop is uncontrolled (`state.selectedItemsProp ===
  // undefined`), matching the Calendar/DateField `valueProp` pattern.
  describe('controlled mode', () => {
    describe('single selection', () => {
      it('should report the intended selection but keep the controlled value when clicking another item', async () => {
        const onSelectedItemsChange = vi.fn();

        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
          selectedItems: ['1'],
          onSelectedItemsChange,
        });

        expect(view.getSelectedTreeItems()).toEqual(['1']);

        fireEvent.click(view.getItemRoot('2'));

        expect(onSelectedItemsChange.mock.calls.length).toBe(1);
        expect(onSelectedItemsChange.mock.calls.at(-1)![0]).toEqual('2');
        expect(onSelectedItemsChange.mock.calls.at(-1)![1]).toHaveProperty('reason', 'item-press');
        // The parent never updated the prop, so nothing should change.
        expect(view.getSelectedTreeItems()).toEqual(['1']);
      });
    });

    describe('multi selection', () => {
      it.each([
        { name: 'clicking', modifiers: {}, expected: ['2'] },
        { name: 'ctrl-clicking', modifiers: { ctrlKey: true }, expected: ['2', '1'] },
      ])(
        'should report the intended selection but keep the controlled value when $name another item',
        async ({ modifiers, expected }) => {
          const onSelectedItemsChange = vi.fn();

          const view = await render({
            selectionMode: 'multiple',
            items: [{ id: '1' }, { id: '2' }],
            selectedItems: ['1'],
            onSelectedItemsChange,
          });

          expect(view.getSelectedTreeItems()).toEqual(['1']);

          fireEvent.click(view.getItemRoot('2'), modifiers);

          expect(onSelectedItemsChange.mock.calls.length).toBe(1);
          expect(onSelectedItemsChange.mock.calls.at(-1)![0]).toEqual(expected);
          expect(view.getSelectedTreeItems()).toEqual(['1']);
        },
      );

      it('should not change the selection when shift-clicking another item while controlled', async () => {
        const onSelectedItemsChange = vi.fn();

        const view = await render({
          selectionMode: 'multiple',
          items: [{ id: '1' }, { id: '2' }, { id: '3' }],
          selectedItems: ['1'],
          onSelectedItemsChange,
        });

        expect(view.getSelectedTreeItems()).toEqual(['1']);

        fireEvent.click(view.getItemRoot('3'), { shiftKey: true });

        expect(view.getSelectedTreeItems()).toEqual(['1']);
        expect(view.isItemSelected('2')).toBe(false);
        expect(view.isItemSelected('3')).toBe(false);
      });

      it('should not use a rejected controlled proposal as the next range anchor', async () => {
        const onSelectedItemsChange = vi.fn();
        const view = await render({
          selectionMode: 'multiple',
          items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }],
          selectedItems: ['1'],
          onSelectedItemsChange,
        });

        fireEvent.click(view.getItemRoot('3'), { ctrlKey: true });
        fireEvent.click(view.getItemRoot('5'), { shiftKey: true });

        expect(onSelectedItemsChange.mock.calls.at(-1)![0]).toEqual(['1', '2', '3', '4', '5']);
      });

      it('should reset the range anchor when the controlled selection is replaced externally', async () => {
        const onSelectedItemsChange = vi.fn();
        const view = await render({
          selectionMode: 'multiple',
          items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }],
          selectedItems: ['1'],
          onSelectedItemsChange,
        });

        fireEvent.click(view.getItemRoot('3'), { ctrlKey: true });
        await view.setProps({ selectedItems: ['3', '1'] });
        await view.setProps({ selectedItems: ['5'] });
        fireEvent.click(view.getItemRoot('1'), { shiftKey: true });

        expect(onSelectedItemsChange.mock.calls.at(-1)![0]).toEqual(['5', '1', '2', '3', '4']);
      });

      it.each(['click', 'keyboard'])(
        'keeps the anchor of an accepted controlled Shift-%s range extended upwards',
        async (interaction) => {
          const onSelectedItemsChange = vi.fn();
          const view = await render({
            selectionMode: 'multiple',
            items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
            selectedItems: [],
            onSelectedItemsChange,
          });
          const acceptLastChange = () =>
            view.setProps({ selectedItems: onSelectedItemsChange.mock.calls.at(-1)![0] });

          fireEvent.click(view.getItemRoot('4'));
          await acceptLastChange();
          if (interaction === 'click') {
            fireEvent.click(view.getItemRoot('3'), { shiftKey: true });
            await acceptLastChange();
            fireEvent.click(view.getItemRoot('2'), { shiftKey: true });
          } else {
            fireEvent.keyDown(view.getItemRoot('4'), { key: 'ArrowUp', shiftKey: true });
            await acceptLastChange();
            fireEvent.keyDown(view.getItemRoot('3'), { key: 'ArrowUp', shiftKey: true });
          }
          await acceptLastChange();

          expect(view.getSelectedTreeItems()).toEqual(['2', '3', '4']);
        },
      );

      it('keeps the range anchor when the parent accepts a range in another order', async () => {
        const onSelectedItemsChange = vi.fn();
        const view = await render({
          selectionMode: 'multiple',
          items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
          selectedItems: [],
          onSelectedItemsChange,
        });
        const acceptSorted = () =>
          view.setProps({
            selectedItems: [...onSelectedItemsChange.mock.calls.at(-1)![0]].sort(),
          });

        fireEvent.click(view.getItemRoot('4'));
        await acceptSorted();
        fireEvent.click(view.getItemRoot('2'), { shiftKey: true });
        await acceptSorted();
        fireEvent.click(view.getItemRoot('3'), { shiftKey: true });
        await acceptSorted();

        expect(view.getSelectedTreeItems()).toEqual(['3', '4']);
      });

      it('restarts a controlled Shift+Arrow range at the focused item when the anchor is hidden', async () => {
        const onSelectedItemsChange = vi.fn();
        const view = await render({
          selectionMode: 'multiple',
          items: [{ id: '1', children: [{ id: '1.1' }] }, { id: '2' }, { id: '3' }],
          selectedItems: [],
          defaultExpandedItems: ['1'],
          onSelectedItemsChange,
        });

        fireEvent.click(view.getItemRoot('1.1'));
        await view.setProps({ selectedItems: onSelectedItemsChange.mock.calls.at(-1)![0] });
        act(() => view.actionsRef.current!.setItemExpansion('1', false));

        act(() => view.getItemRoot('2').focus());
        fireEvent.keyDown(view.getItemRoot('2'), { key: 'ArrowDown', shiftKey: true });

        expect(onSelectedItemsChange.mock.calls.at(-1)![0]).toEqual(['1.1', '2', '3']);
      });
    });
  });

  describe('onItemSelectionToggle prop', () => {
    it('should call onItemSelectionToggle when selecting an item', async () => {
      const onItemSelectionToggle = vi.fn();

      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
        onItemSelectionToggle,
      });

      fireEvent.click(view.getItemRoot('1'));
      expect(onItemSelectionToggle.mock.calls.length).toBe(1);
      expect(onItemSelectionToggle.mock.calls.at(-1)![0]).toEqual({
        itemId: '1',
        selected: true,
      });
      expect(onItemSelectionToggle.mock.calls.at(-1)![1]).toHaveProperty('reason', 'item-press');
      expect(onItemSelectionToggle.mock.calls.at(-1)![1]).toHaveProperty('event');
    });

    it('should call onItemSelectionToggle when un-selecting an item (multi selection)', async () => {
      const onItemSelectionToggle = vi.fn();

      const view = await render({
        selectionMode: 'multiple',
        items: [{ id: '1' }, { id: '2' }],
        defaultSelectedItems: ['1'],
        onItemSelectionToggle,
      });

      fireEvent.click(view.getItemRoot('1'), { ctrlKey: true });
      expect(onItemSelectionToggle.mock.calls.length).toBe(1);
      expect(onItemSelectionToggle.mock.calls.at(-1)![0]).toEqual({
        itemId: '1',
        selected: false,
      });
      expect(onItemSelectionToggle.mock.calls.at(-1)![1]).toHaveProperty('reason', 'item-press');
    });

    it('should not call onItemSelectionToggle when the selection is canceled', async () => {
      const onItemSelectionToggle = vi.fn();

      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
        onItemSelectionToggle,
        onSelectedItemsChange: (_selectedItems: any, eventDetails: any) => {
          eventDetails.cancel();
        },
      });

      fireEvent.click(view.getItemRoot('1'));
      expect(onItemSelectionToggle.mock.calls.length).toBe(0);
    });

    it('should call onItemSelectionToggle when using the setItemSelection imperative API', async () => {
      const onItemSelectionToggle = vi.fn();

      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
        onItemSelectionToggle,
      });

      act(() => {
        view.actionsRef.current!.setItemSelection('1', true);
      });

      expect(onItemSelectionToggle.mock.calls.length).toBe(1);
      expect(onItemSelectionToggle.mock.calls.at(-1)![0]).toEqual({
        itemId: '1',
        selected: true,
      });
      expect(onItemSelectionToggle.mock.calls.at(-1)![1]).toHaveProperty(
        'reason',
        'imperative-action',
      );
    });

    it('should call onItemSelectionToggle for each changed item when selecting replaces previous selection (single select)', async () => {
      const onItemSelectionToggle = vi.fn();

      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
        defaultSelectedItems: '1',
        onItemSelectionToggle,
      });

      fireEvent.click(view.getItemRoot('2'));
      expect(onItemSelectionToggle.mock.calls.length).toBe(2);

      const calls = onItemSelectionToggle.mock.calls.map((call: any) => call[0]);
      expect(calls).toEqual(
        expect.arrayContaining([
          { itemId: '2', selected: true },
          { itemId: '1', selected: false },
        ]),
      );
    });
  });

  describe('item click interaction', () => {
    describe('single selection', () => {
      it('should select un-selected item when clicking on an item', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
        });

        expect(view.isItemSelected('1')).toBe(false);

        fireEvent.click(view.getItemRoot('1'));
        expect(view.isItemSelected('1')).toBe(true);
      });

      it('should not un-select selected item when clicking on an item', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
          defaultSelectedItems: '1',
        });

        expect(view.isItemSelected('1')).toBe(true);

        fireEvent.click(view.getItemRoot('1'));
        expect(view.isItemSelected('1')).toBe(true);
      });

      it('should not select an item on click when selectionMode is none', async () => {
        const onSelectedItemsChange = vi.fn();
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
          selectionMode: 'none',
          onSelectedItemsChange,
        });

        fireEvent.click(view.getItemRoot('1'));
        expect(onSelectedItemsChange).not.toHaveBeenCalled();
      });

      it('should not select an item when clicking on a disabled item', async () => {
        const view = await render({
          items: [{ id: '1', disabled: true }, { id: '2' }],
        });

        expect(view.isItemSelected('1')).toBe(false);
        fireEvent.click(view.getItemRoot('1'));
        expect(view.isItemSelected('1')).toBe(false);
      });

      it('should not select an item when clicking the expansion trigger', async () => {
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1' }] }],
        });

        fireEvent.click(view.getItemExpansionTrigger('1')!);
        expect(view.isItemSelected('1')).toBe(false);
      });
    });

    describe('multi selection', () => {
      it('should select un-selected item and remove other selected items when clicking on an item', async () => {
        const view = await render({
          selectionMode: 'multiple',
          items: [{ id: '1' }, { id: '2' }],
          defaultSelectedItems: ['2'],
        });

        expect(view.getSelectedTreeItems()).toEqual(['2']);

        fireEvent.click(view.getItemRoot('1'));
        expect(view.getSelectedTreeItems()).toEqual(['1']);
      });

      it('should not un-select selected item when clicking on an item', async () => {
        const view = await render({
          selectionMode: 'multiple',
          items: [{ id: '1' }, { id: '2' }],
          defaultSelectedItems: ['1'],
        });

        expect(view.isItemSelected('1')).toBe(true);

        fireEvent.click(view.getItemRoot('1'));
        expect(view.isItemSelected('1')).toBe(true);
      });

      it('should un-select selected item when clicking on its content while holding Ctrl', async () => {
        const view = await render({
          selectionMode: 'multiple',
          items: [{ id: '1' }, { id: '2' }],
          defaultSelectedItems: ['1', '2'],
        });

        expect(view.getSelectedTreeItems()).toEqual(['1', '2']);
        fireEvent.click(view.getItemRoot('1'), { ctrlKey: true });
        expect(view.getSelectedTreeItems()).toEqual(['2']);
      });

      it('should un-select selected item when clicking on its content while holding Meta', async () => {
        const view = await render({
          selectionMode: 'multiple',
          items: [{ id: '1' }, { id: '2' }],
          defaultSelectedItems: ['1', '2'],
        });

        expect(view.getSelectedTreeItems()).toEqual(['1', '2']);

        fireEvent.click(view.getItemRoot('1'), { metaKey: true });
        expect(view.getSelectedTreeItems()).toEqual(['2']);
      });

      it('should not select an item when clicking on a disabled item', async () => {
        const view = await render({
          selectionMode: 'multiple',
          items: [{ id: '1', disabled: true }, { id: '2' }],
        });

        expect(view.isItemSelected('1')).toBe(false);
        fireEvent.click(view.getItemRoot('1'));
        expect(view.isItemSelected('1')).toBe(false);
      });

      it('should select un-selected item when clicking on its content while holding Ctrl', async () => {
        const view = await render({
          selectionMode: 'multiple',
          items: [{ id: '1' }, { id: '2' }, { id: '3' }],
          defaultSelectedItems: ['1'],
        });

        expect(view.getSelectedTreeItems()).toEqual(['1']);

        fireEvent.click(view.getItemRoot('3'), { ctrlKey: true });
        expect(view.getSelectedTreeItems()).toEqual(['1', '3']);
      });

      it('should do nothing when clicking on an item on a fresh tree while holding Shift', async () => {
        const view = await render({
          selectionMode: 'multiple',
          items: [{ id: '1' }, { id: '2' }, { id: '2.1' }, { id: '3' }, { id: '4' }],
        });

        fireEvent.click(view.getItemRoot('3'), { shiftKey: true });
        expect(view.getSelectedTreeItems()).toEqual([]);
      });

      it('should expand the selection range from a selection seeded by props', async () => {
        const view = await render({
          selectionMode: 'multiple',
          items: [{ id: '1' }, { id: '2' }, { id: '3' }],
          defaultSelectedItems: ['1'],
        });

        // Nothing set a range anchor, so without the fallback to the current
        // selection this Shift+Click did nothing at all.
        fireEvent.click(view.getItemRoot('3'), { shiftKey: true });
        expect(view.getSelectedTreeItems()).toEqual(['1', '2', '3']);
      });

      it('should not select the hidden descendants of a collapsed folder in the range', async () => {
        const onSelectedItemsChange = vi.fn();
        const view = await render({
          selectionMode: 'multiple',
          items: [{ id: '1' }, { id: '2', children: [{ id: '2.1' }, { id: '2.2' }] }, { id: '3' }],
          onSelectedItemsChange,
        });

        fireEvent.click(view.getItemRoot('1'));
        fireEvent.click(view.getItemRoot('3'), { shiftKey: true });

        // `checkboxSelectionPropagation` is on by default but documents that it
        // does not affect `Tree.Item` interactions: the range covers the rows the
        // user dragged over, not the subtree hidden under a collapsed folder.
        expect(onSelectedItemsChange.mock.calls.at(-1)![0]).toEqual(['1', '2', '3']);
      });

      it('should expand the selection range when clicking on an item below the last selected item while holding Shift', async () => {
        const view = await render({
          selectionMode: 'multiple',
          items: [{ id: '1' }, { id: '2' }, { id: '2.1' }, { id: '3' }, { id: '4' }],
        });

        fireEvent.click(view.getItemRoot('2'));
        expect(view.getSelectedTreeItems()).toEqual(['2']);

        fireEvent.click(view.getItemRoot('3'), { shiftKey: true });
        expect(view.getSelectedTreeItems()).toEqual(['2', '2.1', '3']);
      });

      it('should expand the selection range when clicking on an item above the last selected item while holding Shift', async () => {
        const view = await render({
          selectionMode: 'multiple',
          items: [{ id: '1' }, { id: '2' }, { id: '2.1' }, { id: '3' }, { id: '4' }],
        });

        fireEvent.click(view.getItemRoot('3'));
        expect(view.getSelectedTreeItems()).toEqual(['3']);

        fireEvent.click(view.getItemRoot('2'), { shiftKey: true });
        expect(view.getSelectedTreeItems()).toEqual(['2', '2.1', '3']);
      });

      it('should expand the selection range when clicking on an item while holding Shift after un-selecting another item', async () => {
        const view = await render({
          selectionMode: 'multiple',
          items: [{ id: '1' }, { id: '2' }, { id: '2.1' }, { id: '3' }, { id: '4' }],
        });

        fireEvent.click(view.getItemRoot('1'));
        expect(view.getSelectedTreeItems()).toEqual(['1']);

        fireEvent.click(view.getItemRoot('2'), { ctrlKey: true });
        expect(view.getSelectedTreeItems()).toEqual(['1', '2']);

        fireEvent.click(view.getItemRoot('2'), { ctrlKey: true });
        expect(view.getSelectedTreeItems()).toEqual(['1']);

        fireEvent.click(view.getItemRoot('3'), { shiftKey: true });
        expect(view.getSelectedTreeItems()).toEqual(['1', '2', '2.1', '3']);
      });

      it('should not expand the selection range when clicking on a disabled item then clicking on an item while holding Shift', async () => {
        const view = await render({
          selectionMode: 'multiple',
          items: [
            { id: '1' },
            { id: '2', disabled: true },
            { id: '2.1' },
            { id: '3' },
            { id: '4' },
          ],
        });

        fireEvent.click(view.getItemRoot('2'));
        expect(view.getSelectedTreeItems()).toEqual([]);

        fireEvent.click(view.getItemRoot('3'), { shiftKey: true });
        expect(view.getSelectedTreeItems()).toEqual([]);
      });

      it('should not expand the selection range when clicking on an item then clicking a disabled item while holding Shift', async () => {
        const view = await render({
          selectionMode: 'multiple',
          items: [
            { id: '1' },
            { id: '2' },
            { id: '2.1' },
            { id: '3', disabled: true },
            { id: '4' },
          ],
        });

        fireEvent.click(view.getItemRoot('2'));
        expect(view.getSelectedTreeItems()).toEqual(['2']);

        fireEvent.click(view.getItemRoot('3'), { shiftKey: true });
        expect(view.getSelectedTreeItems()).toEqual(['2']);
      });

      it('should not select disabled items that are part of the selected range', async () => {
        const view = await render({
          selectionMode: 'multiple',
          items: [{ id: '1' }, { id: '2', disabled: true }, { id: '3' }],
        });

        fireEvent.click(view.getItemRoot('1'));
        expect(view.getSelectedTreeItems()).toEqual(['1']);

        fireEvent.click(view.getItemRoot('3'), { shiftKey: true });
        expect(view.getSelectedTreeItems()).toEqual(['1', '3']);
      });

      it('should not crash when selecting multiple items in a deeply nested tree', async () => {
        const view = await render({
          selectionMode: 'multiple',
          items: [{ id: '1', children: [{ id: '1.1', children: [{ id: '1.1.1' }] }] }, { id: '2' }],
          defaultExpandedItems: ['1', '1.1'],
        });

        fireEvent.click(view.getItemRoot('1.1.1'));
        fireEvent.click(view.getItemRoot('2'), { shiftKey: true });

        expect(view.getSelectedTreeItems()).toEqual(['1.1.1', '2']);
      });
    });
  });

  describe('checkbox item interaction', () => {
    describe('single selection', () => {
      it('should select un-selected item when clicking on a checkbox item', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
          checkboxSelection: true,
        });

        expect(view.isItemSelected('1')).toBe(false);

        fireEvent.click(view.getItemRoot('1').querySelector('[role=checkbox]')!);
        expect(view.isItemSelected('1')).toBe(true);
      });

      it('should un-select selected item when clicking on a checkbox item', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
          defaultSelectedItems: '1',
          checkboxSelection: true,
        });

        expect(view.isItemSelected('1')).toBe(true);

        fireEvent.click(view.getItemRoot('1').querySelector('[role=checkbox]')!);
        expect(view.isItemSelected('1')).toBe(false);
      });

      it('should not select from the checkbox when selectionMode is none', async () => {
        const onSelectedItemsChange = vi.fn();
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
          selectionMode: 'none',
          onSelectedItemsChange,
          checkboxSelection: true,
        });

        fireEvent.click(view.getItemRoot('1').querySelector('[role=checkbox]')!);
        expect(onSelectedItemsChange).not.toHaveBeenCalled();
      });

      it('should not select an item when clicking on a disabled checkbox item', async () => {
        const view = await render({
          items: [{ id: '1', disabled: true }, { id: '2' }],
          checkboxSelection: true,
        });

        expect(view.isItemSelected('1')).toBe(false);
        fireEvent.click(view.getItemRoot('1').querySelector('[role=checkbox]')!);
        expect(view.isItemSelected('1')).toBe(false);
      });
    });

    describe('multi selection', () => {
      it('should select un-selected item and keep other items selected when clicking on a checkbox item', async () => {
        const view = await render({
          selectionMode: 'multiple',
          checkboxSelection: true,
          items: [{ id: '1' }, { id: '2' }],
          defaultSelectedItems: ['2'],
        });

        expect(view.getSelectedTreeItems()).toEqual(['2']);

        fireEvent.click(view.getItemRoot('1').querySelector('[role=checkbox]')!);
        expect(view.getSelectedTreeItems()).toEqual(['1', '2']);
      });

      it('should un-select selected item when clicking on a checkbox item', async () => {
        const view = await render({
          selectionMode: 'multiple',
          checkboxSelection: true,
          items: [{ id: '1' }, { id: '2' }],
          defaultSelectedItems: ['1'],
        });

        expect(view.isItemSelected('1')).toBe(true);

        fireEvent.click(view.getItemRoot('1').querySelector('[role=checkbox]')!);
        expect(view.isItemSelected('1')).toBe(false);
      });

      it('should not select an item when clicking on a disabled item', async () => {
        const view = await render({
          selectionMode: 'multiple',
          checkboxSelection: true,
          items: [{ id: '1', disabled: true }, { id: '2' }],
        });

        expect(view.isItemSelected('1')).toBe(false);
        fireEvent.click(view.getItemRoot('1').querySelector('[role=checkbox]')!);
        expect(view.isItemSelected('1')).toBe(false);
      });

      it('should expand the selection range when shift-clicking an item after un-checking another item', async () => {
        const view = await render({
          selectionMode: 'multiple',
          checkboxSelection: true,
          items: [{ id: '1' }, { id: '2' }, { id: '2.1' }, { id: '3' }, { id: '4' }],
        });

        fireEvent.click(view.getItemRoot('1').querySelector('[role=checkbox]')!);
        expect(view.getSelectedTreeItems()).toEqual(['1']);

        fireEvent.click(view.getItemRoot('2').querySelector('[role=checkbox]')!);
        expect(view.getSelectedTreeItems()).toEqual(['1', '2']);

        fireEvent.click(view.getItemRoot('2').querySelector('[role=checkbox]')!);
        expect(view.getSelectedTreeItems()).toEqual(['1']);

        fireEvent.click(view.getItemRoot('3'), { shiftKey: true });
        expect(view.getSelectedTreeItems()).toEqual(['1', '2', '2.1', '3']);
      });

      it('should only toggle the clicked checkbox when shift-clicking a checkbox', async () => {
        const onSelectedItemsChange = vi.fn();
        const view = await render({
          selectionMode: 'multiple',
          checkboxSelection: true,
          items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
          onSelectedItemsChange,
        });

        fireEvent.click(view.getItemRoot('2').querySelector('[role=checkbox]')!);
        fireEvent.click(view.getItemRoot('4').querySelector('[role=checkbox]')!, {
          shiftKey: true,
        });

        expect(onSelectedItemsChange.mock.calls.at(-1)![0]).toEqual(['4', '2']);
        expect(view.getSelectedTreeItems()).toEqual(['2', '4']);
      });

      it('should keep the default propagation for the keys a partial checkboxSelectionPropagation omits', async () => {
        const onSelectedItemsChange = vi.fn();
        const view = await render({
          selectionMode: 'multiple',
          checkboxSelection: true,
          items: [{ id: '1', children: [{ id: '1.1' }, { id: '1.2' }] }],
          defaultSelectedItems: ['1.2'],
          defaultExpandedItems: ['1'],
          checkboxSelectionPropagation: { descendants: false },
          onSelectedItemsChange,
        });

        fireEvent.click(view.getItemRoot('1.1').querySelector('[role=checkbox]')!);
        expect(onSelectedItemsChange.mock.calls.at(-1)![0]).toEqual(['1.1', '1.2', '1']);
      });

      it('should not select the parent when selecting all the children if checkboxSelectionPropagation.parents is false', async () => {
        const view = await render({
          selectionMode: 'multiple',
          checkboxSelection: true,
          items: [{ id: '1', children: [{ id: '1.1' }, { id: '1.2' }] }, { id: '2' }],
          defaultSelectedItems: ['1.2'],
          defaultExpandedItems: ['1'],
          checkboxSelectionPropagation: { parents: false, descendants: false },
        });

        fireEvent.click(view.getItemRoot('1.1').querySelector('[role=checkbox]')!);
        expect(view.getSelectedTreeItems()).toEqual(['1.1', '1.2']);
      });

      it('should set the checkbox item as indeterminate when all its children are selected but the parent is not (no propagation)', async () => {
        const view = await render({
          selectionMode: 'multiple',
          checkboxSelection: true,
          items: [{ id: '1', children: [{ id: '1.1' }, { id: '1.2' }] }],
          defaultSelectedItems: ['1.1', '1.2'],
          defaultExpandedItems: ['1'],
          checkboxSelectionPropagation: { parents: false, descendants: false },
        });

        expect(view.getItemRoot('1').querySelector('[role=checkbox]')).toHaveAttribute(
          'data-indeterminate',
        );
      });

      it('should set the checkbox item as indeterminate when some of its descendants are selected but the parent is not', async () => {
        const view = await render({
          selectionMode: 'multiple',
          checkboxSelection: true,
          items: [
            {
              id: '1',
              children: [{ id: '1.1' }, { id: '1.2', children: [{ id: '1.2.1' }] }],
            },
          ],
          defaultSelectedItems: ['1.2.1'],
          defaultExpandedItems: ['1', '1.2'],
        });

        expect(view.getItemRoot('1').querySelector('[role=checkbox]')).toHaveAttribute(
          'data-indeterminate',
        );
      });

      it('should keep the checkbox item indeterminate after collapsing it and expanding another node', async () => {
        const view = await render({
          selectionMode: 'multiple',
          checkboxSelection: true,
          items: [
            { id: '1', children: [{ id: '1.1' }, { id: '1.2' }] },
            { id: '2', children: [{ id: '2.1' }] },
          ],
          defaultSelectedItems: ['1.1'],
          defaultExpandedItems: ['1'],
        });

        expect(view.getItemRoot('1').querySelector('[role=checkbox]')).toHaveAttribute(
          'data-indeterminate',
        );

        // Use expansion trigger to collapse/expand without toggling selection
        fireEvent.click(view.getItemExpansionTrigger('1')!);
        fireEvent.click(view.getItemExpansionTrigger('2')!);

        expect(view.getItemRoot('1').querySelector('[role=checkbox]')).toHaveAttribute(
          'data-indeterminate',
        );
      });

      it('should keep parent indeterminate (3 levels) after collapsing the parent and expanding a sibling node', async () => {
        const view = await render({
          selectionMode: 'multiple',
          checkboxSelection: true,
          items: [
            {
              id: '1',
              children: [
                { id: '1.1', children: [{ id: '1.1.1' }, { id: '1.1.2' }] },
                { id: '1.2' },
              ],
            },
            { id: '2', children: [{ id: '2.1' }] },
          ],
          defaultSelectedItems: ['1.1.1'],
          defaultExpandedItems: ['1', '1.1'],
        });

        expect(view.getItemRoot('1.1').querySelector('[role=checkbox]')).toHaveAttribute(
          'data-indeterminate',
        );
        expect(view.getItemRoot('1').querySelector('[role=checkbox]')).toHaveAttribute(
          'data-indeterminate',
        );

        // Use expansion trigger to collapse/expand without toggling selection
        fireEvent.click(view.getItemExpansionTrigger('1')!);
        fireEvent.click(view.getItemExpansionTrigger('2')!);

        expect(view.getItemRoot('1').querySelector('[role=checkbox]')).toHaveAttribute(
          'data-indeterminate',
        );
      });

      it('should update the indeterminate state of the parent when selecting a child', async () => {
        const view = await render({
          selectionMode: 'multiple',
          checkboxSelection: true,
          items: [{ id: '1' }, { id: '2', children: [{ id: '2.1' }, { id: '2.2' }] }],
          defaultExpandedItems: ['2'],
        });

        const parentCheckbox = view.getItemRoot('2').querySelector('[role=checkbox]');
        expect(parentCheckbox).not.toHaveAttribute('data-indeterminate');

        fireEvent.click(view.getItemRoot('2.1').querySelector('[role=checkbox]')!);
        expect(parentCheckbox).toHaveAttribute('data-indeterminate');

        fireEvent.click(view.getItemRoot('2.1').querySelector('[role=checkbox]')!);
        expect(parentCheckbox).not.toHaveAttribute('data-indeterminate');
      });
    });

    describe('multi selection with checkboxSelectionPropagation.descendants = true', () => {
      it('should select all the children when selecting a parent', async () => {
        const view = await render({
          selectionMode: 'multiple',
          checkboxSelection: true,
          items: [{ id: '1', children: [{ id: '1.1' }, { id: '1.2' }] }],
          defaultExpandedItems: ['1'],

          checkboxSelectionPropagation: { descendants: true, parents: false },
        });

        fireEvent.click(view.getItemRoot('1').querySelector('[role=checkbox]')!);
        expect(view.getSelectedTreeItems()).toEqual(['1', '1.1', '1.2']);
      });

      it('should deselect all the children when deselecting a parent', async () => {
        const view = await render({
          selectionMode: 'multiple',
          checkboxSelection: true,
          items: [{ id: '1', children: [{ id: '1.1' }, { id: '1.2' }] }],
          defaultSelectedItems: ['1', '1.1', '1.2'],
          defaultExpandedItems: ['1'],
          checkboxSelectionPropagation: { descendants: true, parents: false },
        });

        fireEvent.click(view.getItemRoot('1').querySelector('[role=checkbox]')!);
        expect(view.getSelectedTreeItems()).toEqual([]);
      });

      it('should not select the parent when selecting all the children', async () => {
        const view = await render({
          selectionMode: 'multiple',
          checkboxSelection: true,
          items: [{ id: '1', children: [{ id: '1.1' }, { id: '1.2' }] }],
          defaultSelectedItems: ['1.2'],
          defaultExpandedItems: ['1'],
          checkboxSelectionPropagation: { descendants: true, parents: false },
        });

        fireEvent.click(view.getItemRoot('1.1').querySelector('[role=checkbox]')!);
        expect(view.getSelectedTreeItems()).toEqual(['1.1', '1.2']);
      });

      it('should not unselect the parent when unselecting a children', async () => {
        const view = await render({
          selectionMode: 'multiple',
          checkboxSelection: true,
          items: [{ id: '1', children: [{ id: '1.1' }, { id: '1.2' }] }],
          defaultSelectedItems: ['1', '1.1', '1.2'],
          defaultExpandedItems: ['1'],
          checkboxSelectionPropagation: { descendants: true, parents: false },
        });

        fireEvent.click(view.getItemRoot('1.1').querySelector('[role=checkbox]')!);
        expect(view.getSelectedTreeItems()).toEqual(['1', '1.2']);
      });
    });

    describe('multi selection with checkboxSelectionPropagation.parents = true', () => {
      it('should select all the parents when selecting a child', async () => {
        const view = await render({
          selectionMode: 'multiple',
          checkboxSelection: true,
          items: [{ id: '1', children: [{ id: '1.1', children: [{ id: '1.1.1' }] }] }],
          defaultExpandedItems: ['1', '1.1'],
          checkboxSelectionPropagation: { parents: true, descendants: false },
        });

        fireEvent.click(view.getItemRoot('1.1.1').querySelector('[role=checkbox]')!);
        expect(view.getSelectedTreeItems()).toEqual(['1', '1.1', '1.1.1']);
      });

      it('should deselect all the parents when deselecting a child', async () => {
        const view = await render({
          selectionMode: 'multiple',
          checkboxSelection: true,
          items: [{ id: '1', children: [{ id: '1.1', children: [{ id: '1.1.1' }] }] }],
          defaultSelectedItems: ['1', '1.1', '1.1.1'],
          defaultExpandedItems: ['1', '1.1'],
          checkboxSelectionPropagation: { parents: true, descendants: false },
        });

        fireEvent.click(view.getItemRoot('1.1.1').querySelector('[role=checkbox]')!);
        expect(view.getSelectedTreeItems()).toEqual([]);
      });
    });

    describe('selection propagation with disabled items', () => {
      it('should not select disabled descendants when selecting a parent', async () => {
        const view = await render({
          selectionMode: 'multiple',
          checkboxSelection: true,
          items: [
            {
              id: '1',
              children: [{ id: '1.1' }, { id: '1.2', disabled: true }, { id: '1.3' }],
            },
          ],
          defaultExpandedItems: ['1'],

          checkboxSelectionPropagation: { descendants: true, parents: false },
        });

        fireEvent.click(view.getItemRoot('1').querySelector('[role=checkbox]')!);
        expect(view.getSelectedTreeItems()).toEqual(['1', '1.1', '1.3']);
      });

      it('should not select non-selectable descendants when selecting a parent', async () => {
        const onSelectedItemsChange = vi.fn();
        const view = await render({
          selectionMode: 'multiple',
          checkboxSelection: true,
          items: [
            {
              id: '1',
              children: [{ id: '1.1' }, { id: '1.2' }, { id: '1.3' }],
            },
          ],
          defaultExpandedItems: ['1'],

          checkboxSelectionPropagation: { descendants: true, parents: false },
          isItemSelectionDisabled: (item: any) => item.id === '1.2',
          onSelectedItemsChange,
        });

        fireEvent.click(view.getItemRoot('1').querySelector('[role=checkbox]')!);
        expect(onSelectedItemsChange.mock.calls.at(-1)![0]).toEqual(['1', '1.1', '1.3']);
      });

      it('should auto-select parent when all selectable children are selected (ignoring disabled children)', async () => {
        const view = await render({
          selectionMode: 'multiple',
          checkboxSelection: true,
          items: [
            {
              id: '1',
              children: [{ id: '1.1' }, { id: '1.2', disabled: true }],
            },
          ],
          defaultSelectedItems: [],
          defaultExpandedItems: ['1'],
          checkboxSelectionPropagation: { parents: true, descendants: false },
        });

        fireEvent.click(view.getItemRoot('1.1').querySelector('[role=checkbox]')!);
        expect(view.getSelectedTreeItems()).toEqual(['1', '1.1']);
      });

      it('should auto-select parent when all selectable children are selected (ignoring non-selectable children)', async () => {
        const onSelectedItemsChange = vi.fn();
        const view = await render({
          selectionMode: 'multiple',
          checkboxSelection: true,
          items: [
            {
              id: '1',
              children: [{ id: '1.1' }, { id: '1.2' }],
            },
          ],
          defaultSelectedItems: [],
          defaultExpandedItems: ['1'],
          checkboxSelectionPropagation: { parents: true, descendants: false },
          isItemSelectionDisabled: (item: any) => item.id === '1.2',
          onSelectedItemsChange,
        });

        fireEvent.click(view.getItemRoot('1.1').querySelector('[role=checkbox]')!);
        expect(onSelectedItemsChange.mock.calls.at(-1)![0]).toEqual(['1.1', '1']);
      });

      it('should not auto-select a non-selectable parent even when all children are selected', async () => {
        const onSelectedItemsChange = vi.fn();
        const view = await render({
          selectionMode: 'multiple',
          checkboxSelection: true,
          items: [
            {
              id: '1',
              children: [{ id: '1.1' }, { id: '1.2' }],
            },
          ],
          defaultSelectedItems: ['1.2'],
          defaultExpandedItems: ['1'],
          checkboxSelectionPropagation: { parents: true, descendants: false },
          isItemSelectionDisabled: (item: any) => item.id === '1',
          onSelectedItemsChange,
        });

        fireEvent.click(view.getItemRoot('1.1').querySelector('[role=checkbox]')!);
        expect(onSelectedItemsChange.mock.calls.at(-1)![0]).toEqual(['1.1', '1.2']);
      });
    });
  });

  describe('checkboxSelectionPropagation warning', () => {
    it('should warn when checkboxSelectionPropagation is used with single selection mode', async () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        await render({
          items: [{ id: '1', children: [{ id: '1.1' }] }],
          checkboxSelectionPropagation: { descendants: true, parents: false },
        });

        expect(consoleWarn.mock.calls.length).toBeGreaterThanOrEqual(1);
        expect(consoleWarn.mock.calls[0][0]).toContain('checkboxSelectionPropagation');
      } finally {
        consoleWarn.mockRestore();
      }
    });

    it('should not warn when checkboxSelectionPropagation is used with multiple selection mode', async () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        await render({
          items: [{ id: '1', children: [{ id: '1.1' }] }],
          selectionMode: 'multiple',
          checkboxSelectionPropagation: { descendants: true, parents: false },
        });

        expect(consoleWarn.mock.calls.length).toBe(0);
      } finally {
        consoleWarn.mockRestore();
      }
    });
  });

  describe('aria-multiselectable tree attribute', () => {
    it('should not have the attribute `aria-multiselectable` if using single select', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
      });

      expect(view.getRoot()).not.toHaveAttribute('aria-multiselectable');
    });

    it('should have the attribute `aria-multiselectable=true if using multi select`', async () => {
      const view = await render({ items: [{ id: '1' }, { id: '2' }], selectionMode: 'multiple' });

      expect(view.getRoot()).toHaveAttribute('aria-multiselectable', 'true');
    });
  });

  describe('aria-selected item attribute (Tree.Item)', () => {
    describe('single selection', () => {
      it('should have the attribute `aria-selected=false` if not selected', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
        });

        expect(view.getItemRoot('1')).toHaveAttribute('aria-selected', 'false');
      });

      it('should have the attribute `aria-selected=true` if selected', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
          defaultSelectedItems: '1',
        });

        expect(view.getItemRoot('1')).toHaveAttribute('aria-selected', 'true');
      });

      it('should keep `aria-checked` on the checkbox, not the row', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
          checkboxSelection: true,
          defaultSelectedItems: '1',
        });

        expect(view.getItemRoot('1')).not.toHaveAttribute('aria-checked');
        expect(view.getItemRoot('1').querySelector('[role=checkbox]')).toHaveAttribute(
          'aria-checked',
          'true',
        );
      });
    });

    describe('multi selection', () => {
      it('should have the attribute `aria-selected=false` if not selected', async () => {
        const view = await render({
          selectionMode: 'multiple',
          items: [{ id: '1' }, { id: '2' }],
        });

        expect(view.getItemRoot('1')).toHaveAttribute('aria-selected', 'false');
      });

      it('should have the attribute `aria-selected=true` if selected', async () => {
        const view = await render({
          selectionMode: 'multiple',
          items: [{ id: '1' }, { id: '2' }],
          defaultSelectedItems: ['1'],
        });

        expect(view.getItemRoot('1')).toHaveAttribute('aria-selected', 'true');
      });

      it('should not have `aria-selected` if selectionMode is none', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
          selectionMode: 'none',
        });

        expect(view.getItemRoot('1')).not.toHaveAttribute('aria-selected');
      });

      it('should keep `aria-selected` on a disabled item', async () => {
        const view = await render({
          selectionMode: 'multiple',
          items: [{ id: '1', disabled: true }, { id: '2' }],
          defaultSelectedItems: ['1'],
        });

        // A disabled row still supports selection: dropping the attribute would
        // stop screen readers announcing that it is selected.
        expect(view.getItemRoot('1')).toHaveAttribute('aria-selected', 'true');
        expect(view.getItemRoot('2')).toHaveAttribute('aria-selected', 'false');
      });
    });
  });

  describe('aria-checked item attribute (Tree.ItemCheckbox)', () => {
    it('should have the attribute `aria-checked=false` if not selected', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
        checkboxSelection: true,
      });

      expect(view.getItemRoot('1').querySelector('[role=checkbox]')).toHaveAttribute(
        'aria-checked',
        'false',
      );
    });

    it('should have the attribute `aria-checked=true` if selected', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
        defaultSelectedItems: '1',
        checkboxSelection: true,
      });

      expect(view.getItemRoot('1').querySelector('[role=checkbox]')).toHaveAttribute(
        'aria-checked',
        'true',
      );
    });

    it('should have the attribute `aria-checked="mixed"` if partially selected', async () => {
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }, { id: '1.2' }] }, { id: '2' }],
        defaultSelectedItems: '1.1',
        defaultExpandedItems: ['1'],
        checkboxSelection: true,
      });
      expect(view.getItemRoot('1').querySelector('[role=checkbox]')).toHaveAttribute(
        'aria-checked',
        'mixed',
      );
    });

    it('keeps the mixed state of a partially selected parent while the tree is disabled', async () => {
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }, { id: '1.2' }] }, { id: '2' }],
        defaultSelectedItems: '1.1',
        defaultExpandedItems: ['1'],
        checkboxSelection: true,
      });

      await view.setProps({ disabled: true });

      expect(view.getItemRoot('1').querySelector('[role=checkbox]')).toHaveAttribute(
        'aria-checked',
        'mixed',
      );
    });

    it('should not show indeterminate when all selectable descendants are selected and some are disabled', async () => {
      const view = await render({
        selectionMode: 'multiple',
        checkboxSelection: true,
        items: [
          {
            id: '1',
            children: [{ id: '1.1' }, { id: '1.2', disabled: true }, { id: '1.3' }],
          },
        ],
        defaultSelectedItems: ['1.1', '1.3'],
        defaultExpandedItems: ['1'],
        checkboxSelectionPropagation: { parents: true, descendants: false },
      });

      // All selectable descendants are selected, so parent should show checked (not mixed)
      expect(view.getItemRoot('1').querySelector('[role=checkbox]')).toHaveAttribute(
        'aria-checked',
        'true',
      );
    });

    it('should not show indeterminate when all selectable descendants are selected via isItemSelectionDisabled', async () => {
      const view = await render({
        selectionMode: 'multiple',
        checkboxSelection: true,
        items: [
          {
            id: '1',
            children: [{ id: '1.1' }, { id: '1.2' }, { id: '1.3' }],
          },
        ],
        defaultSelectedItems: ['1.1', '1.3'],
        defaultExpandedItems: ['1'],
        checkboxSelectionPropagation: { parents: true, descendants: false },
        isItemSelectionDisabled: (item: any) => item.id === '1.2',
      });

      // '1.2' is not selectable, '1.1' and '1.3' are selected — parent should show checked
      expect(view.getItemRoot('1').querySelector('[role=checkbox]')).toHaveAttribute(
        'aria-checked',
        'true',
      );
    });

    it('should correctly handle checkbox status with deeply nested disabled items', async () => {
      const view = await render({
        selectionMode: 'multiple',
        checkboxSelection: true,
        items: [
          {
            id: '1',
            children: [
              {
                id: '1.1',
                disabled: true,
                children: [{ id: '1.1.1' }],
              },
              { id: '1.2' },
            ],
          },
        ],
        defaultSelectedItems: ['1.2'],
        defaultExpandedItems: ['1', '1.1'],
        checkboxSelectionPropagation: { parents: true, descendants: false },
      });

      // '1.1' and its child '1.1.1' are disabled, so only '1.2' is selectable
      // Since '1.2' is selected, the parent should show checked
      expect(view.getItemRoot('1').querySelector('[role=checkbox]')).toHaveAttribute(
        'aria-checked',
        'true',
      );
    });

    it('should keep `aria-checked` on a disabled item', async () => {
      const view = await render({
        selectionMode: 'multiple',
        items: [{ id: '1', disabled: true }, { id: '2' }],
        defaultSelectedItems: ['1'],
        checkboxSelection: true,
      });

      expect(view.getItemRoot('1').querySelector('[role=checkbox]')).toHaveAttribute(
        'aria-checked',
        'true',
      );
      expect(view.getItemRoot('2').querySelector('[role=checkbox]')).toHaveAttribute(
        'aria-checked',
        'false',
      );
    });

    it('should not have `aria-selected` attribute', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
        checkboxSelection: true,
      });

      expect(view.getItemRoot('1').querySelector('[role=checkbox]')).not.toHaveAttribute(
        'aria-selected',
      );
    });
  });

  describe('setItemSelection() api method', () => {
    describe('single selection', () => {
      it('should select un-selected item', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
        });

        act(() => {
          view.actionsRef.current!.setItemSelection('1', true);
        });

        expect(view.isItemSelected('1')).toBe(true);
      });

      it('should un-select selected item', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
          defaultSelectedItems: ['1'],
        });

        act(() => {
          view.actionsRef.current!.setItemSelection('1', false);
        });

        expect(view.isItemSelected('1')).toBe(false);
      });

      it('should not select an item when disableSelection is true', async () => {
        const onSelectedItemsChange = vi.fn();
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
          selectionMode: 'none',
          onSelectedItemsChange,
        });

        act(() => {
          view.actionsRef.current!.setItemSelection('1', true);
        });

        expect(onSelectedItemsChange).not.toHaveBeenCalled();
      });

      it('should not un-select an item when disableSelection is true', async () => {
        const onSelectedItemsChange = vi.fn();

        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
          defaultSelectedItems: ['1'],
          selectionMode: 'none',
          onSelectedItemsChange,
        });

        act(() => {
          view.actionsRef.current!.setItemSelection('1', false);
        });

        // The selection change should be prevented
        expect(onSelectedItemsChange.mock.calls.length).toBe(0);
        // Re-enable selection to verify the item is still selected
        await view.setProps({ selectionMode: 'single' });
        expect(view.isItemSelected('1')).toBe(true);
      });

      it('should normalize uncontrolled multiple selection when switching to single mode', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
          defaultSelectedItems: ['1', '2'],
          selectionMode: 'multiple',
        });

        expect(view.getSelectedTreeItems()).toEqual(['1', '2']);

        await view.setProps({ selectionMode: 'single' });

        expect(view.getSelectedTreeItems()).toEqual(['1']);
      });
    });

    describe('multi selection', () => {
      it('should select an item without clearing the rest of the selection', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
          defaultSelectedItems: ['2'],
          selectionMode: 'multiple',
        });

        act(() => {
          view.actionsRef.current!.setItemSelection('1', true);
        });

        expect(view.getSelectedTreeItems()).toEqual(['1', '2']);
      });

      it('should deselect a single item and leave the others selected', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }, { id: '3' }],
          defaultSelectedItems: ['1', '2', '3'],
          selectionMode: 'multiple',
        });

        act(() => {
          view.actionsRef.current!.setItemSelection('1', false);
        });

        expect(view.getSelectedTreeItems()).toEqual(['2', '3']);
      });

      it('should propagate to the descendants of an already selected item', async () => {
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1' }, { id: '1.2' }] }],
          defaultExpandedItems: ['1'],
          selectionMode: 'multiple',
        });

        fireEvent.click(view.getItemRoot('1'));
        expect(view.getSelectedTreeItems()).toEqual(['1']);

        act(() => {
          view.actionsRef.current!.setItemSelection('1', true);
        });

        expect(view.getSelectedTreeItems()).toEqual(['1', '1.1', '1.2']);
      });
    });
  });

  describe('disableEmptySelection prop', () => {
    describe('single selection', () => {
      it('should not un-select selected item when clicking on its checkbox', async () => {
        const onSelectedItemsChange = vi.fn();
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
          defaultSelectedItems: '1',
          disableEmptySelection: true,
          checkboxSelection: true,
          onSelectedItemsChange,
        });

        expect(view.isItemSelected('1')).toBe(true);
        fireEvent.click(view.getItemRoot('1').querySelector('[role=checkbox]')!);
        expect(view.isItemSelected('1')).toBe(true);
        expect(onSelectedItemsChange).not.toHaveBeenCalled();
      });

      it('should allow selecting a different item', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
          defaultSelectedItems: '1',
          disableEmptySelection: true,
        });

        expect(view.isItemSelected('1')).toBe(true);
        fireEvent.click(view.getItemRoot('2'));
        expect(view.isItemSelected('2')).toBe(true);
        expect(view.isItemSelected('1')).toBe(false);
      });

      it('should not un-select via setItemSelection imperative API', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
          defaultSelectedItems: '1',
          disableEmptySelection: true,
        });

        act(() => {
          view.actionsRef.current!.setItemSelection('1', false);
        });

        expect(view.isItemSelected('1')).toBe(true);
      });
    });

    describe('multi selection', () => {
      it('should not un-select the last selected item when clicking on it with Ctrl', async () => {
        const view = await render({
          selectionMode: 'multiple',
          items: [{ id: '1' }, { id: '2' }],
          defaultSelectedItems: ['1'],
          disableEmptySelection: true,
        });

        expect(view.isItemSelected('1')).toBe(true);
        fireEvent.click(view.getItemRoot('1'), { ctrlKey: true });
        expect(view.isItemSelected('1')).toBe(true);
      });

      it('should allow un-selecting an item when another item is still selected', async () => {
        const view = await render({
          selectionMode: 'multiple',
          items: [{ id: '1' }, { id: '2' }],
          defaultSelectedItems: ['1', '2'],
          disableEmptySelection: true,
        });

        expect(view.getSelectedTreeItems()).toEqual(['1', '2']);
        fireEvent.click(view.getItemRoot('1'), { ctrlKey: true });
        expect(view.getSelectedTreeItems()).toEqual(['2']);
      });

      it('should not un-select the last selected item via checkbox click', async () => {
        const onSelectedItemsChange = vi.fn();
        const view = await render({
          selectionMode: 'multiple',
          items: [{ id: '1' }, { id: '2' }],
          defaultSelectedItems: ['1'],
          disableEmptySelection: true,
          checkboxSelection: true,
          onSelectedItemsChange,
        });

        expect(view.isItemSelected('1')).toBe(true);
        fireEvent.click(view.getItemRoot('1').querySelector('[role=checkbox]')!);
        expect(view.isItemSelected('1')).toBe(true);
        expect(onSelectedItemsChange).not.toHaveBeenCalled();
      });

      it('should not un-select all items via setItemSelection imperative API', async () => {
        const view = await render({
          selectionMode: 'multiple',
          items: [{ id: '1' }, { id: '2' }],
          defaultSelectedItems: ['1'],
          disableEmptySelection: true,
        });

        act(() => {
          view.actionsRef.current!.setItemSelection('1', false);
        });

        expect(view.isItemSelected('1')).toBe(true);
      });

      it('should not count selected ids missing from the items as a remaining selection', async () => {
        const onSelectedItemsChange = vi.fn();
        const view = await render({
          selectionMode: 'multiple',
          items: [{ id: '1' }, { id: '2' }],
          defaultSelectedItems: ['1', '2'],
          disableEmptySelection: true,
          onSelectedItemsChange,
        });

        await view.setItems([{ id: '2' }]);
        fireEvent.click(view.getItemRoot('2'), { ctrlKey: true });

        expect(view.isItemSelected('2')).toBe(true);
        expect(onSelectedItemsChange).not.toHaveBeenCalled();
      });
    });
  });

  describe('isItemSelectionDisabled prop', () => {
    describe('isItemSelectionDisabled as a function', () => {
      it('should not select an item when clicking if isItemSelectionDisabled returns true', async () => {
        const onSelectedItemsChange = vi.fn();
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1' }] }, { id: '2' }],
          defaultExpandedItems: ['1'],
          isItemSelectionDisabled: (item: any) => !!item.children && item.children.length > 0,
          onSelectedItemsChange,
        });

        fireEvent.click(view.getItemRoot('1'));
        expect(onSelectedItemsChange).not.toHaveBeenCalled();

        fireEvent.click(view.getItemRoot('1.1'));
        expect(onSelectedItemsChange).toHaveBeenCalledTimes(1);
        expect(onSelectedItemsChange.mock.calls[0][0]).toBe('1.1');
        expect(view.isItemSelected('1.1')).toBe(true);
      });

      it('should not have aria-selected attribute when item is not selectable (Tree.Item)', async () => {
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1' }] }, { id: '2' }],
          defaultExpandedItems: ['1'],
          isItemSelectionDisabled: (item: any) => !!item.children && item.children.length > 0,
        });

        expect(view.getItemRoot('1')).not.toHaveAttribute('aria-selected');
        expect(view.getItemRoot('1.1')).toHaveAttribute('aria-selected', 'false');
      });

      it('disables the checkbox when the item is not selectable', async () => {
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1' }] }, { id: '2' }],
          checkboxSelection: true,
          defaultExpandedItems: ['1'],
          isItemSelectionDisabled: (item: any) => !!item.children && item.children.length > 0,
        });

        expect(view.getItemRoot('1').querySelector('[role=checkbox]')).toHaveAttribute(
          'aria-disabled',
          'true',
        );
        expect(view.getItemRoot('1.1').querySelector('[role=checkbox]')).toHaveAttribute(
          'aria-checked',
          'false',
        );
      });
    });

    describe('checkbox item interaction', () => {
      it('should not select a non-selectable checkbox item when clicking on it', async () => {
        const onSelectedItemsChange = vi.fn();
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
          checkboxSelection: true,
          isItemSelectionDisabled: (item: any) => item.id === '1',
          onSelectedItemsChange,
        });

        fireEvent.click(view.getItemRoot('1').querySelector('[role=checkbox]')!);
        fireEvent.click(view.getItemRoot('1'));
        expect(onSelectedItemsChange).not.toHaveBeenCalled();

        fireEvent.click(view.getItemRoot('2').querySelector('[role=checkbox]')!);
        expect(onSelectedItemsChange).toHaveBeenCalledTimes(1);
        expect(onSelectedItemsChange.mock.calls[0][0]).toBe('2');
      });
    });

    describe('with multi selection', () => {
      it('should not include non-selectable items when selecting a range', async () => {
        const onSelectedItemsChange = vi.fn();
        const view = await render({
          items: [{ id: '1' }, { id: '2', children: [{ id: '2.1' }] }, { id: '3' }],
          selectionMode: 'multiple',
          isItemSelectionDisabled: (item: any) => !!item.children && item.children.length > 0,
          onSelectedItemsChange,
        });

        fireEvent.click(view.getItemRoot('1'));
        expect(onSelectedItemsChange.mock.calls.at(-1)![0]).toEqual(['1']);

        fireEvent.click(view.getItemRoot('3'), { shiftKey: true });
        expect(onSelectedItemsChange.mock.calls.at(-1)![0]).toEqual(['1', '3']);
      });
    });
  });

  describe('select all ("all" sentinel)', () => {
    it.each([{ disabled: true }, { selectionMode: 'none' }])(
      'keeps the selected items of "all" while interaction is paused with %o',
      async (paused) => {
        const onSelectedItemsChange = vi.fn();
        const view = await render({
          items: [{ id: '1' }, { id: '2', disabled: true }],
          selectionMode: 'multiple',
          defaultSelectedItems: TREE_SELECTION_ALL,
          onSelectedItemsChange,
        });

        await view.setProps(paused);

        expect([...view.actionsRef.current!.getSelectedItemIds()]).toEqual(['1']);
        expect(view.actionsRef.current!.isItemSelected('1')).toBe(true);
        expect(onSelectedItemsChange).not.toHaveBeenCalled();
      },
    );

    it('should render all items as selected when selectedItems="all"', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }, { id: '3' }],
        selectionMode: 'multiple',
        selectedItems: TREE_SELECTION_ALL,
      });

      expect(view.isItemSelected('1')).toBe(true);
      expect(view.isItemSelected('2')).toBe(true);
      expect(view.isItemSelected('3')).toBe(true);
    });

    it('should render all items as selected when defaultSelectedItems="all"', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }, { id: '3' }],
        selectionMode: 'multiple',
        defaultSelectedItems: TREE_SELECTION_ALL,
      });

      expect(view.isItemSelected('1')).toBe(true);
      expect(view.isItemSelected('2')).toBe(true);
      expect(view.isItemSelected('3')).toBe(true);
    });

    it('should not select disabled items when selectedItems="all"', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2', disabled: true }, { id: '3' }],
        selectionMode: 'multiple',
        selectedItems: TREE_SELECTION_ALL,
      });

      expect(view.isItemSelected('1')).toBe(true);
      expect(view.isItemSelected('2')).toBe(false);
      expect(view.isItemSelected('3')).toBe(true);
    });

    it('should materialize "all" into explicit IDs when deselecting an item via Ctrl+click', async () => {
      const onSelectedItemsChange = vi.fn();
      const view = await render({
        items: [{ id: '1' }, { id: '2' }, { id: '3' }],
        selectionMode: 'multiple',
        defaultSelectedItems: TREE_SELECTION_ALL,
        onSelectedItemsChange,
      });

      fireEvent.click(view.getItemRoot('2'), { ctrlKey: true });

      expect(onSelectedItemsChange.mock.calls.length).toBe(1);
      const newSelection = onSelectedItemsChange.mock.calls[0][0] as string[];
      expect(newSelection).toContain('1');
      expect(newSelection).toContain('3');
      expect(newSelection).not.toContain('2');
    });

    it('reports per-item toggles when selecting and materializing all items', async () => {
      const onItemSelectionToggle = vi.fn();
      const view = await render({
        items: [{ id: '1' }, { id: '2' }, { id: '3', disabled: true }],
        selectionMode: 'multiple',
        onItemSelectionToggle,
      });

      act(() => view.getItemRoot('1').focus());
      fireEvent.keyDown(view.getItemRoot('1'), { key: 'a', ctrlKey: true });
      expect(onItemSelectionToggle.mock.calls.map((call) => call[0])).toEqual([
        { itemId: '1', selected: true },
        { itemId: '2', selected: true },
      ]);

      onItemSelectionToggle.mockClear();
      fireEvent.click(view.getItemRoot('2'), { ctrlKey: true });
      expect(onItemSelectionToggle).toHaveBeenCalledWith(
        { itemId: '2', selected: false },
        expect.objectContaining({ reason: 'item-press' }),
      );
    });

    it('does not echo a controlled switch to "all" through onSelectedItemsChange', async () => {
      const onSelectedItemsChange = vi.fn();
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
        selectionMode: 'multiple',
        selectedItems: [],
        onSelectedItemsChange,
      });

      await view.setProps({ selectedItems: TREE_SELECTION_ALL });

      expect(view.isItemSelected('1')).toBe(true);
      expect(view.isItemSelected('2')).toBe(true);
      expect(onSelectedItemsChange).not.toHaveBeenCalled();
    });

    it('should return true from actionsRef.isItemSelected for all items when "all"', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }, { id: '3' }],
        selectionMode: 'multiple',
        selectedItems: TREE_SELECTION_ALL,
      });

      expect(view.actionsRef.current!.isItemSelected('1')).toBe(true);
      expect(view.actionsRef.current!.isItemSelected('2')).toBe(true);
      expect(view.actionsRef.current!.isItemSelected('3')).toBe(true);
    });

    it('should show all checkboxes as checked when selectedItems="all"', async () => {
      const view = await render({
        items: [
          { id: '1', children: [{ id: '1.1' }, { id: '1.2' }] },
          { id: '2' },
          { id: '3', children: [{ id: '3.1' }] },
        ],
        selectionMode: 'multiple',
        checkboxSelection: true,
        selectedItems: TREE_SELECTION_ALL,
        defaultExpandedItems: ['1', '3'],
        isItemSelectionDisabled: (item: any) => item.id === '3',
      });

      const getCheckbox = (id: string) => view.getItemRoot(id).querySelector('[role=checkbox]');
      for (const id of ['1', '1.1', '1.2', '2', '3.1']) {
        expect(getCheckbox(id)).toHaveAttribute('aria-checked', 'true');
      }
      // Not selectable itself, so it reads as checked through its descendants.
      expect(getCheckbox('3')).toHaveAttribute('aria-checked', 'true');
    });

    it('should select children revealed by expanding an item after Ctrl+A', async () => {
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }, { id: '1.2' }] }, { id: '2' }],
        selectionMode: 'multiple',
      });

      // Press Ctrl+A to select all visible items
      act(() => {
        view.getItemRoot('1').focus();
      });
      fireEvent.keyDown(view.getItemRoot('1'), {
        key: 'a',
        keyCode: 65,
        ctrlKey: true,
      });

      // Expand item 1 to reveal its children
      act(() => {
        view.actionsRef.current!.setItemExpansion('1', true);
      });

      // Children should be selected because state is "all"
      expect(view.isItemSelected('1.1')).toBe(true);
      expect(view.isItemSelected('1.2')).toBe(true);
    });
  });

  describe('numeric ids', () => {
    it('should support defaultSelectedItems with a numeric id (single selection)', async () => {
      const view = await render({
        items: [{ id: 1 }, { id: 2 }],
        defaultSelectedItems: 1,
      });

      expect(view.isItemSelected(1)).toBe(true);
      expect(view.isItemSelected(2)).toBe(false);
    });

    it('should select an item with a numeric id on click (single selection)', async () => {
      const onSelectedItemsChange = vi.fn();

      const view = await render({
        items: [{ id: 1 }, { id: 2 }],
        onSelectedItemsChange,
      });

      fireEvent.click(view.getItemRoot(1));

      expect(onSelectedItemsChange.mock.calls.length).toBe(1);
      expect(onSelectedItemsChange.mock.calls.at(-1)![0]).toBe(1);
    });

    it('should support defaultSelectedItems with numeric ids (multiple selection)', async () => {
      const view = await render({
        items: [{ id: 1 }, { id: 2 }, { id: 3 }],
        selectionMode: 'multiple',
        defaultSelectedItems: [1, 3],
      });

      expect(view.isItemSelected(1)).toBe(true);
      expect(view.isItemSelected(2)).toBe(false);
      expect(view.isItemSelected(3)).toBe(true);
    });

    it('should support Ctrl+Click multi-selection with numeric ids', async () => {
      const onSelectedItemsChange = vi.fn();

      const view = await render({
        items: [{ id: 1 }, { id: 2 }, { id: 3 }],
        selectionMode: 'multiple',
        defaultSelectedItems: [1],
        onSelectedItemsChange,
      });

      fireEvent.click(view.getItemRoot(2), { ctrlKey: true });

      expect(onSelectedItemsChange.mock.calls.at(-1)![0]).toEqual([2, 1]);
    });

    it('should support checkbox selection with numeric ids', async () => {
      const onSelectedItemsChange = vi.fn();

      const view = await render({
        items: [{ id: 1 }, { id: 2 }],
        selectionMode: 'multiple',
        checkboxSelection: true,
        onSelectedItemsChange,
      });

      fireEvent.click(view.getItemRoot(1).querySelector('[role=checkbox]')!);

      expect(onSelectedItemsChange.mock.calls.at(-1)![0]).toEqual([1]);
      expect(view.isItemSelected(1)).toBe(true);
    });

    it('should support setItemSelection with numeric ids', async () => {
      const view = await render({
        items: [{ id: 1 }, { id: 2 }],
      });

      expect(view.isItemSelected(1)).toBe(false);
      act(() => {
        view.actionsRef.current!.setItemSelection(1, true);
      });
      expect(view.isItemSelected(1)).toBe(true);
    });

    it('should expand a Shift selection range across a parent with the numeric id 0', async () => {
      const view = await render({
        selectionMode: 'multiple',
        items: [{ id: 0, children: [{ id: 1 }] }, { id: 2 }],
        defaultExpandedItems: [0],
      });

      fireEvent.click(view.getItemRoot(1));
      expect(view.isItemSelected(1)).toBe(true);

      // Climbing out of item 0's subtree must not abort on the falsy `0` parent id.
      fireEvent.click(view.getItemRoot(2), { shiftKey: true });

      expect(view.isItemSelected(1)).toBe(true);
      expect(view.isItemSelected(2)).toBe(true);
    });

    it('prunes removed items from the selection so they do not leak into later callbacks', async () => {
      const onSelectedItemsChange = vi.fn();
      const view = await render({
        selectionMode: 'multiple',
        items: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
        defaultSelectedItems: ['a', 'b'],
        onSelectedItemsChange,
      });

      act(() => {
        view.actionsRef.current!.applyTransaction((transaction) => transaction.remove('b'));
      });

      // Selecting another item must not re-introduce the removed 'b'.
      fireEvent.click(view.getItemRoot('c'), { ctrlKey: true });
      const lastPayload = onSelectedItemsChange.mock.calls.at(-1)![0] as string[];
      expect(lastPayload).not.toContain('b');
      expect(new Set(lastPayload)).toEqual(new Set(['a', 'c']));
    });

    it('should propagate selection to descendants with numeric ids', async () => {
      const onSelectedItemsChange = vi.fn();

      const view = await render({
        selectionMode: 'multiple',
        checkboxSelection: true,
        items: [{ id: 1, children: [{ id: 11 }, { id: 12 }] }],
        defaultExpandedItems: [1],
        checkboxSelectionPropagation: { descendants: true },
        onSelectedItemsChange,
      });

      fireEvent.click(view.getItemRoot(1).querySelector('[role=checkbox]')!);
      expect(onSelectedItemsChange.mock.calls.at(-1)![0]).toEqual([1, 11, 12]);
    });

    it('should propagate selection to parents with numeric ids', async () => {
      const onSelectedItemsChange = vi.fn();

      const view = await render({
        selectionMode: 'multiple',
        checkboxSelection: true,
        items: [{ id: 1, children: [{ id: 11 }] }],
        defaultExpandedItems: [1],
        checkboxSelectionPropagation: { parents: true },
        onSelectedItemsChange,
      });

      fireEvent.click(view.getItemRoot(11).querySelector('[role=checkbox]')!);
      expect(onSelectedItemsChange.mock.calls.at(-1)![0]).toEqual([11, 1]);
    });

    it('should update Shift+Click range correctly with numeric ids', async () => {
      const onSelectedItemsChange = vi.fn();

      const view = await render({
        selectionMode: 'multiple',
        items: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
        onSelectedItemsChange,
      });

      fireEvent.click(view.getItemRoot(2));
      fireEvent.click(view.getItemRoot(4), { shiftKey: true });
      expect(onSelectedItemsChange.mock.calls.at(-1)![0]).toEqual([2, 3, 4]);

      // Shift+Click on a different target should replace the old range
      fireEvent.click(view.getItemRoot(1), { shiftKey: true });
      expect(onSelectedItemsChange.mock.calls.at(-1)![0]).toEqual([1, 2]);
    });
  });

  describe('range selection with a hidden anchor (regression)', () => {
    it('restarts the range when the Shift anchor was hidden by collapsing its ancestor', async () => {
      const onSelectedItemsChange = vi.fn();
      const view = await render({
        selectionMode: 'multiple',
        items: [{ id: 'A' }, { id: 'B', children: [{ id: 'B1' }] }, { id: 'C' }],
        onSelectedItemsChange,
      });

      // Expand B and select its child B1 — this sets the Shift anchor to B1.
      fireEvent.click(view.getItemExpansionTrigger('B')!);
      fireEvent.click(view.getItemRoot('B1'));
      expect(view.isItemSelected('B1')).toBe(true);

      // Collapse B so the anchor (B1) is no longer in the visible flat list.
      fireEvent.click(view.getItemExpansionTrigger('B')!);
      expect(view.isItemExpanded('B')).toBe(false);

      // Shift+Click a visible sibling. This previously threw an "Invalid range"
      // error from the visible-only range walk reaching a hidden endpoint.
      fireEvent.click(view.getItemRoot('A'), { shiftKey: true });

      // The range restarts at the clicked item, extending the selection.
      expect(onSelectedItemsChange.mock.calls.at(-1)![0]).toEqual(['A', 'B1']);
    });
  });

  describe('redundant change events (regression)', () => {
    it('does not fire onSelectedItemsChange when re-clicking an already-selected item', async () => {
      const onSelectedItemsChange = vi.fn();
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
        onSelectedItemsChange,
      });

      fireEvent.click(view.getItemRoot('1'));
      expect(view.isItemSelected('1')).toBe(true);
      expect(onSelectedItemsChange).toHaveBeenCalledTimes(1);

      // Clicking the already-selected item leaves the model unchanged, so no
      // redundant onSelectedItemsChange should fire.
      fireEvent.click(view.getItemRoot('1'));
      expect(onSelectedItemsChange).toHaveBeenCalledTimes(1);
    });
  });
});
