import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { act, fireEvent, screen, waitFor, describeSkipIf } from '@mui/internal-test-utils';
import { Dialog } from '@base-ui-components/react/dialog';
import { createRenderer } from '#test-utils';
import { Menu } from '@base-ui-components/react/menu';
import { Select } from '@base-ui-components/react/select';

const isJSDOM = /jsdom/.test(window.navigator.userAgent);

describe('<Dialog.Root />', () => {
  beforeEach(() => {
    (globalThis as any).BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render } = createRenderer();

  describe('uncontrolled mode', () => {
    it('should open the dialog with the trigger', async () => {
      const { queryByRole, getByRole } = await render(
        <Dialog.Root modal={false}>
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
        <Dialog.Root open={false} modal={false}>
          <Dialog.Popup />
        </Dialog.Root>,
      );

      expect(queryByRole('dialog')).to.equal(null);

      setProps({ open: true });
      expect(queryByRole('dialog')).not.to.equal(null);

      setProps({ open: false });
      expect(queryByRole('dialog')).to.equal(null);
    });

    it('should remove the popup when there is no exit animation defined', async function test(t = {}) {
      if (/jsdom/.test(window.navigator.userAgent)) {
        // @ts-expect-error to support mocha and vitest
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        this?.skip?.() || t?.skip();
      }

      function Test() {
        const [open, setOpen] = React.useState(true);

        return (
          <div>
            <button onClick={() => setOpen(false)}>Close</button>
            <Dialog.Root open={open}>
              <Dialog.Popup />
            </Dialog.Root>
          </div>
        );
      }

      const { user } = await render(<Test />);

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).to.equal(null);
      });
    });

    it('should remove the popup when the animation finishes', async function test(t = {}) {
      if (/jsdom/.test(window.navigator.userAgent)) {
        // @ts-expect-error to support mocha and vitest
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        this?.skip?.() || t?.skip();
      }

      (globalThis as any).BASE_UI_ANIMATIONS_DISABLED = false;

      let animationFinished = false;
      const notifyAnimationFinished = () => {
        animationFinished = true;
      };

      function Test() {
        const style = `
          @keyframes test-anim {
            to {
              opacity: 0;
            }
          }

          .animation-test-popup[data-open] {
            opacity: 1;
          }

          .animation-test-popup[data-ending-style] {
            animation: test-anim 50ms;
          }
        `;

        const [open, setOpen] = React.useState(true);

        return (
          <div>
            {/* eslint-disable-next-line react/no-danger */}
            <style dangerouslySetInnerHTML={{ __html: style }} />
            <button onClick={() => setOpen(false)}>Close</button>
            <Dialog.Root open={open}>
              <Dialog.Popup
                className="animation-test-popup"
                data-testid="popup"
                onAnimationEnd={notifyAnimationFinished}
                keepMounted
              />
            </Dialog.Root>
          </div>
        );
      }

      const { user } = await render(<Test />);

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.getByTestId('popup')).to.have.attribute('hidden');
      });

      expect(animationFinished).to.equal(true);
    });
  });

  describe('prop: onOpenChange', () => {
    it('calls onOpenChange with the new open state', async () => {
      const handleOpenChange = spy();

      const { user } = await render(
        <Dialog.Root onOpenChange={handleOpenChange}>
          <Dialog.Trigger>Open</Dialog.Trigger>
          <Dialog.Popup>
            <Dialog.Close>Close</Dialog.Close>
          </Dialog.Popup>
        </Dialog.Root>,
      );

      expect(handleOpenChange.callCount).to.equal(0);

      const openButton = screen.getByText('Open');
      await user.click(openButton);

      expect(handleOpenChange.callCount).to.equal(1);
      expect(handleOpenChange.firstCall.args[0]).to.equal(true);

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      expect(handleOpenChange.callCount).to.equal(2);
      expect(handleOpenChange.secondCall.args[0]).to.equal(false);
    });

    it('calls onOpenChange with the reason for change when clicked on trigger and close button', async () => {
      const handleOpenChange = spy();

      const { user } = await render(
        <Dialog.Root onOpenChange={handleOpenChange}>
          <Dialog.Trigger>Open</Dialog.Trigger>
          <Dialog.Popup>
            <Dialog.Close>Close</Dialog.Close>
          </Dialog.Popup>
        </Dialog.Root>,
      );

      const openButton = screen.getByText('Open');
      await user.click(openButton);

      expect(handleOpenChange.callCount).to.equal(1);
      expect(handleOpenChange.firstCall.args[2]).to.equal('click');

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      expect(handleOpenChange.callCount).to.equal(2);
      expect(handleOpenChange.secondCall.args[2]).to.equal('click');
    });

    it('calls onOpenChange with the reason for change when pressed Esc while the dialog is open', async () => {
      const handleOpenChange = spy();

      const { user } = await render(
        <Dialog.Root defaultOpen onOpenChange={handleOpenChange}>
          <Dialog.Trigger>Open</Dialog.Trigger>
          <Dialog.Popup>
            <Dialog.Close>Close</Dialog.Close>
          </Dialog.Popup>
        </Dialog.Root>,
      );

      await user.keyboard('[Escape]');

      expect(handleOpenChange.callCount).to.equal(1);
      expect(handleOpenChange.firstCall.args[2]).to.equal('escape-key');
    });

    it('calls onOpenChange with the reason for change when user clicks outside while the dialog is open', async () => {
      const handleOpenChange = spy();

      const { user } = await render(
        <Dialog.Root defaultOpen onOpenChange={handleOpenChange}>
          <Dialog.Trigger>Open</Dialog.Trigger>
          <Dialog.Popup>
            <Dialog.Close>Close</Dialog.Close>
          </Dialog.Popup>
        </Dialog.Root>,
      );

      await user.click(document.body);

      expect(handleOpenChange.callCount).to.equal(1);
      expect(handleOpenChange.firstCall.args[2]).to.equal('outside-press');
    });
  });

  describeSkipIf(isJSDOM)('prop: modal', () => {
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

  it('waits for the exit transition to finish before unmounting', async function test(t = {}) {
    const css = `
    .dialog {
      opacity: 0;
      transition: opacity 200ms;
    }
    .dialog[data-open] {
      opacity: 1;
    }
  `;

    if (/jsdom/.test(window.navigator.userAgent)) {
      // @ts-expect-error to support mocha and vitest
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      this?.skip?.() || t?.skip();
    }

    (globalThis as any).BASE_UI_ANIMATIONS_DISABLED = false;

    const notifyTransitionEnd = spy();

    const { setProps, queryByRole } = await render(
      <Dialog.Root open modal={false}>
        {/* eslint-disable-next-line react/no-danger */}
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <Dialog.Popup className="dialog" onTransitionEnd={notifyTransitionEnd} keepMounted />
      </Dialog.Root>,
    );

    setProps({ open: false });
    expect(queryByRole('dialog')).not.to.equal(null);

    await waitFor(() => {
      expect(queryByRole('dialog')).to.equal(null);
    });

    expect(notifyTransitionEnd.callCount).to.equal(1);
  });

  describe('prop: modal', () => {
    it('should render an internal backdrop when `true`', async () => {
      const { user } = await render(
        <div>
          <Dialog.Root>
            <Dialog.Trigger data-testid="trigger">Open</Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Popup />
            </Dialog.Portal>
          </Dialog.Root>
          <button>Outside</button>
        </div>,
      );

      const trigger = screen.getByTestId('trigger');

      await user.click(trigger);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.to.equal(null);
      });

      const popup = screen.getByRole('dialog');

      // focus guard -> internal backdrop
      expect(popup.previousElementSibling?.previousElementSibling).to.have.attribute(
        'role',
        'presentation',
      );
    });

    it('should not render an internal backdrop when `false`', async () => {
      const { user } = await render(
        <div>
          <Dialog.Root modal={false}>
            <Dialog.Trigger data-testid="trigger">Open</Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Popup />
            </Dialog.Portal>
          </Dialog.Root>
          <button>Outside</button>
        </div>,
      );

      const trigger = screen.getByTestId('trigger');

      await user.click(trigger);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.to.equal(null);
      });

      const popup = screen.getByRole('dialog');

      // focus guard -> internal backdrop
      expect(popup.previousElementSibling?.previousElementSibling).to.equal(null);
    });
  });

  describeSkipIf(isJSDOM)('nested popups', () => {
    it('should not dismiss the dialog when dismissing outside a nested modal menu', async () => {
      const { user } = await render(
        <Dialog.Root>
          <Dialog.Trigger>Open dialog</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup data-testid="dialog-popup">
              <Menu.Root>
                <Menu.Trigger>Open menu</Menu.Trigger>
                <Menu.Portal>
                  <Menu.Positioner data-testid="menu-positioner">
                    <Menu.Popup>
                      <Menu.Item>Item</Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
      );

      const dialogTrigger = screen.getByRole('button', { name: 'Open dialog' });
      await user.click(dialogTrigger);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.to.equal(null);
      });

      const menuTrigger = screen.getByRole('button', { name: 'Open menu' });

      await user.click(menuTrigger);

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.to.equal(null);
      });

      const menuPositioner = screen.getByTestId('menu-positioner');
      const menuInternalBackdrop = menuPositioner.previousElementSibling as HTMLElement;

      await user.click(menuInternalBackdrop);

      await waitFor(() => {
        expect(screen.queryByRole('menu')).to.equal(null);
      });
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.to.equal(null);
      });

      const dialogPopup = screen.getByTestId('dialog-popup');
      const dialogInternalBackdrop = dialogPopup.previousElementSibling
        ?.previousElementSibling as HTMLElement;

      await user.click(dialogInternalBackdrop);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).to.equal(null);
      });
    });

    it('should not dismiss the dialog when dismissing outside a nested select menu', async () => {
      const { user } = await render(
        <Dialog.Root>
          <Dialog.Trigger>Open dialog</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup data-testid="dialog-popup">
              <Select.Root>
                <Select.Trigger data-testid="select-trigger">Open select</Select.Trigger>
                <Select.Portal>
                  <Select.Positioner data-testid="select-positioner">
                    <Select.Popup>
                      <Select.Item>Item</Select.Item>
                    </Select.Popup>
                  </Select.Positioner>
                </Select.Portal>
              </Select.Root>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
      );

      const dialogTrigger = screen.getByRole('button', { name: 'Open dialog' });
      await user.click(dialogTrigger);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.to.equal(null);
      });

      const selectTrigger = screen.getByTestId('select-trigger');

      await user.click(selectTrigger);

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.to.equal(null);
      });

      const selectPositioner = screen.getByTestId('select-positioner');
      const selectInternalBackdrop = selectPositioner.previousElementSibling as HTMLElement;

      await user.click(selectInternalBackdrop);

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).to.equal(null);
      });
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.to.equal(null);
      });

      const dialogPopup = screen.getByTestId('dialog-popup');
      const dialogInternalBackdrop = dialogPopup.previousElementSibling
        ?.previousElementSibling as HTMLElement;

      await user.click(dialogInternalBackdrop);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).to.equal(null);
      });
    });
  });
});
