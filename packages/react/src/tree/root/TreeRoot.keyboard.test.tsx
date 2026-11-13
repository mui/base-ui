import { describe, it, expect, vi } from 'vitest';
import * as React from 'react';
import { act, fireEvent, screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { DirectionProvider } from '../../direction-provider';
import { describeTree } from '../../../test/describeTree';
import { TREE_SELECTION_ALL } from '../store/types';
import type { TreeDefaultItem } from '../store/types';
import { selectors } from '../store/selectors';
import { Tree } from '..';

const { render: renderElement } = createRenderer();

describeTree('TreeRoot - Keyboard', ({ render }) => {
  it('should ignore select-all when the root is disabled but rows are focusable', async () => {
    const onSelectedItemsChange = vi.fn();
    const view = await render({
      items: [{ id: '1' }, { id: '2' }],
      selectionMode: 'multiple',
      disabled: true,
      itemFocusableWhenDisabled: true,
      onSelectedItemsChange,
    });
    act(() => view.getItemRoot('1').focus());
    fireEvent.keyDown(view.getItemRoot('1'), { key: 'a', ctrlKey: true });
    expect(onSelectedItemsChange).not.toHaveBeenCalled();
    expect(view.isItemSelected('1')).toBe(false);
  });

  describe('Navigation (focus and expansion)', () => {
    describe('key: ArrowDown', () => {
      it('should move the focus to a sibling item', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
        });

        act(() => {
          view.getItemRoot('1').focus();
        });
        fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowDown' });
        expect(view.getFocusedItemId()).toBe('2');
      });

      it('should move the focus to a child item', async () => {
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1' }] }],
          defaultExpandedItems: ['1'],
        });

        act(() => {
          view.getItemRoot('1').focus();
        });
        fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowDown' });
        expect(view.getFocusedItemId()).toBe('1.1');
      });

      it('should move the focus to a child item with a dynamic tree', async () => {
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1' }] }, { id: '2' }],
          defaultExpandedItems: ['1'],
        });

        await view.setItems([{ id: '2' }]);
        await view.setItems([{ id: '1', children: [{ id: '1.1' }] }, { id: '2' }]);
        act(() => {
          view.getItemRoot('1').focus();
        });
        fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowDown' });
        expect(view.getFocusedItemId()).toBe('1.1');
      });

      it("should move the focus to a parent's sibling", async () => {
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1' }, { id: '2' }] }],
          defaultExpandedItems: ['1'],
        });

        act(() => {
          view.getItemRoot('1.1').focus();
        });
        fireEvent.keyDown(view.getItemRoot('1.1'), { key: 'ArrowDown' });
        expect(view.getFocusedItemId()).toBe('2');
      });

      it('should skip disabled items', async () => {
        const view = await render({
          itemFocusableWhenDisabled: false,
          items: [{ id: '1' }, { id: '2', disabled: true }, { id: '3' }],
        });

        act(() => {
          view.getItemRoot('1').focus();
        });
        fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowDown' });
        expect(view.getFocusedItemId()).toBe('3');
      });

      it('should not skip disabled items if itemFocusableWhenDisabled={true}', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2', disabled: true }, { id: '3' }],
          itemFocusableWhenDisabled: true,
        });

        act(() => {
          view.getItemRoot('1').focus();
        });
        fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowDown' });
        expect(view.getFocusedItemId()).toBe('2');
      });

      it('should skip the rows of an expanded disabled item at once', async () => {
        const children = Array.from({ length: 200 }, (_, index) => ({ id: `2.${index}` }));
        const view = await render({
          itemFocusableWhenDisabled: false,
          items: [{ id: '1' }, { id: '2', disabled: true, children }, { id: '3' }],
          defaultExpandedItems: ['2'],
        });
        const canItemBeFocused = vi.spyOn(selectors, 'canItemBeFocused');

        act(() => {
          view.getItemRoot('1').focus();
        });
        fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowDown' });
        expect(view.getFocusedItemId()).toBe('3');
        fireEvent.keyDown(view.getItemRoot('3'), { key: 'ArrowUp' });
        expect(view.getFocusedItemId()).toBe('1');

        expect(canItemBeFocused.mock.calls.length).toBeLessThan(children.length);
        canItemBeFocused.mockRestore();
      });

      it('should not move the focus when the last item is focused', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
        });

        act(() => {
          view.getItemRoot('2').focus();
        });
        expect(fireEvent.keyDown(view.getItemRoot('2'), { key: 'ArrowDown' })).toBe(false);
        expect(view.getFocusedItemId()).toBe('2');
      });
    });

    describe('key: ArrowUp', () => {
      it('should move the focus to a sibling item', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
        });

        act(() => {
          view.getItemRoot('2').focus();
        });
        fireEvent.keyDown(view.getItemRoot('2'), { key: 'ArrowUp' });
        expect(view.getFocusedItemId()).toBe('1');
      });

      it('should move the focus to a parent', async () => {
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1' }] }],
          defaultExpandedItems: ['1'],
        });

        act(() => {
          view.getItemRoot('1.1').focus();
        });
        fireEvent.keyDown(view.getItemRoot('1.1'), { key: 'ArrowUp' });
        expect(view.getFocusedItemId()).toBe('1');
      });

      it("should move the focus to a sibling's child", async () => {
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1' }] }, { id: '2' }],
          defaultExpandedItems: ['1'],
        });

        act(() => {
          view.getItemRoot('2').focus();
        });
        fireEvent.keyDown(view.getItemRoot('2'), { key: 'ArrowUp' });
        expect(view.getFocusedItemId()).toBe('1.1');
      });

      it('should move the focus to the last visible and enabled descendant of the previous sibling', async () => {
        const view = await render({
          items: [
            {
              id: '1',
              children: [
                { id: '1-1' },
                {
                  id: '1-2',
                  children: [{ id: '1-2-1' }, { id: '1-2-2' }, { id: '1-2-3' }],
                },
              ],
            },
            { id: '2' },
          ],
          defaultExpandedItems: ['1', '1-2'],
        });

        act(() => {
          view.getItemRoot('2').focus();
        });
        fireEvent.keyDown(view.getItemRoot('2'), { key: 'ArrowUp' });
        expect(view.getFocusedItemId()).toBe('1-2-3');
      });

      it('should move the focus to the last visible descendant of the previous sibling, skipping disabled items', async () => {
        const view = await render({
          itemFocusableWhenDisabled: false,
          items: [
            {
              id: '1',
              children: [
                { id: '1-1' },
                {
                  id: '1-2',
                  children: [{ id: '1-2-1' }, { id: '1-2-2' }, { id: '1-2-3', disabled: true }],
                },
              ],
            },
            { id: '2' },
          ],
          defaultExpandedItems: ['1', '1-2'],
        });

        act(() => {
          view.getItemRoot('2').focus();
        });
        fireEvent.keyDown(view.getItemRoot('2'), { key: 'ArrowUp' });
        expect(view.getFocusedItemId()).toBe('1-2-2');
      });

      it('should skip disabled items', async () => {
        const view = await render({
          itemFocusableWhenDisabled: false,
          items: [{ id: '1' }, { id: '2', disabled: true }, { id: '3' }],
        });

        act(() => {
          view.getItemRoot('3').focus();
        });
        fireEvent.keyDown(view.getItemRoot('3'), { key: 'ArrowUp' });
        expect(view.getFocusedItemId()).toBe('1');
      });

      it('should not skip disabled items if itemFocusableWhenDisabled={true}', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2', disabled: true }, { id: '3' }],
          itemFocusableWhenDisabled: true,
        });

        act(() => {
          view.getItemRoot('3').focus();
        });
        fireEvent.keyDown(view.getItemRoot('3'), { key: 'ArrowUp' });
        expect(view.getFocusedItemId()).toBe('2');
      });

      it('should not move the focus when the first item is focused', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
        });

        act(() => {
          view.getItemRoot('1').focus();
        });
        expect(fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowUp' })).toBe(false);
        expect(view.getFocusedItemId()).toBe('1');
      });
    });

    describe('key: ArrowRight', () => {
      it('should open the item and not move the focus if the focus is on a closed item', async () => {
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1' }] }],
        });

        act(() => {
          view.getItemRoot('1').focus();
        });
        fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowRight' });
        expect(view.isItemExpanded('1')).toBe(true);
        expect(view.getFocusedItemId()).toBe('1');
      });

      it('should not change focus if ctrl is pressed', async () => {
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1' }] }],
          defaultExpandedItems: ['1'],
        });

        act(() => {
          view.getItemRoot('1').focus();
        });
        fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowRight', ctrlKey: true });
        expect(view.getFocusedItemId()).toBe('1');
      });

      it('should move the focus to the first child if the focus is on an open item', async () => {
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1' }] }],
          defaultExpandedItems: ['1'],
        });

        act(() => {
          view.getItemRoot('1').focus();
        });
        fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowRight' });
        expect(view.getFocusedItemId()).toBe('1.1');
      });

      it('should not move to a sibling when an expanded item has no focusable child', async () => {
        const view = await render({
          itemFocusableWhenDisabled: false,
          items: [{ id: '1', children: [{ id: '1.1', disabled: true }] }, { id: '2' }],
          defaultExpandedItems: ['1'],
        });

        act(() => view.getItemRoot('1').focus());
        fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowRight' });

        expect(view.getItemRoot('1')).toHaveFocus();
      });

      it('should do nothing if the focus is on a leaf', async () => {
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1' }] }],
          defaultExpandedItems: ['1'],
        });

        act(() => {
          view.getItemRoot('1.1').focus();
        });
        expect(fireEvent.keyDown(view.getItemRoot('1.1'), { key: 'ArrowRight' })).toBe(false);
        expect(view.getFocusedItemId()).toBe('1.1');
      });

      it('should not expand an item with children if it is collapsed but disabled even if itemFocusableWhenDisabled={true}', async () => {
        const view = await render({
          items: [{ id: '1', disabled: true, children: [{ id: '1.1' }] }],
          itemFocusableWhenDisabled: true,
        });

        act(() => {
          view.getItemRoot('1').focus();
        });
        fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowRight' });
        expect(view.isItemExpanded('1')).toBe(false);
      });
    });

    describe('key: ArrowLeft', () => {
      it('should close the item if the focus is on an open item', async () => {
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1' }] }],
          defaultExpandedItems: ['1'],
        });

        act(() => {
          view.getItemRoot('1').focus();
        });
        expect(fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowLeft' })).toBe(false);
        expect(view.isItemExpanded('1')).toBe(false);
      });

      it('should not change focus if ctrl is pressed', async () => {
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1' }] }],
          defaultExpandedItems: ['1'],
        });

        act(() => {
          view.getItemRoot('1.1').focus();
        });
        fireEvent.keyDown(view.getItemRoot('1.1'), { key: 'ArrowLeft', ctrlKey: true });
        expect(view.getFocusedItemId()).toBe('1.1');
      });

      it("should move focus to the item's parent if the focus is on a child item that is a leaf", async () => {
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1' }] }],
          defaultExpandedItems: ['1'],
        });

        act(() => {
          view.getItemRoot('1.1').focus();
        });
        fireEvent.keyDown(view.getItemRoot('1.1'), { key: 'ArrowLeft' });
        expect(view.getFocusedItemId()).toBe('1');
        expect(view.isItemExpanded('1')).toBe(true);
      });

      it("should move the focus to the item's parent if the focus is on a child item that is closed", async () => {
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1', children: [{ id: '1.1.1' }] }] }],
          defaultExpandedItems: ['1'],
        });

        act(() => {
          view.getItemRoot('1.1').focus();
        });
        fireEvent.keyDown(view.getItemRoot('1.1'), { key: 'ArrowLeft' });
        expect(view.getFocusedItemId()).toBe('1');
        expect(view.isItemExpanded('1')).toBe(true);
      });

      it('should do nothing if the focus is on a root item that is closed', async () => {
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1' }] }],
        });

        act(() => {
          view.getItemRoot('1').focus();
        });
        fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowLeft' });
        expect(view.getFocusedItemId()).toBe('1');
        expect(view.isItemExpanded('1')).toBe(false);
      });

      it('should do nothing if the focus is on a root item that is a leaf', async () => {
        const view = await render({
          items: [{ id: '1' }],
        });

        act(() => {
          view.getItemRoot('1').focus();
        });
        expect(fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowLeft' })).toBe(false);
        expect(view.getFocusedItemId()).toBe('1');
      });

      it('should not collapse an item with children if it is collapsed but disabled even if itemFocusableWhenDisabled={true}', async () => {
        const view = await render({
          items: [{ id: '1', disabled: true, children: [{ id: '1.1' }] }],
          defaultExpandedItems: ['1'],
          itemFocusableWhenDisabled: true,
        });

        act(() => {
          view.getItemRoot('1').focus();
        });
        fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowLeft' });
        expect(view.isItemExpanded('1')).toBe(true);
      });
    });

    describe('key: Home', () => {
      it('should move the focus to the first item in the tree', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
        });

        act(() => {
          view.getItemRoot('4').focus();
        });
        fireEvent.keyDown(view.getItemRoot('4'), { key: 'Home' });
        expect(view.getFocusedItemId()).toBe('1');
      });
    });

    describe('key: End', () => {
      it('should move the focus to the last item in the tree when the last item is not expanded', async () => {
        const view = await render({
          items: [
            { id: '1' },
            { id: '2' },
            { id: '3' },
            { id: '4', children: [{ id: '4.1' }, { id: '4.2' }] },
          ],
        });

        act(() => {
          view.getItemRoot('1').focus();
        });
        fireEvent.keyDown(view.getItemRoot('1'), { key: 'End' });
        expect(view.getFocusedItemId()).toBe('4');
      });

      it('should move the focus to the last item in the tree when the last item is expanded', async () => {
        const view = await render({
          items: [
            { id: '1' },
            { id: '2' },
            { id: '3' },
            { id: '4', children: [{ id: '4.1', children: [{ id: '4.1.1' }] }] },
          ],
          defaultExpandedItems: ['4', '4.1'],
        });

        act(() => {
          view.getItemRoot('1').focus();
        });
        fireEvent.keyDown(view.getItemRoot('1'), { key: 'End' });
        expect(view.getFocusedItemId()).toBe('4.1.1');
      });
    });

    describe('key: * (asterisk)', () => {
      it('should expand all items that are at the same level as the current item (level = 1)', async () => {
        const view = await render({
          items: [
            { id: '1', children: [{ id: '1.1' }] },
            { id: '2', children: [{ id: '2.1' }] },
            { id: '3', children: [{ id: '3.1', children: [{ id: '3.1.1' }] }] },
            { id: '4' },
          ],
        });

        act(() => {
          view.getItemRoot('1').focus();
        });

        expect(view.isItemExpanded('1')).toBe(false);
        expect(view.isItemExpanded('2')).toBe(false);
        expect(view.isItemExpanded('3')).toBe(false);

        fireEvent.keyDown(view.getItemRoot('1'), { key: '*' });
        expect(view.isItemExpanded('1')).toBe(true);
        expect(view.isItemExpanded('2')).toBe(true);
        expect(view.isItemExpanded('3')).toBe(true);
        expect(view.isItemExpanded('3.1')).toBe(false);
      });

      it('should expand all items that are at the same level as the current item (level = 2)', async () => {
        const view = await render({
          items: [
            { id: '1', children: [{ id: '1.1' }] },
            { id: '2', children: [{ id: '2.1' }] },
            {
              id: '3',
              children: [
                {
                  id: '3.1',
                  children: [{ id: '3.1.1' }, { id: '3.1.2', children: [{ id: '3.1.2.1' }] }],
                },
              ],
            },
            { id: '4' },
          ],
          defaultExpandedItems: ['3'],
        });

        act(() => {
          view.getItemRoot('3.1').focus();
        });

        expect(view.isItemExpanded('1')).toBe(false);
        expect(view.isItemExpanded('2')).toBe(false);
        expect(view.isItemExpanded('3')).toBe(true);
        expect(view.isItemExpanded('3.1')).toBe(false);

        fireEvent.keyDown(view.getItemRoot('3.1'), { key: '*' });
        expect(view.isItemExpanded('1')).toBe(false);
        expect(view.isItemExpanded('2')).toBe(false);
        expect(view.isItemExpanded('3')).toBe(true);
        expect(view.isItemExpanded('3.1')).toBe(true);
        expect(view.isItemExpanded('3.1.2')).toBe(false);
      });
    });

    describe('key: Enter', () => {
      it('should expand an item with children if it is collapsed', async () => {
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1' }] }],
        });

        act(() => {
          view.getItemRoot('1').focus();
        });
        fireEvent.keyDown(view.getItemRoot('1'), { key: 'Enter' });
        expect(view.isItemExpanded('1')).toBe(true);
      });

      it('should collapse an item with children if it is expanded', async () => {
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1' }] }],
          defaultExpandedItems: ['1'],
        });

        act(() => {
          view.getItemRoot('1').focus();
        });
        fireEvent.keyDown(view.getItemRoot('1'), { key: 'Enter' });
        expect(view.isItemExpanded('1')).toBe(false);
      });

      it('should not expand an item with children if it is collapsed but disabled even if itemFocusableWhenDisabled={true}', async () => {
        const view = await render({
          items: [{ id: '1', disabled: true, children: [{ id: '1.1' }] }],
          itemFocusableWhenDisabled: true,
        });

        act(() => {
          view.getItemRoot('1').focus();
        });
        fireEvent.keyDown(view.getItemRoot('1'), { key: 'Enter' });
        expect(view.isItemExpanded('1')).toBe(false);
      });
    });
  });

  describe('Selection', () => {
    describe('single selection', () => {
      describe('key: Space', () => {
        it('should select the focused item when Space is pressed', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }],
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), { key: ' ' });
          expect(view.isItemSelected('1')).toBe(true);
        });

        it('should un-select the focused item when Space is pressed', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }],
            defaultSelectedItems: ['1'],
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), { key: ' ' });
          expect(view.isItemSelected('1')).toBe(false);
        });

        it('should not re-toggle selection on auto-repeated Space (held key)', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }],
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          // Initial press selects the item.
          fireEvent.keyDown(view.getItemRoot('1'), { key: ' ' });
          expect(view.isItemSelected('1')).toBe(true);
          // OS auto-repeat while the key is held must not flip it back off.
          fireEvent.keyDown(view.getItemRoot('1'), { key: ' ', repeat: true });
          fireEvent.keyDown(view.getItemRoot('1'), { key: ' ', repeat: true });
          expect(view.isItemSelected('1')).toBe(true);
        });

        it('should not select the focused item when Space is pressed and disableSelection={true}', async () => {
          const onSelectedItemsChange = vi.fn();
          const view = await render({
            items: [{ id: '1' }, { id: '2' }],
            selectionMode: 'none',
            onSelectedItemsChange,
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), { key: ' ' });
          expect(onSelectedItemsChange).not.toHaveBeenCalled();
        });

        it('should not select the focused item when Space is pressed and the item is disabled', async () => {
          const view = await render({
            items: [{ id: '1', disabled: true }, { id: '2' }],
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), { key: ' ' });
          expect(view.isItemSelected('1')).toBe(false);
        });

        it('should not select the focused item when Space is pressed and the item is disabled even if itemFocusableWhenDisabled={true}', async () => {
          const view = await render({
            items: [{ id: '1', disabled: true }, { id: '2' }],
            itemFocusableWhenDisabled: true,
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), { key: ' ' });
          expect(view.isItemSelected('1')).toBe(false);
        });
      });

      describe('key: Enter', () => {
        it('should select the focused item when Enter is pressed', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }],
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), { key: 'Enter' });
          expect(view.isItemSelected('1')).toBe(true);
        });

        it('should not un-select the focused item when Enter is pressed', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }],
            defaultSelectedItems: ['1'],
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), { key: 'Enter' });
          expect(view.isItemSelected('1')).toBe(true);
        });

        it('should not select the focused item when Enter is pressed and disableSelection={true}', async () => {
          const onSelectedItemsChange = vi.fn();
          const view = await render({
            items: [{ id: '1' }, { id: '2' }],
            selectionMode: 'none',
            onSelectedItemsChange,
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), { key: 'Enter' });
          expect(onSelectedItemsChange).not.toHaveBeenCalled();
        });

        it('should not select the focused item when Enter is pressed and the item is disabled even if itemFocusableWhenDisabled={true}', async () => {
          const view = await render({
            items: [{ id: '1', disabled: true }, { id: '2' }],
            itemFocusableWhenDisabled: true,
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), { key: 'Enter' });
          expect(view.isItemSelected('1')).toBe(false);
        });
      });

      describe('key: Ctrl + A', () => {
        it('should not select all items when Ctrl + A is pressed in single selection mode', async () => {
          const onSelectedItemsChange = vi.fn();
          const view = await render({
            items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
            selectionMode: 'single',
            onSelectedItemsChange,
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), {
            key: 'a',
            keyCode: 65,
            ctrlKey: true,
          });

          expect(onSelectedItemsChange).not.toHaveBeenCalled();
          expect(view.getSelectedTreeItems()).toEqual([]);
        });
      });

      describe('key: Shift + Arrow', () => {
        it('should not range-select on Shift+ArrowDown in single selection mode', async () => {
          const onSelectedItemsChange = vi.fn();
          const view = await render({
            items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
            selectionMode: 'single',
            defaultSelectedItems: '1',
            onSelectedItemsChange,
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowDown', shiftKey: true });

          // Focus still moves, but selection must not accumulate a multi range.
          expect(view.getFocusedItemId()).toBe('2');
          expect(onSelectedItemsChange).not.toHaveBeenCalled();
          expect(view.getSelectedTreeItems()).toEqual(['1']);
        });

        it('should not range-select on Shift+ArrowUp in single selection mode', async () => {
          const onSelectedItemsChange = vi.fn();
          const view = await render({
            items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
            selectionMode: 'single',
            defaultSelectedItems: '3',
            onSelectedItemsChange,
          });

          act(() => {
            view.getItemRoot('3').focus();
          });
          fireEvent.keyDown(view.getItemRoot('3'), { key: 'ArrowUp', shiftKey: true });

          expect(view.getFocusedItemId()).toBe('2');
          expect(onSelectedItemsChange).not.toHaveBeenCalled();
          expect(view.getSelectedTreeItems()).toEqual(['3']);
        });
      });
    });

    it.each([' ', 'Enter'])(
      'should report the selection of a row with %j as an item press',
      async (key) => {
        const onSelectedItemsChange = vi.fn();
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
          onSelectedItemsChange,
        });

        act(() => {
          view.getItemRoot('2').focus();
        });
        fireEvent.keyDown(view.getItemRoot('2'), { key });
        expect(onSelectedItemsChange.mock.calls.at(-1)![1].reason).toBe('item-press');
      },
    );

    it('should report the expansion of a row with Enter as an item press', async () => {
      const onExpandedItemsChange = vi.fn();
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }],
        onExpandedItemsChange,
      });

      act(() => {
        view.getItemRoot('1').focus();
      });
      fireEvent.keyDown(view.getItemRoot('1'), { key: 'Enter' });
      expect(onExpandedItemsChange.mock.calls.at(-1)![1].reason).toBe('item-press');
    });

    describe('multi selection', () => {
      it('should keep the selection when Shift+ArrowDown extends a range in a disabled tree', async () => {
        const onSelectedItemsChange = vi.fn();
        const view = await render({
          items: [{ id: '1' }, { id: '2' }, { id: '3' }],
          selectionMode: 'multiple',
          defaultSelectedItems: ['1'],
          onSelectedItemsChange,
        });

        act(() => {
          view.getItemRoot('1').focus();
        });
        fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowDown', shiftKey: true });
        expect(view.getSelectedTreeItems()).toEqual(['1', '2']);

        await view.setProps({ disabled: true });
        onSelectedItemsChange.mockClear();
        fireEvent.keyDown(view.getItemRoot('2'), { key: 'ArrowDown', shiftKey: true });

        expect(onSelectedItemsChange).not.toHaveBeenCalled();
        expect(view.getSelectedTreeItems()).toEqual(['1', '2']);
      });

      describe('key: Space', () => {
        it('should select the focused item without un-selecting the other selected items when Space is pressed', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }],
            selectionMode: 'multiple',
            defaultSelectedItems: ['1'],
          });

          act(() => {
            view.getItemRoot('2').focus();
          });
          fireEvent.keyDown(view.getItemRoot('2'), { key: ' ' });
          expect(view.getSelectedTreeItems()).toEqual(['1', '2']);
        });

        it('should un-select the focused item when Space is pressed', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }],
            selectionMode: 'multiple',
            defaultSelectedItems: ['1', '2'],
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), { key: ' ' });
          expect(view.getSelectedTreeItems()).toEqual(['2']);
        });

        it('should select the focused item without un-selecting the other selected items when Space is pressed while holding Ctrl', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }],
            selectionMode: 'multiple',
            defaultSelectedItems: ['1'],
          });

          act(() => {
            view.getItemRoot('2').focus();
          });
          fireEvent.keyDown(view.getItemRoot('2'), { key: ' ', ctrlKey: true });
          expect(view.getSelectedTreeItems()).toEqual(['1', '2']);
        });

        it('should un-select the focused item when Space is pressed while holding Ctrl', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }],
            selectionMode: 'multiple',
            defaultSelectedItems: ['1', '2'],
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), { key: ' ', ctrlKey: true });
          expect(view.getSelectedTreeItems()).toEqual(['2']);
        });

        it('should not select the focused item when Space is pressed and the item is disabled', async () => {
          const view = await render({
            items: [{ id: '1', disabled: true }, { id: '2' }],
            selectionMode: 'multiple',
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), { key: ' ' });
          expect(view.getSelectedTreeItems()).toEqual([]);
        });

        it('should not select the focused item when Space is pressed and the item is disabled even if itemFocusableWhenDisabled={true}', async () => {
          const view = await render({
            items: [{ id: '1', disabled: true }, { id: '2' }],
            selectionMode: 'multiple',
            itemFocusableWhenDisabled: true,
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), { key: ' ' });
          expect(view.getSelectedTreeItems()).toEqual([]);
        });

        it('should expand the selection range when Space is pressed while holding Shift', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }, { id: '3' }],
            selectionMode: 'multiple',
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), { key: ' ' });
          expect(view.getSelectedTreeItems()).toEqual(['1']);

          act(() => {
            view.getItemRoot('3').focus();
          });
          fireEvent.keyDown(view.getItemRoot('3'), { key: ' ', shiftKey: true });
          expect(view.getSelectedTreeItems()).toEqual(['1', '2', '3']);
        });
      });

      describe('key: ArrowDown', () => {
        it('should expand the selection range when ArrowDown is pressed while holding Shift from a selected item', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
            selectionMode: 'multiple',
            defaultSelectedItems: ['2'],
          });

          act(() => {
            view.getItemRoot('2').focus();
          });
          fireEvent.keyDown(view.getItemRoot('2'), { key: 'ArrowDown', shiftKey: true });
          expect(view.getSelectedTreeItems()).toEqual(['2', '3']);
        });

        it.each([false, true])(
          'should extend the range from the clicked anchor after moving focus away, controlled=%s',
          async (controlled) => {
            const onSelectedItemsChange = vi.fn();
            const view = await render({
              items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
              selectionMode: 'multiple',
              selectedItems: controlled ? [] : undefined,
              onSelectedItemsChange,
            });
            const accept = async () => {
              if (controlled) {
                await view.setProps({
                  selectedItems: onSelectedItemsChange.mock.calls.at(-1)![0],
                });
              }
            };

            fireEvent.click(view.getItemRoot('1'));
            await accept();
            act(() => view.getItemRoot('1').focus());
            fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowDown' });
            fireEvent.keyDown(view.getItemRoot('2'), { key: 'ArrowDown', shiftKey: true });
            await accept();

            expect(view.getSelectedTreeItems()).toEqual(['1', '2', '3']);
          },
        );

        it('should derive the next controlled range from the retained selection after rejection', async () => {
          const onSelectedItemsChange = vi.fn((_value, details) => details.cancel());
          const view = await render({
            items: [{ id: '1' }, { id: '2' }, { id: '3' }],
            selectionMode: 'multiple',
            selectedItems: ['1'],
            onSelectedItemsChange,
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowDown', shiftKey: true });
          fireEvent.keyDown(view.getItemRoot('2'), { key: 'ArrowDown', shiftKey: true });

          expect(onSelectedItemsChange.mock.calls[0][0]).toEqual(['1', '2']);
          expect(onSelectedItemsChange.mock.calls[1][0]).toEqual(['1', '2', '3']);
          expect(view.getSelectedTreeItems()).toEqual(['1']);
        });

        it('should not un-select the item below the focused item when ArrowDown is pressed while holding Shift from a selected item', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
            selectionMode: 'multiple',
            defaultSelectedItems: ['2', '3'],
          });

          act(() => {
            view.getItemRoot('2').focus();
          });
          fireEvent.keyDown(view.getItemRoot('2'), { key: 'ArrowDown', shiftKey: true });
          expect(view.getSelectedTreeItems()).toEqual(['2', '3']);
        });

        it('should un-select the focused item when ArrowDown is pressed while holding Shift and the item below have been selected in the same range', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
            selectionMode: 'multiple',
            defaultSelectedItems: ['3'],
          });

          act(() => {
            view.getItemRoot('3').focus();
          });
          fireEvent.keyDown(view.getItemRoot('3'), { key: 'ArrowUp', shiftKey: true });
          expect(view.getSelectedTreeItems()).toEqual(['2', '3']);

          fireEvent.keyDown(view.getItemRoot('2'), { key: 'ArrowDown', shiftKey: true });
          expect(view.getSelectedTreeItems()).toEqual(['3']);
        });

        it('should not select any item when ArrowDown is pressed while holding Shift and disabledSelection={true}', async () => {
          const onSelectedItemsChange = vi.fn();
          const view = await render({
            items: [{ id: '1' }, { id: '2' }],
            selectionMode: 'none',
            onSelectedItemsChange,
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowDown', shiftKey: true });
          expect(onSelectedItemsChange).not.toHaveBeenCalled();
        });

        it('should select the next non-disabled item when ArrowDown is pressed while holding Shift', async () => {
          const view = await render({
            itemFocusableWhenDisabled: false,
            items: [{ id: '1' }, { id: '2', disabled: true }, { id: '3' }],
            selectionMode: 'multiple',
            defaultSelectedItems: ['1'],
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowDown', shiftKey: true });
          expect(view.getSelectedTreeItems()).toEqual(['1', '3']);
        });

        it('should not select the next item when ArrowDown is pressed while holding Shift if the next item is disabled and itemFocusableWhenDisabled={true}', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2', disabled: true }, { id: '3' }],
            selectionMode: 'multiple',
            itemFocusableWhenDisabled: true,
            defaultSelectedItems: ['1'],
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowDown', shiftKey: true });
          expect(view.getSelectedTreeItems()).toEqual(['1']);
          expect(view.getFocusedItemId()).toBe('2');
        });

        it('should select the next item when ArrowDown is pressed while holding Shift if the focused item is disabled and itemFocusableWhenDisabled={true}', async () => {
          const view = await render({
            items: [{ id: '1', disabled: true }, { id: '2' }, { id: '3' }],
            selectionMode: 'multiple',
            itemFocusableWhenDisabled: true,
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowDown', shiftKey: true });
          expect(view.getSelectedTreeItems()).toEqual(['2']);
        });
      });

      describe('key: ArrowUp', () => {
        it('should expand the selection range when ArrowUp is pressed while holding Shift from a selected item', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
            selectionMode: 'multiple',
            defaultSelectedItems: ['3'],
          });

          act(() => {
            view.getItemRoot('3').focus();
          });
          fireEvent.keyDown(view.getItemRoot('3'), { key: 'ArrowUp', shiftKey: true });
          expect(view.getSelectedTreeItems()).toEqual(['2', '3']);
        });

        it('should not un-select the item above the focused item when ArrowUp is pressed while holding Shift from a selected item', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
            selectionMode: 'multiple',
            defaultSelectedItems: ['2', '3'],
          });

          act(() => {
            view.getItemRoot('3').focus();
          });
          fireEvent.keyDown(view.getItemRoot('3'), { key: 'ArrowUp', shiftKey: true });
          expect(view.getSelectedTreeItems()).toEqual(['2', '3']);
        });

        it('should un-select the focused item when ArrowUp is pressed while holding Shift and the item above have been selected in the same range', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
            selectionMode: 'multiple',
            defaultSelectedItems: ['2'],
          });

          act(() => {
            view.getItemRoot('2').focus();
          });
          fireEvent.keyDown(view.getItemRoot('2'), { key: 'ArrowDown', shiftKey: true });
          expect(view.getSelectedTreeItems()).toEqual(['2', '3']);

          fireEvent.keyDown(view.getItemRoot('3'), { key: 'ArrowUp', shiftKey: true });
          expect(view.getSelectedTreeItems()).toEqual(['2']);
        });

        it('should not select any item when ArrowUp is pressed while holding Shift and disabledSelection={true}', async () => {
          const onSelectedItemsChange = vi.fn();
          const view = await render({
            items: [{ id: '1' }, { id: '2' }],
            selectionMode: 'none',
            onSelectedItemsChange,
          });

          act(() => {
            view.getItemRoot('2').focus();
          });
          fireEvent.keyDown(view.getItemRoot('2'), { key: 'ArrowUp', shiftKey: true });
          expect(onSelectedItemsChange).not.toHaveBeenCalled();
        });

        it('should select the next non-disabled item when ArrowUp is pressed while holding Shift', async () => {
          const view = await render({
            itemFocusableWhenDisabled: false,
            items: [{ id: '1' }, { id: '2', disabled: true }, { id: '3' }],
            selectionMode: 'multiple',
            defaultSelectedItems: ['3'],
          });

          act(() => {
            view.getItemRoot('3').focus();
          });
          fireEvent.keyDown(view.getItemRoot('3'), { key: 'ArrowUp', shiftKey: true });
          expect(view.getSelectedTreeItems()).toEqual(['1', '3']);
        });

        it('should not select the next item when ArrowUp is pressed while holding Shift if the next item is disabled and itemFocusableWhenDisabled={true}', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2', disabled: true }, { id: '3' }],
            selectionMode: 'multiple',
            itemFocusableWhenDisabled: true,
            defaultSelectedItems: ['3'],
          });

          act(() => {
            view.getItemRoot('3').focus();
          });
          fireEvent.keyDown(view.getItemRoot('3'), { key: 'ArrowUp', shiftKey: true });
          expect(view.getSelectedTreeItems()).toEqual(['3']);
          expect(view.getFocusedItemId()).toBe('2');
        });

        it('should select the previous item when ArrowUp is pressed while holding Shift if the focused item is disabled and itemFocusableWhenDisabled={true}', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }, { id: '3', disabled: true }],
            selectionMode: 'multiple',
            itemFocusableWhenDisabled: true,
          });

          act(() => {
            view.getItemRoot('3').focus();
          });
          fireEvent.keyDown(view.getItemRoot('3'), { key: 'ArrowUp', shiftKey: true });
          expect(view.getSelectedTreeItems()).toEqual(['2']);
        });
      });

      describe('key: Home', () => {
        it('should select the focused item and all the items above when Home is pressed while holding Shift + Ctrl', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2', children: [{ id: '2.1' }] }, { id: '3' }, { id: '4' }],
            selectionMode: 'multiple',
            defaultExpandedItems: ['2'],
          });

          act(() => {
            view.getItemRoot('3').focus();
          });
          fireEvent.keyDown(view.getItemRoot('3'), {
            key: 'Home',
            shiftKey: true,
            ctrlKey: true,
          });
          expect(view.getSelectedTreeItems()).toEqual(['1', '2', '2.1', '3']);
        });

        it('should not select any item when Home is pressed while holding Shift + Ctrl and disableSelection={true}', async () => {
          const onSelectedItemsChange = vi.fn();
          const view = await render({
            items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
            selectionMode: 'none',
            onSelectedItemsChange,
          });

          act(() => {
            view.getItemRoot('3').focus();
          });
          fireEvent.keyDown(view.getItemRoot('3'), {
            key: 'Home',
            shiftKey: true,
            ctrlKey: true,
          });
          expect(onSelectedItemsChange).not.toHaveBeenCalled();
        });

        it('should not select disabled items when Home is pressed while holding Shift + Ctrl', async () => {
          const view = await render({
            items: [
              { id: '1' },
              { id: '2', disabled: true, children: [{ id: '2.1' }] },
              { id: '3' },
              { id: '4' },
            ],
            selectionMode: 'multiple',
            defaultExpandedItems: ['2'],
          });

          act(() => {
            view.getItemRoot('3').focus();
          });
          fireEvent.keyDown(view.getItemRoot('3'), {
            key: 'Home',
            shiftKey: true,
            ctrlKey: true,
          });
          expect(view.getSelectedTreeItems()).toEqual(['1', '3']);
        });

        it('should select the enabled items above a focused disabled item when Home is pressed while holding Shift + Ctrl', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }, { id: '3', disabled: true }, { id: '4' }],
            selectionMode: 'multiple',
          });

          act(() => {
            view.getItemRoot('3').focus();
          });
          fireEvent.keyDown(view.getItemRoot('3'), {
            key: 'Home',
            shiftKey: true,
            ctrlKey: true,
          });
          expect(view.getSelectedTreeItems()).toEqual(['1', '2']);
        });
      });

      describe('key: End', () => {
        it('should select the focused item and all the items below when End is pressed while holding Shift + Ctrl', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2', children: [{ id: '2.1' }] }, { id: '3' }, { id: '4' }],
            selectionMode: 'multiple',
            defaultExpandedItems: ['2'],
          });

          act(() => {
            view.getItemRoot('2').focus();
          });
          fireEvent.keyDown(view.getItemRoot('2'), {
            key: 'End',
            shiftKey: true,
            ctrlKey: true,
          });
          expect(view.getSelectedTreeItems()).toEqual(['2', '2.1', '3', '4']);
        });

        it('should not select any item when End is pressed while holding Shift + Ctrl and disableSelection={true}', async () => {
          const onSelectedItemsChange = vi.fn();
          const view = await render({
            items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
            selectionMode: 'none',
            onSelectedItemsChange,
          });

          act(() => {
            view.getItemRoot('2').focus();
          });
          fireEvent.keyDown(view.getItemRoot('2'), {
            key: 'End',
            shiftKey: true,
            ctrlKey: true,
          });
          expect(onSelectedItemsChange).not.toHaveBeenCalled();
        });

        it('should not select disabled items when End is pressed while holding Shift + Ctrl', async () => {
          const view = await render({
            items: [
              { id: '1' },
              { id: '2' },
              { id: '3', disabled: true, children: [{ id: '3.1' }] },
              { id: '4' },
            ],
            selectionMode: 'multiple',
            defaultExpandedItems: ['2'],
          });

          act(() => {
            view.getItemRoot('2').focus();
          });
          fireEvent.keyDown(view.getItemRoot('2'), {
            key: 'End',
            shiftKey: true,
            ctrlKey: true,
          });
          expect(view.getSelectedTreeItems()).toEqual(['2', '4']);
        });
      });

      describe('key: Ctrl + A', () => {
        it('should select all items when Ctrl + A is pressed', async () => {
          const onSelectedItemsChange = vi.fn();
          const view = await render({
            items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
            selectionMode: 'multiple',
            onSelectedItemsChange,
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), {
            key: 'a',
            keyCode: 65,
            ctrlKey: true,
          });
          expect(view.getSelectedTreeItems()).toEqual(['1', '2', '3', '4']);
          expect(onSelectedItemsChange.mock.calls.at(-1)![0]).toBe(TREE_SELECTION_ALL);
        });

        it('should deselect every item when Ctrl + A is pressed and they are all selected', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2', disabled: true }, { id: '3' }],
            selectionMode: 'multiple',
            defaultSelectedItems: ['1', '3'],
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), { key: 'a', ctrlKey: true });
          expect(view.getSelectedTreeItems()).toEqual([]);

          fireEvent.keyDown(view.getItemRoot('1'), { key: 'a', ctrlKey: true });
          expect(view.getSelectedTreeItems()).toEqual(['1', '3']);
        });

        it('should deselect every item when Escape is pressed, and consume the key', async () => {
          const onSelectedItemsChange = vi.fn();
          const onDocumentKeyDown = vi.fn();
          const view = await render({
            items: [{ id: '1' }, { id: '2' }, { id: '3' }],
            selectionMode: 'multiple',
            defaultSelectedItems: ['1', '3'],
            onSelectedItemsChange,
          });
          document.addEventListener('keydown', onDocumentKeyDown);

          act(() => {
            view.getItemRoot('1').focus();
          });
          // An enclosing popup closes on an Escape that reaches it.
          const notPrevented = fireEvent.keyDown(view.getItemRoot('1'), { key: 'Escape' });
          document.removeEventListener('keydown', onDocumentKeyDown);
          expect(view.getSelectedTreeItems()).toEqual([]);
          expect(onSelectedItemsChange.mock.calls[0][1].reason).toBe('escape-key');
          expect(notPrevented).toBe(false);
          expect(onDocumentKeyDown).not.toHaveBeenCalled();
        });

        it('should keep the selection when Escape is pressed in single selection mode', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }],
            defaultSelectedItems: '2',
          });

          act(() => {
            view.getItemRoot('2').focus();
          });
          fireEvent.keyDown(view.getItemRoot('2'), { key: 'Escape' });
          expect(view.getSelectedTreeItems()).toEqual(['2']);
        });

        it('should keep the Shift range when select-all is canceled', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
            selectionMode: 'multiple',
            onSelectedItemsChange: (value: unknown, details: { cancel: () => void }) => {
              if (value === TREE_SELECTION_ALL) {
                details.cancel();
              }
            },
          });

          fireEvent.click(view.getItemRoot('1'));
          fireEvent.click(view.getItemRoot('3'), { shiftKey: true });
          expect(view.getSelectedTreeItems()).toEqual(['1', '2', '3']);
          fireEvent.keyDown(view.getItemRoot('3'), { key: 'a', ctrlKey: true });
          fireEvent.click(view.getItemRoot('2'), { shiftKey: true });

          expect(view.getSelectedTreeItems()).toEqual(['1', '2']);
        });

        it('should not select any item when Ctrl + A is pressed and disableSelection={true}', async () => {
          const onSelectedItemsChange = vi.fn();
          const view = await render({
            items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
            selectionMode: 'none',
            onSelectedItemsChange,
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), {
            key: 'a',
            keyCode: 65,
            ctrlKey: true,
          });
          expect(onSelectedItemsChange).not.toHaveBeenCalled();
        });

        it('should not select disabled items when Ctrl + A is pressed', async () => {
          const view = await render({
            items: [
              { id: '1' },
              { id: '2', disabled: true, children: [{ id: '2.1' }] },
              { id: '3' },
              { id: '4' },
            ],
            selectionMode: 'multiple',
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), {
            key: 'a',
            keyCode: 65,
            ctrlKey: true,
          });
          expect(view.getSelectedTreeItems()).toEqual(['1', '3', '4']);
        });
      });

      describe('key: Enter', () => {
        it('should select the focused item without un-selecting the other selected items when Enter is pressed', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }],
            selectionMode: 'multiple',
            defaultSelectedItems: ['1'],
          });

          act(() => {
            view.getItemRoot('2').focus();
          });
          fireEvent.keyDown(view.getItemRoot('2'), { key: 'Enter' });
          expect(view.getSelectedTreeItems()).toEqual(['1', '2']);
        });

        it('should un-select the focused item when Enter is pressed', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }],
            selectionMode: 'multiple',
            defaultSelectedItems: ['1', '2'],
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), { key: 'Enter' });
          expect(view.getSelectedTreeItems()).toEqual(['2']);
        });
      });
    });
  });

  describe('Type-ahead', () => {
    it('should move the focus to the next item with a name that starts with the typed character', async () => {
      const view = await render({
        items: [
          { id: '1', label: 'one' },
          { id: '2', label: 'two' },
          { id: '3', label: 'three' },
          { id: '4', label: 'four' },
        ],
      });

      act(() => {
        view.getItemRoot('1').focus();
      });
      expect(view.getFocusedItemId()).toBe('1');

      fireEvent.keyDown(view.getItemRoot('1'), { key: 't' });
      expect(view.getFocusedItemId()).toBe('2');

      fireEvent.keyDown(view.getItemRoot('2'), { key: 'f' });
      expect(view.getFocusedItemId()).toBe('4');

      fireEvent.keyDown(view.getItemRoot('4'), { key: 'o' });
      expect(view.getFocusedItemId()).toBe('4');

      fireEvent.keyDown(view.getItemRoot('4'), { key: 'o' });
      expect(view.getFocusedItemId()).toBe('1');
    });

    it('should move to the next item in the displayed order when typing the same starting character', async () => {
      const view = await render({
        items: [{ id: 'A1' }, { id: 'B1' }, { id: 'A2' }, { id: 'B3' }, { id: 'B2' }],
      });

      act(() => {
        view.getItemRoot('A1').focus();
      });
      expect(view.getFocusedItemId()).toBe('A1');

      fireEvent.keyDown(view.getItemRoot('A1'), { key: 'b' });
      expect(view.getFocusedItemId()).toBe('B1');

      fireEvent.keyDown(view.getItemRoot('B1'), { key: 'b' });
      expect(view.getFocusedItemId()).toBe('B3');

      fireEvent.keyDown(view.getItemRoot('B3'), { key: 'b' });
      expect(view.getFocusedItemId()).toBe('B2');

      fireEvent.keyDown(view.getItemRoot('B2'), { key: 'b' });
      expect(view.getFocusedItemId()).toBe('B1');
    });

    it('should work with capitalized label', async () => {
      const view = await render({
        items: [
          { id: '1', label: 'One' },
          { id: '2', label: 'Two' },
          { id: '3', label: 'Three' },
          { id: '4', label: 'Four' },
        ],
      });

      act(() => {
        view.getItemRoot('1').focus();
      });
      expect(view.getFocusedItemId()).toBe('1');

      fireEvent.keyDown(view.getItemRoot('1'), { key: 't' });
      expect(view.getFocusedItemId()).toBe('2');

      fireEvent.keyDown(view.getItemRoot('2'), { key: 'f' });
      expect(view.getFocusedItemId()).toBe('4');

      fireEvent.keyDown(view.getItemRoot('4'), { key: 'o' });
      expect(view.getFocusedItemId()).toBe('4');

      fireEvent.keyDown(view.getItemRoot('4'), { key: 'o' });
      expect(view.getFocusedItemId()).toBe('1');
    });

    it('should type a space as part of a multi-word label', async () => {
      const view = await render({
        selectionMode: 'multiple',
        items: [
          { id: '1', label: 'Documents' },
          { id: '2', label: 'New Folder' },
          { id: '3', label: 'Notes' },
        ],
      });

      act(() => {
        view.getItemRoot('1').focus();
      });

      fireEvent.keyDown(view.getItemRoot('1'), { key: 'n' });
      expect(view.getFocusedItemId()).toBe('2');
      // Mid-query the Space belongs to the label, not to selection.
      fireEvent.keyDown(view.getItemRoot('2'), { key: ' ' });
      fireEvent.keyDown(view.getItemRoot('2'), { key: 'f' });
      expect(view.getFocusedItemId()).toBe('2');
      expect(view.getSelectedTreeItems()).toEqual([]);
    });

    it('should still select with Space when no type-ahead query is in progress', async () => {
      const view = await render({
        selectionMode: 'multiple',
        items: [{ id: '1', label: 'Documents' }],
      });

      act(() => {
        view.getItemRoot('1').focus();
      });
      fireEvent.keyDown(view.getItemRoot('1'), { key: ' ' });
      expect(view.getSelectedTreeItems()).toEqual(['1']);
    });

    it('should work after adding / removing items', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
      });

      act(() => {
        view.getItemRoot('1').focus();
      });

      fireEvent.keyDown(view.getItemRoot('1'), { key: '4' });
      expect(view.getFocusedItemId()).toBe('4');

      await view.setItems([{ id: '1' }, { id: '2' }, { id: '3' }]);
      expect(view.getFocusedItemId()).toBe('3');

      fireEvent.keyDown(view.getItemRoot('3'), { key: '2' });
      expect(view.getFocusedItemId()).toBe('2');

      await view.setItems([{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }]);
      expect(view.getFocusedItemId()).toBe('2');

      fireEvent.keyDown(view.getItemRoot('2'), { key: '4' });
      expect(view.getFocusedItemId()).toBe('4');
    });

    it('should not move focus when a modifier key and a letter are pressed', async () => {
      const view = await render({
        items: [
          { id: '1', label: 'one' },
          { id: '2', label: 'two' },
          { id: '3', label: 'three' },
          { id: '4', label: 'four' },
        ],
      });

      act(() => {
        view.getItemRoot('1').focus();
      });
      expect(view.getFocusedItemId()).toBe('1');

      fireEvent.keyDown(view.getItemRoot('1'), { key: 't', ctrlKey: true });
      expect(view.getFocusedItemId()).toBe('1');

      fireEvent.keyDown(view.getItemRoot('1'), { key: 't', metaKey: true });
      expect(view.getFocusedItemId()).toBe('1');
    });

    it('should type-ahead when Shift is held to type an uppercase letter', async () => {
      const view = await render({
        items: [
          { id: '1', label: 'one' },
          { id: '2', label: 'two' },
          { id: '3', label: 'three' },
          { id: '4', label: 'four' },
        ],
      });

      act(() => {
        view.getItemRoot('1').focus();
      });
      expect(view.getFocusedItemId()).toBe('1');

      // Holding Shift to type a capital letter must not disable type-ahead.
      fireEvent.keyDown(view.getItemRoot('1'), { key: 't', shiftKey: true });
      expect(view.getFocusedItemId()).toBe('2');
    });

    it('should match labels whatever their case and accents', async () => {
      const view = await render({
        items: [
          { id: '1', label: 'Notes' },
          { id: '2', label: 'Écoles' },
          { id: '3', label: 'Ëxport' },
        ],
      });

      act(() => {
        view.getItemRoot('1').focus();
      });

      fireEvent.keyDown(view.getItemRoot('1'), { key: 'e' });
      expect(view.getFocusedItemId()).toBe('2');

      fireEvent.keyDown(view.getItemRoot('2'), { key: 'X' });
      expect(view.getFocusedItemId()).toBe('3');
    });

    it('should work on disabled item when itemFocusableWhenDisabled={true}', async () => {
      const view = await render({
        items: [
          { id: '1', label: 'one', disabled: true },
          { id: '2', label: 'two', disabled: true },
          { id: '3', label: 'three', disabled: true },
          { id: '4', label: 'four', disabled: true },
        ],
        itemFocusableWhenDisabled: true,
      });

      act(() => {
        view.getItemRoot('1').focus();
      });
      expect(view.getFocusedItemId()).toBe('1');

      fireEvent.keyDown(view.getItemRoot('1'), { key: 't' });
      expect(view.getFocusedItemId()).toBe('2');
    });

    it('should not move focus on disabled item when itemFocusableWhenDisabled={false}', async () => {
      const view = await render({
        items: [
          { id: '1', label: 'one', disabled: true },
          { id: '2', label: 'two', disabled: true },
          { id: '3', label: 'three', disabled: true },
          { id: '4', label: 'four', disabled: true },
        ],
        itemFocusableWhenDisabled: false,
      });

      act(() => {
        view.getItemRoot('1').focus();
      });
      expect(view.getFocusedItemId()).toBe('1');

      fireEvent.keyDown(view.getItemRoot('1'), { key: 't' });
      expect(view.getFocusedItemId()).toBe('1');
    });

    it('should skip disabled items and focus the next enabled match', async () => {
      const view = await render({
        itemFocusableWhenDisabled: false,
        items: [
          { id: '1', label: 'one' },
          { id: '2', label: 'two', disabled: true },
          { id: '3', label: 'three' },
          { id: '4', label: 'four' },
        ],
      });

      act(() => {
        view.getItemRoot('1').focus();
      });
      expect(view.getFocusedItemId()).toBe('1');

      fireEvent.keyDown(view.getItemRoot('1'), { key: 't' });
      expect(view.getFocusedItemId()).toBe('3');
    });
  });

  describe('Multi-character type-ahead', () => {
    it('should move the focus to the next item when typing multiple characters quickly', async () => {
      const view = await render({
        items: [
          { id: '1', label: 'apple' },
          { id: '2', label: 'apricot' },
          { id: '3', label: 'banana' },
          { id: '4', label: 'blueberry' },
        ],
      });

      act(() => {
        view.getItemRoot('1').focus();
      });
      expect(view.getFocusedItemId()).toBe('1');

      fireEvent.keyDown(view.getItemRoot('1'), { key: 'a' });
      fireEvent.keyDown(view.getItemRoot('2'), { key: 'p' });
      fireEvent.keyDown(view.getItemRoot('2'), { key: 'r' });
      expect(view.getFocusedItemId()).toBe('2');
    });

    it('should work after adding / removing items', async () => {
      const view = await render({
        items: [
          { id: '1', label: 'apple' },
          { id: '2', label: 'apricot' },
          { id: '3', label: 'banana' },
        ],
      });

      act(() => {
        view.getItemRoot('3').focus();
      });

      fireEvent.keyDown(view.getItemRoot('3'), { key: 'a' });
      expect(view.getFocusedItemId()).toBe('1');
      fireEvent.keyDown(view.getItemRoot('1'), { key: 'p' });
      expect(view.getFocusedItemId()).toBe('1');

      fireEvent.keyDown(view.getItemRoot('1'), { key: 'r' });
      expect(view.getFocusedItemId()).toBe('2');
      fireEvent.keyDown(view.getItemRoot('2'), { key: 'a' });
      expect(view.getFocusedItemId()).toBe('1');

      await view.setItems([
        { id: '1', label: 'apple' },
        { id: '3', label: 'banana' },
      ]);
      expect(view.getFocusedItemId()).toBe('1');

      fireEvent.keyDown(view.getItemRoot('1'), { key: 'b' });
      expect(view.getFocusedItemId()).toBe('3');
      fireEvent.keyDown(view.getItemRoot('3'), { key: 'a' });
      expect(view.getFocusedItemId()).toBe('3');
    });

    it.each([
      [499, '3'],
      [500, '1'],
    ])('should reset the query %sms after the last key press', async (delay, expectedItemId) => {
      const view = await render({
        items: [
          { id: '1', label: 'ab' },
          { id: '2', label: 'b' },
          { id: '3', label: 'ba' },
        ],
      });

      act(() => {
        view.getItemRoot('1').focus();
      });
      vi.useFakeTimers();
      try {
        fireEvent.keyDown(view.getItemRoot('1'), { key: 'b' });
        expect(view.getFocusedItemId()).toBe('2');

        act(() => {
          vi.advanceTimersByTime(delay);
        });
        fireEvent.keyDown(view.getItemRoot('2'), { key: 'a' });
        expect(view.getFocusedItemId()).toBe(expectedItemId);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('isItemSelectionDisabled prop', () => {
    it('should not select item with Space when isItemSelectionDisabled returns true', async () => {
      const onSelectedItemsChange = vi.fn();
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }, { id: '2' }],
        isItemSelectionDisabled: (item: any) => !!item.children && item.children.length > 0,
        onSelectedItemsChange,
      });

      act(() => {
        view.getItemRoot('1').focus();
      });
      fireEvent.keyDown(view.getItemRoot('1'), { key: ' ' });
      expect(onSelectedItemsChange).not.toHaveBeenCalled();

      act(() => {
        view.getItemRoot('2').focus();
      });
      fireEvent.keyDown(view.getItemRoot('2'), { key: ' ' });
      expect(onSelectedItemsChange).toHaveBeenCalledTimes(1);
      expect(onSelectedItemsChange.mock.calls[0][0]).toBe('2');
    });

    it('should not select item with Enter when isItemSelectionDisabled returns true (single selection, leaf item)', async () => {
      const onSelectedItemsChange = vi.fn();
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
        isItemSelectionDisabled: (item: any) => item.id === '1',
        onSelectedItemsChange,
      });

      act(() => {
        view.getItemRoot('1').focus();
      });
      fireEvent.keyDown(view.getItemRoot('1'), { key: 'Enter' });
      expect(onSelectedItemsChange).not.toHaveBeenCalled();

      act(() => {
        view.getItemRoot('2').focus();
      });
      fireEvent.keyDown(view.getItemRoot('2'), { key: 'Enter' });
      expect(onSelectedItemsChange).toHaveBeenCalledTimes(1);
      expect(onSelectedItemsChange.mock.calls[0][0]).toBe('2');
    });

    it('should not select non-selectable items with Shift+ArrowDown in multi selection', async () => {
      const onSelectedItemsChange = vi.fn();
      const view = await render({
        items: [{ id: '1' }, { id: '2' }, { id: '3' }],
        selectionMode: 'multiple',
        defaultSelectedItems: ['1'],
        isItemSelectionDisabled: (item: any) => item.id === '2',
        onSelectedItemsChange,
      });

      act(() => {
        view.getItemRoot('1').focus();
      });
      fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowDown', shiftKey: true });
      expect(onSelectedItemsChange).not.toHaveBeenCalled();
      expect(view.getFocusedItemId()).toBe('2');
    });

    it('should not select non-selectable items with Shift+ArrowUp in multi selection', async () => {
      const onSelectedItemsChange = vi.fn();
      const view = await render({
        items: [{ id: '1' }, { id: '2' }, { id: '3' }],
        selectionMode: 'multiple',
        defaultSelectedItems: ['3'],
        isItemSelectionDisabled: (item: any) => item.id === '2',
        onSelectedItemsChange,
      });

      act(() => {
        view.getItemRoot('3').focus();
      });
      fireEvent.keyDown(view.getItemRoot('3'), { key: 'ArrowUp', shiftKey: true });
      expect(onSelectedItemsChange).not.toHaveBeenCalled();
      expect(view.getFocusedItemId()).toBe('2');
    });

    it('should reverse a Shift+Arrow range across a focusable non-selectable item', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }, { id: '3' }],
        selectionMode: 'multiple',
        defaultSelectedItems: ['1'],
        isItemSelectionDisabled: (item: any) => item.id === '2',
      });

      act(() => {
        view.getItemRoot('1').focus();
      });
      fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowDown', shiftKey: true });
      fireEvent.keyDown(view.getItemRoot('2'), { key: 'ArrowDown', shiftKey: true });
      expect(view.getSelectedTreeItems()).toEqual(['1', '3']);

      fireEvent.keyDown(view.getItemRoot('3'), { key: 'ArrowUp', shiftKey: true });
      expect(view.getFocusedItemId()).toBe('2');
      expect(view.getSelectedTreeItems()).toEqual(['1']);

      fireEvent.keyDown(view.getItemRoot('2'), { key: 'ArrowUp', shiftKey: true });
      expect(view.getFocusedItemId()).toBe('1');
      expect(view.getSelectedTreeItems()).toEqual(['1']);
    });
  });
});

// RTL tests require DirectionProvider, which is not available via describeTree
describe('TreeRoot - Keyboard (RTL)', () => {
  function RTLTree(props: { items: any[]; defaultExpandedItems?: string[] }) {
    return (
      <DirectionProvider direction="rtl">
        <Tree.Root items={props.items} defaultExpandedItems={props.defaultExpandedItems}>
          <Tree.List>
            {(item: any) => (
              <Tree.Item key={item.id} itemId={item.id} data-testid={`item-${item.id}`}>
                <Tree.ItemContent>
                  <Tree.ItemExpansionTrigger />
                  {item.label}
                </Tree.ItemContent>
              </Tree.Item>
            )}
          </Tree.List>
        </Tree.Root>
      </DirectionProvider>
    );
  }

  function getItemRoot(id: string) {
    return document.querySelector(`[data-item-id="${id}"]`) as HTMLElement;
  }

  function isItemExpanded(id: string) {
    return getItemRoot(id).getAttribute('aria-expanded') === 'true';
  }

  // The direction only drives the arrow keys: the page owns the text direction.
  it('should not set the dir attribute', async () => {
    await renderElement(<RTLTree items={[{ id: '1', label: '1' }]} />);
    expect(document.querySelector('[role="treegrid"]')).not.toHaveAttribute('dir');
  });

  it('should expand a collapsed item on ArrowLeft in RTL', async () => {
    await renderElement(
      <RTLTree items={[{ id: '1', label: '1', children: [{ id: '1.1', label: '1.1' }] }]} />,
    );

    act(() => {
      getItemRoot('1').focus();
    });
    expect(isItemExpanded('1')).toBe(false);
    fireEvent.keyDown(getItemRoot('1'), { key: 'ArrowLeft' });
    expect(isItemExpanded('1')).toBe(true);
  });

  it('should focus first child on ArrowLeft when item is expanded in RTL', async () => {
    await renderElement(
      <RTLTree
        items={[{ id: '1', label: '1', children: [{ id: '1.1', label: '1.1' }] }]}
        defaultExpandedItems={['1']}
      />,
    );

    act(() => {
      getItemRoot('1').focus();
    });
    fireEvent.keyDown(getItemRoot('1'), { key: 'ArrowLeft' });
    expect(getItemRoot('1.1')).toHaveFocus();
  });

  it('should collapse an expanded item on ArrowRight in RTL', async () => {
    await renderElement(
      <RTLTree
        items={[{ id: '1', label: '1', children: [{ id: '1.1', label: '1.1' }] }]}
        defaultExpandedItems={['1']}
      />,
    );

    act(() => {
      getItemRoot('1').focus();
    });
    fireEvent.keyDown(getItemRoot('1'), { key: 'ArrowRight' });
    expect(isItemExpanded('1')).toBe(false);
  });

  it('should focus parent on ArrowRight when item is collapsed in RTL', async () => {
    await renderElement(
      <RTLTree
        items={[{ id: '1', label: '1', children: [{ id: '1.1', label: '1.1' }] }]}
        defaultExpandedItems={['1']}
      />,
    );

    act(() => {
      getItemRoot('1.1').focus();
    });
    fireEvent.keyDown(getItemRoot('1.1'), { key: 'ArrowRight' });
    expect(getItemRoot('1')).toHaveFocus();
  });
});

describe('TreeRoot - Keyboard (consumer handlers)', () => {
  it.each(['row', 'button'] as const)(
    'does not navigate when a %s keydown handler prevents the Base UI handler',
    async (part) => {
      const preventArrowDown = (
        event: React.KeyboardEvent & { preventBaseUIHandler: () => void },
      ) => {
        if (event.key === 'ArrowDown') {
          event.preventBaseUIHandler();
        }
      };
      await renderElement(
        <Tree.Root
          items={[
            { id: 'a', label: 'A' },
            { id: 'b', label: 'B' },
          ]}
        >
          <Tree.List>
            {(item: TreeDefaultItem) => (
              <Tree.Item itemId={item.id} onKeyDown={part === 'row' ? preventArrowDown : undefined}>
                <Tree.ItemContent>
                  {item.label}
                  <Tree.ItemButton onKeyDown={part === 'button' ? preventArrowDown : undefined}>
                    Open {item.label}
                  </Tree.ItemButton>
                </Tree.ItemContent>
              </Tree.Item>
            )}
          </Tree.List>
        </Tree.Root>,
      );

      const focused =
        part === 'row'
          ? screen.getByRole('row', { name: 'A' })
          : screen.getByRole('button', { name: 'Open A' });
      act(() => focused.focus());
      fireEvent.keyDown(focused, { key: 'ArrowDown' });

      expect(focused).toHaveFocus();
    },
  );
});
