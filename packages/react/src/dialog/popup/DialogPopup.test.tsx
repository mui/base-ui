import { expect, vi, describe, it } from 'vitest';
import * as React from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import { fireEvent, waitFor, screen } from '@mui/internal-test-utils';
import { describeConformance, createRenderer, isJSDOM, popupFocusPropsTests } from '#test-utils';

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

  it('throws a descriptive error when rendered outside <Dialog.Root>', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(render(<Dialog.Popup />)).rejects.toThrow(
        'Base UI: DialogRootContext is missing. Dialog parts must be placed within <Dialog.Root>.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  describe('prop: keepMounted', () => {
    it('should keep the dialog mounted when keepMounted=true', async () => {
      await render(
        <Dialog.Root open={false} modal={false}>
          <Dialog.Portal keepMounted>
            <Dialog.Popup />
          </Dialog.Portal>
        </Dialog.Root>,
      );

      expect(screen.getByRole('dialog', { hidden: true })).toBeInaccessible();
    });

    it.each([
      { name: 'false', keepMounted: false },
      { name: 'undefined', keepMounted: undefined },
    ])('should not keep the dialog mounted when keepMounted=$name', async ({ keepMounted }) => {
      await render(
        <Dialog.Root open={false} modal={false}>
          <Dialog.Portal keepMounted={keepMounted}>
            <Dialog.Popup />
          </Dialog.Portal>
        </Dialog.Root>,
      );

      expect(screen.queryByRole('dialog', { hidden: true })).toBe(null);
    });
  });

  // A modal dialog traps focus and marks the rest of the page inert, so it resolves the focus props
  // through a different path than a non-modal one.
  describe('modal', () => {
    popupFocusPropsTests({
      render,
      createComponent: ({ children, ...focusProps }) => (
        <Dialog.Root>
          <Dialog.Trigger>Open</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop />
            <Dialog.Popup {...focusProps}>
              {children}
              <Dialog.Close>Close</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      ),
    });
  });

  describe('non-modal', () => {
    popupFocusPropsTests({
      render,
      createComponent: ({ children, ...focusProps }) => (
        <Dialog.Root modal={false}>
          <Dialog.Trigger>Open</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup {...focusProps}>
              {children}
              <Dialog.Close>Close</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      ),
    });
  });

  describe('prop: initialFocus', () => {
    it('focuses the popup itself rather than inner content when opened by touch', async () => {
      await render(
        <Dialog.Root modal={false}>
          <Dialog.Trigger>Open</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup data-testid="dialog">
              <input data-testid="input" />
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
      );

      const trigger = screen.getByText('Open');
      fireEvent.pointerDown(trigger, { pointerType: 'touch' });
      fireEvent.click(trigger, { detail: 1 });

      // On touch the default focuses the popup to avoid opening the virtual keyboard.
      await waitFor(() => {
        expect(screen.getByTestId('dialog')).toHaveFocus();
      });
      expect(screen.getByTestId('input')).not.toHaveFocus();
    });
  });

  describe.skipIf(isJSDOM)('display: contents ancestors', () => {
    it('keeps initial focus working when the popup is wrapped by a display: contents ancestor', async () => {
      const { user } = await render(
        <div>
          <button data-testid="outside-before">Outside before</button>
          <Dialog.Root modal={false}>
            <Dialog.Trigger>Open</Dialog.Trigger>
            <Dialog.Portal>
              <form style={{ display: 'contents' }}>
                <Dialog.Popup data-testid="dialog-popup">
                  <input data-testid="dialog-input" />
                  <button type="button">Close</button>
                </Dialog.Popup>
              </form>
            </Dialog.Portal>
          </Dialog.Root>
          <button data-testid="outside-after">Outside after</button>
        </div>,
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        expect(screen.getByTestId('dialog-input')).toHaveFocus();
      });
    });

    it('keeps trap-focus tab cycling inside the popup when wrapped by a display: contents ancestor', async () => {
      const { user } = await render(
        <div>
          <button data-testid="outside-before">Outside before</button>
          <Dialog.Root defaultOpen modal="trap-focus">
            <Dialog.Portal>
              <form style={{ display: 'contents' }}>
                <Dialog.Popup data-testid="dialog-popup">
                  <input data-testid="first-input" />
                  <button type="button" data-testid="second-button">
                    Second
                  </button>
                </Dialog.Popup>
              </form>
            </Dialog.Portal>
          </Dialog.Root>
          <button data-testid="outside-after">Outside after</button>
        </div>,
      );

      const popup = screen.getByTestId('dialog-popup');

      await waitFor(() => {
        expect(screen.getByTestId('first-input')).toHaveFocus();
      });

      await user.keyboard('[Tab]');
      expect(screen.getByTestId('second-button')).toHaveFocus();

      await user.keyboard('[Tab]');
      await waitFor(() => {
        expect(screen.getByTestId('first-input')).toHaveFocus();
      });
      expect(screen.getByTestId('outside-before')).not.toHaveFocus();
      expect(screen.getByTestId('outside-after')).not.toHaveFocus();

      await user.keyboard('[ShiftLeft>][Tab][/ShiftLeft]');
      await waitFor(() => {
        expect(screen.getByTestId('second-button')).toHaveFocus();
      });
      expect(popup.contains(document.activeElement)).toBe(true);
    });
  });

  describe('prop: finalFocus', () => {
    it('respects finalFocus when initialFocus points outside the popup', async () => {
      function TestComponent() {
        const initialRef = React.useRef<HTMLInputElement>(null);
        const finalRef = React.useRef<HTMLInputElement>(null);
        return (
          <div>
            <input data-testid="initial-outside" ref={initialRef} />
            <Dialog.Root>
              <Dialog.Backdrop />
              <Dialog.Trigger>Open</Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Popup initialFocus={initialRef} finalFocus={finalRef}>
                  <Dialog.Close>Close</Dialog.Close>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
            <input data-testid="final-outside" ref={finalRef} />
          </div>
        );
      }

      const { user } = await render(<TestComponent />);

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        expect(screen.getByTestId('initial-outside')).toHaveFocus();
      });

      await user.click(screen.getByText('Close'));

      await waitFor(() => {
        expect(screen.getByTestId('final-outside')).toHaveFocus();
      });
    });

    it('moves final focus to trigger if initialFocus points outside the popup and finalFocus is not specified', async () => {
      function TestComponent() {
        const initialRef = React.useRef<HTMLInputElement>(null);
        const finalRef = React.useRef<HTMLInputElement>(null);
        return (
          <div>
            <input data-testid="initial-outside" ref={initialRef} />
            <Dialog.Root>
              <Dialog.Backdrop />
              <Dialog.Trigger>Open</Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Popup initialFocus={initialRef}>
                  <Dialog.Close>Close</Dialog.Close>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
            <input data-testid="final-outside" ref={finalRef} />
          </div>
        );
      }

      const { user } = await render(<TestComponent />);

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        expect(screen.getByTestId('initial-outside')).toHaveFocus();
      });

      await user.click(screen.getByText('Close'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus();
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
        expect(screen.getByTestId('popup0')).not.toBe(null);
      });

      const computedStyles = getComputedStyle(screen.getByTestId('popup0'));

      expect(computedStyles.getPropertyValue('--nested-dialogs')).toBe('0');

      await user.click(screen.getByRole('button', { name: 'Trigger 1' }));

      await waitFor(() => {
        expect(screen.getByTestId('popup1')).not.toBe(null);
      });

      expect(computedStyles.getPropertyValue('--nested-dialogs')).toBe('1');

      await user.click(screen.getByRole('button', { name: 'Trigger 2' }));

      await waitFor(() => {
        expect(screen.getByTestId('popup2')).not.toBe(null);
      });

      expect(computedStyles.getPropertyValue('--nested-dialogs')).toBe('2');

      await user.click(screen.getByRole('button', { name: 'Close 2' }));

      expect(computedStyles.getPropertyValue('--nested-dialogs')).toBe('1');

      await user.click(screen.getByRole('button', { name: 'Close 1' }));

      expect(computedStyles.getPropertyValue('--nested-dialogs')).toBe('0');
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
        expect(screen.getByTestId('popup0')).not.toBe(null);
      });

      const computedStyles = getComputedStyle(screen.getByTestId('popup0'));

      expect(computedStyles.getPropertyValue('--nested-dialogs')).toBe('0');

      await user.click(screen.getByRole('button', { name: 'Trigger 1' }));

      await waitFor(() => {
        expect(screen.getByTestId('popup1')).not.toBe(null);
      });

      expect(computedStyles.getPropertyValue('--nested-dialogs')).toBe('1');

      await user.click(screen.getByRole('button', { name: 'toggle', hidden: true }));

      expect(computedStyles.getPropertyValue('--nested-dialogs')).toBe('0');
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
        expect(screen.getByTestId('popup0')).not.toBe(null);
      });

      const computedStyles = getComputedStyle(screen.getByTestId('popup0'));

      expect(computedStyles.getPropertyValue('--nested-dialogs')).toBe('0');

      await user.click(screen.getByRole('button', { name: 'toggle' }));

      expect(computedStyles.getPropertyValue('--nested-dialogs')).toBe('0');
    });

    it('increments for nested alert dialog and decrements on close (cross-type)', async () => {
      const { user } = await render(
        <Dialog.Root>
          <Dialog.Trigger>Open Dialog</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup data-testid="parent-dialog">
              <AlertDialog.Root>
                <AlertDialog.Trigger>Open Alert</AlertDialog.Trigger>
                <AlertDialog.Portal>
                  <AlertDialog.Popup data-testid="nested-alert">
                    <AlertDialog.Close>Close Alert</AlertDialog.Close>
                  </AlertDialog.Popup>
                </AlertDialog.Portal>
              </AlertDialog.Root>
              <Dialog.Close>Close Dialog</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
      );

      await user.click(screen.getByRole('button', { name: 'Open Dialog' }));
      await waitFor(() => expect(screen.getByTestId('parent-dialog')).not.toBe(null));

      const parent = screen.getByTestId('parent-dialog');
      expect(getComputedStyle(parent).getPropertyValue('--nested-dialogs')).toBe('0');

      await user.click(screen.getByRole('button', { name: 'Open Alert' }));
      await waitFor(() => expect(screen.getByTestId('nested-alert')).not.toBe(null));
      await waitFor(() => {
        expect(getComputedStyle(parent).getPropertyValue('--nested-dialogs')).toBe('1');
      });

      await user.click(screen.getByRole('button', { name: 'Close Alert' }));
      await waitFor(() => {
        expect(getComputedStyle(parent).getPropertyValue('--nested-dialogs')).toBe('0');
      });
    });
  });

  describe('style hooks', () => {
    it('adds the `nested` and `nested-dialog-open` style hooks if a dialog has a parent dialog', async () => {
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

      expect(parentDialog).not.toHaveAttribute('data-nested');
      expect(nestedDialog).toHaveAttribute('data-nested');

      expect(parentDialog).toHaveAttribute('data-nested-dialog-open');
      expect(nestedDialog).not.toHaveAttribute('data-nested-dialog-open');
    });

    it('adds the `nested` and `nested-dialog-open` style hooks if a dialog has a parent alert dialog', async () => {
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

      expect(parentDialog).not.toHaveAttribute('data-nested');
      expect(nestedDialog).toHaveAttribute('data-nested');

      expect(parentDialog).toHaveAttribute('data-nested-dialog-open');
      expect(nestedDialog).not.toHaveAttribute('data-nested-dialog-open');
    });
  });
});
