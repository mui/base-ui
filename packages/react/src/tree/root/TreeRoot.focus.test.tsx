import { expect } from 'chai';
import { spy } from 'sinon';
import { act, fireEvent } from '@mui/internal-test-utils';
import { describeTree } from '../../../test/describeTree';

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
      expect(view.getFocusedItemId()).to.equal('2');

      fireEvent.focus(view.getItemRoot('1'));
      expect(view.getFocusedItemId()).to.equal('1');
    });

    it('should focus the next sibling when a focused middle item is removed', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }, { id: '3' }],
      });

      fireEvent.focus(view.getItemRoot('2'));
      expect(view.getFocusedItemId()).to.equal('2');

      await view.setItems([{ id: '1' }, { id: '3' }]);
      expect(view.getFocusedItemId()).to.equal('3');
    });

    it('should focus the previous sibling when the focused last item is removed', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }, { id: '3' }],
      });

      fireEvent.focus(view.getItemRoot('3'));
      expect(view.getFocusedItemId()).to.equal('3');

      await view.setItems([{ id: '1' }, { id: '2' }]);
      expect(view.getFocusedItemId()).to.equal('2');
    });

    it('should focus the remaining sibling when the focused item is removed and only one sibling is left', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
      });

      fireEvent.focus(view.getItemRoot('2'));
      expect(view.getFocusedItemId()).to.equal('2');

      await view.setItems([{ id: '1' }]);
      expect(view.getFocusedItemId()).to.equal('1');
    });

    it('should focus the parent when the focused item is removed and has no siblings left', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2', children: [{ id: '2.1' }] }],
        defaultExpandedItems: ['2'],
      });

      fireEvent.focus(view.getItemRoot('2.1'));
      expect(view.getFocusedItemId()).to.equal('2.1');

      await view.setItems([{ id: '1' }, { id: '2' }]);
      expect(view.getFocusedItemId()).to.equal('2');
    });

    it('should focus the next nested sibling when a focused nested item is removed', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2', children: [{ id: '2.1' }, { id: '2.2' }, { id: '2.3' }] }],
        defaultExpandedItems: ['2'],
      });

      fireEvent.focus(view.getItemRoot('2.2'));
      expect(view.getFocusedItemId()).to.equal('2.2');

      await view.setItems([{ id: '1' }, { id: '2', children: [{ id: '2.1' }, { id: '2.3' }] }]);
      expect(view.getFocusedItemId()).to.equal('2.3');
    });
  });

  describe('tabIndex HTML attribute', () => {
    it('should set tabIndex={0} on the first item if none are selected', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
      });

      expect(view.getItemRoot('1').tabIndex).to.equal(0);
      expect(view.getItemRoot('2').tabIndex).to.equal(-1);
    });

    it('should set tabIndex={0} on the selected item (single selection)', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
        selectedItems: '2',
      });

      expect(view.getItemRoot('1').tabIndex).to.equal(-1);
      expect(view.getItemRoot('2').tabIndex).to.equal(0);
    });

    it('should set tabIndex={0} on the first selected item (multi selection)', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }, { id: '3' }],
        selectedItems: ['2', '3'],
        multiple: true,
      });

      expect(view.getItemRoot('1').tabIndex).to.equal(-1);
      expect(view.getItemRoot('2').tabIndex).to.equal(0);
      expect(view.getItemRoot('3').tabIndex).to.equal(-1);
    });

    it('should set tabIndex={0} on the first item if selected item is not visible', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2', children: [{ id: '2.1' }] }],
        selectedItems: '2.1',
      });

      expect(view.getItemRoot('1').tabIndex).to.equal(0);
      expect(view.getItemRoot('2').tabIndex).to.equal(-1);
    });

    it('should set tabIndex={0} on the first item if no selected item is visible', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2', children: [{ id: '2.1' }, { id: '2.2' }] }],
        selectedItems: ['2.1', '2.2'],
        multiple: true,
      });

      expect(view.getItemRoot('1').tabIndex).to.equal(0);
      expect(view.getItemRoot('2').tabIndex).to.equal(-1);
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

      expect(view.getFocusedItemId()).to.equal('2');
    });

    it('should not focus item if parent is collapsed', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2', children: [{ id: '2.1' }] }],
      });

      act(() => {
        view.actionsRef.current!.focusItem('2.1');
      });

      expect(view.getFocusedItemId()).to.equal(null);
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

      expect(view.getFocusedItemId()).to.equal(null);
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

      expect(view.getFocusedItemId()).to.equal('2.1.1');
    });
  });

  describe('onItemFocus prop', () => {
    it('should be called when an item is focused', async () => {
      const onItemFocus = spy();

      const view = await render({
        items: [{ id: '1' }],
        onItemFocus,
      });

      act(() => {
        view.getItemRoot('1').focus();
      });

      expect(onItemFocus.callCount).to.equal(1);
      expect(onItemFocus.lastCall.args[0]).to.equal('1');
      expect(onItemFocus.lastCall.args[1]).to.have.property('reason', 'keyboard');
      expect(onItemFocus.lastCall.args[1]).to.have.property('event');
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
        expect(view.getFocusedItemId()).to.equal(null);
      });

      it('should set tabIndex={-1} on the disabled item and tabIndex={0} on the first non-disabled item', async () => {
        const view = await render({
          items: [{ id: '1', disabled: true }, { id: '2' }, { id: '3' }],
          itemFocusableWhenDisabled: false,
        });

        expect(view.getItemRoot('1').tabIndex).to.equal(-1);
        expect(view.getItemRoot('2').tabIndex).to.equal(0);
        expect(view.getItemRoot('3').tabIndex).to.equal(-1);
      });
    });

    describe('disabledItemFocusable={true}', () => {
      it('should prevent focus by mouse', async () => {
        const view = await render({
          items: [{ id: '1', disabled: true }],
          itemFocusableWhenDisabled: true,
        });

        fireEvent.click(view.getItemRoot('1'));
        expect(view.getFocusedItemId()).to.equal(null);
      });

      it('should set tabIndex={0} on the disabled item and tabIndex={-1} on the other items', async () => {
        const view = await render({
          items: [{ id: '1', disabled: true }, { id: '2' }, { id: '3' }],
          itemFocusableWhenDisabled: true,
        });

        expect(view.getItemRoot('1').tabIndex).to.equal(0);
        expect(view.getItemRoot('2').tabIndex).to.equal(-1);
        expect(view.getItemRoot('3').tabIndex).to.equal(-1);
      });
    });
  });

  describe('tree root focus behavior', () => {
    it('should focus the first selected item when the tree root receives focus', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }, { id: '3' }],
        selectedItems: '2',
      });

      fireEvent.focus(view.getRoot());
      expect(view.getFocusedItemId()).to.equal('2');
    });

    it('should focus the first item when the tree root receives focus and no item is selected', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }, { id: '3' }],
      });

      fireEvent.focus(view.getRoot());
      expect(view.getFocusedItemId()).to.equal('1');
    });
  });

  it('should not error when component state changes', async () => {
    const onItemFocus = spy();

    const view = await render({
      items: [{ id: '1', children: [{ id: '1.1' }] }],
      defaultExpandedItems: ['1'],
      onItemFocus,
    });

    act(() => {
      view.getItemRoot('1').focus();
    });
    expect(view.getFocusedItemId()).to.equal('1');

    fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowDown' });
    expect(view.getFocusedItemId()).to.equal('1.1');

    fireEvent.keyDown(view.getItemRoot('1.1'), { key: 'ArrowUp' });
    expect(view.getFocusedItemId()).to.equal('1');

    fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowDown' });
    expect(view.getFocusedItemId()).to.equal('1.1');
  });
});
