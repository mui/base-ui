import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { act, fireEvent } from '@mui/internal-test-utils';
import * as Dialog from '@base_ui/react/Dialog';
import { createRenderer } from '../../../test';

async function wait(timeout: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, timeout);
  });
}

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

      act(() => {
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
    it('warns when the dialog is modal but no backdrop is present', async () => {
      await expect(() =>
        render(
          <Dialog.Root modal animated={false}>
            <Dialog.Popup />
          </Dialog.Root>,
        ),
      ).toWarnDev([
        'Base UI: The Dialog is modal but no backdrop is present. Add the backdrop component to prevent interacting with the rest of the page.',
        'Base UI: The Dialog is modal but no backdrop is present. Add the backdrop component to prevent interacting with the rest of the page.',
      ]);
    });

    it('does not warn when the dialog is not modal and no backdrop is present', () => {
      expect(() =>
        render(
          <Dialog.Root modal={false} animated={false}>
            <Dialog.Popup />
          </Dialog.Root>,
        ),
      ).not.toWarnDev();
    });

    it('does not warn when the dialog is modal and backdrop is present', () => {
      expect(() =>
        render(
          <Dialog.Root modal animated={false}>
            <Dialog.Backdrop />
            <Dialog.Popup />
          </Dialog.Root>,
        ),
      ).not.toWarnDev();
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

  describe('prop: animated', () => {
    before(function test() {
      if (/jsdom/.test(window.navigator.userAgent)) {
        this.skip();
      }
    });

    const css = `
    .dialog {
      opacity: 0;
      transition: opacity 200ms;
    }

    .dialog[data-state='open'] {
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

  describe('focus management', () => {
    before(function test() {
      if (/jsdom/.test(window.navigator.userAgent)) {
        this.skip();
      }
    });

    it('should focus the first focusable element within the popup', async () => {
      const { getByText, getByTestId } = await render(
        <div>
          <input />
          <Dialog.Root modal={false} animated={false}>
            <Dialog.Trigger>Open</Dialog.Trigger>
            <Dialog.Popup data-testid="dialog">
              <input data-testid="dialog-input" />
              <button>Close</button>
            </Dialog.Popup>
          </Dialog.Root>
          <input />
        </div>,
      );

      const trigger = getByText('Open');
      act(() => {
        trigger.click();
      });

      // wait for the focus to be settled (takes some time on CI)
      await wait(50);

      const dialogInput = getByTestId('dialog-input');
      expect(dialogInput).to.toHaveFocus();
    });
  });
});
