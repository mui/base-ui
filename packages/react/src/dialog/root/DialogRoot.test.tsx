import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { Dialog } from '@base-ui-components/react/dialog';
import { createRenderer, isJSDOM } from '#test-utils';
import { Menu } from '@base-ui-components/react/menu';
import { Select } from '@base-ui-components/react/select';

describe('<Dialog.Root />', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render } = createRenderer();

  it('ARIA attributes', async () => {
    const { queryByRole, getByText } = await render(
      <Dialog.Root modal={false} open>
        <Dialog.Trigger />
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Popup>
            <Dialog.Title>title text</Dialog.Title>
            <Dialog.Description>description text</Dialog.Description>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>,
    );

    const popup = queryByRole('dialog');
    expect(popup).not.to.equal(null);
    expect(popup).to.not.have.attribute('aria-modal');

    expect(getByText('title text').getAttribute('id')).to.equal(
      popup?.getAttribute('aria-labelledby'),
    );
    expect(getByText('description text').getAttribute('id')).to.equal(
      popup?.getAttribute('aria-describedby'),
    );
  });

  describe('uncontrolled mode', () => {
    it('should open the dialog with the trigger', async () => {
      const { queryByRole, getByRole } = await render(
        <Dialog.Root modal={false}>
          <Dialog.Trigger />
          <Dialog.Portal>
            <Dialog.Popup />
          </Dialog.Portal>
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
          <Dialog.Portal>
            <Dialog.Popup />
          </Dialog.Portal>
        </Dialog.Root>,
      );

      expect(queryByRole('dialog')).to.equal(null);

      setProps({ open: true });
      expect(queryByRole('dialog')).not.to.equal(null);

      setProps({ open: false });
      expect(queryByRole('dialog')).to.equal(null);
    });

    it('should remove the popup when there is no exit animation defined', async ({ skip }) => {
      if (isJSDOM) {
        skip();
      }

      function Test() {
        const [open, setOpen] = React.useState(true);

        return (
          <div>
            <button onClick={() => setOpen(false)}>Close</button>
            <Dialog.Root open={open}>
              <Dialog.Portal>
                <Dialog.Popup />
              </Dialog.Portal>
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

    it('should remove the popup when the animation finishes', async ({ skip }) => {
      if (isJSDOM) {
        skip();
      }

      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

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
            animation: test-anim 1ms;
          }
        `;

        const [open, setOpen] = React.useState(true);

        return (
          <div>
            {/* eslint-disable-next-line react/no-danger */}
            <style dangerouslySetInnerHTML={{ __html: style }} />
            <button onClick={() => setOpen(false)}>Close</button>
            <Dialog.Root open={open}>
              <Dialog.Portal keepMounted>
                <Dialog.Popup
                  className="animation-test-popup"
                  data-testid="popup"
                  onAnimationEnd={notifyAnimationFinished}
                />
              </Dialog.Portal>
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
          <Dialog.Portal>
            <Dialog.Popup>
              <Dialog.Close>Close</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
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
          <Dialog.Portal>
            <Dialog.Popup>
              <Dialog.Close>Close</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
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
          <Dialog.Portal>
            <Dialog.Popup>
              <Dialog.Close>Close</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
      );

      await user.keyboard('[Escape]');

      expect(handleOpenChange.callCount).to.equal(1);
      expect(handleOpenChange.firstCall.args[2]).to.equal('escape-key');
    });

    it('calls onOpenChange with the reason for change when user clicks backdrop while the modal dialog is open', async () => {
      const handleOpenChange = spy();

      const { user } = await render(
        <Dialog.Root defaultOpen onOpenChange={handleOpenChange}>
          <Dialog.Trigger>Open</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup>
              <Dialog.Close>Close</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
      );

      await user.click(screen.getByRole('presentation', { hidden: true }));

      expect(handleOpenChange.callCount).to.equal(1);
      expect(handleOpenChange.firstCall.args[2]).to.equal('outside-press');
    });

    it('calls onOpenChange with the reason for change when user clicks outside while the non-modal dialog is open', async () => {
      const handleOpenChange = spy();

      const { user } = await render(
        <Dialog.Root defaultOpen onOpenChange={handleOpenChange} modal={false}>
          <Dialog.Trigger>Open</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup>
              <Dialog.Close>Close</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
      );

      await user.click(document.body);

      expect(handleOpenChange.callCount).to.equal(1);
      expect(handleOpenChange.firstCall.args[2]).to.equal('outside-press');
    });

    describe.skipIf(isJSDOM)('clicks on user backdrop', () => {
      it('detects clicks on user backdrop', async () => {
        const handleOpenChange = spy();

        const { user } = await render(
          <Dialog.Root defaultOpen onOpenChange={handleOpenChange}>
            <Dialog.Trigger>Open</Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Backdrop data-backdrop style={{ position: 'fixed', zIndex: 10, inset: 0 }} />
              <Dialog.Popup style={{ position: 'fixed', zIndex: 10 }}>
                <Dialog.Close>Close</Dialog.Close>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>,
        );

        await user.click(document.querySelector('[data-backdrop]') as HTMLElement);

        expect(handleOpenChange.callCount).to.equal(1);
        expect(handleOpenChange.firstCall.args[2]).to.equal('outside-press');
      });
    });
  });

  describe.skipIf(isJSDOM)('prop: modal', () => {
    it('makes other interactive elements on the page inert when a modal dialog is open', async () => {
      await render(
        <Dialog.Root defaultOpen modal>
          <Dialog.Trigger>Open Dialog</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup>
              <Dialog.Close>Close Dialog</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
      );

      expect(screen.getByRole('presentation', { hidden: true })).not.to.equal(null);
    });

    it('does not make other interactive elements on the page inert when a non-modal dialog is open', async () => {
      await render(
        <Dialog.Root defaultOpen modal={false}>
          <Dialog.Trigger>Open Dialog</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup>
              <Dialog.Close>Close Dialog</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
      );

      expect(screen.queryByRole('presentation')).to.equal(null);
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
              <Dialog.Portal>
                <Dialog.Popup />
              </Dialog.Portal>
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

  it('waits for the exit transition to finish before unmounting', async ({ skip }) => {
    const css = `
    .dialog {
      opacity: 0;
      transition: opacity 200ms;
    }
    .dialog[data-open] {
      opacity: 1;
    }
  `;

    if (isJSDOM) {
      skip();
    }

    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

    const notifyTransitionEnd = spy();

    const { setProps, queryByRole } = await render(
      <Dialog.Root open modal={false}>
        {/* eslint-disable-next-line react/no-danger */}
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <Dialog.Portal keepMounted>
          <Dialog.Popup className="dialog" onTransitionEnd={notifyTransitionEnd} />
        </Dialog.Portal>
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

  it('does not dismiss previous modal dialog when clicking new modal dialog', async () => {
    function App() {
      const [openNested, setOpenNested] = React.useState(false);
      const [openNested2, setOpenNested2] = React.useState(false);

      return (
        <div>
          <Dialog.Root>
            <Dialog.Trigger>Trigger</Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Backdrop />
              <Dialog.Popup>
                <button onClick={() => setOpenNested(true)}>Open nested 1</button>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
          <Dialog.Root open={openNested} onOpenChange={setOpenNested}>
            <Dialog.Portal>
              <Dialog.Backdrop />
              <Dialog.Popup>
                <button onClick={() => setOpenNested2(true)}>Open nested 2</button>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
          <Dialog.Root open={openNested2} onOpenChange={setOpenNested2}>
            <Dialog.Portal>
              <Dialog.Backdrop />
              <Dialog.Popup>Final nested</Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      );
    }

    const { user } = await render(<App />);

    const trigger = screen.getByRole('button', { name: 'Trigger' });
    await user.click(trigger);

    const nestedButton1 = screen.getByRole('button', { name: 'Open nested 1' });
    await user.click(nestedButton1);

    const nestedButton2 = screen.getByRole('button', { name: 'Open nested 2' });
    await user.click(nestedButton2);

    const finalDialog = screen.getByText('Final nested');

    expect(finalDialog).not.to.equal(null);
  });

  it('dismisses non-nested dialogs one by one', async () => {
    function App() {
      const [openNested, setOpenNested] = React.useState(false);
      const [openNested2, setOpenNested2] = React.useState(false);

      return (
        <div>
          <Dialog.Root>
            <Dialog.Trigger>Trigger</Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Popup data-testid="level-1">
                <button onClick={() => setOpenNested(true)}>Open nested 1</button>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
          <Dialog.Root open={openNested} onOpenChange={setOpenNested}>
            <Dialog.Portal>
              <Dialog.Popup data-testid="level-2">
                <button onClick={() => setOpenNested2(true)}>Open nested 2</button>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
          <Dialog.Root open={openNested2} onOpenChange={setOpenNested2}>
            <Dialog.Portal>
              <Dialog.Popup data-testid="level-3">Final nested</Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      );
    }

    const { user } = await render(<App />);

    const trigger = screen.getByRole('button', { name: 'Trigger' });
    await user.click(trigger);

    const nestedButton1 = screen.getByRole('button', { name: 'Open nested 1' });
    await user.click(nestedButton1);

    const nestedButton2 = screen.getByRole('button', { name: 'Open nested 2' });
    await user.click(nestedButton2);

    const backdrops = Array.from(document.querySelectorAll('[role="presentation"]'));
    await user.click(backdrops[backdrops.length - 1]);

    expect(screen.queryByTestId('level-3')).to.equal(null);

    await user.click(backdrops[backdrops.length - 2]);

    expect(screen.queryByTestId('level-2')).to.equal(null);

    await user.click(backdrops[backdrops.length - 3]);

    expect(screen.queryByTestId('level-1')).to.equal(null);
  });

  describe.skipIf(isJSDOM)('nested popups', () => {
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

  describe.skipIf(isJSDOM)('prop: onOpenChangeComplete', () => {
    it('is called on close when there is no exit animation defined', async () => {
      const onOpenChangeComplete = spy();

      function Test() {
        const [open, setOpen] = React.useState(true);
        return (
          <div>
            <button onClick={() => setOpen(false)}>Close</button>
            <Dialog.Root open={open} onOpenChangeComplete={onOpenChangeComplete}>
              <Dialog.Portal>
                <Dialog.Popup data-testid="popup" />
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        );
      }

      const { user } = await render(<Test />);

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('popup')).to.equal(null);
      });

      expect(onOpenChangeComplete.firstCall.args[0]).to.equal(true);
      expect(onOpenChangeComplete.lastCall.args[0]).to.equal(false);
    });

    it('is called on close when the exit animation finishes', async () => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      const onOpenChangeComplete = spy();

      function Test() {
        const style = `
        @keyframes test-anim {
          to {
            opacity: 0;
          }
        }

        .animation-test-indicator[data-ending-style] {
          animation: test-anim 1ms;
        }
      `;

        const [open, setOpen] = React.useState(true);

        return (
          <div>
            {/* eslint-disable-next-line react/no-danger */}
            <style dangerouslySetInnerHTML={{ __html: style }} />
            <button onClick={() => setOpen(false)}>Close</button>
            <Dialog.Root open={open} onOpenChangeComplete={onOpenChangeComplete}>
              <Dialog.Portal>
                <Dialog.Popup className="animation-test-indicator" data-testid="popup" />
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        );
      }

      const { user } = await render(<Test />);

      expect(screen.getByTestId('popup')).not.to.equal(null);

      // Wait for open animation to finish
      await waitFor(() => {
        expect(onOpenChangeComplete.firstCall.args[0]).to.equal(true);
      });

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('popup')).to.equal(null);
      });

      expect(onOpenChangeComplete.lastCall.args[0]).to.equal(false);
    });

    it('is called on open when there is no enter animation defined', async () => {
      const onOpenChangeComplete = spy();

      function Test() {
        const [open, setOpen] = React.useState(false);
        return (
          <div>
            <button onClick={() => setOpen(true)}>Open</button>
            <Dialog.Root open={open} onOpenChangeComplete={onOpenChangeComplete}>
              <Dialog.Portal>
                <Dialog.Popup data-testid="popup" />
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        );
      }

      const { user } = await render(<Test />);

      const openButton = screen.getByText('Open');
      await user.click(openButton);

      await waitFor(() => {
        expect(screen.queryByTestId('popup')).not.to.equal(null);
      });

      expect(onOpenChangeComplete.callCount).to.equal(2);
      expect(onOpenChangeComplete.firstCall.args[0]).to.equal(true);
    });

    it('is called on open when the enter animation finishes', async () => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      const onOpenChangeComplete = spy();

      function Test() {
        const style = `
          @keyframes test-anim {
            from {
              opacity: 0;
            }
          }
  
          .animation-test-indicator[data-starting-style] {
            animation: test-anim 1ms;
          }
        `;

        const [open, setOpen] = React.useState(false);

        return (
          <div>
            {/* eslint-disable-next-line react/no-danger */}
            <style dangerouslySetInnerHTML={{ __html: style }} />
            <button onClick={() => setOpen(true)}>Open</button>
            <Dialog.Root
              open={open}
              onOpenChange={setOpen}
              onOpenChangeComplete={onOpenChangeComplete}
            >
              <Dialog.Portal>
                <Dialog.Popup className="animation-test-indicator" data-testid="popup" />
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        );
      }

      const { user } = await render(<Test />);

      const openButton = screen.getByText('Open');
      await user.click(openButton);

      // Wait for open animation to finish
      await waitFor(() => {
        expect(onOpenChangeComplete.firstCall.args[0]).to.equal(true);
      });

      expect(screen.queryByTestId('popup')).not.to.equal(null);
    });

    it('does not get called on mount when not open', async () => {
      const onOpenChangeComplete = spy();

      await render(
        <Dialog.Root onOpenChangeComplete={onOpenChangeComplete}>
          <Dialog.Portal>
            <Dialog.Popup data-testid="popup" />
          </Dialog.Portal>
        </Dialog.Root>,
      );

      expect(onOpenChangeComplete.callCount).to.equal(0);
    });
  });
});
