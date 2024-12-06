import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { act, describeSkipIf, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { Dialog } from '@base-ui-components/react/dialog';
import { createRenderer } from '#test-utils';

describe('<Dialog.Root />', () => {
  const { render } = createRenderer();

  describe('uncontrolled mode', () => {
    it('should open the dialog with the trigger', async () => {
      const { queryByRole, getByRole } = await render(
        <Dialog.Root modal={false} animated={false}>
          <Dialog.Trigger />
          <Dialog.Popup />
        </Dialog.Root>,
      );

      const button = getByRole('button');
      expect(queryByRole('dialog')).to.equal(null);

      await act(async () => {
        button.click();
      });

      expect(queryByRole('dialog')).not.to.equal(null);
    });
  });

  describe('controlled mode', () => {
    it('should open and close the dialog with the `open` prop', async () => {
      const { queryByRole, setProps } = await render(
        <Dialog.Root open={false} modal={false} animated={false}>
          <Dialog.Popup />
        </Dialog.Root>,
      );

      expect(queryByRole('dialog')).to.equal(null);

      setProps({ open: true });
      expect(queryByRole('dialog')).not.to.equal(null);

      setProps({ open: false });
      expect(queryByRole('dialog')).to.equal(null);
    });
  });

  describe('prop: modal', () => {
    it('makes other interactive elements on the page inert when a modal dialog is open and restores them after the dialog is closed', async () => {
      const { user } = await render(
        <div>
          <input data-testid="input" />
          <textarea data-testid="textarea" />

          <Dialog.Root modal>
            <Dialog.Trigger>Open Dialog</Dialog.Trigger>
            <Dialog.Popup>
              <Dialog.Close>Close Dialog</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Root>

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

    it('does not make other interactive elements on the page inert when a non-modal dialog is open', async () => {
      const { user } = await render(
        <div>
          <input data-testid="input" />
          <textarea data-testid="textarea" />

          <Dialog.Root modal={false}>
            <Dialog.Trigger>Open Dialog</Dialog.Trigger>
            <Dialog.Popup>
              <Dialog.Close>Close Dialog</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Root>

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
          expect(element.closest('[inert]')).to.equal(null);
        });
      });
    });
  });

  describe('prop: dismissible', () => {
    (
      [
        [true, true],
        [false, false],
        [undefined, true],
      ] as const
    ).forEach(([dismissible, expectDismissed]) => {
      it(`${expectDismissed ? 'closes' : 'does not close'} the dialog when clicking outside if dismissible=${dismissible}`, async () => {
        const handleOpenChange = spy();

        const { getByTestId, queryByRole } = await render(
          <div data-testid="outside">
            <Dialog.Root
              defaultOpen
              onOpenChange={handleOpenChange}
              dismissible={dismissible}
              modal={false}
              animated={false}
            >
              <Dialog.Popup />
            </Dialog.Root>
          </div>,
        );

        const outside = getByTestId('outside');

        fireEvent.mouseDown(outside);
        expect(handleOpenChange.calledOnce).to.equal(expectDismissed);

        if (expectDismissed) {
          expect(queryByRole('dialog')).to.equal(null);
        } else {
          expect(queryByRole('dialog')).not.to.equal(null);
        }
      });
    });
  });

  describeSkipIf(/jsdom/.test(window.navigator.userAgent))('prop: animated', () => {
    const css = `
    .dialog {
      opacity: 0;
      transition: opacity 200ms;
    }

    .dialog[data-open] {
      opacity: 1;
    }
  `;

    it('when `true`, waits for the exit transition to finish before unmounting', async () => {
      const { setProps, queryByRole } = await render(
        <Dialog.Root open modal={false} animated>
          {/* eslint-disable-next-line react/no-danger */}
          <style dangerouslySetInnerHTML={{ __html: css }} />
          <Dialog.Popup className="dialog" />
        </Dialog.Root>,
      );

      setProps({ open: false });
      expect(queryByRole('dialog', { hidden: true })).not.to.equal(null);
    });

    it('when `false`, unmounts the popup immediately', async () => {
      const { setProps, queryByRole } = await render(
        <Dialog.Root open modal={false} animated={false}>
          {/* eslint-disable-next-line react/no-danger */}
          <style dangerouslySetInnerHTML={{ __html: css }} />
          <Dialog.Popup className="dialog" />
        </Dialog.Root>,
      );

      setProps({ open: false });
      expect(queryByRole('dialog')).to.equal(null);
    });
  });
});
