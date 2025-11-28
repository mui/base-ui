import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { act, fireEvent, screen, waitFor, flushMicrotasks } from '@mui/internal-test-utils';
import { Dialog } from '@base-ui-components/react/dialog';
import { createRenderer, isJSDOM, popupConformanceTests } from '#test-utils';
import { Menu } from '@base-ui-components/react/menu';
import { Select } from '@base-ui-components/react/select';
import { REASONS } from '../../utils/reasons';

describe('<Dialog.Root />', () => {
  const { render } = createRenderer();

  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  popupConformanceTests({
    createComponent: (props) => (
      <Dialog.Root {...props.root}>
        <Dialog.Trigger {...props.trigger}>Open dialog</Dialog.Trigger>
        <Dialog.Portal {...props.portal}>
          <Dialog.Popup {...props.popup}>Dialog</Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    ),
    render,
    triggerMouseAction: 'click',
    expectedPopupRole: 'dialog',
  });

  it('ARIA attributes', async () => {
    await render(
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

    const popup = screen.queryByRole('dialog');
    expect(popup).not.to.equal(null);

    expect(screen.getByText('title text').getAttribute('id')).to.equal(
      popup?.getAttribute('aria-labelledby'),
    );
    expect(screen.getByText('description text').getAttribute('id')).to.equal(
      popup?.getAttribute('aria-describedby'),
    );
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
      expect(handleOpenChange.firstCall.args[1].reason).to.equal(REASONS.triggerPress);

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      expect(handleOpenChange.callCount).to.equal(2);
      expect(handleOpenChange.secondCall.args[1].reason).to.equal(REASONS.closePress);
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
      expect(handleOpenChange.firstCall.args[1].reason).to.equal(REASONS.escapeKey);
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
      expect(handleOpenChange.firstCall.args[1].reason).to.equal(REASONS.outsidePress);
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
      expect(handleOpenChange.firstCall.args[1].reason).to.equal(REASONS.outsidePress);
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
        expect(handleOpenChange.firstCall.args[1].reason).to.equal(REASONS.outsidePress);
      });

      it('does not change open state on non-main button clicks', async () => {
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

        const backdrop = document.querySelector('[data-backdrop]') as HTMLElement;
        await user.pointer([{ target: backdrop }, { keys: '[MouseRight]', target: backdrop }]);

        expect(handleOpenChange.callCount).to.equal(0);
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

  describe('prop: disablePointerDismissal', () => {
    (
      [
        [true, false],
        [false, true],
        [undefined, true],
      ] as const
    ).forEach(([disablePointerDismissal, expectDismissed]) => {
      it(`${expectDismissed ? 'closes' : 'does not close'} the dialog when clicking outside if disablePointerDismissal=${disablePointerDismissal}`, async () => {
        const handleOpenChange = spy();

        await render(
          <div data-testid="outside">
            <Dialog.Root
              defaultOpen
              onOpenChange={handleOpenChange}
              disablePointerDismissal={disablePointerDismissal}
              modal={false}
            >
              <Dialog.Portal>
                <Dialog.Popup />
              </Dialog.Portal>
            </Dialog.Root>
          </div>,
        );

        const outside = screen.getByTestId('outside');

        fireEvent.mouseDown(outside);
        fireEvent.click(outside);
        expect(handleOpenChange.calledOnce).to.equal(expectDismissed);

        if (expectDismissed) {
          expect(screen.queryByRole('dialog')).to.equal(null);
        } else {
          expect(screen.queryByRole('dialog')).not.to.equal(null);
        }
      });
    });
  });

  describe('outside press event with backdrops', () => {
    it('uses intentional outside press with user backdrop (mouse): closes on click, not on mousedown', async () => {
      const handleOpenChange = spy();

      await render(
        <Dialog.Root defaultOpen onOpenChange={handleOpenChange} modal={false}>
          <Dialog.Portal>
            <Dialog.Backdrop data-testid="backdrop" />
            <Dialog.Popup />
          </Dialog.Portal>
        </Dialog.Root>,
      );

      const backdrop = screen.getByTestId('backdrop');

      fireEvent.mouseDown(backdrop);
      expect(screen.queryByRole('dialog')).not.to.equal(null);
      expect(handleOpenChange.callCount).to.equal(0);

      fireEvent.click(backdrop);
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).to.equal(null);
      });
      expect(handleOpenChange.callCount).to.equal(1);
    });

    it('uses intentional outside press with internal backdrop (modal=true): closes on click, not on mousedown', async () => {
      const handleOpenChange = spy();

      await render(
        <Dialog.Root defaultOpen onOpenChange={handleOpenChange} modal>
          <Dialog.Portal>
            <Dialog.Popup />
          </Dialog.Portal>
        </Dialog.Root>,
      );

      const internalBackdrop = screen.getByRole('presentation', { hidden: true });

      fireEvent.mouseDown(internalBackdrop);
      expect(screen.queryByRole('dialog')).not.to.equal(null);
      expect(handleOpenChange.callCount).to.equal(0);

      fireEvent.click(internalBackdrop);
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).to.equal(null);
      });
      expect(handleOpenChange.callCount).to.equal(1);
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

    const { setProps } = await render(
      <Dialog.Root open modal={false}>
        {/* eslint-disable-next-line react/no-danger */}
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <Dialog.Portal keepMounted>
          <Dialog.Popup className="dialog" onTransitionEnd={notifyTransitionEnd} />
        </Dialog.Portal>
      </Dialog.Root>,
    );

    await setProps({ open: false });
    expect(screen.queryByRole('dialog')).not.to.equal(null);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).to.equal(null);
    });

    expect(notifyTransitionEnd.callCount).to.equal(1);
  });

  describe('prop: modal', () => {
    it('should render an internal backdrop when `true`', async () => {
      const { user } = await render(
        <div>
          <Dialog.Root modal>
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

  describe('BaseUIChangeEventDetails', () => {
    it('onOpenChange cancel() prevents opening while uncontrolled', async () => {
      const { user } = await render(
        <Dialog.Root
          onOpenChange={(nextOpen, eventDetails) => {
            if (nextOpen) {
              eventDetails.cancel();
            }
          }}
        >
          <Dialog.Trigger>Open</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup>Dialog</Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
      );

      const openButton = screen.getByText('Open');
      await user.click(openButton);
      await flushMicrotasks();

      expect(screen.queryByRole('dialog')).to.equal(null);
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

    await render(<App />);

    const trigger = screen.getByRole('button', { name: 'Trigger' });
    fireEvent.click(trigger);

    const nestedButton1 = screen.getByRole('button', { name: 'Open nested 1' });
    fireEvent.click(nestedButton1);

    const nestedButton2 = screen.getByRole('button', { name: 'Open nested 2' });
    fireEvent.click(nestedButton2);

    const backdrops = Array.from(document.querySelectorAll('[role="presentation"]'));
    fireEvent.click(backdrops[backdrops.length - 1]);

    await waitFor(() => {
      expect(screen.queryByTestId('level-3')).to.equal(null);
    });

    fireEvent.click(backdrops[backdrops.length - 2]);

    await waitFor(() => {
      expect(screen.queryByTestId('level-2')).to.equal(null);
    });

    fireEvent.click(backdrops[backdrops.length - 3]);

    await waitFor(() => {
      expect(screen.queryByTestId('level-1')).to.equal(null);
    });
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

    it('should not dismiss the dialog when dismissing outside a nested select popup', async () => {
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

    it('should not close the parent menu when Escape is pressed in a nested dialog', async () => {
      const { user } = await render(
        <Menu.Root>
          <Menu.Trigger>Open menu</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Dialog.Root>
                  <Menu.Item closeOnClick={false} render={<Dialog.Trigger nativeButton={false} />}>
                    Open dialog
                  </Menu.Item>
                  <Dialog.Portal>
                    <Dialog.Popup />
                  </Dialog.Portal>
                </Dialog.Root>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const menuTrigger = screen.getByRole('button', { name: 'Open menu' });
      await user.click(menuTrigger);

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.to.equal(null);
      });

      const dialogTrigger = screen.getByRole('menuitem', { name: 'Open dialog' });
      await user.click(dialogTrigger);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.to.equal(null);
      });

      await user.keyboard('[Escape]');

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).to.equal(null);
      });
      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.to.equal(null);
      });
    });
  });

  describe('prop: actionsRef', () => {
    it('unmounts the dialog when the `unmount` method is called', async () => {
      const actionsRef = {
        current: {
          unmount: spy(),
          close: spy(),
        },
      };

      const { user } = await render(
        <Dialog.Root
          actionsRef={actionsRef}
          onOpenChange={(open, details) => {
            details.preventUnmountOnClose();
          }}
        >
          <Dialog.Trigger>Open</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup />
          </Dialog.Portal>
        </Dialog.Root>,
      );

      const trigger = screen.getByRole('button', { name: 'Open' });
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.to.equal(null);
      });

      await user.click(trigger);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.to.equal(null);
      });

      await act(async () => actionsRef.current.unmount());

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).to.equal(null);
      });
    });
  });

  describe.skipIf(isJSDOM)('multiple triggers within Root', () => {
    type NumberPayload = { payload: number | undefined };

    it('opens the dialog with any trigger', async () => {
      const { user } = await render(
        <Dialog.Root>
          <Dialog.Trigger>Trigger 1</Dialog.Trigger>
          <Dialog.Trigger>Trigger 2</Dialog.Trigger>
          <Dialog.Trigger>Trigger 3</Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Popup>
              Dialog Content
              <Dialog.Close>Close</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });
      const trigger3 = screen.getByRole('button', { name: 'Trigger 3' });

      expect(screen.queryByText('Dialog Content')).to.equal(null);

      await user.click(trigger1);
      await waitFor(() => {
        expect(screen.queryByText('Dialog Content')).not.to.equal(null);
      });

      await user.click(screen.getByText('Close'));
      await waitFor(() => {
        expect(screen.queryByText('Dialog Content')).to.equal(null);
      });

      await user.click(trigger2);
      await waitFor(() => {
        expect(screen.queryByText('Dialog Content')).not.to.equal(null);
      });

      await user.click(screen.getByText('Close'));
      await waitFor(() => {
        expect(screen.queryByText('Dialog Content')).to.equal(null);
      });

      await user.click(trigger3);
      await waitFor(() => {
        expect(screen.queryByText('Dialog Content')).not.to.equal(null);
      });
    });

    it('sets the payload and renders content based on its value', async () => {
      const { user } = await render(
        <Dialog.Root>
          {({ payload }: NumberPayload) => (
            <React.Fragment>
              <Dialog.Trigger payload={1}>Trigger 1</Dialog.Trigger>
              <Dialog.Trigger payload={2}>Trigger 2</Dialog.Trigger>

              <Dialog.Portal>
                <Dialog.Popup>
                  <span data-testid="content">{payload}</span>
                  <Dialog.Close>Close</Dialog.Close>
                </Dialog.Popup>
              </Dialog.Portal>
            </React.Fragment>
          )}
        </Dialog.Root>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await user.click(trigger1);
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).to.equal('1');
      });

      await user.click(trigger2);
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).to.equal('2');
      });
    });

    it('reuses the popup DOM node when switching triggers', async () => {
      const { user } = await render(
        <Dialog.Root>
          {({ payload }: NumberPayload) => (
            <React.Fragment>
              <Dialog.Trigger payload={1}>Trigger 1</Dialog.Trigger>
              <Dialog.Trigger payload={2}>Trigger 2</Dialog.Trigger>

              <Dialog.Portal>
                <Dialog.Popup data-testid="dialog-popup">
                  <span>{payload}</span>
                </Dialog.Popup>
              </Dialog.Portal>
            </React.Fragment>
          )}
        </Dialog.Root>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await user.click(trigger1);
      const popupElement = screen.getByTestId('dialog-popup');

      await user.click(trigger2);
      expect(screen.getByTestId('dialog-popup')).to.equal(popupElement);
    });

    it('synchronizes ARIA attributes on the active trigger', async () => {
      const { user } = await render(
        <Dialog.Root>
          <Dialog.Trigger>Trigger 1</Dialog.Trigger>
          <Dialog.Trigger>Trigger 2</Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Popup data-testid="dialog-popup">Dialog Content</Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      expect(trigger1).to.have.attribute('aria-expanded', 'false');
      expect(trigger2).to.have.attribute('aria-expanded', 'false');

      await user.click(trigger1);

      const dialog = await screen.findByRole('dialog');
      const trigger1Controls = trigger1.getAttribute('aria-controls');
      expect(trigger1Controls).not.to.equal(null);
      expect(dialog.getAttribute('id')).to.equal(trigger1Controls);
      await waitFor(() => {
        expect(trigger1).to.have.attribute('aria-expanded', 'true');
      });
      expect(trigger2).to.have.attribute('aria-expanded', 'false');
    });

    it('sets the payload when opening programmatically with a controlled triggerId', async () => {
      function App() {
        const [open, setOpen] = React.useState(false);
        const [triggerId, setTriggerId] = React.useState<string | null>(null);

        return (
          <div>
            <Dialog.Root open={open} triggerId={triggerId}>
              {({ payload }: NumberPayload) => (
                <React.Fragment>
                  <Dialog.Trigger id="trigger-1" payload={1}>
                    One
                  </Dialog.Trigger>
                  <Dialog.Trigger id="trigger-2" payload={2}>
                    Two
                  </Dialog.Trigger>

                  <Dialog.Portal>
                    <Dialog.Popup>
                      <span data-testid="content">{payload}</span>
                    </Dialog.Popup>
                  </Dialog.Portal>
                </React.Fragment>
              )}
            </Dialog.Root>

            <button
              type="button"
              onClick={() => {
                setTriggerId('trigger-2');
                setOpen(true);
              }}
            >
              Open programmatically
            </button>
          </div>
        );
      }

      const { user } = await render(<App />);

      const openButton = screen.getByRole('button', { name: 'Open programmatically' });
      await user.click(openButton);

      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).to.equal('2');
      });
    });

    it('keeps the payload reactive', async () => {
      function App() {
        const [payloads, setPayloads] = React.useState([1, 2]);

        return (
          <div>
            <Dialog.Root>
              {({ payload }: NumberPayload) => (
                <React.Fragment>
                  <Dialog.Trigger id="trigger-1" payload={payloads[0]}>
                    Dialog 1
                  </Dialog.Trigger>
                  <Dialog.Trigger id="trigger-2" payload={payloads[1]}>
                    Dialog 2
                  </Dialog.Trigger>

                  <Dialog.Portal>
                    <Dialog.Popup>
                      <span data-testid="content">{payload}</span>
                      <button type="button" onClick={() => setPayloads([8, 16])}>
                        Update payloads
                      </button>
                    </Dialog.Popup>
                  </Dialog.Portal>
                </React.Fragment>
              )}
            </Dialog.Root>
          </div>
        );
      }

      const { user } = await render(<App />);

      const trigger1 = screen.getByRole('button', { name: 'Dialog 1' });
      await user.click(trigger1);
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).to.equal('1');
      });

      const updateButton = screen.getByRole('button', { name: 'Update payloads' });
      await user.click(updateButton);
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).to.equal('8');
      });
    });
  });

  describe.skipIf(isJSDOM)('multiple detached triggers', () => {
    type NumberPayload = { payload: number | undefined };

    it('opens the dialog with any trigger', async () => {
      const testDialog = Dialog.createHandle();
      const { user } = await render(
        <div>
          <Dialog.Trigger handle={testDialog}>Trigger 1</Dialog.Trigger>
          <Dialog.Trigger handle={testDialog}>Trigger 2</Dialog.Trigger>
          <Dialog.Trigger handle={testDialog}>Trigger 3</Dialog.Trigger>

          <Dialog.Root handle={testDialog}>
            <Dialog.Portal>
              <Dialog.Popup>
                Dialog Content
                <Dialog.Close>Close</Dialog.Close>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </div>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });
      const trigger3 = screen.getByRole('button', { name: 'Trigger 3' });

      expect(screen.queryByText('Dialog Content')).to.equal(null);

      await user.click(trigger1);
      await waitFor(() => {
        expect(screen.queryByText('Dialog Content')).not.to.equal(null);
      });
      await user.click(screen.getByText('Close'));
      await waitFor(() => {
        expect(screen.queryByText('Dialog Content')).to.equal(null);
      });

      await user.click(trigger2);
      await waitFor(() => {
        expect(screen.queryByText('Dialog Content')).not.to.equal(null);
      });
      await user.click(screen.getByText('Close'));
      await waitFor(() => {
        expect(screen.queryByText('Dialog Content')).to.equal(null);
      });

      await user.click(trigger3);
      await waitFor(() => {
        expect(screen.queryByText('Dialog Content')).not.to.equal(null);
      });
    });

    it('sets the payload and renders content based on its value', async () => {
      const testDialog = Dialog.createHandle<number>();
      const { user } = await render(
        <div>
          <Dialog.Trigger handle={testDialog} payload={1}>
            Trigger 1
          </Dialog.Trigger>
          <Dialog.Trigger handle={testDialog} payload={2}>
            Trigger 2
          </Dialog.Trigger>

          <Dialog.Root handle={testDialog}>
            {({ payload }: NumberPayload) => (
              <Dialog.Portal>
                <Dialog.Popup>
                  <span data-testid="content">{payload}</span>
                  <Dialog.Close>Close</Dialog.Close>
                </Dialog.Popup>
              </Dialog.Portal>
            )}
          </Dialog.Root>
        </div>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await user.click(trigger1);
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).to.equal('1');
      });

      await user.click(trigger2);
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).to.equal('2');
      });
    });

    it('reuses the popup DOM node when switching triggers', async () => {
      const testDialog = Dialog.createHandle<number>();
      const { user } = await render(
        <React.Fragment>
          <Dialog.Trigger handle={testDialog} payload={1}>
            Trigger 1
          </Dialog.Trigger>
          <Dialog.Trigger handle={testDialog} payload={2}>
            Trigger 2
          </Dialog.Trigger>

          <Dialog.Root handle={testDialog}>
            {({ payload }: NumberPayload) => (
              <Dialog.Portal>
                <Dialog.Popup data-testid="dialog-popup">
                  <span>{payload}</span>
                </Dialog.Popup>
              </Dialog.Portal>
            )}
          </Dialog.Root>
        </React.Fragment>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await user.click(trigger1);
      const popupElement = screen.getByTestId('dialog-popup');

      await user.click(trigger2);
      expect(screen.getByTestId('dialog-popup')).to.equal(popupElement);
    });

    it('keeps the payload reactive', async () => {
      type NumberAccessorPayload = { payload: (() => number) | undefined };
      const testDialog = Dialog.createHandle<() => number>();
      function Triggers() {
        // Setting up triggers in a separate component so payload is in their local state
        // and updating it does not cause the Dialog.Root to re-render automatically.
        // This verifies that the payload is reactive and not only set on mount or on trigger click.
        const [payloads, setPayloads] = React.useState([1, 2]);

        return (
          <div>
            <Dialog.Trigger id="trigger-1" payload={() => payloads[0]} handle={testDialog}>
              Dialog 1
            </Dialog.Trigger>
            <Dialog.Trigger id="trigger-2" payload={() => payloads[1]} handle={testDialog}>
              Dialog 2
            </Dialog.Trigger>
            <button type="button" onClick={() => setPayloads([8, 16])}>
              Update payloads
            </button>
          </div>
        );
      }

      function App() {
        return (
          <div>
            <Triggers />
            <Dialog.Root modal={false} disablePointerDismissal={true} handle={testDialog}>
              {({ payload }: NumberAccessorPayload) => (
                <Dialog.Portal>
                  <Dialog.Popup>
                    <span data-testid="content">{payload?.()}</span>
                  </Dialog.Popup>
                </Dialog.Portal>
              )}
            </Dialog.Root>
          </div>
        );
      }

      const { user } = await render(<App />);

      const trigger1 = screen.getByRole('button', { name: 'Dialog 1' });
      await user.click(trigger1);
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).to.equal('1');
      });

      const updateButton = screen.getByRole('button', { name: 'Update payloads' });
      await user.click(updateButton);
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).to.equal('8');
      });
    });
  });

  describe('imperative actions on the handle', () => {
    it('opens and closes the dialog', async () => {
      const dialog = Dialog.createHandle();
      await render(
        <div>
          <Dialog.Trigger handle={dialog} id="trigger">
            Trigger
          </Dialog.Trigger>
          <Dialog.Root handle={dialog}>
            <Dialog.Portal>
              <Dialog.Popup data-testid="content">Content</Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </div>,
      );

      const trigger = screen.getByRole('button', { name: 'Trigger' });
      expect(screen.queryByRole('dialog')).to.equal(null);

      await act(() => dialog.open('trigger'));
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.to.equal(null);
      });

      expect(screen.getByTestId('content').textContent).to.equal('Content');
      expect(trigger).to.have.attribute('aria-expanded', 'true');

      await act(() => dialog.close());
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).to.equal(null);
      });

      expect(trigger).to.have.attribute('aria-expanded', 'false');
    });

    it('sets the payload assosiated with the trigger', async () => {
      const dialog = Dialog.createHandle<number>();
      await render(
        <div>
          <Dialog.Trigger handle={dialog} id="trigger1" payload={1}>
            Trigger 1
          </Dialog.Trigger>
          <Dialog.Trigger handle={dialog} id="trigger2" payload={2}>
            Trigger 2
          </Dialog.Trigger>
          <Dialog.Root handle={dialog}>
            {({ payload }: { payload: number | undefined }) => (
              <Dialog.Portal>
                <Dialog.Popup data-testid="content">{payload}</Dialog.Popup>
              </Dialog.Portal>
            )}
          </Dialog.Root>
        </div>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });
      expect(screen.queryByRole('dialog')).to.equal(null);

      await act(() => dialog.open('trigger2'));
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.to.equal(null);
      });

      expect(screen.getByTestId('content').textContent).to.equal('2');
      expect(trigger2).to.have.attribute('aria-expanded', 'true');
      expect(trigger1).not.to.have.attribute('aria-expanded', 'true');

      await act(() => dialog.close());
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).to.equal(null);
      });

      expect(trigger2).to.have.attribute('aria-expanded', 'false');
    });

    it('sets the payload programmatically', async () => {
      const dialog = Dialog.createHandle<number>();
      await render(
        <div>
          <Dialog.Trigger handle={dialog} id="trigger1" payload={1}>
            Trigger 1
          </Dialog.Trigger>
          <Dialog.Trigger handle={dialog} id="trigger2" payload={2}>
            Trigger 2
          </Dialog.Trigger>
          <Dialog.Root handle={dialog}>
            {({ payload }: { payload: number | undefined }) => (
              <Dialog.Portal>
                <Dialog.Popup data-testid="content">{payload}</Dialog.Popup>
              </Dialog.Portal>
            )}
          </Dialog.Root>
        </div>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });
      expect(screen.queryByRole('dialog')).to.equal(null);

      await act(() => dialog.openWithPayload(8));
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.to.equal(null);
      });

      expect(screen.getByTestId('content').textContent).to.equal('8');
      expect(trigger1).not.to.have.attribute('aria-expanded', 'true');
      expect(trigger2).not.to.have.attribute('aria-expanded', 'true');

      await act(() => dialog.close());
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).to.equal(null);
      });
    });
  });

  describe.skipIf(isJSDOM)('pointerdown removal', () => {
    it('moves focus to the popup when a focused child is removed on pointerdown and outside press still dismisses', async () => {
      function Test() {
        const [showButton, setShowButton] = React.useState(true);
        return (
          <Dialog.Root defaultOpen modal="trap-focus">
            <Dialog.Trigger>Open</Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Popup data-testid="popup">
                {showButton && (
                  <button data-testid="remove" onPointerDown={() => setShowButton(false)}>
                    Remove on pointer down
                  </button>
                )}
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        );
      }

      const { user } = await render(<Test />);

      const removeButton = screen.getByTestId('remove');
      await waitFor(() => {
        expect(removeButton).toHaveFocus();
      });
      fireEvent.pointerDown(removeButton);

      const popup = screen.getByTestId('popup');
      await waitFor(() => {
        expect(popup).toHaveFocus();
      });

      await user.click(document.body);

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
