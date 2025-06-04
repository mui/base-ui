import * as React from 'react';
import { expect } from 'chai';
import { Dialog } from '@base-ui-components/react/dialog';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Dialog.Trigger />', () => {
  const { render } = createRenderer();

  describeConformance(<Dialog.Trigger />, () => ({
    refInstanceof: window.HTMLButtonElement,
    render: (node) => {
      return render(
        <Dialog.Root open modal={false}>
          {node}
        </Dialog.Root>,
      );
    },
  }));

  describe('prop: disabled', () => {
    it('disables the dialog', async () => {
      const { user } = await render(
        <Dialog.Root modal={false}>
          <Dialog.Trigger disabled />
          <Dialog.Portal>
            <Dialog.Backdrop />
            <Dialog.Popup>
              <Dialog.Title>title text</Dialog.Title>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
      );

      const trigger = screen.getByRole('button');
      expect(trigger).to.have.attribute('disabled');
      expect(trigger).to.have.attribute('data-disabled');

      await user.click(trigger);
      expect(screen.queryByText('title text')).to.equal(null);

      await user.keyboard('[Tab]');
      expect(document.activeElement).to.not.equal(trigger);
    });

    it('custom element', async () => {
      const { user } = await render(
        <Dialog.Root modal={false}>
          <Dialog.Trigger disabled render={<span />} nativeButton={false} />
          <Dialog.Portal>
            <Dialog.Backdrop />
            <Dialog.Popup>
              <Dialog.Title>title text</Dialog.Title>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
      );

      const trigger = screen.getByRole('button');
      expect(trigger).to.not.have.attribute('disabled');
      expect(trigger).to.have.attribute('data-disabled');
      expect(trigger).to.have.attribute('aria-disabled', 'true');

      await user.click(trigger);
      expect(screen.queryByText('title text')).to.equal(null);

      await user.keyboard('[Tab]');
      expect(document.activeElement).to.not.equal(trigger);
    });
  });
});
