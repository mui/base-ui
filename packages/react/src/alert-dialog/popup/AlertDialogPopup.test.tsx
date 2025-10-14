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
    await render(
      <AlertDialog.Root open>
        <AlertDialog.Backdrop />
        <AlertDialog.Portal>
          <AlertDialog.Popup data-testid="test-alert-dialog" />
        </AlertDialog.Portal>
      </AlertDialog.Root>,
    );

    const dialog = screen.getByTestId('test-alert-dialog');
    expect(dialog).to.have.attribute('role', 'alertdialog');
  });

  describe('prop: initialFocus', () => {
    it('should focus the first focusable element within the popup by default', async () => {
      await render(
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

      const trigger = screen.getByText('Open');
      await act(async () => {
        trigger.click();
      });

      await waitFor(() => {
        const dialogInput = screen.getByTestId('dialog-input');
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

      await render(<TestComponent />);

      const trigger = screen.getByText('Open');
      await act(async () => {
        trigger.click();
      });

      await waitFor(() => {
        const input2 = screen.getByTestId('input-2');
        expect(input2).to.toHaveFocus();
      });
    });

    it('should focus the element provided to `initialFocus` as a function when open', async () => {
      function TestComponent() {
        const input2Ref = React.useRef<HTMLInputElement>(null);

        const getRef = React.useCallback(() => input2Ref.current, []);

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

      await render(<TestComponent />);

      const trigger = screen.getByText('Open');
      await act(async () => {
        trigger.click();
      });

      await waitFor(() => {
        const input2 = screen.getByTestId('input-2');
        expect(input2).to.toHaveFocus();
      });
    });

    it('should not move focus when initialFocus is false', async () => {
      function TestComponent() {
        return (
          <div>
            <AlertDialog.Root>
              <AlertDialog.Backdrop />
              <AlertDialog.Trigger>Open</AlertDialog.Trigger>
              <AlertDialog.Portal>
                <AlertDialog.Popup data-testid="dialog" initialFocus={false}>
                  <input data-testid="input-1" />
                </AlertDialog.Popup>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          </div>
        );
      }

      const { user } = await render(<TestComponent />);
      const trigger = screen.getByText('Open');
      await user.click(trigger);
      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });
    });

    it('should default focus when initialFocus returns true', async () => {
      function TestComponent() {
        return (
          <div>
            <AlertDialog.Root>
              <AlertDialog.Backdrop />
              <AlertDialog.Trigger>Open</AlertDialog.Trigger>
              <AlertDialog.Portal>
                <AlertDialog.Popup data-testid="dialog" initialFocus={() => true}>
                  <input data-testid="input-1" />
                </AlertDialog.Popup>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          </div>
        );
      }

      const { user } = await render(<TestComponent />);
      await user.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByTestId('input-1')).toHaveFocus();
      });
    });

    it('uses default behavior when initialFocus returns null', async () => {
      function TestComponent() {
        return (
          <div>
            <AlertDialog.Root>
              <AlertDialog.Backdrop />
              <AlertDialog.Trigger>Open</AlertDialog.Trigger>
              <AlertDialog.Portal>
                <AlertDialog.Popup data-testid="dialog" initialFocus={() => null}>
                  <input data-testid="input-1" />
                </AlertDialog.Popup>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          </div>
        );
      }

      const { user } = await render(<TestComponent />);
      await user.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByTestId('input-1')).toHaveFocus();
      });
    });
  });

  describe('prop: finalFocus', () => {
    it('should focus the trigger by default when closed', async () => {
      const { user } = await render(
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

      const trigger = screen.getByText('Open');
      await user.click(trigger);

      const closeButton = screen.getByText('Close');
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

      const { user } = await render(<TestComponent />);

      const trigger = screen.getByText('Open');
      await user.click(trigger);

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      const inputToFocus = screen.getByTestId('input-to-focus');

      await waitFor(() => {
        expect(inputToFocus).toHaveFocus();
      });
    });

    it('should support function returning element for finalFocus when closed', async () => {
      function TestComponent() {
        const inputRef = React.useRef<HTMLInputElement>(null);
        const getEl = React.useCallback(() => inputRef.current, []);
        return (
          <div>
            <AlertDialog.Root>
              <AlertDialog.Backdrop />
              <AlertDialog.Trigger>Open</AlertDialog.Trigger>
              <AlertDialog.Portal>
                <AlertDialog.Popup finalFocus={getEl}>
                  <AlertDialog.Close>Close</AlertDialog.Close>
                </AlertDialog.Popup>
              </AlertDialog.Portal>
            </AlertDialog.Root>
            <input data-testid="input-to-focus" ref={inputRef} />
          </div>
        );
      }

      const { user } = await render(<TestComponent />);
      await user.click(screen.getByText('Open'));
      await user.click(screen.getByText('Close'));
      await waitFor(() => {
        expect(screen.getByTestId('input-to-focus')).toHaveFocus();
      });
    });

    it('should not move focus when finalFocus is false', async () => {
      function TestComponent() {
        return (
          <div>
            <AlertDialog.Root>
              <AlertDialog.Backdrop />
              <AlertDialog.Trigger>Open</AlertDialog.Trigger>
              <AlertDialog.Portal>
                <AlertDialog.Popup finalFocus={false}>
                  <AlertDialog.Close>Close</AlertDialog.Close>
                </AlertDialog.Popup>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          </div>
        );
      }

      const { user } = await render(<TestComponent />);
      const trigger = screen.getByText('Open');
      await user.click(trigger);
      await user.click(screen.getByText('Close'));
      await waitFor(() => {
        expect(trigger).not.toHaveFocus();
      });
    });

    it('should move focus to the trigger when finalFocus returns true', async () => {
      function TestComponent() {
        return (
          <div>
            <AlertDialog.Root>
              <AlertDialog.Backdrop />
              <AlertDialog.Trigger>Open</AlertDialog.Trigger>
              <AlertDialog.Portal>
                <AlertDialog.Popup finalFocus={() => true}>
                  <AlertDialog.Close>Close</AlertDialog.Close>
                </AlertDialog.Popup>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          </div>
        );
      }

      const { user } = await render(<TestComponent />);
      const trigger = screen.getByText('Open');
      await user.click(trigger);
      await user.click(screen.getByText('Close'));
      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });
    });

    it('uses default behavior when finalFocus returns null', async () => {
      function TestComponent() {
        return (
          <div>
            <AlertDialog.Root>
              <AlertDialog.Backdrop />
              <AlertDialog.Trigger>Open</AlertDialog.Trigger>
              <AlertDialog.Portal>
                <AlertDialog.Popup finalFocus={() => null}>
                  <AlertDialog.Close>Close</AlertDialog.Close>
                </AlertDialog.Popup>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          </div>
        );
      }

      const { user } = await render(<TestComponent />);
      const trigger = screen.getByText('Open');
      await user.click(trigger);
      await user.click(screen.getByText('Close'));
      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });
    });
  });

  describe('style hooks', () => {
    it('adds the `nested` and `nested-dialog-open` style hooks if a dialog has a parent dialog', async () => {
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

      expect(parentDialog).to.have.attribute('data-nested-dialog-open');
      expect(nestedDialog).not.to.have.attribute('data-nested-dialog-open');
    });

    it('adds the `nested` and `nested-dialog-open` style hooks on an alert dialog if has a parent dialog', async () => {
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

      expect(parentDialog).to.have.attribute('data-nested-dialog-open');
      expect(nestedDialog).not.to.have.attribute('data-nested-dialog-open');
    });
  });

  describe('--nested-dialogs variable', () => {
    it('increments/decrements for nested alert dialogs', async () => {
      const { user } = await render(
        <AlertDialog.Root>
          <AlertDialog.Trigger>Trigger 0</AlertDialog.Trigger>
          <AlertDialog.Portal>
            <AlertDialog.Popup data-testid="popup0">
              <AlertDialog.Root>
                <AlertDialog.Trigger>Trigger 1</AlertDialog.Trigger>
                <AlertDialog.Portal>
                  <AlertDialog.Popup data-testid="popup1">
                    <AlertDialog.Root>
                      <AlertDialog.Trigger>Trigger 2</AlertDialog.Trigger>
                      <AlertDialog.Portal>
                        <AlertDialog.Popup data-testid="popup2">
                          <AlertDialog.Close>Close 2</AlertDialog.Close>
                        </AlertDialog.Popup>
                      </AlertDialog.Portal>
                    </AlertDialog.Root>
                    <AlertDialog.Close>Close 1</AlertDialog.Close>
                  </AlertDialog.Popup>
                </AlertDialog.Portal>
              </AlertDialog.Root>
              <AlertDialog.Close>Close 0</AlertDialog.Close>
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>,
      );

      await user.click(screen.getByRole('button', { name: 'Trigger 0' }));
      await waitFor(() => expect(screen.getByTestId('popup0')).not.to.equal(null));

      const computedStyles = getComputedStyle(screen.getByTestId('popup0'));
      expect(computedStyles.getPropertyValue('--nested-dialogs')).to.equal('0');

      await user.click(screen.getByRole('button', { name: 'Trigger 1' }));
      await waitFor(() => expect(screen.getByTestId('popup1')).not.to.equal(null));
      await waitFor(() => {
        expect(
          getComputedStyle(screen.getByTestId('popup0')).getPropertyValue('--nested-dialogs'),
        ).to.equal('1');
      });

      await user.click(screen.getByRole('button', { name: 'Trigger 2' }));
      await waitFor(() => expect(screen.getByTestId('popup2')).not.to.equal(null));
      await waitFor(() => {
        expect(
          getComputedStyle(screen.getByTestId('popup0')).getPropertyValue('--nested-dialogs'),
        ).to.equal('2');
      });

      await user.click(screen.getByRole('button', { name: 'Close 2' }));
      await waitFor(() => {
        expect(
          getComputedStyle(screen.getByTestId('popup0')).getPropertyValue('--nested-dialogs'),
        ).to.equal('1');
      });

      await user.click(screen.getByRole('button', { name: 'Close 1' }));
      await waitFor(() => {
        expect(
          getComputedStyle(screen.getByTestId('popup0')).getPropertyValue('--nested-dialogs'),
        ).to.equal('0');
      });
    });

    it('decrements when an open nested alert dialog is unmounted', async () => {
      function App() {
        const [showNested, setShowNested] = React.useState(true);
        return (
          <React.Fragment>
            <button onClick={() => setShowNested(!showNested)}>toggle</button>
            <AlertDialog.Root>
              <AlertDialog.Trigger>Trigger 0</AlertDialog.Trigger>
              <AlertDialog.Portal>
                <AlertDialog.Popup data-testid="popup0">
                  {showNested && (
                    <AlertDialog.Root>
                      <AlertDialog.Trigger>Trigger 1</AlertDialog.Trigger>
                      <AlertDialog.Portal>
                        <AlertDialog.Popup data-testid="popup1">
                          <AlertDialog.Close>Close 1</AlertDialog.Close>
                        </AlertDialog.Popup>
                      </AlertDialog.Portal>
                    </AlertDialog.Root>
                  )}
                  <AlertDialog.Close>Close 0</AlertDialog.Close>
                </AlertDialog.Popup>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          </React.Fragment>
        );
      }

      const { user } = await render(<App />);
      await user.click(screen.getByRole('button', { name: 'Trigger 0' }));
      await waitFor(() => expect(screen.getByTestId('popup0')).not.to.equal(null));

      const computedStyles = getComputedStyle(screen.getByTestId('popup0'));
      expect(computedStyles.getPropertyValue('--nested-dialogs')).to.equal('0');

      await user.click(screen.getByRole('button', { name: 'Trigger 1' }));
      await waitFor(() => expect(screen.getByTestId('popup1')).not.to.equal(null));
      await waitFor(() => {
        expect(
          getComputedStyle(screen.getByTestId('popup0')).getPropertyValue('--nested-dialogs'),
        ).to.equal('1');
      });

      await user.click(screen.getByRole('button', { name: 'toggle', hidden: true }));
      expect(computedStyles.getPropertyValue('--nested-dialogs')).to.equal('0');
    });

    it('does not change when a closed nested alert dialog is unmounted', async () => {
      function App() {
        const [showNested, setShowNested] = React.useState(true);
        return (
          <AlertDialog.Root>
            <AlertDialog.Trigger>Trigger 0</AlertDialog.Trigger>
            <AlertDialog.Portal>
              <AlertDialog.Popup data-testid="popup0">
                {showNested && (
                  <AlertDialog.Root>
                    <AlertDialog.Trigger />
                    <AlertDialog.Portal>
                      <AlertDialog.Popup />
                    </AlertDialog.Portal>
                  </AlertDialog.Root>
                )}
                <button onClick={() => setShowNested(!showNested)}>toggle</button>
                <AlertDialog.Close>Close 0</AlertDialog.Close>
              </AlertDialog.Popup>
            </AlertDialog.Portal>
          </AlertDialog.Root>
        );
      }

      const { user } = await render(<App />);
      await user.click(screen.getByRole('button', { name: 'Trigger 0' }));
      await waitFor(() => expect(screen.getByTestId('popup0')).not.to.equal(null));

      const computedStyles = getComputedStyle(screen.getByTestId('popup0'));
      expect(computedStyles.getPropertyValue('--nested-dialogs')).to.equal('0');

      await user.click(screen.getByRole('button', { name: 'toggle' }));
      expect(computedStyles.getPropertyValue('--nested-dialogs')).to.equal('0');
    });
  });
});
