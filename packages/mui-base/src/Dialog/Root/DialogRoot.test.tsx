import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { act, createRenderer, fireEvent } from '@mui/internal-test-utils';
import * as Dialog from '@base_ui/react/Dialog';

describe('<Dialog.Root />', () => {
  const { render } = createRenderer();

  describe('uncontrolled mode', () => {
    it('should open the dialog with the trigger', () => {
      const { queryByRole, getByRole } = render(
        <Dialog.Root>
          <Dialog.Trigger />
          <Dialog.Popup animated={false} />
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
    it('should open and close the dialog with the `open` prop', () => {
      const { queryByRole, setProps } = render(
        <Dialog.Root open={false}>
          <Dialog.Popup animated={false} />
        </Dialog.Root>,
      );

      expect(queryByRole('dialog')).to.equal(null);

      setProps({ open: true });
      expect(queryByRole('dialog')).not.to.equal(null);

      setProps({ open: false });
      expect(queryByRole('dialog')).to.equal(null);
    });
  });

  describe('prop: softClose', () => {
    (
      [
        [true, true],
        ['escapeKey', true],
        ['clickOutside', false],
        [false, false],
      ] as const
    ).forEach(([softClose, expectClosed]) => {
      it(`${expectClosed ? 'closes' : 'does not close'} the dialog when pressing Esc if softClose=${softClose}`, () => {
        const handleOpenChange = spy();

        const { getByTestId, queryByRole } = render(
          <Dialog.Root defaultOpen onOpenChange={handleOpenChange} softClose={softClose}>
            <Dialog.Popup animated={false}>
              <div tabIndex={0} data-testid="content" />
            </Dialog.Popup>
          </Dialog.Root>,
        );

        const content = getByTestId('content');

        act(() => {
          content.focus();
        });

        // keyDown not targetted at anything specific
        // eslint-disable-next-line material-ui/disallow-active-element-as-key-event-target
        fireEvent.keyDown(document.activeElement!, { key: 'Esc' });
        expect(handleOpenChange.calledOnce).to.equal(expectClosed);

        if (expectClosed) {
          expect(queryByRole('dialog')).to.equal(null);
        } else {
          expect(queryByRole('dialog')).not.to.equal(null);
        }
      });
    });

    (
      [
        [true, true],
        ['clickOutside', true],
        ['escapeKey', false],
        [false, false],
      ] as const
    ).forEach(([softClose, expectClosed]) => {
      it(`${expectClosed ? 'closes' : 'does not close'} the dialog when clicking outside if softClose=${softClose}`, () => {
        const handleOpenChange = spy();

        const { getByTestId, queryByRole } = render(
          <div data-testid="outside">
            <Dialog.Root defaultOpen onOpenChange={handleOpenChange} softClose={softClose}>
              <Dialog.Popup animated={false} />
            </Dialog.Root>
          </div>,
        );

        const outside = getByTestId('outside');

        fireEvent.mouseDown(outside);
        expect(handleOpenChange.calledOnce).to.equal(expectClosed);

        if (expectClosed) {
          expect(queryByRole('dialog')).to.equal(null);
        } else {
          expect(queryByRole('dialog')).not.to.equal(null);
        }
      });
    });
  });

  describe('focus management', () => {
    before(function test() {
      if (/jsdom/.test(window.navigator.userAgent)) {
        this.skip();
      }
    });

    it('should focus the first focusable element within the popup', async () => {
      const { getByText, getByTestId } = render(
        <div>
          <input />
          <Dialog.Root>
            <Dialog.Trigger>Open</Dialog.Trigger>
            <Dialog.Popup data-testid="dialog" animated={false}>
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

      await act(() => async () => {});
      const dialogInput = getByTestId('dialog-input');
      expect(dialogInput).to.toHaveFocus();
    });
  });
});
