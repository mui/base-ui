import { expect } from 'chai';
import { act, fireEvent } from '@mui/internal-test-utils';
import { describeTree } from '../../../test/describeTree';

describeTree('TreeRoot - Label Editing', ({ render }) => {
  describe('interaction', () => {
    describe('render labelInput when needed', () => {
      it('should not render labelInput when double clicked if item is not editable', async () => {
        const view = await render({
          items: [{ id: '1' }],
          isItemEditable: () => false,
        });
        act(() => {
          view.getItemRoot('1').focus();
        });
        fireEvent.doubleClick(view.getItemLabel('1')!);

        expect(view.getItemLabelInput('1')).to.equal(null);
      });

      it('should render labelInput when double clicked if item is editable', async () => {
        const view = await render({
          items: [{ id: '1' }],
          isItemEditable: () => true,
        });
        act(() => {
          view.getItemRoot('1').focus();
        });
        fireEvent.doubleClick(view.getItemLabel('1')!);

        expect(view.getItemLabelInput('1')).not.to.equal(null);
      });

      it('should not render label when double clicked if item is editable', async () => {
        const view = await render({
          items: [{ id: '1' }],
          isItemEditable: () => true,
        });
        act(() => {
          view.getItemRoot('1').focus();
        });
        fireEvent.doubleClick(view.getItemLabel('1')!);

        expect(view.getItemLabel('1')).to.equal(null);
      });

      it('should not render labelInput on Enter if item is not editable', async () => {
        const view = await render({
          items: [{ id: '1' }],
          isItemEditable: () => false,
        });
        act(() => {
          view.getItemRoot('1').focus();
        });
        fireEvent.keyDown(view.getItemRoot('1'), { key: 'Enter' });

        expect(view.getItemLabelInput('1')).to.equal(null);
        expect(view.getItemLabel('1')).not.to.equal(null);
      });

      it('should render labelInput on Enter if item is editable', async () => {
        const view = await render({
          items: [{ id: '1' }],
          isItemEditable: () => true,
        });
        act(() => {
          view.getItemRoot('1').focus();
        });
        fireEvent.keyDown(view.getItemRoot('1'), { key: 'Enter' });

        expect(view.getItemLabelInput('1')).not.to.equal(null);
      });

      it('should unmount labelInput after save', async () => {
        const view = await render({
          items: [{ id: '1', label: 'test' }],
          isItemEditable: () => true,
        });
        act(() => {
          view.getItemRoot('1').focus();
        });
        fireEvent.doubleClick(view.getItemLabel('1')!);
        fireEvent.keyDown(view.getItemLabelInput('1')!, { key: 'Enter' });

        expect(view.getItemLabelInput('1')).to.equal(null);
        expect(view.getItemLabel('1')).not.to.equal(null);
      });

      it('should unmount labelInput after cancel', async () => {
        const view = await render({
          items: [{ id: '1', label: 'test' }],
          isItemEditable: () => true,
        });
        act(() => {
          view.getItemRoot('1').focus();
        });
        fireEvent.doubleClick(view.getItemLabel('1')!);
        fireEvent.keyDown(view.getItemLabelInput('1')!, { key: 'Escape' });

        expect(view.getItemLabelInput('1')).to.equal(null);
        expect(view.getItemLabel('1')).not.to.equal(null);
      });
    });

    describe('labelInput value', () => {
      it('should equal label value on first render', async () => {
        const view = await render({
          items: [{ id: '1', label: 'test' }],
          isItemEditable: () => true,
        });
        act(() => {
          view.getItemRoot('1').focus();
        });
        fireEvent.doubleClick(view.getItemLabel('1')!);

        expect(view.getItemLabelInput('1')!.value).to.equal('test');
      });

      it('should save new value on Enter', async () => {
        const view = await render({
          items: [{ id: '1', label: 'test' }],
          isItemEditable: () => true,
        });
        act(() => {
          view.getItemRoot('1').focus();
        });
        fireEvent.doubleClick(view.getItemLabel('1')!);
        fireEvent.change(view.getItemLabelInput('1')!, { target: { value: 'new value' } });
        fireEvent.keyDown(view.getItemLabelInput('1')!, { key: 'Enter' });

        expect(view.getItemLabel('1')!.textContent).to.equal('new value');
      });

      it('should hold new value on render after save', async () => {
        const view = await render({
          items: [{ id: '1', label: 'test' }],
          isItemEditable: () => true,
        });
        act(() => {
          view.getItemRoot('1').focus();
        });
        fireEvent.doubleClick(view.getItemLabel('1')!);
        fireEvent.change(view.getItemLabelInput('1')!, { target: { value: 'new value' } });
        fireEvent.keyDown(view.getItemLabelInput('1')!, { key: 'Enter' });
        fireEvent.doubleClick(view.getItemLabel('1')!);

        expect(view.getItemLabelInput('1')!.value).to.equal('new value');
      });

      it('should hold initial value on render after cancel', async () => {
        const view = await render({
          items: [{ id: '1', label: 'test' }],
          isItemEditable: () => true,
        });
        act(() => {
          view.getItemRoot('1').focus();
        });
        fireEvent.doubleClick(view.getItemLabel('1')!);
        fireEvent.change(view.getItemLabelInput('1')!, { target: { value: 'new value' } });
        fireEvent.keyDown(view.getItemLabelInput('1')!, { key: 'Escape' });
        expect(view.getItemLabel('1')!.textContent).to.equal('test');

        fireEvent.doubleClick(view.getItemLabel('1')!);
        expect(view.getItemLabelInput('1')!.value).to.equal('test');
      });
    });
  });

  describe('updateItemLabel API method', () => {
    it('should change the label value', async () => {
      const view = await render({
        items: [{ id: '1', label: 'test' }],
      });

      act(() => {
        view.actionsRef.current!.updateItemLabel('1', 'new value');
      });

      expect(view.getItemLabel('1')!.textContent).to.equal('new value');
    });
  });

  describe('setEditedItem API method', () => {
    it('should enter editing mode via setEditedItem if item is editable', async () => {
      const view = await render({
        items: [{ id: '1' }],
        isItemEditable: () => true,
      });

      act(() => {
        view.actionsRef.current!.setEditedItem('1');
      });

      expect(view.getItemLabelInput('1')).not.to.equal(null);
    });

    it('should not enter editing mode via setEditedItem if item is not editable', async () => {
      const view = await render({
        items: [{ id: '1' }],
        isItemEditable: () => false,
      });

      act(() => {
        view.actionsRef.current!.setEditedItem('1');
      });

      expect(view.getItemLabelInput('1')).to.equal(null);
    });

    it('should exit editing mode via setEditedItem(null)', async () => {
      const view = await render({
        items: [{ id: '1' }],
        isItemEditable: () => true,
      });

      act(() => {
        view.actionsRef.current!.setEditedItem('1');
      });

      expect(view.getItemLabelInput('1')).not.to.equal(null);

      act(() => {
        view.actionsRef.current!.setEditedItem(null);
      });

      expect(view.getItemLabelInput('1')).to.equal(null);
    });
  });
});
