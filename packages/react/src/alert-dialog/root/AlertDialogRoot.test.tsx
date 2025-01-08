import * as React from 'react';
import { expect } from 'chai';
import { screen, waitFor } from '@mui/internal-test-utils';
import { AlertDialog } from '@base-ui-components/react/alert-dialog';
import { createRenderer } from '#test-utils';
import { spy } from 'sinon';

const isJSDOM = /jsdom/.test(window.navigator.userAgent);

describe('<AlertDialog.Root />', () => {
  const { render } = createRenderer();

  describe('prop: onOpenChange', () => {
    it('calls onOpenChange with the new open state', async () => {
      const handleOpenChange = spy();

      const { user } = await render(
        <AlertDialog.Root onOpenChange={handleOpenChange}>
          <AlertDialog.Trigger>Open</AlertDialog.Trigger>
          <AlertDialog.Portal>
            <AlertDialog.Popup>
              <AlertDialog.Close>Close</AlertDialog.Close>
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
      await user.click(closeButton);

      expect(handleOpenChange.callCount).to.equal(2);
      expect(handleOpenChange.secondCall.args[0]).to.equal(false);
    });

    it('calls onOpenChange with the reason for change when clicked on trigger and close button', async () => {
      const handleOpenChange = spy();

      const { user } = await render(
        <AlertDialog.Root onOpenChange={handleOpenChange}>
          <AlertDialog.Trigger>Open</AlertDialog.Trigger>
          <AlertDialog.Portal>
            <AlertDialog.Popup>
              <AlertDialog.Close>Close</AlertDialog.Close>
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>,
      );

      const openButton = screen.getByText('Open');
      await user.click(openButton);

      expect(handleOpenChange.callCount).to.equal(1);
      expect(handleOpenChange.firstCall.args[2]).to.equal('click');

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      expect(handleOpenChange.callCount).to.equal(2);
      expect(handleOpenChange.secondCall.args[2]).to.equal('click');
    });

    it('calls onOpenChange with the reason for change when pressed Esc while the dialog is open', async () => {
      const handleOpenChange = spy();

      const { user } = await render(
        <AlertDialog.Root defaultOpen onOpenChange={handleOpenChange}>
          <AlertDialog.Trigger>Open</AlertDialog.Trigger>
          <AlertDialog.Portal>
            <AlertDialog.Popup>
              <AlertDialog.Close>Close</AlertDialog.Close>
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>,
      );

      await user.keyboard('[Escape]');

      expect(handleOpenChange.callCount).to.equal(1);
      expect(handleOpenChange.firstCall.args[2]).to.equal('escape-key');
    });
  });

  describe.skipIf(isJSDOM)('modality', () => {
    it('makes other interactive elements on the page inert when a modal dialog is open and restores them after the dialog is closed', async () => {
      const { user } = await render(
        <div>
          <input data-testid="input" />
          <textarea data-testid="textarea" />

          <AlertDialog.Root>
            <AlertDialog.Trigger>Open Dialog</AlertDialog.Trigger>
            <AlertDialog.Portal>
              <AlertDialog.Popup>
                <AlertDialog.Close>Close Dialog</AlertDialog.Close>
              </AlertDialog.Popup>
            </AlertDialog.Portal>
          </AlertDialog.Root>

          <button type="button">Another Button</button>
        </div>,
      );

      const outsideElements = [
        screen.getByTestId('input'),
        screen.getByTestId('textarea'),
        screen.getByRole('button', { name: 'Another Button' }),
      ];

      const trigger = screen.getByRole('button', { name: 'Open Dialog' });
      await user.click(trigger);

      await waitFor(() => {
        outsideElements.forEach((element) => {
          // The `inert` attribute can be applied to the element itself or to an ancestor
          expect(element.closest('[inert]')).not.to.equal(null);
        });
      });

      const close = screen.getByRole('button', { name: 'Close Dialog' });
      await user.click(close);

      await waitFor(() => {
        outsideElements.forEach((element) => {
          expect(element.closest('[inert]')).to.equal(null);
        });
      });
    });
  });

  describe.skipIf(isJSDOM)('prop: onCloseComplete', () => {
    it('is called on close when there is no exit animation defined', async () => {
      let onCloseCompleteCalled = false;
      function notifyonCloseComplete() {
        onCloseCompleteCalled = true;
      }

      function Test() {
        const [open, setOpen] = React.useState(true);
        return (
          <div>
            <button onClick={() => setOpen(false)}>Close</button>
            <AlertDialog.Root open={open} onCloseComplete={notifyonCloseComplete}>
              <AlertDialog.Portal>
                <AlertDialog.Popup data-testid="popup" />
              </AlertDialog.Portal>
            </AlertDialog.Root>
          </div>
        );
      }

      const { user } = await render(<Test />);

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('popup')).to.equal(null);
      });

      expect(onCloseCompleteCalled).to.equal(true);
    });

    it('is called on close when the exit animation finishes', async () => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      let onCloseCompleteCalled = false;
      function notifyonCloseComplete() {
        onCloseCompleteCalled = true;
      }

      function Test() {
        const style = `
            @keyframes test-anim {
              to {
                opacity: 0;
              }
            }
    
            .animation-test-indicator[data-ending-style] {
              animation: test-anim 50ms;
            }
          `;

        const [open, setOpen] = React.useState(true);

        return (
          <div>
            {/* eslint-disable-next-line react/no-danger */}
            <style dangerouslySetInnerHTML={{ __html: style }} />
            <button onClick={() => setOpen(false)}>Close</button>
            <AlertDialog.Root open={open} onCloseComplete={notifyonCloseComplete}>
              <AlertDialog.Portal>
                <AlertDialog.Popup className="animation-test-indicator" data-testid="popup" />
              </AlertDialog.Portal>
            </AlertDialog.Root>
          </div>
        );
      }

      const { user } = await render(<Test />);

      expect(screen.getByTestId('popup')).not.to.equal(null);

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('popup')).to.equal(null);
      });

      expect(onCloseCompleteCalled).to.equal(true);
    });
  });
});
