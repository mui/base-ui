import { expect } from 'chai';
import { spy } from 'sinon';
import { act, fireEvent } from '@mui/internal-test-utils';
import { describeTree } from '../../../test/describeTree';

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

      expect(view.isItemExpanded('1')).to.equal(false);
      expect(view.getAllTreeItemIds()).to.deep.equal(['1', '2']);
    });

    it('should use the default state when defined', async () => {
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }, { id: '2' }],
        defaultExpandedItems: ['1'],
      });

      expect(view.isItemExpanded('1')).to.equal(true);
      expect(view.getAllTreeItemIds()).to.deep.equal(['1', '1.1', '2']);
    });

    it('should use the controlled state when defined', async () => {
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }, { id: '2' }],
        expandedItems: ['1'],
      });

      expect(view.isItemExpanded('1')).to.equal(true);
    });

    it('should use the controlled state instead of the default state when both are defined', async () => {
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }, { id: '2' }],
        expandedItems: ['1'],
        defaultExpandedItems: ['2'],
      });

      expect(view.isItemExpanded('1')).to.equal(true);
    });

    it('should react to controlled state update', async () => {
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }],
        expandedItems: [],
      });

      await view.setProps({ expandedItems: ['1'] });
      expect(view.isItemExpanded('1')).to.equal(true);
    });

    it('should call onExpandedItemsChange when expanding an item (add to empty list)', async () => {
      const onExpandedItemsChange = spy();

      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }],
        onExpandedItemsChange,
      });

      fireEvent.click(view.getItemRoot('1'));

      expect(onExpandedItemsChange.callCount).to.equal(1);
      expect(onExpandedItemsChange.lastCall.args[0]).to.deep.equal(['1']);
    });

    it('should call onExpandedItemsChange when expanding an item (add to non-empty list)', async () => {
      const onExpandedItemsChange = spy();

      const view = await render({
        items: [
          { id: '1', children: [{ id: '1.1' }] },
          { id: '2', children: [{ id: '2.1' }] },
        ],
        onExpandedItemsChange,
        defaultExpandedItems: ['1'],
      });

      fireEvent.click(view.getItemRoot('2'));

      expect(onExpandedItemsChange.callCount).to.equal(1);
      expect(onExpandedItemsChange.lastCall.args[0]).to.deep.equal(['2', '1']);
    });

    it('should call onExpandedItemsChange when collapsing an item', async () => {
      const onExpandedItemsChange = spy();

      const view = await render({
        items: [
          { id: '1', children: [{ id: '1.1' }] },
          { id: '2', children: [{ id: '2.1' }] },
        ],
        onExpandedItemsChange,
        defaultExpandedItems: ['1'],
      });

      fireEvent.click(view.getItemRoot('1'));

      expect(onExpandedItemsChange.callCount).to.equal(1);
      expect(onExpandedItemsChange.lastCall.args[0]).to.deep.equal([]);
    });
  });

  describe('item click interaction', () => {
    it('should expand collapsed item when clicking on an item', async () => {
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }, { id: '2' }],
      });

      expect(view.isItemExpanded('1')).to.equal(false);
      fireEvent.click(view.getItemRoot('1'));
      expect(view.isItemExpanded('1')).to.equal(true);
    });

    it('should collapse expanded item when clicking on an item', async () => {
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }, { id: '2' }],
        defaultExpandedItems: ['1'],
      });

      expect(view.isItemExpanded('1')).to.equal(true);
      fireEvent.click(view.getItemRoot('1'));
      expect(view.isItemExpanded('1')).to.equal(false);
    });

    it('should not expand collapsed item when clicking on a disabled item', async () => {
      const view = await render({
        items: [{ id: '1', disabled: true, children: [{ id: '1.1' }] }, { id: '2' }],
      });

      expect(view.isItemExpanded('1')).to.equal(false);
      fireEvent.click(view.getItemRoot('1'));
      expect(view.isItemExpanded('1')).to.equal(false);
    });

    it('should not collapse expanded item when clicking on a disabled item', async () => {
      const view = await render({
        items: [{ id: '1', disabled: true, children: [{ id: '1.1' }] }, { id: '2' }],
        defaultExpandedItems: ['1'],
      });

      expect(view.isItemExpanded('1')).to.equal(true);
      fireEvent.click(view.getItemRoot('1'));
      expect(view.isItemExpanded('1')).to.equal(true);
    });

    it('should expand collapsed item when clicking on an item label', async () => {
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }, { id: '2' }],
      });

      expect(view.isItemExpanded('1')).to.equal(false);
      fireEvent.click(view.getItemLabel('1')!);
      expect(view.isItemExpanded('1')).to.equal(true);
    });
  });

  describe('aria-expanded item attribute', () => {
    it('should have the attribute `aria-expanded=false` if collapsed', async () => {
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }],
      });

      expect(view.getItemRoot('1')).to.have.attribute('aria-expanded', 'false');
    });

    it('should have the attribute `aria-expanded=true` if expanded', async () => {
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }],
        defaultExpandedItems: ['1'],
      });

      expect(view.getItemRoot('1')).to.have.attribute('aria-expanded', 'true');
    });

    it('should not have the attribute `aria-expanded` if no children are present', async () => {
      const view = await render({
        items: [{ id: '1' }],
      });

      expect(view.getItemRoot('1')).not.to.have.attribute('aria-expanded');
    });
  });

  describe('setItemExpansion API method', () => {
    it('should expand a collapsed item', async () => {
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }],
      });

      act(() => {
        view.actionsRef.current!.setItemExpansion('1', true);
      });

      expect(view.isItemExpanded('1')).to.equal(true);
    });

    it('should collapse an expanded item', async () => {
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }],
        defaultExpandedItems: ['1'],
      });

      act(() => {
        view.actionsRef.current!.setItemExpansion('1', false);
      });

      expect(view.isItemExpanded('1')).to.equal(false);
    });

    it('should do nothing when expanding an already expanded item', async () => {
      const onExpandedItemsChange = spy();

      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }],
        defaultExpandedItems: ['1'],
        onExpandedItemsChange,
      });

      act(() => {
        view.actionsRef.current!.setItemExpansion('1', true);
      });

      expect(view.isItemExpanded('1')).to.equal(true);
      expect(onExpandedItemsChange.callCount).to.equal(0);
    });

    it('should do nothing when collapsing an already collapsed item', async () => {
      const onExpandedItemsChange = spy();

      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }],
        onExpandedItemsChange,
      });

      act(() => {
        view.actionsRef.current!.setItemExpansion('1', false);
      });

      expect(view.isItemExpanded('1')).to.equal(false);
      expect(onExpandedItemsChange.callCount).to.equal(0);
    });
  });
});
