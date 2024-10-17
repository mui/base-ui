import * as React from 'react';
import { expect } from 'chai';
import { act, waitFor } from '@mui/internal-test-utils';
import { AlertDialog } from '@base_ui/react/AlertDialog';
import { createRenderer } from '#test-utils';

describe('<AlertDialog.Root />', () => {
  const { render } = createRenderer();

  describe('prop: initial focus', () => {
    before(function test() {
      if (/jsdom/.test(window.navigator.userAgent)) {
        this.skip();
      }
    });

    it('should focus the first focusable element within the popup by default', async () => {
      const { getByText, getByTestId } = await render(
        <div>
          <input />
          <AlertDialog.Root animated={false}>
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
  });

  it('should focus the element provided to `initialFocus` as a ref when open', async () => {
    function TestComponent() {
      const input2Ref = React.useRef<HTMLInputElement>(null);
      return (
        <div>
          <input />
          <AlertDialog.Root animated={false}>
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
          <AlertDialog.Root animated={false}>
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
