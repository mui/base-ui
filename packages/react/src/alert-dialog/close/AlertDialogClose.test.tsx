import * as React from 'react';
import { spy } from 'sinon';
import { AlertDialog } from '@base-ui-components/react/alert-dialog';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<AlertDialog.Close />', () => {
  const { render } = createRenderer();

  describeConformance(<AlertDialog.Close />, () => ({
    refInstanceof: window.HTMLButtonElement,
    render: (node) => {
      return render(
        <AlertDialog.Root open>
          <AlertDialog.Backdrop />
          <AlertDialog.Portal>
            <AlertDialog.Popup>{node}</AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>,
      );
    },
  }));

  describe('prop: disabled', () => {
    it('disables the button', async () => {
      const handleOpenChange = spy();

      const { user } = await render(
        <AlertDialog.Root onOpenChange={handleOpenChange}>
          <AlertDialog.Trigger>Open</AlertDialog.Trigger>
          <AlertDialog.Portal>
            <AlertDialog.Popup>
              <AlertDialog.Close disabled>Close</AlertDialog.Close>
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>,
      );

      expect(handleOpenChange.callCount).to.equal(0);

      const openButton = screen.getByText('Open');
      await user.click(openButton);

      expect(handleOpenChange.callCount).to.equal(1);
      expect(handleOpenChange.firstCall.args[0]).to.equal(true);

      const closeButton = screen.getByText('Close');
      expect(closeButton).to.have.attribute('disabled');
      expect(closeButton).to.have.attribute('data-disabled');
      await user.click(closeButton);

      expect(handleOpenChange.callCount).to.equal(1);
    });

    it('custom element', async () => {
      const handleOpenChange = spy();

      const { user } = await render(
        <AlertDialog.Root onOpenChange={handleOpenChange}>
          <AlertDialog.Trigger>Open</AlertDialog.Trigger>
          <AlertDialog.Portal>
            <AlertDialog.Popup>
              <AlertDialog.Close disabled render={<span />}>
                Close
              </AlertDialog.Close>
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>,
      );

      expect(handleOpenChange.callCount).to.equal(0);

      const openButton = screen.getByText('Open');
      await user.click(openButton);

      expect(handleOpenChange.callCount).to.equal(1);
      expect(handleOpenChange.firstCall.args[0]).to.equal(true);

      const closeButton = screen.getByText('Close');
      expect(closeButton).to.not.have.attribute('disabled');
      expect(closeButton).to.have.attribute('data-disabled');
      expect(closeButton).to.have.attribute('aria-disabled', 'true');
      await user.click(closeButton);

      expect(handleOpenChange.callCount).to.equal(1);
    });
  });
});
