import * as React from 'react';
import { expect } from 'chai';
import { act, waitFor } from '@mui/internal-test-utils';
import { AlertDialog } from '@base-ui-components/react/alert-dialog';
import { createRenderer, describeConformance } from '#test-utils';

describe('<AlertDialog.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(<AlertDialog.Popup />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node) => {
      return render(
        <AlertDialog.Root open>
          <AlertDialog.Backdrop />
          {node}
        </AlertDialog.Root>,
      );
    },
  }));

  it('should have role="alertdialog"', async () => {
    const { getByTestId } = await render(
      <AlertDialog.Root open>
        <AlertDialog.Backdrop />
        <AlertDialog.Popup data-testid="test-alert-dialog" />
      </AlertDialog.Root>,
    );

    const dialog = getByTestId('test-alert-dialog');
    expect(dialog).to.have.attribute('role', 'alertdialog');
  });

  describe('prop: initial focus', () => {
    it('should focus the first focusable element within the popup by default', async () => {
      const { getByText, getByTestId } = await render(
        <div>
          <input />
          <AlertDialog.Root>
            <AlertDialog.Backdrop />
            <AlertDialog.Trigger>Open</AlertDialog.Trigger>
            <AlertDialog.Popup data-testid="dialog">
              <input data-testid="dialog-input" />
              <button>Close</button>
            </AlertDialog.Popup>
          </AlertDialog.Root>
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
            <AlertDialog.Root>
              <AlertDialog.Backdrop />
              <AlertDialog.Trigger>Open</AlertDialog.Trigger>
              <AlertDialog.Popup data-testid="dialog" initialFocus={input2Ref}>
                <input data-testid="input-1" />
                <input data-testid="input-2" ref={input2Ref} />
                <input data-testid="input-3" />
                <button>Close</button>
              </AlertDialog.Popup>
            </AlertDialog.Root>
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
            <AlertDialog.Root>
              <AlertDialog.Backdrop />
              <AlertDialog.Trigger>Open</AlertDialog.Trigger>
              <AlertDialog.Popup data-testid="dialog" initialFocus={getRef}>
                <input data-testid="input-1" />
                <input data-testid="input-2" ref={input2Ref} />
                <input data-testid="input-3" />
                <button>Close</button>
              </AlertDialog.Popup>
            </AlertDialog.Root>
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
          <AlertDialog.Root>
            <AlertDialog.Backdrop />
            <AlertDialog.Trigger>Open</AlertDialog.Trigger>
            <AlertDialog.Popup>
              <AlertDialog.Close>Close</AlertDialog.Close>
            </AlertDialog.Popup>
          </AlertDialog.Root>
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
            <AlertDialog.Root>
              <AlertDialog.Backdrop />
              <AlertDialog.Trigger>Open</AlertDialog.Trigger>
              <AlertDialog.Popup finalFocus={inputRef}>
                <AlertDialog.Close>Close</AlertDialog.Close>
              </AlertDialog.Popup>
            </AlertDialog.Root>
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
