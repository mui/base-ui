import { vi, describe, it, expect, onTestFinished } from 'vitest';
import { ownerDocument } from '@base-ui/utils/owner';
import { AnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { act, fireEvent, waitFor } from '@mui/internal-test-utils';
import { describeTree } from '../../../test/describeTree';
import type { DescribeTreeRendererUtils } from '../../../test/describeTree';

/**
 * All tests related to keyboard navigation (e.g.: type-ahead when using `props.itemFocusableWhenDisabled`)
 * are located in the `TreeRoot.keyboard.test.tsx` file.
 */
describeTree('TreeRoot - Focus', ({ render }) => {
  describe('basic behavior', () => {
    it('should allow to focus an item', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
      });

      fireEvent.focus(view.getItemRoot('2'));
      expect(view.getFocusedItemId()).toBe('2');

      fireEvent.focus(view.getItemRoot('1'));
      expect(view.getFocusedItemId()).toBe('1');
    });

    it('should move DOM focus to a modifier-clicked item', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }, { id: '3' }],
        selectionMode: 'multiple',
      });

      act(() => view.getItemRoot('1').focus());
      fireEvent.mouseDown(view.getItemRoot('2'), { ctrlKey: true });
      fireEvent.click(view.getItemRoot('2'), { ctrlKey: true });

      expect(view.getItemRoot('2')).toHaveFocus();
      fireEvent.keyDown(view.getItemRoot('2'), { key: 'ArrowDown' });
      expect(view.getItemRoot('3')).toHaveFocus();
    });

    it('should focus the next sibling when a focused middle item is removed', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }, { id: '3' }],
      });

      fireEvent.focus(view.getItemRoot('2'));
      expect(view.getFocusedItemId()).toBe('2');

      await view.setItems([{ id: '1' }, { id: '3' }]);
      expect(view.getFocusedItemId()).toBe('3');
    });

    it('should focus the removed item neighbor when another update lands before focus recovers', async () => {
      const view = await render({
        uncontrolled: true,
        items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
      });
      act(() => view.getItemRoot('2').focus());
      act(() => {
        view.actionsRef.current!.applyTransaction((transaction) => transaction.remove('2'));
        view.actionsRef.current!.applyTransaction((transaction) =>
          transaction.update('4', { label: 'Renamed' }),
        );
      });
      await act(async () => {
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => resolve());
        });
      });
      expect(view.getItemRoot('3')).toHaveFocus();
    });

    it('should skip a newly disabled neighbor when recovering removed focus', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
        itemFocusableWhenDisabled: false,
      });
      act(() => view.getItemRoot('2').focus());
      await view.setItems([{ id: '1' }, { id: '3', disabled: true }, { id: '4' }]);
      expect(view.getItemRoot('4')).toHaveFocus();
    });

    it('should focus the previous sibling when the focused last item is removed', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }, { id: '3' }],
      });

      fireEvent.focus(view.getItemRoot('3'));
      expect(view.getFocusedItemId()).toBe('3');

      await view.setItems([{ id: '1' }, { id: '2' }]);
      expect(view.getFocusedItemId()).toBe('2');
    });

    it('should focus the remaining sibling when the focused item is removed and only one sibling is left', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
      });

      fireEvent.focus(view.getItemRoot('2'));
      expect(view.getFocusedItemId()).toBe('2');

      await view.setItems([{ id: '1' }]);
      expect(view.getFocusedItemId()).toBe('1');
    });

    it('should focus the parent when the focused item is removed and has no siblings left', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2', children: [{ id: '2.1' }] }],
        defaultExpandedItems: ['2'],
      });

      fireEvent.focus(view.getItemRoot('2.1'));
      expect(view.getFocusedItemId()).toBe('2.1');

      await view.setItems([{ id: '1' }, { id: '2' }]);
      expect(view.getFocusedItemId()).toBe('2');
    });

    it('should focus the next nested sibling when a focused nested item is removed', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2', children: [{ id: '2.1' }, { id: '2.2' }, { id: '2.3' }] }],
        defaultExpandedItems: ['2'],
      });

      fireEvent.focus(view.getItemRoot('2.2'));
      expect(view.getFocusedItemId()).toBe('2.2');

      await view.setItems([{ id: '1' }, { id: '2', children: [{ id: '2.1' }, { id: '2.3' }] }]);
      expect(view.getFocusedItemId()).toBe('2.3');
    });
  });

  describe('tabIndex HTML attribute', () => {
    it('should remove the remembered tab stop when the root becomes disabled', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
        itemFocusableWhenDisabled: false,
      });
      act(() => {
        view.getItemRoot('2').focus();
        view.getItemRoot('2').blur();
      });
      await view.setProps({ disabled: true });
      expect(view.getItemRoot('1')).toHaveAttribute('tabindex', '-1');
      expect(view.getItemRoot('2')).toHaveAttribute('tabindex', '-1');
    });

    it('should keep disabled items focusable by default', async () => {
      const view = await render({ items: [{ id: '1' }, { id: '2', disabled: true }] });
      act(() => view.getItemRoot('1').focus());
      fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowDown' });
      expect(view.getItemRoot('2')).toHaveFocus();
      expect(view.getItemRoot('2')).toHaveAttribute('aria-disabled', 'true');
    });

    it('should leave a disabled tree out of the tab order and expose it as disabled', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
        disabled: true,
        itemFocusableWhenDisabled: false,
      });
      expect(view.getRoot()).not.toHaveAttribute('tabindex', '0');
      expect(view.getRoot()).toHaveAttribute('aria-disabled', 'true');
      expect(view.getItemRoot('1')).toHaveAttribute('tabindex', '-1');
      await view.setProps({ disabled: false });
      expect(view.getRoot()).not.toHaveAttribute('aria-disabled');
      expect(view.getItemRoot('1')).toHaveAttribute('tabindex', '0');
    });

    it('should keep a row as the tab stop of a disabled tree whose items stay focusable', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
        disabled: true,
        itemFocusableWhenDisabled: true,
      });
      expect(view.getRoot()).not.toHaveAttribute('tabindex', '0');
      expect(view.getRoot()).toHaveAttribute('aria-disabled', 'true');
      expect(view.getItemRoot('1')).toHaveAttribute('tabindex', '0');
    });

    it('should keep roving tabIndex consistent with the real active element', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }, { id: '3' }],
      });

      act(() => {
        view.getItemRoot('1').focus();
      });

      // The focused row is the active element and is the only tabbable row.
      expect(view.getItemRoot('1')).toHaveFocus();
      expect(view.getItemRoot('1').tabIndex).toBe(0);
      expect(view.getItemRoot('2').tabIndex).toBe(-1);
      expect(view.getItemRoot('3').tabIndex).toBe(-1);

      fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowDown' });

      // After moving, tabbability follows the real focus onto the new row.
      expect(view.getItemRoot('2')).toHaveFocus();
      expect(view.getItemRoot('2').tabIndex).toBe(0);
      expect(view.getItemRoot('1').tabIndex).toBe(-1);
      expect(view.getItemRoot('3').tabIndex).toBe(-1);
    });

    it('should set tabIndex={0} on the first item if none are selected', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
      });

      expect(view.getItemRoot('1').tabIndex).toBe(0);
      expect(view.getItemRoot('2').tabIndex).toBe(-1);
    });

    it('should set tabIndex={0} on the selected item (single selection)', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
        selectedItems: '2',
      });

      expect(view.getItemRoot('1').tabIndex).toBe(-1);
      expect(view.getItemRoot('2').tabIndex).toBe(0);
    });

    it('should set tabIndex={0} on the first selected item (multi selection)', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }, { id: '3' }],
        selectedItems: ['2', '3'],
        selectionMode: 'multiple',
      });

      expect(view.getItemRoot('1').tabIndex).toBe(-1);
      expect(view.getItemRoot('2').tabIndex).toBe(0);
      expect(view.getItemRoot('3').tabIndex).toBe(-1);
    });

    it('should set tabIndex={0} on the first visible selected item (multi selection)', async () => {
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }, { id: '2' }, { id: '3' }],
        selectedItems: ['1.1', '3'],
        selectionMode: 'multiple',
      });

      expect(view.getItemRoot('1').tabIndex).toBe(-1);
      expect(view.getItemRoot('2').tabIndex).toBe(-1);
      expect(view.getItemRoot('3').tabIndex).toBe(0);
    });

    it('should set tabIndex={0} on the first item if selected item is not visible', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2', children: [{ id: '2.1' }] }],
        selectedItems: '2.1',
      });

      expect(view.getItemRoot('1').tabIndex).toBe(0);
      expect(view.getItemRoot('2').tabIndex).toBe(-1);
    });

    it('should set tabIndex={0} on the first item if no selected item is visible', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2', children: [{ id: '2.1' }, { id: '2.2' }] }],
        selectedItems: ['2.1', '2.2'],
        selectionMode: 'multiple',
      });

      expect(view.getItemRoot('1').tabIndex).toBe(0);
      expect(view.getItemRoot('2').tabIndex).toBe(-1);
    });
  });

  describe('focusItem api method', () => {
    it('should focus the item', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
      });

      act(() => {
        view.actionsRef.current!.focusItem('2');
      });

      expect(view.getFocusedItemId()).toBe('2');
    });

    it('should not focus item if parent is collapsed', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2', children: [{ id: '2.1' }] }],
      });

      act(() => {
        view.actionsRef.current!.focusItem('2.1');
      });

      expect(view.getFocusedItemId()).toBe(null);
    });

    it('should not focus item if grandparent is collapsed', async () => {
      const view = await render({
        items: [
          { id: '1' },
          {
            id: '2',
            children: [{ id: '2.1', children: [{ id: '2.1.1' }] }],
          },
        ],
        defaultExpandedItems: ['2.1'],
      });

      act(() => {
        view.actionsRef.current!.focusItem('2.1.1');
      });

      expect(view.getFocusedItemId()).toBe(null);
    });

    it('should focus a deeply nested item if all ancestors are expanded', async () => {
      const view = await render({
        items: [
          { id: '1' },
          {
            id: '2',
            children: [{ id: '2.1', children: [{ id: '2.1.1' }] }],
          },
        ],
        defaultExpandedItems: ['2', '2.1'],
      });

      act(() => {
        view.actionsRef.current!.focusItem('2.1.1');
      });

      expect(view.getFocusedItemId()).toBe('2.1.1');
    });

    it('should not focus a disabled item when disabled items are not focusable', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2', disabled: true }],
        itemFocusableWhenDisabled: false,
      });

      act(() => {
        view.getItemRoot('1').focus();
        view.actionsRef.current!.focusItem('2');
      });

      expect(view.getItemRoot('1')).toHaveFocus();
      expect(view.getFocusedItemId()).toBe('1');
    });
  });

  describe('getFocusedItemId api method', () => {
    it('should return null when no item is focused', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
      });

      expect(view.actionsRef.current!.getFocusedItemId()).toBe(null);
    });

    it('should return the focused item id', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
      });

      act(() => {
        view.actionsRef.current!.focusItem('2');
      });

      expect(view.actionsRef.current!.getFocusedItemId()).toBe('2');
    });
  });

  it('marks the focused item with data-highlighted', async () => {
    const view = await render({ items: [{ id: '1' }, { id: '2' }] });

    act(() => {
      view.getItemRoot('2').focus();
    });

    expect(view.getItemRoot('2')).toHaveAttribute('data-highlighted');
    expect(view.getItemRoot('1')).not.toHaveAttribute('data-highlighted');
  });

  describe('onItemHighlighted prop', () => {
    it('should be called when an item is focused', async () => {
      const onItemHighlighted = vi.fn();

      const view = await render({
        items: [{ id: '1' }],
        onItemHighlighted,
      });

      act(() => {
        view.getItemRoot('1').focus();
      });

      expect(onItemHighlighted.mock.calls.length).toBe(1);
      expect(onItemHighlighted.mock.calls.at(-1)![0]).toBe('1');
      expect(onItemHighlighted.mock.calls.at(-1)![1]).toHaveProperty('reason', 'none');
      expect(onItemHighlighted.mock.calls.at(-1)![1]).toHaveProperty('event');
    });

    it.each([
      { input: 'an arrow key', reason: 'keyboard', eventType: 'keydown' },
      { input: 'a press', reason: 'item-press', eventType: 'mousedown' },
      { input: 'actionsRef.focusItem()', reason: 'imperative-action', eventType: 'base-ui' },
      { input: 'the removal of the focused item', reason: 'none', eventType: 'base-ui' },
    ])('passes the event that moved focus with $input', async ({ input, reason, eventType }) => {
      const onItemHighlighted = vi.fn();
      const view = await render({ items: [{ id: '1' }, { id: '2' }], onItemHighlighted });

      if (input === 'an arrow key') {
        act(() => {
          view.getItemRoot('1').focus();
        });
        fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowDown' });
      } else if (input === 'a press') {
        fireEvent.mouseDown(view.getItemRoot('2'));
        act(() => {
          view.getItemRoot('2').focus();
        });
      } else if (input === 'actionsRef.focusItem()') {
        act(() => {
          view.actionsRef.current!.focusItem('2');
        });
      } else {
        act(() => {
          view.getItemRoot('1').focus();
        });
        await act(async () => {
          await view.actionsRef.current!.applyTransaction((transaction) => transaction.remove('1'));
        });
      }

      // Focus recovery after a removal can land a frame later.
      await waitFor(() => expect(onItemHighlighted.mock.calls.at(-1)?.[0]).toBe('2'));
      const details = onItemHighlighted.mock.calls.at(-1)![1];
      expect(details.reason).toBe(reason);
      expect(details.event.type).toBe(eventType);
    });

    it('should not report item-press after a prevented press on a disabled item', async () => {
      // The press reason is latched on mousedown, before the disabled handling
      // prevents focus from moving at all. Nothing reset it, so the *next* focus
      // — a Tab to a different row — reported `item-press`.
      const onItemHighlighted = vi.fn();

      const view = await render({
        items: [{ id: '1', disabled: true }, { id: '2' }],
        onItemHighlighted,
      });

      fireEvent.mouseDown(view.getItemRoot('1'));
      expect(onItemHighlighted).not.toHaveBeenCalled();

      act(() => {
        view.getItemRoot('2').focus();
      });

      expect(onItemHighlighted.mock.calls.at(-1)![0]).toBe('2');
      expect(onItemHighlighted.mock.calls.at(-1)![1]).toHaveProperty('reason', 'none');
    });

    it('should report none when focus returns to a clicked item from outside the tree', async () => {
      const onItemHighlighted = vi.fn();
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
        onItemHighlighted,
      });

      fireEvent.mouseDown(view.getItemRoot('1'));
      act(() => {
        view.getItemRoot('1').focus();
      });
      fireEvent.click(view.getItemRoot('1'));
      expect(onItemHighlighted.mock.calls.at(-1)![1]).toHaveProperty('reason', 'item-press');

      act(() => {
        view.getItemRoot('1').blur();
      });
      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 0);
        });
      });
      act(() => {
        view.getItemRoot('1').focus();
      });

      expect(onItemHighlighted).toHaveBeenCalledTimes(3);
      expect(onItemHighlighted.mock.calls.at(-1)![1]).toHaveProperty('reason', 'none');
    });

    it('reports undefined when focus leaves the tree', async () => {
      const onItemHighlighted = vi.fn();
      const view = await render({ items: [{ id: '1' }], onItemHighlighted });

      act(() => {
        view.getItemRoot('1').focus();
      });
      act(() => {
        view.getItemRoot('1').blur();
      });

      expect(onItemHighlighted).toHaveBeenCalledTimes(2);
      expect(onItemHighlighted.mock.calls.at(-1)![0]).toBe(undefined);
      expect(onItemHighlighted.mock.calls.at(-1)![1]).toHaveProperty('reason', 'none');
      expect(view.getItemRoot('1')).not.toHaveAttribute('data-highlighted');
    });

    it('reports undefined when the highlighted item is removed and no item is left', async () => {
      const onItemHighlighted = vi.fn();
      const view = await render({ items: [{ id: '1' }], onItemHighlighted });

      act(() => {
        view.getItemRoot('1').focus();
      });
      await act(async () => {
        await view.actionsRef.current!.applyTransaction((transaction) => transaction.remove('1'));
      });

      expect(onItemHighlighted).toHaveBeenCalledTimes(2);
      expect(onItemHighlighted.mock.calls.at(-1)![0]).toBe(undefined);
      expect(onItemHighlighted.mock.calls.at(-1)![1]).toHaveProperty('reason', 'none');
    });
  });

  describe('expansion trigger', () => {
    it('should keep focus on the treeitem when the chevron is pressed', async () => {
      // The chevron has `tabIndex={-1}`: a native button takes focus on
      // pointerdown, which parked DOM focus outside the roving tab order.
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }],
      });

      const trigger = view.getItemRoot('1').querySelector('button')!;
      fireEvent.pointerDown(trigger);
      fireEvent.click(trigger);

      expect(document.activeElement).toBe(view.getItemRoot('1'));
      expect(view.getFocusedItemId()).toBe('1');
    });

    it('should report item-press when the chevron focuses the treeitem', async () => {
      const onItemHighlighted = vi.fn();
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }],
        onItemHighlighted,
      });

      fireEvent.pointerDown(view.getItemExpansionTrigger('1')!);

      expect(onItemHighlighted).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ reason: 'item-press' }),
      );
    });
  });

  describe('removal reconciliation', () => {
    it.each([false, true])(
      'should focus the empty tree after removing its final item (uncontrolled: %s)',
      async (uncontrolled) => {
        const view = await render({ uncontrolled, items: [{ id: '1' }] });
        act(() => view.getItemRoot('1').focus());

        if (uncontrolled) {
          await act(async () =>
            view.actionsRef.current!.applyTransaction((transaction) => transaction.remove('1')),
          );
        } else {
          await view.setItems([]);
        }
        await act(async () => {
          await new Promise<void>((resolve) => {
            AnimationFrame.request(() => resolve());
          });
        });

        expect(view.getRoot()).toHaveAttribute('tabindex', '0');
        expect(view.getRoot()).toHaveFocus();
        expect(view.getFocusedItemId()).toBe(null);
      },
    );

    it('should not reclaim focus moved outside after removing the final item', async () => {
      const view = await render({ uncontrolled: true, items: [{ id: '1' }] });
      const doc = ownerDocument(view.getRoot());
      const outside = doc.createElement('button');
      doc.body.appendChild(outside);
      try {
        act(() => view.getItemRoot('1').focus());
        await act(async () => {
          view.actionsRef.current!.applyTransaction((transaction) => transaction.remove('1'));
          outside.focus();
        });
        await act(async () => {
          await new Promise<void>((resolve) => {
            AnimationFrame.request(() => resolve());
          });
        });
        expect(outside).toHaveFocus();
      } finally {
        outside.remove();
      }
    });

    it('should move focus to a neighbour when the focused item is removed', async () => {
      // Recovery works out the neighbour from the id that was focused, so
      // clearing `focusedItemId` as part of the removal left it nothing to work
      // from and focus fell to `<body>`.
      const view = await render({
        uncontrolled: true,
        items: [{ id: '1' }, { id: '2' }, { id: '3' }],
      });

      act(() => {
        view.getItemRoot('2').focus();
      });
      expect(view.getFocusedItemId()).toBe('2');

      await act(async () => {
        view.actionsRef.current!.applyTransaction((transaction) => transaction.remove('2'));
      });
      await act(async () => {
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => resolve());
        });
      });

      expect(document.body).not.toBe(document.activeElement);
      expect(view.getFocusedItemId()).toBe('3');
    });
  });

  describe('itemFocusableWhenDisabled prop', () => {
    describe('disabledItemFocusable={false}', () => {
      it('should prevent focus by mouse', async () => {
        const view = await render({
          items: [{ id: '1', disabled: true }],
          itemFocusableWhenDisabled: false,
        });

        fireEvent.click(view.getItemRoot('1'));
        expect(view.getFocusedItemId()).toBe(null);
      });

      it('should not forward modifier focus to a disabled item', async () => {
        const outside = document.createElement('button');
        document.body.appendChild(outside);
        const view = await render({
          items: [{ id: '1', disabled: true }, { id: '2' }],
          itemFocusableWhenDisabled: false,
        });
        outside.focus();

        fireEvent.mouseDown(view.getItemRoot('1'), { ctrlKey: true });

        expect(outside).toHaveFocus();
        expect(view.getFocusedItemId()).toBe(null);
        outside.remove();
      });

      it('should set tabIndex={-1} on the disabled item and tabIndex={0} on the first non-disabled item', async () => {
        const view = await render({
          items: [{ id: '1', disabled: true }, { id: '2' }, { id: '3' }],
          itemFocusableWhenDisabled: false,
        });

        expect(view.getItemRoot('1').tabIndex).toBe(-1);
        expect(view.getItemRoot('2').tabIndex).toBe(0);
        expect(view.getItemRoot('3').tabIndex).toBe(-1);
      });

      it('should move focus when the focused item becomes disabled', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }, { id: '3' }],
          uncontrolled: true,
          itemFocusableWhenDisabled: false,
          isItemDisabled: (item: { disabled?: boolean }) => item.disabled ?? false,
          setItemDisabled: (item: { disabled?: boolean }, disabled: boolean) => ({
            ...item,
            disabled,
          }),
        });

        act(() => {
          view.getItemRoot('2').focus();
          view.actionsRef.current!.applyTransaction((transaction) =>
            transaction.update('2', { disabled: true }),
          );
        });

        expect(view.getItemRoot('2').tabIndex).toBe(-1);
        expect(view.getItemRoot('3').tabIndex).toBe(0);
        expect(view.getFocusedItemId()).toBe('3');
      });

      it.each([
        {
          change: 'disables the focused item and adds a sibling',
          items: [{ id: '1', disabled: true }, { id: '2' }],
          expected: '2',
        },
        {
          change: 'moves the focused item into a new collapsed parent',
          items: [{ id: 'parent', children: [{ id: '1' }] }],
          expected: 'parent',
        },
        {
          change: 'moves the focused item into a collapsed parent that cannot take focus',
          items: [{ id: 'parent', disabled: true, children: [{ id: '1' }] }, { id: '2' }],
          expected: '2',
        },
      ])('should focus the new row when an update $change', async ({ items, expected }) => {
        const view = await render({ items: [{ id: '1' }], itemFocusableWhenDisabled: false });
        act(() => {
          view.getItemRoot('1').focus();
        });

        await view.setProps({ items });
        await act(async () => {
          await new Promise<void>((resolve) => {
            requestAnimationFrame(() => resolve());
          });
        });

        expect(view.getItemRoot(expected)).toHaveFocus();
        expect(view.getFocusedItemId()).toBe(expected);
      });

      it('should move focus to the tree root when every item becomes disabled', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
          itemFocusableWhenDisabled: false,
        });

        act(() => {
          view.getItemRoot('1').focus();
        });
        await view.setProps({ disabled: true });
        await act(async () => {
          await new Promise<void>((resolve) => {
            requestAnimationFrame(() => resolve());
          });
        });

        expect(view.getItemRoot('1').tabIndex).toBe(-1);
        expect(view.getItemRoot('2').tabIndex).toBe(-1);
        // Focusable, but out of the tab order.
        expect(view.getRoot()).toHaveAttribute('tabindex', '-1');
        expect(document.activeElement).toBe(view.getRoot());
      });
    });

    describe('disabledItemFocusable={true}', () => {
      it('should prevent focus by mouse', async () => {
        const view = await render({
          items: [{ id: '1', disabled: true }],
          itemFocusableWhenDisabled: true,
        });

        fireEvent.click(view.getItemRoot('1'));
        expect(view.getFocusedItemId()).toBe(null);
      });

      it('should set tabIndex={0} on the disabled item and tabIndex={-1} on the other items', async () => {
        const view = await render({
          items: [{ id: '1', disabled: true }, { id: '2' }, { id: '3' }],
          itemFocusableWhenDisabled: true,
        });

        expect(view.getItemRoot('1').tabIndex).toBe(0);
        expect(view.getItemRoot('2').tabIndex).toBe(-1);
        expect(view.getItemRoot('3').tabIndex).toBe(-1);
      });
    });
  });

  describe('tab stop edge cases', () => {
    async function flushFrame() {
      await act(async () => {
        await new Promise<void>((resolve) => {
          AnimationFrame.request(() => resolve());
        });
      });
    }

    // Moves focus to a button outside the tree, removed when the test ends.
    function focusOutside(root: HTMLElement) {
      const doc = ownerDocument(root);
      const outside = doc.createElement('button');
      doc.body.appendChild(outside);
      onTestFinished(() => outside.remove());
      act(() => outside.focus());
      return outside;
    }

    function getTabStops(view: DescribeTreeRendererUtils) {
      return view.getAllTreeItemIds().filter((id) => view.getItemRoot(id).tabIndex === 0);
    }

    const NESTED = [{ id: 'a' }, { id: 'b', children: [{ id: 'b1' }] }];

    it('should move focus to the ancestor when a controlled collapse hides the focused row', async () => {
      const view = await render({ items: NESTED, expandedItems: ['b'] });
      act(() => view.getItemRoot('b1').focus());

      await view.setProps({ expandedItems: [] });
      await flushFrame();

      expect(view.getFocusedItemId()).toBe('b');
    });

    it('should keep a visible tab stop when a controlled collapse hides the row focused last', async () => {
      const view = await render({ items: NESTED, expandedItems: ['b'] });
      act(() => view.getItemRoot('b1').focus());
      const outside = focusOutside(view.getRoot());

      await view.setProps({ expandedItems: [] });
      await flushFrame();

      expect(outside).toHaveFocus();
      expect(getTabStops(view)).toEqual(['a']);
    });

    it('should keep a visible tab stop when the filter hides the row focused last', async () => {
      const view = await render({
        items: [
          { id: 'apple', label: 'Apple' },
          { id: 'banana', label: 'Banana' },
        ],
        filterValue: '',
      });
      act(() => view.getItemRoot('banana').focus());
      const outside = focusOutside(view.getRoot());

      await view.setProps({ filterValue: 'apple' });
      await flushFrame();

      expect(outside).toHaveFocus();
      expect(getTabStops(view)).toEqual(['apple']);
    });

    it('should move the tab stop to the next row when the app removes the row focused last', async () => {
      const view = await render({ items: [{ id: '1' }, { id: '2' }, { id: '3' }] });
      act(() => view.getItemRoot('2').focus());
      const outside = focusOutside(view.getRoot());

      await view.setItems([{ id: '1' }, { id: '3' }]);

      expect(outside).toHaveFocus();
      expect(getTabStops(view)).toEqual(['3']);
    });

    it('should move the tab stop to the previous row when the removed row focused last was the last one', async () => {
      const view = await render({ items: [{ id: '1' }, { id: '2' }, { id: '3' }] });
      act(() => view.getItemRoot('3').focus());
      const outside = focusOutside(view.getRoot());

      await view.setItems([{ id: '1' }, { id: '2' }]);

      expect(outside).toHaveFocus();
      expect(getTabStops(view)).toEqual(['2']);
    });

    it('should move focus to the first row when rows arrive in an empty focused tree', async () => {
      const view = await render({ items: [] });
      act(() => view.getRoot().focus());
      expect(view.getRoot()).toHaveFocus();

      await view.setItems([{ id: '1' }, { id: '2' }]);
      await flushFrame();

      expect(view.getFocusedItemId()).toBe('1');
      fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowDown' });
      expect(view.getFocusedItemId()).toBe('2');
    });
  });

  describe('tree root focus behavior', () => {
    it('should focus the first selected item when the tree root receives focus', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }, { id: '3' }],
        selectedItems: '2',
      });

      fireEvent.focus(view.getRoot());
      expect(view.getFocusedItemId()).toBe('2');
    });

    it('should focus the first item when the tree root receives focus and no item is selected', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }, { id: '3' }],
      });

      fireEvent.focus(view.getRoot());
      expect(view.getFocusedItemId()).toBe('1');
    });
  });
});
