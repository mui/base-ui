import * as React from 'react';
import { expect } from 'chai';
import { act, waitFor, screen } from '@mui/internal-test-utils';
import { AlertDialog } from '@base-ui-components/react/alert-dialog';
import { Dialog } from '@base-ui-components/react/dialog';
import { createRenderer, describeConformance } from '#test-utils';

describe('<AlertDialog.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(<AlertDialog.Popup />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node) => {
      return render(
        <AlertDialog.Root open>
          <AlertDialog.Portal>
            <AlertDialog.Backdrop />
            {node}
          </AlertDialog.Portal>
        </AlertDialog.Root>,
      );
    },
  }));

  it('should have role="alertdialog"', async () => {
    const { getByTestId } = await render(
      <AlertDialog.Root open>
        <AlertDialog.Backdrop />
        <AlertDialog.Portal>
          <AlertDialog.Popup data-testid="test-alert-dialog" />
        </AlertDialog.Portal>
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
            <AlertDialog.Portal>
              <AlertDialog.Popup data-testid="dialog">
                <input data-testid="dialog-input" />
                <button>Close</button>
              </AlertDialog.Popup>
            </AlertDialog.Portal>
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
              <AlertDialog.Portal>
                <AlertDialog.Popup data-testid="dialog" initialFocus={input2Ref}>
                  <input data-testid="input-1" />
                  <input data-testid="input-2" ref={input2Ref} />
                  <input data-testid="input-3" />
                  <button>Close</button>
                </AlertDialog.Popup>
              </AlertDialog.Portal>
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
              <AlertDialog.Portal>
                <AlertDialog.Popup data-testid="dialog" initialFocus={getRef}>
                  <input data-testid="input-1" />
                  <input data-testid="input-2" ref={input2Ref} />
                  <input data-testid="input-3" />
                  <button>Close</button>
                </AlertDialog.Popup>
              </AlertDialog.Portal>
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
            <AlertDialog.Portal>
              <AlertDialog.Popup>
                <AlertDialog.Close>Close</AlertDialog.Close>
              </AlertDialog.Popup>
            </AlertDialog.Portal>
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
              <AlertDialog.Portal>
                <AlertDialog.Popup finalFocus={inputRef}>
                  <AlertDialog.Close>Close</AlertDialog.Close>
                </AlertDialog.Popup>
              </AlertDialog.Portal>
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

  describe('style hooks', () => {
    it('adds the `nested` and `has-nested-dialogs` style hooks if a dialog has a parent dialog', async () => {
      await render(
        <AlertDialog.Root open>
          <AlertDialog.Portal>
            <AlertDialog.Popup data-testid="parent-dialog" />
            <AlertDialog.Root open>
              <AlertDialog.Portal>
                <AlertDialog.Popup data-testid="nested-dialog">
                  <AlertDialog.Root>
                    <AlertDialog.Portal>
                      <AlertDialog.Popup />
                    </AlertDialog.Portal>
                  </AlertDialog.Root>
                </AlertDialog.Popup>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          </AlertDialog.Portal>
        </AlertDialog.Root>,
      );

      const parentDialog = screen.getByTestId('parent-dialog');
      const nestedDialog = screen.getByTestId('nested-dialog');

      expect(parentDialog).not.to.have.attribute('data-nested');
      expect(nestedDialog).to.have.attribute('data-nested');

      expect(parentDialog).to.have.attribute('data-has-nested-dialogs');
      expect(nestedDialog).not.to.have.attribute('data-has-nested-dialogs');
    });

    it('adds the `nested` and `has-nested-dialogs` style hooks on an alert dialog if has a parent dialog', async () => {
      await render(
        <Dialog.Root open>
          <Dialog.Portal>
            <Dialog.Popup data-testid="parent-dialog" />
            <AlertDialog.Root open>
              <AlertDialog.Portal>
                <AlertDialog.Popup data-testid="nested-dialog">
                  <AlertDialog.Root>
                    <AlertDialog.Portal>
                      <AlertDialog.Popup />
                    </AlertDialog.Portal>
                  </AlertDialog.Root>
                </AlertDialog.Popup>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          </Dialog.Portal>
        </Dialog.Root>,
      );

      const parentDialog = screen.getByTestId('parent-dialog');
      const nestedDialog = screen.getByTestId('nested-dialog');

      expect(parentDialog).not.to.have.attribute('data-nested');
      expect(nestedDialog).to.have.attribute('data-nested');

      expect(parentDialog).to.have.attribute('data-has-nested-dialogs');
      expect(nestedDialog).not.to.have.attribute('data-has-nested-dialogs');
    });
  });
});
