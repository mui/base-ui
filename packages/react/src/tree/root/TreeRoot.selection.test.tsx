import { expect } from 'chai';
import { spy } from 'sinon';
import { act, fireEvent } from '@mui/internal-test-utils';
import { describeTree } from '../../../test/describeTree';

/**
 * All tests related to keyboard navigation (e.g.: selection using "Space")
 * are located in the `TreeRoot.keyboard.test.tsx` file.
 */
describeTree('TreeRoot - Selection', ({ render }) => {
  describe('model props (selectedItems, defaultSelectedItems, onSelectedItemsChange)', () => {
    it('should not select items when no default state and no control state are defined', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
      });

      expect(view.isItemSelected('1')).to.equal(false);
    });

    it('should use the default state when defined', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
        defaultSelectedItems: ['1'],
      });

      expect(view.isItemSelected('1')).to.equal(true);
    });

    it('should use the controlled state when defined', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
        selectedItems: ['1'],
      });

      expect(view.isItemSelected('1')).to.equal(true);
    });

    it('should use the controlled state instead of the default state when both are defined', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
        selectedItems: ['1'],
        defaultSelectedItems: ['2'],
      });

      expect(view.isItemSelected('1')).to.equal(true);
    });

    it('should react to controlled state update', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
        selectedItems: [],
      });

      await view.setProps({ selectedItems: ['1'] });
      expect(view.isItemSelected('1')).to.equal(true);
    });

    it('should call the onSelectedItemsChange callback when the model is updated (single selection and add selected item)', async () => {
      const onSelectedItemsChange = spy();

      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
        onSelectedItemsChange,
      });

      fireEvent.click(view.getItemRoot('1'));

      expect(onSelectedItemsChange.callCount).to.equal(1);
      expect(onSelectedItemsChange.lastCall.args[0]).to.deep.equal('1');
    });

    it('should call the onSelectedItemsChange callback when the model is updated (multi selection and add selected item to empty list)', async () => {
      const onSelectedItemsChange = spy();

      const view = await render({
        multiSelect: true,
        items: [{ id: '1' }, { id: '2' }],
        onSelectedItemsChange,
      });

      fireEvent.click(view.getItemRoot('1'));

      expect(onSelectedItemsChange.callCount).to.equal(1);
      expect(onSelectedItemsChange.lastCall.args[0]).to.deep.equal(['1']);
    });

    it('should call the onSelectedItemsChange callback when the model is updated (multi selection and add selected item to non-empty list)', async () => {
      const onSelectedItemsChange = spy();

      const view = await render({
        multiSelect: true,
        items: [{ id: '1' }, { id: '2' }],
        onSelectedItemsChange,
        defaultSelectedItems: ['1'],
      });

      fireEvent.click(view.getItemRoot('2'), { ctrlKey: true });

      expect(onSelectedItemsChange.callCount).to.equal(1);
      expect(onSelectedItemsChange.lastCall.args[0]).to.deep.equal(['2', '1']);
    });

    it('should call the onSelectedItemsChange callback when the model is updated (multi selection and remove selected item)', async () => {
      const onSelectedItemsChange = spy();

      const view = await render({
        multiSelect: true,
        items: [{ id: '1' }, { id: '2' }],
        onSelectedItemsChange,
        defaultSelectedItems: ['1'],
      });

      fireEvent.click(view.getItemRoot('1'), { ctrlKey: true });

      expect(onSelectedItemsChange.callCount).to.equal(1);
      expect(onSelectedItemsChange.lastCall.args[0]).to.deep.equal([]);
    });
  });

  describe('item click interaction', () => {
    describe('single selection', () => {
      it('should select un-selected item when clicking on an item', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
        });

        expect(view.isItemSelected('1')).to.equal(false);

        fireEvent.click(view.getItemRoot('1'));
        expect(view.isItemSelected('1')).to.equal(true);
      });

      it('should not un-select selected item when clicking on an item', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
          defaultSelectedItems: '1',
        });

        expect(view.isItemSelected('1')).to.equal(true);

        fireEvent.click(view.getItemRoot('1'));
        expect(view.isItemSelected('1')).to.equal(true);
      });

      it('should not select an item when click and disableSelection', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
          disableSelection: true,
        });

        expect(view.isItemSelected('1')).to.equal(false);

        fireEvent.click(view.getItemRoot('1'));
        expect(view.isItemSelected('1')).to.equal(false);
      });

      it('should not select an item when clicking on a disabled item', async () => {
        const view = await render({
          items: [{ id: '1', disabled: true }, { id: '2' }],
        });

        expect(view.isItemSelected('1')).to.equal(false);
        fireEvent.click(view.getItemRoot('1'));
        expect(view.isItemSelected('1')).to.equal(false);
      });
    });

    describe('multi selection', () => {
      it('should select un-selected item and remove other selected items when clicking on an item', async () => {
        const view = await render({
          multiSelect: true,
          items: [{ id: '1' }, { id: '2' }],
          defaultSelectedItems: ['2'],
        });

        expect(view.getSelectedTreeItems()).to.deep.equal(['2']);

        fireEvent.click(view.getItemRoot('1'));
        expect(view.getSelectedTreeItems()).to.deep.equal(['1']);
      });

      it('should not un-select selected item when clicking on an item', async () => {
        const view = await render({
          multiSelect: true,
          items: [{ id: '1' }, { id: '2' }],
          defaultSelectedItems: ['1'],
        });

        expect(view.isItemSelected('1')).to.equal(true);

        fireEvent.click(view.getItemRoot('1'));
        expect(view.isItemSelected('1')).to.equal(true);
      });

      it('should un-select selected item when clicking on its content while holding Ctrl', async () => {
        const view = await render({
          multiSelect: true,
          items: [{ id: '1' }, { id: '2' }],
          defaultSelectedItems: ['1', '2'],
        });

        expect(view.getSelectedTreeItems()).to.deep.equal(['1', '2']);
        fireEvent.click(view.getItemRoot('1'), { ctrlKey: true });
        expect(view.getSelectedTreeItems()).to.deep.equal(['2']);
      });

      it('should un-select selected item when clicking on its content while holding Meta', async () => {
        const view = await render({
          multiSelect: true,
          items: [{ id: '1' }, { id: '2' }],
          defaultSelectedItems: ['1', '2'],
        });

        expect(view.getSelectedTreeItems()).to.deep.equal(['1', '2']);

        fireEvent.click(view.getItemRoot('1'), { metaKey: true });
        expect(view.getSelectedTreeItems()).to.deep.equal(['2']);
      });

      it('should not select an item when click and disableSelection', async () => {
        const view = await render({
          multiSelect: true,
          items: [{ id: '1' }, { id: '2' }],
          disableSelection: true,
        });

        expect(view.isItemSelected('1')).to.equal(false);

        fireEvent.click(view.getItemRoot('1'));
        expect(view.isItemSelected('1')).to.equal(false);
      });

      it('should not select an item when clicking on a disabled item', async () => {
        const view = await render({
          multiSelect: true,
          items: [{ id: '1', disabled: true }, { id: '2' }],
        });

        expect(view.isItemSelected('1')).to.equal(false);
        fireEvent.click(view.getItemRoot('1'));
        expect(view.isItemSelected('1')).to.equal(false);
      });

      it('should select un-selected item when clicking on its content while holding Ctrl', async () => {
        const view = await render({
          multiSelect: true,
          items: [{ id: '1' }, { id: '2' }, { id: '3' }],
          defaultSelectedItems: ['1'],
        });

        expect(view.getSelectedTreeItems()).to.deep.equal(['1']);

        fireEvent.click(view.getItemRoot('3'), { ctrlKey: true });
        expect(view.getSelectedTreeItems()).to.deep.equal(['1', '3']);
      });

      it('should do nothing when clicking on an item on a fresh tree while holding Shift', async () => {
        const view = await render({
          multiSelect: true,
          items: [{ id: '1' }, { id: '2' }, { id: '2.1' }, { id: '3' }, { id: '4' }],
        });

        fireEvent.click(view.getItemRoot('3'), { shiftKey: true });
        expect(view.getSelectedTreeItems()).to.deep.equal([]);
      });

      it('should expand the selection range when clicking on an item below the last selected item while holding Shift', async () => {
        const view = await render({
          multiSelect: true,
          items: [{ id: '1' }, { id: '2' }, { id: '2.1' }, { id: '3' }, { id: '4' }],
        });

        fireEvent.click(view.getItemRoot('2'));
        expect(view.getSelectedTreeItems()).to.deep.equal(['2']);

        fireEvent.click(view.getItemRoot('3'), { shiftKey: true });
        expect(view.getSelectedTreeItems()).to.deep.equal(['2', '2.1', '3']);
      });

      it('should expand the selection range when clicking on an item above the last selected item while holding Shift', async () => {
        const view = await render({
          multiSelect: true,
          items: [{ id: '1' }, { id: '2' }, { id: '2.1' }, { id: '3' }, { id: '4' }],
        });

        fireEvent.click(view.getItemRoot('3'));
        expect(view.getSelectedTreeItems()).to.deep.equal(['3']);

        fireEvent.click(view.getItemRoot('2'), { shiftKey: true });
        expect(view.getSelectedTreeItems()).to.deep.equal(['2', '2.1', '3']);
      });

      it('should expand the selection range when clicking on an item while holding Shift after un-selecting another item', async () => {
        const view = await render({
          multiSelect: true,
          items: [{ id: '1' }, { id: '2' }, { id: '2.1' }, { id: '3' }, { id: '4' }],
        });

        fireEvent.click(view.getItemRoot('1'));
        expect(view.getSelectedTreeItems()).to.deep.equal(['1']);

        fireEvent.click(view.getItemRoot('2'), { ctrlKey: true });
        expect(view.getSelectedTreeItems()).to.deep.equal(['1', '2']);

        fireEvent.click(view.getItemRoot('2'), { ctrlKey: true });
        expect(view.getSelectedTreeItems()).to.deep.equal(['1']);

        fireEvent.click(view.getItemRoot('3'), { shiftKey: true });
        expect(view.getSelectedTreeItems()).to.deep.equal(['1', '2', '2.1', '3']);
      });

      it('should not expand the selection range when clicking on a disabled item then clicking on an item while holding Shift', async () => {
        const view = await render({
          multiSelect: true,
          items: [
            { id: '1' },
            { id: '2', disabled: true },
            { id: '2.1' },
            { id: '3' },
            { id: '4' },
          ],
        });

        fireEvent.click(view.getItemRoot('2'));
        expect(view.getSelectedTreeItems()).to.deep.equal([]);

        fireEvent.click(view.getItemRoot('3'), { shiftKey: true });
        expect(view.getSelectedTreeItems()).to.deep.equal([]);
      });

      it('should not expand the selection range when clicking on an item then clicking a disabled item while holding Shift', async () => {
        const view = await render({
          multiSelect: true,
          items: [
            { id: '1' },
            { id: '2' },
            { id: '2.1' },
            { id: '3', disabled: true },
            { id: '4' },
          ],
        });

        fireEvent.click(view.getItemRoot('2'));
        expect(view.getSelectedTreeItems()).to.deep.equal(['2']);

        fireEvent.click(view.getItemRoot('3'), { shiftKey: true });
        expect(view.getSelectedTreeItems()).to.deep.equal(['2']);
      });

      it('should not select disabled items that are part of the selected range', async () => {
        const view = await render({
          multiSelect: true,
          items: [{ id: '1' }, { id: '2', disabled: true }, { id: '3' }],
        });

        fireEvent.click(view.getItemRoot('1'));
        expect(view.getSelectedTreeItems()).to.deep.equal(['1']);

        fireEvent.click(view.getItemRoot('3'), { shiftKey: true });
        expect(view.getSelectedTreeItems()).to.deep.equal(['1', '3']);
      });

      it('should not crash when selecting multiple items in a deeply nested tree', async () => {
        const view = await render({
          multiSelect: true,
          items: [{ id: '1', children: [{ id: '1.1', children: [{ id: '1.1.1' }] }] }, { id: '2' }],
          defaultExpandedItems: ['1', '1.1'],
        });

        fireEvent.click(view.getItemRoot('1.1.1'));
        fireEvent.click(view.getItemRoot('2'), { shiftKey: true });

        expect(view.getSelectedTreeItems()).to.deep.equal(['1.1.1', '2']);
      });
    });
  });

  describe('checkbox interaction', () => {
    describe('single selection', () => {
      it('should not change selection when clicking on an item', async () => {
        const view = await render({
          checkboxSelection: true,
          items: [{ id: '1' }],
        });

        expect(view.isItemSelected('1')).to.equal(false);

        fireEvent.click(view.getItemRoot('1'));
        expect(view.isItemSelected('1')).to.equal(false);
      });

      it('should select un-selected item when clicking on an item checkbox', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
          checkboxSelection: true,
        });

        expect(view.isItemSelected('1')).to.equal(false);

        fireEvent.click(view.getItemCheckboxInput('1'));
        expect(view.isItemSelected('1')).to.equal(true);
      });

      it('should un-select selected item when clicking on an item checkbox', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
          defaultSelectedItems: '1',
          checkboxSelection: true,
        });

        expect(view.isItemSelected('1')).to.equal(true);

        fireEvent.click(view.getItemCheckboxInput('1'));
        expect(view.isItemSelected('1')).to.equal(false);
      });

      it('should hide checkbox and not select when disableSelection is true on TreeView', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
          disableSelection: true,
          checkboxSelection: true,
        });

        expect(view.isItemSelected('1')).to.equal(false);
        // Checkbox should be hidden when selection is disabled
        expect(view.getItemRoot('1').querySelector('input[type="checkbox"]')).to.equal(null);
        // Clicking content should not select
        fireEvent.click(view.getItemRoot('1'));
        expect(view.isItemSelected('1')).to.equal(false);
      });

      it('should not select an item when clicking on a disabled item checkbox', async () => {
        const view = await render({
          items: [{ id: '1', disabled: true }, { id: '2' }],
          checkboxSelection: true,
        });

        expect(view.isItemSelected('1')).to.equal(false);
        fireEvent.click(view.getItemCheckboxInput('1'));
        expect(view.isItemSelected('1')).to.equal(false);
      });
    });

    describe('multi selection', () => {
      it('should not change selection when clicking on an item', async () => {
        const view = await render({
          multiSelect: true,
          checkboxSelection: true,
          items: [{ id: '1' }],
        });

        expect(view.isItemSelected('1')).to.equal(false);

        fireEvent.click(view.getItemRoot('1'));
        expect(view.isItemSelected('1')).to.equal(false);
      });

      it('should select un-selected item and keep other items selected when clicking on an item checkbox', async () => {
        const view = await render({
          multiSelect: true,
          checkboxSelection: true,
          items: [{ id: '1' }, { id: '2' }],
          defaultSelectedItems: ['2'],
        });

        expect(view.getSelectedTreeItems()).to.deep.equal(['2']);

        fireEvent.click(view.getItemCheckboxInput('1'));
        expect(view.getSelectedTreeItems()).to.deep.equal(['1', '2']);
      });

      it('should un-select selected item when clicking on an item checkbox', async () => {
        const view = await render({
          multiSelect: true,
          checkboxSelection: true,
          items: [{ id: '1' }, { id: '2' }],
          defaultSelectedItems: ['1'],
        });

        expect(view.isItemSelected('1')).to.equal(true);

        fireEvent.click(view.getItemCheckboxInput('1'));
        expect(view.isItemSelected('1')).to.equal(false);
      });

      it('should hide checkbox and not select when disableSelection is true on TreeView', async () => {
        const view = await render({
          multiSelect: true,
          checkboxSelection: true,
          items: [{ id: '1' }, { id: '2' }],
          disableSelection: true,
        });

        expect(view.isItemSelected('1')).to.equal(false);
        // Checkbox should be hidden when selection is disabled
        expect(view.getItemRoot('1').querySelector('input[type="checkbox"]')).to.equal(null);
        // Clicking content should not select
        fireEvent.click(view.getItemRoot('1'));
        expect(view.isItemSelected('1')).to.equal(false);
      });

      it('should not select an item when clicking on a disabled item', async () => {
        const view = await render({
          multiSelect: true,
          checkboxSelection: true,
          items: [{ id: '1', disabled: true }, { id: '2' }],
        });

        expect(view.isItemSelected('1')).to.equal(false);
        fireEvent.click(view.getItemCheckboxInput('1'));
        expect(view.isItemSelected('1')).to.equal(false);
      });

      it('should expand the selection range when clicking on an item checkbox below the last selected item while holding Shift', async () => {
        const view = await render({
          multiSelect: true,
          checkboxSelection: true,
          items: [{ id: '1' }, { id: '2' }, { id: '2.1' }, { id: '3' }, { id: '4' }],
        });

        fireEvent.click(view.getItemCheckboxInput('2'));
        expect(view.getSelectedTreeItems()).to.deep.equal(['2']);

        fireEvent.click(view.getItemCheckboxInput('3'), { shiftKey: true });
        expect(view.getSelectedTreeItems()).to.deep.equal(['2', '2.1', '3']);
      });

      it('should expand the selection range when clicking on an item checkbox above the last selected item while holding Shift', async () => {
        const view = await render({
          multiSelect: true,
          checkboxSelection: true,
          items: [{ id: '1' }, { id: '2' }, { id: '2.1' }, { id: '3' }, { id: '4' }],
        });

        fireEvent.click(view.getItemCheckboxInput('3'));
        expect(view.getSelectedTreeItems()).to.deep.equal(['3']);

        fireEvent.click(view.getItemCheckboxInput('2'), { shiftKey: true });
        expect(view.getSelectedTreeItems()).to.deep.equal(['2', '2.1', '3']);
      });

      it('should expand the selection range when clicking on an item checkbox while holding Shift after un-selecting another item', async () => {
        const view = await render({
          multiSelect: true,
          checkboxSelection: true,
          items: [{ id: '1' }, { id: '2' }, { id: '2.1' }, { id: '3' }, { id: '4' }],
        });

        fireEvent.click(view.getItemCheckboxInput('1'));
        expect(view.getSelectedTreeItems()).to.deep.equal(['1']);

        fireEvent.click(view.getItemCheckboxInput('2'));
        expect(view.getSelectedTreeItems()).to.deep.equal(['1', '2']);

        fireEvent.click(view.getItemCheckboxInput('2'));
        expect(view.getSelectedTreeItems()).to.deep.equal(['1']);

        fireEvent.click(view.getItemCheckboxInput('3'), { shiftKey: true });
        expect(view.getSelectedTreeItems()).to.deep.equal(['1', '2', '2.1', '3']);
      });

      it('should not expand the selection range when clicking on a disabled item checkbox then clicking on an item checkbox while holding Shift', async () => {
        const view = await render({
          multiSelect: true,
          checkboxSelection: true,
          items: [
            { id: '1' },
            { id: '2', disabled: true },
            { id: '2.1' },
            { id: '3' },
            { id: '4' },
          ],
        });

        fireEvent.click(view.getItemCheckboxInput('2'));
        expect(view.getSelectedTreeItems()).to.deep.equal([]);

        fireEvent.click(view.getItemCheckboxInput('3'), { shiftKey: true });
        expect(view.getSelectedTreeItems()).to.deep.equal([]);
      });

      it('should not expand the selection range when clicking on an item checkbox then clicking a disabled item checkbox while holding Shift', async () => {
        const view = await render({
          multiSelect: true,
          checkboxSelection: true,
          items: [
            { id: '1' },
            { id: '2' },
            { id: '2.1' },
            { id: '3', disabled: true },
            { id: '4' },
          ],
        });

        fireEvent.click(view.getItemCheckboxInput('2'));
        expect(view.getSelectedTreeItems()).to.deep.equal(['2']);

        fireEvent.click(view.getItemCheckboxInput('3'), { shiftKey: true });
        expect(view.getSelectedTreeItems()).to.deep.equal(['2']);
      });

      it('should not select disabled items that are part of the selected range', async () => {
        const view = await render({
          multiSelect: true,
          checkboxSelection: true,
          items: [{ id: '1' }, { id: '2', disabled: true }, { id: '3' }],
        });

        fireEvent.click(view.getItemCheckboxInput('1'));
        expect(view.getSelectedTreeItems()).to.deep.equal(['1']);

        fireEvent.click(view.getItemCheckboxInput('3'), { shiftKey: true });
        expect(view.getSelectedTreeItems()).to.deep.equal(['1', '3']);
      });

      it('should not select the parent when selecting all the children', async () => {
        const view = await render({
          multiSelect: true,
          checkboxSelection: true,
          items: [{ id: '1', children: [{ id: '1.1' }, { id: '1.2' }] }, { id: '2' }],
          defaultSelectedItems: ['1.2'],
          defaultExpandedItems: ['1'],
        });

        fireEvent.click(view.getItemCheckboxInput('1.1'));
        expect(view.getSelectedTreeItems()).to.deep.equal(['1.1', '1.2']);
      });

      it('should set the parent checkbox as indeterminate when some children are selected but the parent is not', async () => {
        const view = await render({
          multiSelect: true,
          checkboxSelection: true,
          items: [{ id: '1', children: [{ id: '1.1' }, { id: '1.2' }] }, { id: '2' }],
          defaultSelectedItems: ['1.1'],
          defaultExpandedItems: ['1'],
        });

        expect(view.getItemCheckboxInput('1')).to.have.attribute('data-indeterminate');
      });

      it('should set the parent checkbox indeterminate when all its children are selected but the parent is not', async () => {
        const view = await render({
          multiSelect: true,
          checkboxSelection: true,
          items: [{ id: '1', children: [{ id: '1.1' }, { id: '1.2' }] }],
          defaultSelectedItems: ['1.1', '1.2'],
          defaultExpandedItems: ['1'],
        });

        expect(view.getItemCheckboxInput('1')).to.have.attribute('data-indeterminate');
      });

      it('should set the parent checkbox indeterminate when some of its descendants are selected but the parent is not', async () => {
        const view = await render({
          multiSelect: true,
          checkboxSelection: true,
          items: [
            { id: '1', children: [{ id: '1.1' }, { id: '1.2', children: [{ id: '1.2.1' }] }] },
          ],
          defaultSelectedItems: ['1.2.1'],
          defaultExpandedItems: ['1', '1.2'],
        });

        expect(view.getItemCheckboxInput('1')).to.have.attribute('data-indeterminate');
      });

      it('should keep the parent checkbox indeterminate after collapsing it and expanding another node', async () => {
        const view = await render({
          multiSelect: true,
          checkboxSelection: true,
          items: [
            { id: '1', children: [{ id: '1.1' }, { id: '1.2' }] },
            { id: '2', children: [{ id: '2.1' }] },
          ],
          defaultSelectedItems: ['1.1'],
          defaultExpandedItems: ['1'],
        });

        expect(view.getItemCheckboxInput('1')).to.have.attribute('data-indeterminate');

        fireEvent.click(view.getItemRoot('1'));
        fireEvent.click(view.getItemRoot('2'));

        expect(view.getItemCheckboxInput('1')).to.have.attribute('data-indeterminate');
      });

      it('should keep parent indeterminate (3 levels) after collapsing the parent and expanding a sibling node', async () => {
        const view = await render({
          multiSelect: true,
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

        expect(view.getItemCheckboxInput('1.1')).to.have.attribute('data-indeterminate');
        expect(view.getItemCheckboxInput('1')).to.have.attribute('data-indeterminate');

        fireEvent.click(view.getItemRoot('1'));
        fireEvent.click(view.getItemRoot('2'));

        expect(view.getItemCheckboxInput('1')).to.have.attribute('data-indeterminate');
      });

      it('should not set the parent checkbox as indeterminate when no child is selected and the parent is not either', async () => {
        const view = await render({
          multiSelect: true,
          checkboxSelection: true,
          items: [{ id: '1', children: [{ id: '1.1' }, { id: '1.2' }] }, { id: '2' }],
          defaultExpandedItems: ['1'],
        });

        expect(view.getItemCheckboxInput('1')).not.to.have.attribute('data-indeterminate');
      });

      it('should update the intermediate state of the parent when selecting a child', async () => {
        const view = await render({
          multiSelect: true,
          checkboxSelection: true,
          items: [{ id: '1' }, { id: '2', children: [{ id: '2.1' }, { id: '2.2' }] }],
          defaultExpandedItems: ['2'],
        });

        expect(view.getItemCheckboxInput('2')).not.to.have.attribute('data-indeterminate');

        fireEvent.click(view.getItemCheckboxInput('2.1'));
        expect(view.getItemCheckboxInput('2')).to.have.attribute('data-indeterminate');

        fireEvent.click(view.getItemCheckboxInput('2.1'));
        expect(view.getItemCheckboxInput('2')).not.to.have.attribute('data-indeterminate');
      });
    });

    describe('multi selection with selectionPropagation.descendants = true', () => {
      it('should select all the children when selecting a parent', async () => {
        const view = await render({
          multiSelect: true,
          checkboxSelection: true,
          items: [{ id: '1', children: [{ id: '1.1' }, { id: '1.2' }] }],
          defaultExpandedItems: ['1'],
          selectionPropagation: { descendants: true },
        });

        fireEvent.click(view.getItemCheckboxInput('1'));
        expect(view.getSelectedTreeItems()).to.deep.equal(['1', '1.1', '1.2']);
      });

      it('should deselect all the children when deselecting a parent', async () => {
        const view = await render({
          multiSelect: true,
          checkboxSelection: true,
          items: [{ id: '1', children: [{ id: '1.1' }, { id: '1.2' }] }],
          defaultSelectedItems: ['1', '1.1', '1.2'],
          defaultExpandedItems: ['1'],
          selectionPropagation: { descendants: true },
        });

        fireEvent.click(view.getItemCheckboxInput('1'));
        expect(view.getSelectedTreeItems()).to.deep.equal([]);
      });

      it('should not select the parent when selecting all the children', async () => {
        const view = await render({
          multiSelect: true,
          checkboxSelection: true,
          items: [{ id: '1', children: [{ id: '1.1' }, { id: '1.2' }] }],
          defaultSelectedItems: ['1.2'],
          defaultExpandedItems: ['1'],
          selectionPropagation: { descendants: true },
        });

        fireEvent.click(view.getItemCheckboxInput('1.1'));
        expect(view.getSelectedTreeItems()).to.deep.equal(['1.1', '1.2']);
      });

      it('should not unselect the parent when unselecting a children', async () => {
        const view = await render({
          multiSelect: true,
          checkboxSelection: true,
          items: [{ id: '1', children: [{ id: '1.1' }, { id: '1.2' }] }],
          defaultSelectedItems: ['1', '1.1', '1.2'],
          defaultExpandedItems: ['1'],
          selectionPropagation: { descendants: true },
        });

        fireEvent.click(view.getItemCheckboxInput('1.1'));
        expect(view.getSelectedTreeItems()).to.deep.equal(['1', '1.2']);
      });
    });

    describe('multi selection with selectionPropagation.parents = true', () => {
      it('should select all the parents when selecting a child', async () => {
        const view = await render({
          multiSelect: true,
          checkboxSelection: true,
          items: [{ id: '1', children: [{ id: '1.1', children: [{ id: '1.1.1' }] }] }],
          defaultExpandedItems: ['1', '1.1'],
          selectionPropagation: { parents: true },
        });

        fireEvent.click(view.getItemCheckboxInput('1.1.1'));
        expect(view.getSelectedTreeItems()).to.deep.equal(['1', '1.1', '1.1.1']);
      });

      it('should deselect all the parents when deselecting a child', async () => {
        const view = await render({
          multiSelect: true,
          checkboxSelection: true,
          items: [{ id: '1', children: [{ id: '1.1', children: [{ id: '1.1.1' }] }] }],
          defaultSelectedItems: ['1', '1.1', '1.1.1'],
          defaultExpandedItems: ['1', '1.1'],
          selectionPropagation: { parents: true },
        });

        fireEvent.click(view.getItemCheckboxInput('1.1.1'));
        expect(view.getSelectedTreeItems()).to.deep.equal([]);
      });
    });
  });

  describe('aria-multiselectable tree attribute', () => {
    it('should have the attribute `aria-multiselectable=false if using single select`', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
      });

      expect(view.getRoot()).to.have.attribute('aria-multiselectable', 'false');
    });

    it('should have the attribute `aria-multiselectable=true if using multi select`', async () => {
      const view = await render({ items: [{ id: '1' }, { id: '2' }], multiSelect: true });

      expect(view.getRoot()).to.have.attribute('aria-multiselectable', 'true');
    });
  });

  // The `aria-checked` attribute is used by the `view.isItemSelected` method.
  // This `describe` only tests basics scenarios, more complex scenarios are tested in this file's other `describe`.
  describe('aria-checked item attribute', () => {
    describe('single selection', () => {
      it('should have the attribute `aria-checked=false` if not selected', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
        });

        expect(view.getItemRoot('1')).to.have.attribute('aria-checked', 'false');
      });

      it('should have the attribute `aria-checked=true` if selected', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
          defaultSelectedItems: '1',
        });

        expect(view.getItemRoot('1')).to.have.attribute('aria-checked', 'true');
      });

      it('should have the attribute `aria-checked="mixed"` if partially selected', async () => {
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1' }, { id: '1.2' }] }, { id: '2' }],
          defaultSelectedItems: '1.1',
          defaultExpandedItems: ['1'],
        });
        expect(view.getItemRoot('1')).to.have.attribute('aria-checked', 'mixed');
      });
    });

    describe('multi selection', () => {
      it('should have the attribute `aria-checked=false` if not selected', async () => {
        const view = await render({
          multiSelect: true,
          items: [{ id: '1' }, { id: '2' }],
        });

        expect(view.getItemRoot('1')).to.have.attribute('aria-checked', 'false');
      });

      it('should have the attribute `aria-checked=true` if selected', async () => {
        const view = await render({
          multiSelect: true,
          items: [{ id: '1' }, { id: '2' }],
          defaultSelectedItems: ['1'],
        });

        expect(view.getItemRoot('1')).to.have.attribute('aria-checked', 'true');
      });

      it('should not have the attribute `aria-checked=false` if disabledSelection is true', async () => {
        const view = await render({
          multiSelect: true,
          items: [{ id: '1' }, { id: '2' }],
          disableSelection: true,
        });

        expect(view.getItemRoot('1')).not.to.have.attribute('aria-checked');
      });

      it('should not have the attribute `aria-checked=false` if the item is disabled', async () => {
        const view = await render({
          multiSelect: true,
          items: [{ id: '1', disabled: true }, { id: '2' }],
        });

        expect(view.getItemRoot('1')).not.to.have.attribute('aria-checked');
      });
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

        expect(view.isItemSelected('1')).to.equal(true);
      });

      it('should un-select selected item', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
          defaultSelectedItems: ['1'],
        });

        act(() => {
          view.actionsRef.current!.setItemSelection('1', false);
        });

        expect(view.isItemSelected('1')).to.equal(false);
      });

      it('should not select an item when disableSelection is true', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
          disableSelection: true,
        });

        act(() => {
          view.actionsRef.current!.setItemSelection('1', true);
        });

        expect(view.isItemSelected('1')).to.equal(false);
      });

      it('should not un-select an item when disableSelection is true', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
          defaultSelectedItems: ['1'],
          disableSelection: true,
        });

        act(() => {
          view.actionsRef.current!.setItemSelection('1', false);
        });

        expect(view.isItemSelected('1')).to.equal(true);
      });
    });

    describe('multi selection', () => {
      it('should select un-selected item and remove other selected items', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
          defaultSelectedItems: ['2'],
          multiSelect: true,
        });

        act(() => {
          view.actionsRef.current!.setItemSelection('1', true);
        });

        expect(view.getSelectedTreeItems()).to.deep.equal(['1']);
      });
    });
  });

  describe('isItemSelectionDisabled prop', () => {
    describe('isItemSelectionDisabled as a function', () => {
      it('should not select an item when clicking if isItemSelectionDisabled returns true', async () => {
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1' }] }, { id: '2' }],
          isItemSelectionDisabled: (item: any) => !!item.children && item.children.length > 0,
        });

        expect(view.isItemSelected('1')).to.equal(false);
        fireEvent.click(view.getItemRoot('1'));
        expect(view.isItemSelected('1')).to.equal(false);

        expect(view.isItemSelected('1.1')).to.equal(false);
        fireEvent.click(view.getItemRoot('1.1'));
        expect(view.isItemSelected('1.1')).to.equal(true);
      });

      it('should hide the checkbox when item is not selectable', async () => {
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1' }] }, { id: '2' }],
          checkboxSelection: true,
          defaultExpandedItems: ['1'],
          isItemSelectionDisabled: (item: any) => !!item.children && item.children.length > 0,
        });

        // Parent item should not have a checkbox input
        expect(view.getItemRoot('1').querySelector('input[type="checkbox"]')).to.equal(null);
        // Leaf item should have a checkbox input
        expect(view.getItemRoot('1.1').querySelector('input[type="checkbox"]')).not.to.equal(null);
      });

      it('should not have aria-checked attribute when item is not selectable', async () => {
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1' }] }, { id: '2' }],
          defaultExpandedItems: ['1'],
          isItemSelectionDisabled: (item: any) => !!item.children && item.children.length > 0,
        });

        expect(view.getItemRoot('1')).not.to.have.attribute('aria-checked');
        expect(view.getItemRoot('1.1')).to.have.attribute('aria-checked', 'false');
      });
    });

    describe('with multi selection', () => {
      it('should not include non-selectable items when selecting a range', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2', children: [{ id: '2.1' }] }, { id: '3' }],
          multiSelect: true,
          isItemSelectionDisabled: (item: any) => !!item.children && item.children.length > 0,
        });

        fireEvent.click(view.getItemRoot('1'));
        expect(view.getSelectedTreeItems()).to.deep.equal(['1']);

        fireEvent.click(view.getItemRoot('3'), { shiftKey: true });
        expect(view.getSelectedTreeItems()).to.deep.equal(['1', '3']);
      });
    });
  });
});
