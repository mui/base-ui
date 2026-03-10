import { expect } from 'chai';
import { spy } from 'sinon';
import { fireEvent } from '@mui/internal-test-utils';
import { describeTree } from '../../../test/describeTree';

describeTree('TreeRoot - Items', ({ render }) => {
  describe('items prop', () => {
    it('should support removing an item', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
      });

      await view.setItems([{ id: '1' }]);
      expect(view.getAllTreeItemIds()).to.deep.equal(['1']);
    });

    it('should support adding an item at the end', async () => {
      const view = await render({
        items: [{ id: '1' }],
      });

      await view.setItems([{ id: '1' }, { id: '2' }]);
      expect(view.getAllTreeItemIds()).to.deep.equal(['1', '2']);
    });

    it('should support adding an item at the beginning', async () => {
      const view = await render({
        items: [{ id: '2' }],
      });

      await view.setItems([{ id: '1' }, { id: '2' }]);
      expect(view.getAllTreeItemIds()).to.deep.equal(['1', '2']);
    });

    it('should update indexes when two items are swapped', async () => {
      const onSelectedItemsChange = spy();

      const view = await render({
        items: [{ id: '1' }, { id: '2' }, { id: '3' }],
        multiple: true,
        onSelectedItemsChange,
      });

      await view.setItems([{ id: '1' }, { id: '3' }, { id: '2' }]);
      expect(view.getAllTreeItemIds()).to.deep.equal(['1', '3', '2']);

      // Check if the internal state is updated by running a range selection
      fireEvent.click(view.getItemRoot('1'));
      fireEvent.click(view.getItemRoot('3'), { shiftKey: true });
      expect(onSelectedItemsChange.lastCall.args[0]).to.deep.equal(['1', '3']);
    });

    it('should not mark an item as expandable if its children is an empty array', async () => {
      const view = await render({
        items: [{ id: '1', children: [] }],
        defaultExpandedItems: ['1'],
      });

      expect(view.getItemRoot('1')).not.to.have.attribute('aria-expanded');
    });

    it('should use getItemLabel to render the label', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
        getItemLabel: (item: any) => `Label: ${item.id}`,
      });

      expect(view.getItemRoot('1')).to.have.text('Label: 1');
      expect(view.getItemRoot('2')).to.have.text('Label: 2');
    });

    it('should use getItemChildren to find children', async () => {
      const items = [
        {
          id: '1',
          label: 'Node 1',
          section: [
            { id: '1.1', label: 'Child 1' },
            { id: '1.2', label: 'Child 2' },
          ],
        },
        { id: '2', label: 'Node 2' },
      ];

      const view = await render({
        items,
        getItemChildren: (item: any) => item.section,
        defaultExpandedItems: ['1'],
      });

      expect(view.getAllTreeItemIds()).to.deep.equal(['1', '1.1', '1.2', '2']);
    });
  });

  describe('disabled prop', () => {
    it('should not have the attribute `aria-disabled` if disabled is not defined', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2', disabled: false }, { id: '3', disabled: true }],
      });

      expect(view.getItemRoot('1')).not.to.have.attribute('aria-disabled');
      expect(view.getItemRoot('2')).not.to.have.attribute('aria-disabled');
      expect(view.getItemRoot('3')).to.have.attribute('aria-disabled');
    });

    it('should disable all descendants of a disabled item', async () => {
      const view = await render({
        items: [
          { id: '1', disabled: true, children: [{ id: '1.1', children: [{ id: '1.1.1' }] }] },
        ],
        defaultExpandedItems: ['1', '1.1'],
      });

      expect(view.getItemRoot('1')).to.have.attribute('aria-disabled', 'true');
      expect(view.getItemRoot('1.1')).to.have.attribute('aria-disabled', 'true');
      expect(view.getItemRoot('1.1.1')).to.have.attribute('aria-disabled', 'true');
    });
  });

  describe('onItemClick prop', () => {
    it('should call onItemClick when clicking on an item', async () => {
      const onItemClick = spy();

      const view = await render({
        items: [{ id: '1' }],
        onItemClick,
      });

      fireEvent.click(view.getItemRoot('1'));
      expect(onItemClick.callCount).to.equal(1);
      expect(onItemClick.lastCall.args[1]).to.equal('1');
    });

    it('should not call onItemClick for the ancestors of the clicked item', async () => {
      const onItemClick = spy();

      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }],
        defaultExpandedItems: ['1'],
        onItemClick,
      });

      fireEvent.click(view.getItemRoot('1.1'));
      expect(onItemClick.callCount).to.equal(1);
      expect(onItemClick.lastCall.args[1]).to.equal('1.1');
    });
  });

  describe('API methods', () => {
    describe('getItem', () => {
      it('should return the item model', async () => {
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1' }] }, { id: '2' }],
        });

        expect(view.actionsRef.current!.getItem('1')).to.deep.equal({
          id: '1',
          label: '1',
          children: [{ id: '1.1', label: '1.1' }],
        });
      });

      it('should have up to date data when items change', async () => {
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1' }] }, { id: '2' }],
        });

        await view.setItems([{ id: '1' }, { id: '2' }]);

        expect(view.actionsRef.current!.getItem('1')).to.deep.equal({
          id: '1',
          label: '1',
        });
      });
    });

    describe('getItemDOMElement', () => {
      it('should return the DOM element of the item', async () => {
        const view = await render({
          items: [{ id: '1' }],
        });

        expect(view.actionsRef.current!.getItemDOMElement('1')).to.equal(view.getItemRoot('1'));
      });

      it('should return null when the item does not exist', async () => {
        const view = await render({
          items: [{ id: '1' }],
        });

        expect(view.actionsRef.current!.getItemDOMElement('2')).to.equal(null);
      });
    });

    describe('getItemTree', () => {
      it('should return the tree', async () => {
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1' }] }, { id: '2' }],
        });

        expect(view.actionsRef.current!.getItemTree()).to.deep.equal([
          { id: '1', label: '1', children: [{ id: '1.1', label: '1.1' }] },
          { id: '2', label: '2' },
        ]);
      });

      it('should have up to date tree when items change', async () => {
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1' }] }, { id: '2' }],
        });

        await view.setItems([{ id: '1' }, { id: '2' }]);

        expect(view.actionsRef.current!.getItemTree()).to.deep.equal([
          { id: '1', label: '1' },
          { id: '2', label: '2' },
        ]);
      });
    });

    describe('getItemOrderedChildrenIds', () => {
      it('should return the children of an item in their rendering order', async () => {
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1' }, { id: '1.2' }] }],
        });

        expect(view.actionsRef.current!.getItemOrderedChildrenIds('1')).to.deep.equal([
          '1.1',
          '1.2',
        ]);
      });

      it('should work for the root items', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
        });

        expect(view.actionsRef.current!.getItemOrderedChildrenIds(null)).to.deep.equal(['1', '2']);
      });

      it('should have up to date children when items change', async () => {
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1' }] }, { id: '2' }],
        });

        await view.setItems([{ id: '1', children: [{ id: '1.1' }, { id: '1.2' }] }]);

        expect(view.actionsRef.current!.getItemOrderedChildrenIds('1')).to.deep.equal([
          '1.1',
          '1.2',
        ]);
      });
    });
  });

  describe('flat DOM structure', () => {
    it('should render all items as siblings', async () => {
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }] }],
        defaultExpandedItems: ['1'],
      });

      const parentRoot = view.getItemRoot('1');
      const childRoot = view.getItemRoot('1.1');

      // In flat DOM structure, the child is NOT a descendant of the parent
      expect(parentRoot.contains(childRoot)).to.equal(false);
      // Both items should be siblings (same parent)
      expect(parentRoot.parentElement).to.equal(childRoot.parentElement);
    });

    it('should render deeply nested items correctly', async () => {
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1', children: [{ id: '1.1.1' }] }] }],
        defaultExpandedItems: ['1', '1.1'],
      });

      const item1 = view.getItemRoot('1');
      const item11 = view.getItemRoot('1.1');
      const item111 = view.getItemRoot('1.1.1');

      // All items should be siblings in flat structure
      expect(item1.parentElement).to.equal(item11.parentElement);
      expect(item11.parentElement).to.equal(item111.parentElement);
    });
  });
});
