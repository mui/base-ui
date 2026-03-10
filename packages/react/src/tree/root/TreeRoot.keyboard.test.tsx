import { expect } from 'chai';
import { act, fireEvent } from '@mui/internal-test-utils';
import { describeTree } from '../../../test/describeTree';

describeTree('TreeRoot - Keyboard', ({ render }) => {
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
        expect(view.getFocusedItemId()).to.equal('2');
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
        expect(view.getFocusedItemId()).to.equal('1.1');
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
        expect(view.getFocusedItemId()).to.equal('1.1');
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
        expect(view.getFocusedItemId()).to.equal('2');
      });

      it('should skip disabled items', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2', disabled: true }, { id: '3' }],
        });

        act(() => {
          view.getItemRoot('1').focus();
        });
        fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowDown' });
        expect(view.getFocusedItemId()).to.equal('3');
      });

      it('should not skip disabled items if disabledItemsFocusable={true}', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2', disabled: true }, { id: '3' }],
          disabledItemsFocusable: true,
        });

        act(() => {
          view.getItemRoot('1').focus();
        });
        fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowDown' });
        expect(view.getFocusedItemId()).to.equal('2');
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
        expect(view.getFocusedItemId()).to.equal('1');
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
        expect(view.getFocusedItemId()).to.equal('1');
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
        expect(view.getFocusedItemId()).to.equal('1.1');
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
        expect(view.getFocusedItemId()).to.equal('1-2-3');
      });

      it('should move the focus to the last visible descendant of the previous sibling, skipping disabled items', async () => {
        const view = await render({
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
        expect(view.getFocusedItemId()).to.equal('1-2-2');
      });

      it('should skip disabled items', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2', disabled: true }, { id: '3' }],
        });

        act(() => {
          view.getItemRoot('3').focus();
        });
        fireEvent.keyDown(view.getItemRoot('3'), { key: 'ArrowUp' });
        expect(view.getFocusedItemId()).to.equal('1');
      });

      it('should not skip disabled items if disabledItemsFocusable={true}', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2', disabled: true }, { id: '3' }],
          disabledItemsFocusable: true,
        });

        act(() => {
          view.getItemRoot('3').focus();
        });
        fireEvent.keyDown(view.getItemRoot('3'), { key: 'ArrowUp' });
        expect(view.getFocusedItemId()).to.equal('2');
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
        expect(view.isItemExpanded('1')).to.equal(true);
        expect(view.getFocusedItemId()).to.equal('1');
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
        expect(view.getFocusedItemId()).to.equal('1');
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
        expect(view.getFocusedItemId()).to.equal('1.1');
      });

      it('should do nothing if the focus is on a leaf', async () => {
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1' }] }],
          defaultExpandedItems: ['1'],
        });

        act(() => {
          view.getItemRoot('1.1').focus();
        });
        fireEvent.keyDown(view.getItemRoot('1.1'), { key: 'ArrowRight' });
        expect(view.getFocusedItemId()).to.equal('1.1');
      });

      it('should not expand an item with children if it is collapsed but disabled even if disabledItemsFocusable={true}', async () => {
        const view = await render({
          items: [{ id: '1', disabled: true, children: [{ id: '1.1' }] }],
          disabledItemsFocusable: true,
        });

        act(() => {
          view.getItemRoot('1').focus();
        });
        fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowRight' });
        expect(view.isItemExpanded('1')).to.equal(false);
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
        fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowLeft' });
        expect(view.isItemExpanded('1')).to.equal(false);
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
        expect(view.getFocusedItemId()).to.equal('1.1');
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
        expect(view.getFocusedItemId()).to.equal('1');
        expect(view.isItemExpanded('1')).to.equal(true);
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
        expect(view.getFocusedItemId()).to.equal('1');
        expect(view.isItemExpanded('1')).to.equal(true);
      });

      it('should do nothing if the focus is on a root item that is closed', async () => {
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1' }] }],
        });

        act(() => {
          view.getItemRoot('1').focus();
        });
        fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowLeft' });
        expect(view.getFocusedItemId()).to.equal('1');
        expect(view.isItemExpanded('1')).to.equal(false);
      });

      it('should do nothing if the focus is on a root item that is a leaf', async () => {
        const view = await render({
          items: [{ id: '1' }],
        });

        act(() => {
          view.getItemRoot('1').focus();
        });
        fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowLeft' });
        expect(view.getFocusedItemId()).to.equal('1');
      });

      it('should not collapse an item with children if it is collapsed but disabled even if disabledItemsFocusable={true}', async () => {
        const view = await render({
          items: [{ id: '1', disabled: true, children: [{ id: '1.1' }] }],
          defaultExpandedItems: ['1'],
          disabledItemsFocusable: true,
        });

        act(() => {
          view.getItemRoot('1').focus();
        });
        fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowLeft' });
        expect(view.isItemExpanded('1')).to.equal(true);
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
        expect(view.getFocusedItemId()).to.equal('1');
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
        expect(view.getFocusedItemId()).to.equal('4');
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
        expect(view.getFocusedItemId()).to.equal('4.1.1');
      });
    });

    describe('key: * (asterisk)', () => {
      it('should expand all items that are at the same depth as the current item (depth = 0)', async () => {
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

        expect(view.isItemExpanded('1')).to.equal(false);
        expect(view.isItemExpanded('2')).to.equal(false);
        expect(view.isItemExpanded('3')).to.equal(false);

        fireEvent.keyDown(view.getItemRoot('1'), { key: '*' });
        expect(view.isItemExpanded('1')).to.equal(true);
        expect(view.isItemExpanded('2')).to.equal(true);
        expect(view.isItemExpanded('3')).to.equal(true);
        expect(view.isItemExpanded('3.1')).to.equal(false);
      });

      it('should expand all items that are at the same depth as the current item (depth = 1)', async () => {
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

        expect(view.isItemExpanded('1')).to.equal(false);
        expect(view.isItemExpanded('2')).to.equal(false);
        expect(view.isItemExpanded('3')).to.equal(true);
        expect(view.isItemExpanded('3.1')).to.equal(false);

        fireEvent.keyDown(view.getItemRoot('3.1'), { key: '*' });
        expect(view.isItemExpanded('1')).to.equal(false);
        expect(view.isItemExpanded('2')).to.equal(false);
        expect(view.isItemExpanded('3')).to.equal(true);
        expect(view.isItemExpanded('3.1')).to.equal(true);
        expect(view.isItemExpanded('3.1.2')).to.equal(false);
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
        expect(view.isItemExpanded('1')).to.equal(true);
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
        expect(view.isItemExpanded('1')).to.equal(false);
      });

      it('should not expand an item with children if it is collapsed but disabled even if disabledItemsFocusable={true}', async () => {
        const view = await render({
          items: [{ id: '1', disabled: true, children: [{ id: '1.1' }] }],
          disabledItemsFocusable: true,
        });

        act(() => {
          view.getItemRoot('1').focus();
        });
        fireEvent.keyDown(view.getItemRoot('1'), { key: 'Enter' });
        expect(view.isItemExpanded('1')).to.equal(false);
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
          expect(view.isItemSelected('1')).to.equal(true);
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
          expect(view.isItemSelected('1')).to.equal(false);
        });

        it('should not select the focused item when Space is pressed and disableSelection={true}', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }],
            disableSelection: true,
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), { key: ' ' });
          expect(view.isItemSelected('1')).to.equal(false);
        });

        it('should not select the focused item when Space is pressed and the item is disabled', async () => {
          const view = await render({
            items: [{ id: '1', disabled: true }, { id: '2' }],
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), { key: ' ' });
          expect(view.isItemSelected('1')).to.equal(false);
        });

        it('should not select the focused item when Space is pressed and the item is disabled even if disabledItemsFocusable={true}', async () => {
          const view = await render({
            items: [{ id: '1', disabled: true }, { id: '2' }],
            disabledItemsFocusable: true,
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), { key: ' ' });
          expect(view.isItemSelected('1')).to.equal(false);
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
          expect(view.isItemSelected('1')).to.equal(true);
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
          expect(view.isItemSelected('1')).to.equal(true);
        });

        it('should not select the focused item when Enter is pressed and disableSelection={true}', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }],
            disableSelection: true,
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), { key: 'Enter' });
          expect(view.isItemSelected('1')).to.equal(false);
        });

        it('should not select the focused item when Enter is pressed and the item is disabled even if disabledItemsFocusable={true}', async () => {
          const view = await render({
            items: [{ id: '1', disabled: true }, { id: '2' }],
            disabledItemsFocusable: true,
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), { key: 'Enter' });
          expect(view.isItemSelected('1')).to.equal(false);
        });
      });
    });

    describe('multi selection', () => {
      describe('key: Space', () => {
        it('should select the focused item without un-selecting the other selected items when Space is pressed', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }],
            multiple: true,
            defaultSelectedItems: ['1'],
          });

          act(() => {
            view.getItemRoot('2').focus();
          });
          fireEvent.keyDown(view.getItemRoot('2'), { key: ' ' });
          expect(view.getSelectedTreeItems()).to.deep.equal(['1', '2']);
        });

        it('should un-select the focused item when Space is pressed', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }],
            multiple: true,
            defaultSelectedItems: ['1', '2'],
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), { key: ' ' });
          expect(view.getSelectedTreeItems()).to.deep.equal(['2']);
        });

        it('should select the focused item without un-selecting the other selected items when Space is pressed while holding Ctrl', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }],
            multiple: true,
            defaultSelectedItems: ['1'],
          });

          act(() => {
            view.getItemRoot('2').focus();
          });
          fireEvent.keyDown(view.getItemRoot('2'), { key: ' ', ctrlKey: true });
          expect(view.getSelectedTreeItems()).to.deep.equal(['1', '2']);
        });

        it('should un-select the focused item when Space is pressed while holding Ctrl', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }],
            multiple: true,
            defaultSelectedItems: ['1', '2'],
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), { key: ' ', ctrlKey: true });
          expect(view.getSelectedTreeItems()).to.deep.equal(['2']);
        });

        it('should not select the focused item when Space is pressed and disableSelection={true}', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }],
            multiple: true,
            disableSelection: true,
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), { key: ' ' });
          expect(view.getSelectedTreeItems()).to.deep.equal([]);
        });

        it('should not select the focused item when Space is pressed and the item is disabled', async () => {
          const view = await render({
            items: [{ id: '1', disabled: true }, { id: '2' }],
            multiple: true,
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), { key: ' ' });
          expect(view.getSelectedTreeItems()).to.deep.equal([]);
        });

        it('should not select the focused item when Space is pressed and the item is disabled even if disabledItemsFocusable={true}', async () => {
          const view = await render({
            items: [{ id: '1', disabled: true }, { id: '2' }],
            multiple: true,
            disabledItemsFocusable: true,
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), { key: ' ' });
          expect(view.getSelectedTreeItems()).to.deep.equal([]);
        });
      });

      describe('key: ArrowDown', () => {
        it('should expand the selection range when ArrowDown is pressed while holding Shift from a selected item', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
            multiple: true,
            defaultSelectedItems: ['2'],
          });

          act(() => {
            view.getItemRoot('2').focus();
          });
          fireEvent.keyDown(view.getItemRoot('2'), { key: 'ArrowDown', shiftKey: true });
          expect(view.getSelectedTreeItems()).to.deep.equal(['2', '3']);
        });

        it('should not un-select the item below the focused item when ArrowDown is pressed while holding Shift from a selected item', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
            multiple: true,
            defaultSelectedItems: ['2', '3'],
          });

          act(() => {
            view.getItemRoot('2').focus();
          });
          fireEvent.keyDown(view.getItemRoot('2'), { key: 'ArrowDown', shiftKey: true });
          expect(view.getSelectedTreeItems()).to.deep.equal(['2', '3']);
        });

        it('should un-select the focused item when ArrowDown is pressed while holding Shift and the item below have been selected in the same range', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
            multiple: true,
            defaultSelectedItems: ['3'],
          });

          act(() => {
            view.getItemRoot('3').focus();
          });
          fireEvent.keyDown(view.getItemRoot('3'), { key: 'ArrowUp', shiftKey: true });
          expect(view.getSelectedTreeItems()).to.deep.equal(['2', '3']);

          fireEvent.keyDown(view.getItemRoot('2'), { key: 'ArrowDown', shiftKey: true });
          expect(view.getSelectedTreeItems()).to.deep.equal(['3']);
        });

        it('should not select any item when ArrowDown is pressed while holding Shift and disabledSelection={true}', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }],
            multiple: true,
            disableSelection: true,
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowDown', shiftKey: true });
          expect(view.getSelectedTreeItems()).to.deep.equal([]);
        });

        it('should select the next non-disabled item when ArrowDown is pressed while holding Shift', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2', disabled: true }, { id: '3' }],
            multiple: true,
            defaultSelectedItems: ['1'],
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowDown', shiftKey: true });
          expect(view.getSelectedTreeItems()).to.deep.equal(['1', '3']);
        });

        it('should not select the next item when ArrowDown is pressed while holding Shift if the next item is disabled and disabledItemsFocusable={true}', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2', disabled: true }, { id: '3' }],
            multiple: true,
            disabledItemsFocusable: true,
            defaultSelectedItems: ['1'],
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowDown', shiftKey: true });
          expect(view.getSelectedTreeItems()).to.deep.equal(['1']);
          expect(view.getFocusedItemId()).to.equal('2');
        });

        it('should select the next item when ArrowDown is pressed while holding Shift if the focused item is disabled and disabledItemsFocusable={true}', async () => {
          const view = await render({
            items: [{ id: '1', disabled: true }, { id: '2' }, { id: '3' }],
            multiple: true,
            disabledItemsFocusable: true,
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowDown', shiftKey: true });
          expect(view.getSelectedTreeItems()).to.deep.equal(['2']);
        });
      });

      describe('key: ArrowUp', () => {
        it('should expand the selection range when ArrowUp is pressed while holding Shift from a selected item', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
            multiple: true,
            defaultSelectedItems: ['3'],
          });

          act(() => {
            view.getItemRoot('3').focus();
          });
          fireEvent.keyDown(view.getItemRoot('3'), { key: 'ArrowUp', shiftKey: true });
          expect(view.getSelectedTreeItems()).to.deep.equal(['2', '3']);
        });

        it('should not un-select the item above the focused item when ArrowUp is pressed while holding Shift from a selected item', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
            multiple: true,
            defaultSelectedItems: ['2', '3'],
          });

          act(() => {
            view.getItemRoot('3').focus();
          });
          fireEvent.keyDown(view.getItemRoot('3'), { key: 'ArrowUp', shiftKey: true });
          expect(view.getSelectedTreeItems()).to.deep.equal(['2', '3']);
        });

        it('should un-select the focused item when ArrowUp is pressed while holding Shift and the item above have been selected in the same range', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
            multiple: true,
            defaultSelectedItems: ['2'],
          });

          act(() => {
            view.getItemRoot('2').focus();
          });
          fireEvent.keyDown(view.getItemRoot('2'), { key: 'ArrowDown', shiftKey: true });
          expect(view.getSelectedTreeItems()).to.deep.equal(['2', '3']);

          fireEvent.keyDown(view.getItemRoot('3'), { key: 'ArrowUp', shiftKey: true });
          expect(view.getSelectedTreeItems()).to.deep.equal(['2']);
        });

        it('should not select any item when ArrowUp is pressed while holding Shift and disabledSelection={true}', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }],
            multiple: true,
            disableSelection: true,
          });

          act(() => {
            view.getItemRoot('2').focus();
          });
          fireEvent.keyDown(view.getItemRoot('2'), { key: 'ArrowUp', shiftKey: true });
          expect(view.getSelectedTreeItems()).to.deep.equal([]);
        });

        it('should select the next non-disabled item when ArrowUp is pressed while holding Shift', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2', disabled: true }, { id: '3' }],
            multiple: true,
            defaultSelectedItems: ['3'],
          });

          act(() => {
            view.getItemRoot('3').focus();
          });
          fireEvent.keyDown(view.getItemRoot('3'), { key: 'ArrowUp', shiftKey: true });
          expect(view.getSelectedTreeItems()).to.deep.equal(['1', '3']);
        });

        it('should not select the next item when ArrowUp is pressed while holding Shift if the next item is disabled and disabledItemsFocusable={true}', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2', disabled: true }, { id: '3' }],
            multiple: true,
            disabledItemsFocusable: true,
            defaultSelectedItems: ['3'],
          });

          act(() => {
            view.getItemRoot('3').focus();
          });
          fireEvent.keyDown(view.getItemRoot('3'), { key: 'ArrowUp', shiftKey: true });
          expect(view.getSelectedTreeItems()).to.deep.equal(['3']);
          expect(view.getFocusedItemId()).to.equal('2');
        });

        it('should select the previous item when ArrowUp is pressed while holding Shift if the focused item is disabled and disabledItemsFocusable={true}', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }, { id: '3', disabled: true }],
            multiple: true,
            disabledItemsFocusable: true,
          });

          act(() => {
            view.getItemRoot('3').focus();
          });
          fireEvent.keyDown(view.getItemRoot('3'), { key: 'ArrowUp', shiftKey: true });
          expect(view.getSelectedTreeItems()).to.deep.equal(['2']);
        });
      });

      describe('key: Home', () => {
        it('should select the focused item and all the items above when Home is pressed while holding Shift + Ctrl', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2', children: [{ id: '2.1' }] }, { id: '3' }, { id: '4' }],
            multiple: true,
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
          expect(view.getSelectedTreeItems()).to.deep.equal(['1', '2', '2.1', '3']);
        });

        it('should not select any item when Home is pressed while holding Shift + Ctrl and disableSelection={true}', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
            multiple: true,
            disableSelection: true,
          });

          act(() => {
            view.getItemRoot('3').focus();
          });
          fireEvent.keyDown(view.getItemRoot('3'), {
            key: 'Home',
            shiftKey: true,
            ctrlKey: true,
          });
          expect(view.getSelectedTreeItems()).to.deep.equal([]);
        });

        it('should not select disabled items when Home is pressed while holding Shift + Ctrl', async () => {
          const view = await render({
            items: [
              { id: '1' },
              { id: '2', disabled: true, children: [{ id: '2.1' }] },
              { id: '3' },
              { id: '4' },
            ],
            multiple: true,
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
          expect(view.getSelectedTreeItems()).to.deep.equal(['1', '3']);
        });
      });

      describe('key: End', () => {
        it('should select the focused item and all the items below when End is pressed while holding Shift + Ctrl', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2', children: [{ id: '2.1' }] }, { id: '3' }, { id: '4' }],
            multiple: true,
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
          expect(view.getSelectedTreeItems()).to.deep.equal(['2', '2.1', '3', '4']);
        });

        it('should not select any item when End is pressed while holding Shift + Ctrl and disableSelection={true}', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
            multiple: true,
            disableSelection: true,
          });

          act(() => {
            view.getItemRoot('2').focus();
          });
          fireEvent.keyDown(view.getItemRoot('2'), {
            key: 'End',
            shiftKey: true,
            ctrlKey: true,
          });
          expect(view.getSelectedTreeItems()).to.deep.equal([]);
        });

        it('should not select disabled items when End is pressed while holding Shift + Ctrl', async () => {
          const view = await render({
            items: [
              { id: '1' },
              { id: '2' },
              { id: '3', disabled: true, children: [{ id: '3.1' }] },
              { id: '4' },
            ],
            multiple: true,
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
          expect(view.getSelectedTreeItems()).to.deep.equal(['2', '4']);
        });
      });

      describe('key: Ctrl + A', () => {
        it('should select all items when Ctrl + A is pressed', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
            multiple: true,
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), {
            key: 'a',
            keyCode: 65,
            ctrlKey: true,
          });
          expect(view.getSelectedTreeItems()).to.deep.equal(['1', '2', '3', '4']);
        });

        it('should not select any item when Ctrl + A is pressed and disableSelection={true}', async () => {
          const view = await render({
            items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
            multiple: true,
            disableSelection: true,
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), {
            key: 'a',
            keyCode: 65,
            ctrlKey: true,
          });
          expect(view.getSelectedTreeItems()).to.deep.equal([]);
        });

        it('should not select disabled items when Ctrl + A is pressed', async () => {
          const view = await render({
            items: [
              { id: '1' },
              { id: '2', disabled: true, children: [{ id: '2.1' }] },
              { id: '3' },
              { id: '4' },
            ],
            multiple: true,
          });

          act(() => {
            view.getItemRoot('1').focus();
          });
          fireEvent.keyDown(view.getItemRoot('1'), {
            key: 'a',
            keyCode: 65,
            ctrlKey: true,
          });
          expect(view.getSelectedTreeItems()).to.deep.equal(['1', '3', '4']);
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
      expect(view.getFocusedItemId()).to.equal('1');

      fireEvent.keyDown(view.getItemRoot('1'), { key: 't' });
      expect(view.getFocusedItemId()).to.equal('2');

      fireEvent.keyDown(view.getItemRoot('2'), { key: 'f' });
      expect(view.getFocusedItemId()).to.equal('4');

      fireEvent.keyDown(view.getItemRoot('4'), { key: 'o' });
      expect(view.getFocusedItemId()).to.equal('4');

      fireEvent.keyDown(view.getItemRoot('4'), { key: 'o' });
      expect(view.getFocusedItemId()).to.equal('1');
    });

    it('should move to the next item in the displayed order when typing the same starting character', async () => {
      const view = await render({
        items: [{ id: 'A1' }, { id: 'B1' }, { id: 'A2' }, { id: 'B3' }, { id: 'B2' }],
      });

      act(() => {
        view.getItemRoot('A1').focus();
      });
      expect(view.getFocusedItemId()).to.equal('A1');

      fireEvent.keyDown(view.getItemRoot('A1'), { key: 'b' });
      expect(view.getFocusedItemId()).to.equal('B1');

      fireEvent.keyDown(view.getItemRoot('B1'), { key: 'b' });
      expect(view.getFocusedItemId()).to.equal('B3');

      fireEvent.keyDown(view.getItemRoot('B3'), { key: 'b' });
      expect(view.getFocusedItemId()).to.equal('B2');

      fireEvent.keyDown(view.getItemRoot('B2'), { key: 'b' });
      expect(view.getFocusedItemId()).to.equal('B1');
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
      expect(view.getFocusedItemId()).to.equal('1');

      fireEvent.keyDown(view.getItemRoot('1'), { key: 't' });
      expect(view.getFocusedItemId()).to.equal('2');

      fireEvent.keyDown(view.getItemRoot('2'), { key: 'f' });
      expect(view.getFocusedItemId()).to.equal('4');

      fireEvent.keyDown(view.getItemRoot('4'), { key: 'o' });
      expect(view.getFocusedItemId()).to.equal('4');

      fireEvent.keyDown(view.getItemRoot('4'), { key: 'o' });
      expect(view.getFocusedItemId()).to.equal('1');
    });

    it('should work after adding / removing items', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
      });

      act(() => {
        view.getItemRoot('1').focus();
      });

      fireEvent.keyDown(view.getItemRoot('1'), { key: '4' });
      expect(view.getFocusedItemId()).to.equal('4');

      await view.setItems([{ id: '1' }, { id: '2' }, { id: '3' }]);
      expect(view.getFocusedItemId()).to.equal('3');

      fireEvent.keyDown(view.getItemRoot('3'), { key: '2' });
      expect(view.getFocusedItemId()).to.equal('2');

      await view.setItems([{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }]);
      expect(view.getFocusedItemId()).to.equal('2');

      fireEvent.keyDown(view.getItemRoot('2'), { key: '4' });
      expect(view.getFocusedItemId()).to.equal('4');
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
      expect(view.getFocusedItemId()).to.equal('1');

      fireEvent.keyDown(view.getItemRoot('1'), { key: 't', ctrlKey: true });
      expect(view.getFocusedItemId()).to.equal('1');

      fireEvent.keyDown(view.getItemRoot('1'), { key: 't', metaKey: true });
      expect(view.getFocusedItemId()).to.equal('1');

      fireEvent.keyDown(view.getItemRoot('1'), { key: 't', shiftKey: true });
      expect(view.getFocusedItemId()).to.equal('1');
    });

    it('should work on disabled item when disabledItemsFocusable={true}', async () => {
      const view = await render({
        items: [
          { id: '1', label: 'one', disabled: true },
          { id: '2', label: 'two', disabled: true },
          { id: '3', label: 'three', disabled: true },
          { id: '4', label: 'four', disabled: true },
        ],
        disabledItemsFocusable: true,
      });

      act(() => {
        view.getItemRoot('1').focus();
      });
      expect(view.getFocusedItemId()).to.equal('1');

      fireEvent.keyDown(view.getItemRoot('1'), { key: 't' });
      expect(view.getFocusedItemId()).to.equal('2');
    });

    it('should not move focus on disabled item when disabledItemsFocusable={false}', async () => {
      const view = await render({
        items: [
          { id: '1', label: 'one', disabled: true },
          { id: '2', label: 'two', disabled: true },
          { id: '3', label: 'three', disabled: true },
          { id: '4', label: 'four', disabled: true },
        ],
        disabledItemsFocusable: false,
      });

      act(() => {
        view.getItemRoot('1').focus();
      });
      expect(view.getFocusedItemId()).to.equal('1');

      fireEvent.keyDown(view.getItemRoot('1'), { key: 't' });
      expect(view.getFocusedItemId()).to.equal('1');
    });

    it('should skip disabled items and focus the next enabled match', async () => {
      const view = await render({
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
      expect(view.getFocusedItemId()).to.equal('1');

      fireEvent.keyDown(view.getItemRoot('1'), { key: 't' });
      expect(view.getFocusedItemId()).to.equal('3');
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
      expect(view.getFocusedItemId()).to.equal('1');

      fireEvent.keyDown(view.getItemRoot('1'), { key: 'a' });
      fireEvent.keyDown(view.getItemRoot('2'), { key: 'p' });
      fireEvent.keyDown(view.getItemRoot('2'), { key: 'r' });
      expect(view.getFocusedItemId()).to.equal('2');
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
      expect(view.getFocusedItemId()).to.equal('1');
      fireEvent.keyDown(view.getItemRoot('1'), { key: 'p' });
      expect(view.getFocusedItemId()).to.equal('1');

      fireEvent.keyDown(view.getItemRoot('1'), { key: 'r' });
      expect(view.getFocusedItemId()).to.equal('2');
      fireEvent.keyDown(view.getItemRoot('2'), { key: 'a' });
      expect(view.getFocusedItemId()).to.equal('1');

      await view.setItems([
        { id: '1', label: 'apple' },
        { id: '3', label: 'banana' },
      ]);
      expect(view.getFocusedItemId()).to.equal('1');

      fireEvent.keyDown(view.getItemRoot('1'), { key: 'b' });
      expect(view.getFocusedItemId()).to.equal('3');
      fireEvent.keyDown(view.getItemRoot('3'), { key: 'a' });
      expect(view.getFocusedItemId()).to.equal('3');
    });
  });

  describe('isItemSelectionDisabled prop', () => {
    it('should not select item with Space when isItemSelectionDisabled returns true', async () => {
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }, { id: '2' }],
        isItemSelectionDisabled: (item: any) => !!item.children && item.children.length > 0,
      });

      act(() => {
        view.getItemRoot('1').focus();
      });
      fireEvent.keyDown(view.getItemRoot('1'), { key: ' ' });
      expect(view.isItemSelected('1')).to.equal(false);

      act(() => {
        view.getItemRoot('2').focus();
      });
      fireEvent.keyDown(view.getItemRoot('2'), { key: ' ' });
      expect(view.isItemSelected('2')).to.equal(true);
    });

    it('should not select item with Enter when isItemSelectionDisabled returns true (single selection, leaf item)', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
        isItemSelectionDisabled: (item: any) => item.id === '1',
      });

      act(() => {
        view.getItemRoot('1').focus();
      });
      fireEvent.keyDown(view.getItemRoot('1'), { key: 'Enter' });
      expect(view.isItemSelected('1')).to.equal(false);

      act(() => {
        view.getItemRoot('2').focus();
      });
      fireEvent.keyDown(view.getItemRoot('2'), { key: 'Enter' });
      expect(view.isItemSelected('2')).to.equal(true);
    });

    it('should not select non-selectable items with Shift+ArrowDown in multi selection', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }, { id: '3' }],
        multiple: true,
        defaultSelectedItems: ['1'],
        isItemSelectionDisabled: (item: any) => item.id === '2',
      });

      act(() => {
        view.getItemRoot('1').focus();
      });
      fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowDown', shiftKey: true });
      expect(view.getSelectedTreeItems()).to.deep.equal(['1']);
      expect(view.getFocusedItemId()).to.equal('2');
    });

    it('should not select non-selectable items with Shift+ArrowUp in multi selection', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }, { id: '3' }],
        multiple: true,
        defaultSelectedItems: ['3'],
        isItemSelectionDisabled: (item: any) => item.id === '2',
      });

      act(() => {
        view.getItemRoot('3').focus();
      });
      fireEvent.keyDown(view.getItemRoot('3'), { key: 'ArrowUp', shiftKey: true });
      expect(view.getSelectedTreeItems()).to.deep.equal(['3']);
      expect(view.getFocusedItemId()).to.equal('2');
    });
  });
});
