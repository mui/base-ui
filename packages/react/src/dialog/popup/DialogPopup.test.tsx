import * as React from 'react';
import { expect } from 'chai';
import { Dialog } from '@base-ui-components/react/dialog';
import { act, waitFor } from '@mui/internal-test-utils';
import { describeConformance, createRenderer } from '#test-utils';

describe('<Dialog.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(<Dialog.Popup />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node) => {
      return render(
        <Dialog.Root open modal={false}>
          {node}
        </Dialog.Root>,
      );
    },
  }));

  describe('prop: keepMounted', () => {
    [
      [true, true],
      [false, false],
      [undefined, false],
    ].forEach(([keepMounted, expectedIsMounted]) => {
      it(`should ${!expectedIsMounted ? 'not ' : ''}keep the dialog mounted when keepMounted=${keepMounted}`, async () => {
        const { queryByRole } = await render(
          <Dialog.Root open={false} modal={false}>
            <Dialog.Popup keepMounted={keepMounted} />
          </Dialog.Root>,
        );

        const dialog = queryByRole('dialog', { hidden: true });
        if (expectedIsMounted) {
          expect(dialog).not.to.equal(null);
          expect(dialog).toBeInaccessible();
        } else {
          expect(dialog).to.equal(null);
        }
      });
    });
  });

  describe('prop: initial focus', () => {
    it('should focus the first focusable element within the popup', async () => {
      const { getByText, getByTestId } = await render(
        <div>
          <input />
          <Dialog.Root modal={false}>
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
      await act(async () => {
        trigger.click();
      });

      await waitFor(() => {
        const dialogInput = getByTestId('dialog-input');
        expect(dialogInput).to.toHaveFocus();
      });
    });

    it('should focus the element provided to `initialFocus` as a ref when open', async () => {
      function TestComponent() {
        const input2Ref = React.useRef<HTMLInputElement>(null);
        return (
          <div>
            <input />
            <Dialog.Root modal={false}>
              <Dialog.Trigger>Open</Dialog.Trigger>
              <Dialog.Popup data-testid="dialog" initialFocus={input2Ref}>
                <input data-testid="input-1" />
                <input data-testid="input-2" ref={input2Ref} />
                <input data-testid="input-3" />
                <button>Close</button>
              </Dialog.Popup>
            </Dialog.Root>
            <input />
          </div>
        );
      }

      const { getByText, getByTestId } = await render(<TestComponent />);

      const trigger = getByText('Open');
      await act(async () => {
        trigger.click();
      });

      await waitFor(() => {
        const input2 = getByTestId('input-2');
        expect(input2).to.toHaveFocus();
      });
    });

    it('should focus the element provided to `initialFocus` as a function when open', async () => {
      function TestComponent() {
        const input2Ref = React.useRef<HTMLInputElement>(null);

        const getRef = React.useCallback(() => input2Ref, []);

        return (
          <div>
            <input />
            <Dialog.Root modal={false}>
              <Dialog.Trigger>Open</Dialog.Trigger>
              <Dialog.Popup data-testid="dialog" initialFocus={getRef}>
                <input data-testid="input-1" />
                <input data-testid="input-2" ref={input2Ref} />
                <input data-testid="input-3" />
                <button>Close</button>
              </Dialog.Popup>
            </Dialog.Root>
            <input />
          </div>
        );
      }

      const { getByText, getByTestId } = await render(<TestComponent />);

      const trigger = getByText('Open');
      await act(async () => {
        trigger.click();
      });

      await waitFor(() => {
        const input2 = getByTestId('input-2');
        expect(input2).to.toHaveFocus();
      });
    });
  });

  describe('prop: final focus', () => {
    it('should focus the trigger by default when closed', async () => {
      const { getByText, user } = await render(
        <div>
          <input />
          <Dialog.Root>
            <Dialog.Backdrop />
            <Dialog.Trigger>Open</Dialog.Trigger>
            <Dialog.Popup>
              <Dialog.Close>Close</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Root>
          <input />
        </div>,
      );

      const trigger = getByText('Open');
      await user.click(trigger);

      const closeButton = getByText('Close');
      await user.click(closeButton);

      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });
    });

    it('should focus the element provided to the prop when closed', async () => {
      function TestComponent() {
        const inputRef = React.useRef<HTMLInputElement>(null);
        return (
          <div>
            <input />
            <Dialog.Root>
              <Dialog.Backdrop />
              <Dialog.Trigger>Open</Dialog.Trigger>
              <Dialog.Popup finalFocus={inputRef}>
                <Dialog.Close>Close</Dialog.Close>
              </Dialog.Popup>
            </Dialog.Root>
            <input />
            <input data-testid="input-to-focus" ref={inputRef} />
            <input />
          </div>
        );
      }

      const { getByText, getByTestId, user } = await render(<TestComponent />);

      const trigger = getByText('Open');
      await user.click(trigger);

      const closeButton = getByText('Close');
      await user.click(closeButton);

      const inputToFocus = getByTestId('input-to-focus');

      await waitFor(() => {
        expect(inputToFocus).toHaveFocus();
      });
    });
  });
});
