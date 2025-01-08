import * as React from 'react';
import { expect } from 'chai';
import { Dialog } from '@base-ui-components/react/dialog';
import { AlertDialog } from '@base-ui-components/react/alert-dialog';
import { act, waitFor, screen } from '@mui/internal-test-utils';
import { describeConformance, createRenderer } from '#test-utils';

const isJSDOM = /jsdom/.test(window.navigator.userAgent);

describe('<Dialog.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(<Dialog.Popup />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node) => {
      return render(
        <Dialog.Root open modal={false}>
          <Dialog.Portal>{node}</Dialog.Portal>
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
            <Dialog.Portal keepMounted={keepMounted}>
              <Dialog.Popup />
            </Dialog.Portal>
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
            <Dialog.Portal>
              <Dialog.Popup data-testid="dialog">
                <input data-testid="dialog-input" />
                <button>Close</button>
              </Dialog.Popup>
            </Dialog.Portal>
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
              <Dialog.Portal>
                <Dialog.Popup data-testid="dialog" initialFocus={input2Ref}>
                  <input data-testid="input-1" />
                  <input data-testid="input-2" ref={input2Ref} />
                  <input data-testid="input-3" />
                  <button>Close</button>
                </Dialog.Popup>
              </Dialog.Portal>
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
              <Dialog.Portal>
                <Dialog.Popup data-testid="dialog" initialFocus={getRef}>
                  <input data-testid="input-1" />
                  <input data-testid="input-2" ref={input2Ref} />
                  <input data-testid="input-3" />
                  <button>Close</button>
                </Dialog.Popup>
              </Dialog.Portal>
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
            <Dialog.Portal>
              <Dialog.Popup>
                <Dialog.Close>Close</Dialog.Close>
              </Dialog.Popup>
            </Dialog.Portal>
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
              <Dialog.Portal>
                <Dialog.Popup finalFocus={inputRef}>
                  <Dialog.Close>Close</Dialog.Close>
                </Dialog.Popup>
              </Dialog.Portal>
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

  describe.skipIf(isJSDOM)('nested dialog count', () => {
    it('provides the number of open nested dialogs as a CSS variable', async () => {
      const { user } = await render(
        <Dialog.Root>
          <Dialog.Trigger>Trigger 0</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup data-testid="popup0">
              <Dialog.Root>
                <Dialog.Trigger>Trigger 1</Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Popup data-testid="popup1">
                    <Dialog.Root>
                      <Dialog.Trigger>Trigger 2</Dialog.Trigger>
                      <Dialog.Portal>
                        <Dialog.Popup data-testid="popup2">
                          <Dialog.Close>Close 2</Dialog.Close>
                        </Dialog.Popup>
                      </Dialog.Portal>
                    </Dialog.Root>
                    <Dialog.Close>Close 1</Dialog.Close>
                  </Dialog.Popup>
                </Dialog.Portal>
              </Dialog.Root>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
      );

      await user.click(screen.getByRole('button', { name: 'Trigger 0' }));

      await waitFor(() => {
        expect(screen.getByTestId('popup0')).not.to.equal(null);
      });

      const computedStyles = getComputedStyle(screen.getByTestId('popup0'));

      expect(computedStyles.getPropertyValue('--nested-dialogs')).to.equal('0');

      await user.click(screen.getByRole('button', { name: 'Trigger 1' }));

      await waitFor(() => {
        expect(screen.getByTestId('popup1')).not.to.equal(null);
      });

      expect(computedStyles.getPropertyValue('--nested-dialogs')).to.equal('1');

      await user.click(screen.getByRole('button', { name: 'Trigger 2' }));

      await waitFor(() => {
        expect(screen.getByTestId('popup2')).not.to.equal(null);
      });

      expect(computedStyles.getPropertyValue('--nested-dialogs')).to.equal('2');

      await user.click(screen.getByRole('button', { name: 'Close 2' }));

      expect(computedStyles.getPropertyValue('--nested-dialogs')).to.equal('1');

      await user.click(screen.getByRole('button', { name: 'Close 1' }));

      expect(computedStyles.getPropertyValue('--nested-dialogs')).to.equal('0');
    });

    it('decrements the count when an open nested dialog is unmounted', async () => {
      function App() {
        const [showNested, setShowNested] = React.useState(true);
        return (
          <React.Fragment>
            <button onClick={() => setShowNested(!showNested)}>toggle</button>
            <Dialog.Root>
              <Dialog.Trigger>Trigger 0</Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Popup data-testid="popup0">
                  {showNested && (
                    <Dialog.Root>
                      <Dialog.Trigger>Trigger 1</Dialog.Trigger>
                      <Dialog.Portal>
                        <Dialog.Popup data-testid="popup1">
                          <Dialog.Close>Close 1</Dialog.Close>
                        </Dialog.Popup>
                      </Dialog.Portal>
                    </Dialog.Root>
                  )}
                  <Dialog.Close>Close 0</Dialog.Close>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          </React.Fragment>
        );
      }

      const { user } = await render(<App />);

      await user.click(screen.getByRole('button', { name: 'Trigger 0' }));

      await waitFor(() => {
        expect(screen.getByTestId('popup0')).not.to.equal(null);
      });

      const computedStyles = getComputedStyle(screen.getByTestId('popup0'));

      expect(computedStyles.getPropertyValue('--nested-dialogs')).to.equal('0');

      await user.click(screen.getByRole('button', { name: 'Trigger 1' }));

      await waitFor(() => {
        expect(screen.getByTestId('popup1')).not.to.equal(null);
      });

      expect(computedStyles.getPropertyValue('--nested-dialogs')).to.equal('1');

      await user.click(screen.getByRole('button', { name: 'toggle' }));

      expect(computedStyles.getPropertyValue('--nested-dialogs')).to.equal('0');
    });

    it('does not change the count when a closed nested dialog is unmounted', async () => {
      function App() {
        const [showNested, setShowNested] = React.useState(true);
        return (
          <Dialog.Root>
            <Dialog.Trigger>Trigger 0</Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Popup data-testid="popup0">
                {showNested && (
                  <Dialog.Root>
                    <Dialog.Trigger />
                    <Dialog.Portal>
                      <Dialog.Popup />
                    </Dialog.Portal>
                  </Dialog.Root>
                )}
                <button onClick={() => setShowNested(!showNested)}>toggle</button>
                <Dialog.Close>Close 0</Dialog.Close>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        );
      }

      const { user } = await render(<App />);

      await user.click(screen.getByRole('button', { name: 'Trigger 0' }));

      await waitFor(() => {
        expect(screen.getByTestId('popup0')).not.to.equal(null);
      });

      const computedStyles = getComputedStyle(screen.getByTestId('popup0'));

      expect(computedStyles.getPropertyValue('--nested-dialogs')).to.equal('0');

      await user.click(screen.getByRole('button', { name: 'toggle' }));

      expect(computedStyles.getPropertyValue('--nested-dialogs')).to.equal('0');
    });
  });

  describe('style hooks', () => {
    it('adds the `nested` and `has-nested-dialogs` style hooks if a dialog has a parent dialog', async () => {
      await render(
        <Dialog.Root open>
          <Dialog.Portal>
            <Dialog.Popup data-testid="parent-dialog" />
            <Dialog.Root open>
              <Dialog.Portal>
                <Dialog.Popup data-testid="nested-dialog">
                  <Dialog.Root>
                    <Dialog.Portal>
                      <Dialog.Popup />
                    </Dialog.Portal>
                  </Dialog.Root>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
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

    it('adds the `nested` and `has-nested-dialogs` style hooks if a dialog has a parent alert dialog', async () => {
      await render(
        <AlertDialog.Root open>
          <AlertDialog.Portal>
            <AlertDialog.Popup data-testid="parent-dialog" />
            <Dialog.Root open>
              <Dialog.Portal>
                <Dialog.Popup data-testid="nested-dialog">
                  <Dialog.Root>
                    <Dialog.Portal>
                      <Dialog.Popup />
                    </Dialog.Portal>
                  </Dialog.Root>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
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
  });
});
