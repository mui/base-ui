import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { act, fireEvent, screen, waitFor, flushMicrotasks } from '@mui/internal-test-utils';
import { Dialog } from '@base-ui/react/dialog';
import { createRenderer, isJSDOM, popupConformanceTests } from '#test-utils';
import { Menu } from '@base-ui/react/menu';
import { Select } from '@base-ui/react/select';
import { NumberField } from '@base-ui/react/number-field';
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

  describe.for([
    { name: 'contained triggers', Component: ContainedTriggerDialog },
    { name: 'detached triggers', Component: DetachedTriggerDialog },
    { name: 'multiple detached triggers', Component: MultipleDetachedTriggersDialog },
  ])('when using $name', ({ Component: TestDialog }) => {
    it('ARIA attributes', async () => {
      await render(
        <TestDialog
          rootProps={{ modal: false, open: true }}
          popupProps={{
            children: (
              <React.Fragment>
                <Dialog.Title>title text</Dialog.Title>
                <Dialog.Description>description text</Dialog.Description>
              </React.Fragment>
            ),
          }}
          includeBackdrop
        />,
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
          <TestDialog rootProps={{ onOpenChange: handleOpenChange }} />,
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
          <TestDialog rootProps={{ onOpenChange: handleOpenChange }} />,
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
          <TestDialog rootProps={{ defaultOpen: true, onOpenChange: handleOpenChange }} />,
        );

        await user.keyboard('[Escape]');

        expect(handleOpenChange.callCount).to.equal(1);
        expect(handleOpenChange.firstCall.args[1].reason).to.equal(REASONS.escapeKey);
      });

      it('calls onOpenChange with the reason for change when user clicks backdrop while the modal dialog is open', async () => {
        const handleOpenChange = spy();

        const { user } = await render(
          <TestDialog rootProps={{ defaultOpen: true, onOpenChange: handleOpenChange }} />,
        );

        await user.click(screen.getByRole('presentation', { hidden: true }));

        expect(handleOpenChange.callCount).to.equal(1);
        expect(handleOpenChange.firstCall.args[1].reason).to.equal(REASONS.outsidePress);
      });

      it('calls onOpenChange with the reason for change when user clicks outside while the non-modal dialog is open', async () => {
        const handleOpenChange = spy();

        const { user } = await render(
          <TestDialog
            rootProps={{ defaultOpen: true, onOpenChange: handleOpenChange, modal: false }}
          />,
        );

        await user.click(document.body);

        expect(handleOpenChange.callCount).to.equal(1);
        expect(handleOpenChange.firstCall.args[1].reason).to.equal(REASONS.outsidePress);
      });

      describe.skipIf(isJSDOM)('clicks on user backdrop', () => {
        it('detects clicks on user backdrop', async () => {
          const handleOpenChange = spy();

          const { user } = await render(
            <TestDialog
              rootProps={{ defaultOpen: true, onOpenChange: handleOpenChange }}
              popupProps={{ style: { position: 'fixed', zIndex: 10 } }}
              includeBackdrop
            />,
          );

          await user.click(screen.getByTestId('backdrop'));

          expect(handleOpenChange.callCount).to.equal(1);
          expect(handleOpenChange.firstCall.args[1].reason).to.equal(REASONS.outsidePress);
        });

        it('does not change open state on non-main button clicks', async () => {
          const handleOpenChange = spy();

          const { user } = await render(
            <TestDialog
              rootProps={{ defaultOpen: true, onOpenChange: handleOpenChange }}
              includeBackdrop
            />,
          );

          const backdrop = screen.getByTestId('backdrop');
          await user.pointer([{ target: backdrop }, { keys: '[MouseRight]', target: backdrop }]);

          expect(handleOpenChange.callCount).to.equal(0);
        });
      });

      it('cancel() prevents opening while uncontrolled', async () => {
        const { user } = await render(
          <TestDialog
            rootProps={{
              onOpenChange: (nextOpen, eventDetails) => {
                if (nextOpen) {
                  eventDetails.cancel();
                }
              },
            }}
          />,
        );

        const openButton = screen.getByText('Open');
        await user.click(openButton);
        await flushMicrotasks();

        expect(screen.queryByRole('dialog')).to.equal(null);
      });
    });

    describe('prop: modal', () => {
      it('makes other interactive elements on the page inert when a modal dialog is open', async () => {
        await render(<TestDialog rootProps={{ defaultOpen: true, modal: true }} />);

        expect(screen.getByRole('presentation', { hidden: true })).not.to.equal(null);
      });

      it('does not make other interactive elements on the page inert when a non-modal dialog is open', async () => {
        await render(<TestDialog rootProps={{ defaultOpen: true, modal: false }} />);

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
              <TestDialog
                rootProps={{
                  defaultOpen: true,
                  onOpenChange: handleOpenChange,
                  disablePointerDismissal,
                  modal: false,
                }}
              />
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
          <TestDialog
            rootProps={{ defaultOpen: true, onOpenChange: handleOpenChange, modal: false }}
            includeBackdrop
          />,
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
          <TestDialog
            rootProps={{ defaultOpen: true, onOpenChange: handleOpenChange, modal: true }}
          />,
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

      it('closing via intentional outside press with user backdrop (modal=true): works when portaled into a shadow DOM', async () => {
        const handleOpenChange = spy();

        const container = document.body.appendChild(document.createElement('div'));
        const shadowRoot = container.attachShadow({ mode: 'open' });

        await render(
          <TestDialog
            rootProps={{ defaultOpen: true, onOpenChange: handleOpenChange, modal: true }}
            portalProps={{ container: shadowRoot }}
            includeBackdrop
          />,
        );

        const backdrop = shadowRoot.querySelector('[data-testid="backdrop"]') as HTMLElement;

        fireEvent.click(backdrop);
        await waitFor(() => {
          expect(shadowRoot.querySelector('[role="dialog"]')).to.equal(null);
        });
        expect(handleOpenChange.callCount).to.equal(1);
      });
    });

    it.skipIf(isJSDOM)('waits for the exit transition to finish before unmounting', async () => {
      const css = `
    .dialog {
      opacity: 0;
      transition: opacity 200ms;
    }
    .dialog[data-open] {
      opacity: 1;
    }
  `;

      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      const notifyTransitionEnd = spy();

      function TransitionTest(props: { open: boolean }) {
        return (
          <React.Fragment>
            {/* eslint-disable-next-line react/no-danger */}
            <style dangerouslySetInnerHTML={{ __html: css }} />
            <TestDialog
              rootProps={{ open: props.open, modal: false }}
              portalProps={{ keepMounted: true }}
              popupProps={{
                className: 'dialog',
                onTransitionEnd: notifyTransitionEnd,
                children: null,
              }}
            />
          </React.Fragment>
        );
      }

      const { setProps } = await render(<TransitionTest open />);

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
            <TestDialog rootProps={{ modal: true }} />
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
            <TestDialog rootProps={{ modal: false }} />
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
            <TestDialog
              triggerProps={{ children: 'Open base' }}
              popupProps={{
                children: <button onClick={() => setOpenNested(true)}>Open nested 1</button>,
              }}
            />
            <TestDialog
              rootProps={{ open: openNested, onOpenChange: setOpenNested }}
              popupProps={{
                children: <button onClick={() => setOpenNested2(true)}>Open nested 2</button>,
              }}
            />
            <TestDialog
              rootProps={{ open: openNested2, onOpenChange: setOpenNested2 }}
              popupProps={{ children: 'Final nested' }}
            />
          </div>
        );
      }

      const { user } = await render(<App />);

      const trigger = screen.getByRole('button', { name: 'Open base' });
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
            <TestDialog
              triggerProps={{ children: 'Open base' }}
              popupProps={
                {
                  'data-testid': 'level-1',
                  children: <button onClick={() => setOpenNested(true)}>Open nested 1</button>,
                } as Dialog.Popup.Props
              }
            />
            <TestDialog
              rootProps={{ open: openNested, onOpenChange: setOpenNested }}
              popupProps={
                {
                  'data-testid': 'level-2',
                  children: <button onClick={() => setOpenNested2(true)}>Open nested 2</button>,
                } as Dialog.Popup.Props
              }
            />
            <TestDialog
              rootProps={{ open: openNested2, onOpenChange: setOpenNested2 }}
              popupProps={
                { 'data-testid': 'level-3', children: 'Final nested' } as Dialog.Popup.Props
              }
            />
          </div>
        );
      }

      await render(<App />);

      const trigger = screen.getByRole('button', { name: 'Open base' });
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
          <TestDialog
            popupProps={{
              children: (
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
              ),
            }}
          />,
        );

        const dialogTrigger = screen.getByRole('button', { name: 'Open' });
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
          <TestDialog
            popupProps={{
              children: (
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
              ),
            }}
          />,
        );

        const dialogTrigger = screen.getByRole('button', { name: 'Open' });
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
                  <TestDialog
                    triggerProps={{ children: 'Open dialog' }}
                    triggerWrapper={(trigger) => (
                      <Menu.Item closeOnClick={false} render={trigger} nativeButton />
                    )}
                  ></TestDialog>
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
          <TestDialog
            rootProps={{
              actionsRef,
              onOpenChange: (open, details) => {
                details.preventUnmountOnClose();
              },
            }}
          />,
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

    describe.skipIf(isJSDOM)('pointerdown removal', () => {
      it('moves focus to the popup when a focused child is removed on pointerdown and outside press still dismisses', async () => {
        function Test() {
          const [showButton, setShowButton] = React.useState(true);
          return (
            <TestDialog
              rootProps={{ defaultOpen: true, modal: 'trap-focus' }}
              popupProps={{
                children: showButton && (
                  <button data-testid="remove" onPointerDown={() => setShowButton(false)}>
                    Remove on pointer down
                  </button>
                ),
              }}
            />
          );
        }

        const { user } = await render(<Test />);

        const removeButton = screen.getByTestId('remove');
        await waitFor(() => {
          expect(removeButton).toHaveFocus();
        });
        fireEvent.pointerDown(removeButton);

        const popup = screen.getByTestId('dialog-popup');
        await waitFor(() => {
          expect(popup).toHaveFocus();
        });

        await user.click(document.body);

        await waitFor(() => {
          expect(screen.queryByRole('dialog')).to.equal(null);
        });
      });

      it('dismisses on first outside click after NumberField scrub interaction (pointer lock path)', async () => {
        const originalRequestPointerLock = Element.prototype.requestPointerLock;
        const requestPointerLockSpy = spy(() => Promise.resolve());

        try {
          Element.prototype.requestPointerLock =
            requestPointerLockSpy as typeof originalRequestPointerLock;

          await render(
            <ContainedTriggerDialog
              rootProps={{ defaultOpen: true, modal: false }}
              popupProps={{
                children: (
                  <NumberField.Root defaultValue={100}>
                    <NumberField.ScrubArea data-testid="scrub-area">
                      <span>Amount</span>
                    </NumberField.ScrubArea>
                    <NumberField.Input aria-label="Amount" />
                  </NumberField.Root>
                ),
              }}
            />,
          );

          const scrubArea = screen.getByTestId('scrub-area');

          fireEvent.pointerDown(scrubArea, { pointerType: 'mouse', button: 0 });
          fireEvent.mouseDown(scrubArea, { button: 0 });
          fireEvent.pointerUp(document.body, { pointerType: 'mouse', button: 0 });
          fireEvent.mouseUp(document.body, { button: 0 });
          await flushMicrotasks();

          fireEvent.click(document.body);

          await waitFor(() => {
            expect(screen.queryByRole('dialog')).to.equal(null);
          });
          expect(requestPointerLockSpy.callCount).to.equal(1);
        } finally {
          Element.prototype.requestPointerLock = originalRequestPointerLock;
        }
      });
    });

    describe.skipIf(isJSDOM)('prop: onOpenChangeComplete', () => {
      it('is called on close when there is no exit animation defined', async () => {
        const onOpenChangeComplete = spy();

        function Test() {
          const [open, setOpen] = React.useState(true);
          return (
            <div>
              <button onClick={() => setOpen(false)}>Close externally</button>
              <TestDialog rootProps={{ open, onOpenChangeComplete }} />
            </div>
          );
        }

        const { user } = await render(<Test />);

        const closeButton = screen.getByText('Close externally');
        await user.click(closeButton);

        await waitFor(() => {
          expect(screen.queryByTestId('dialog-popup')).to.equal(null);
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
              <button onClick={() => setOpen(false)}>Close externally</button>
              <TestDialog
                rootProps={{ open, onOpenChangeComplete }}
                popupProps={{
                  className: 'animation-test-indicator',
                }}
              />
            </div>
          );
        }

        const { user } = await render(<Test />);

        expect(screen.getByTestId('dialog-popup')).not.to.equal(null);

        // Wait for open animation to finish
        await waitFor(() => {
          expect(onOpenChangeComplete.firstCall.args[0]).to.equal(true);
        });

        const closeButton = screen.getByText('Close externally');
        await user.click(closeButton);

        await waitFor(() => {
          expect(screen.queryByTestId('dialog-popup')).to.equal(null);
        });

        expect(onOpenChangeComplete.lastCall.args[0]).to.equal(false);
      });

      it('is called on open when there is no enter animation defined', async () => {
        const onOpenChangeComplete = spy();

        function Test() {
          const [open, setOpen] = React.useState(false);
          return (
            <div>
              <button onClick={() => setOpen(true)}>Open externally</button>
              <TestDialog rootProps={{ open, onOpenChangeComplete }} />
            </div>
          );
        }

        const { user } = await render(<Test />);

        const openButton = screen.getByText('Open externally');
        await user.click(openButton);

        await waitFor(() => {
          expect(screen.queryByTestId('dialog-popup')).not.to.equal(null);
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
              <button onClick={() => setOpen(true)}>Open externally</button>
              <TestDialog
                rootProps={{ open, onOpenChange: setOpen, onOpenChangeComplete }}
                popupProps={{
                  className: 'animation-test-indicator',
                }}
              />
            </div>
          );
        }

        const { user } = await render(<Test />);

        const openButton = screen.getByText('Open externally');
        await user.click(openButton);

        // Wait for open animation to finish
        await waitFor(() => {
          expect(onOpenChangeComplete.firstCall.args[0]).to.equal(true);
        });

        expect(screen.queryByTestId('dialog-popup')).not.to.equal(null);
      });

      it('waits for a restarted enter animation to finish', async () => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

        const onOpenChangeComplete = spy();

        function Test() {
          const style = `
            @keyframes test-enter-a {
              from {
                opacity: 0;
              }
            }

            @keyframes test-enter-b {
              from {
                opacity: 0;
              }
            }

            .animation-test-indicator.animation-a[data-open] {
              animation: test-enter-a 50ms linear;
            }

            .animation-test-indicator.animation-b[data-open] {
              animation: test-enter-b 50ms linear;
            }
          `;

          const [open, setOpen] = React.useState(false);
          const [variant, setVariant] = React.useState<'a' | 'b'>('a');

          return (
            <div>
              {/* eslint-disable-next-line react/no-danger */}
              <style dangerouslySetInnerHTML={{ __html: style }} />
              <button onClick={() => setOpen(true)}>Open externally</button>
              <button onClick={() => setVariant((v) => (v === 'a' ? 'b' : 'a'))}>
                Swap animation
              </button>
              <TestDialog
                rootProps={{ open, onOpenChange: setOpen, onOpenChangeComplete }}
                popupProps={{
                  className: `animation-test-indicator animation-${variant}`,
                }}
              />
            </div>
          );
        }

        const { user } = await render(<Test />);

        const openButton = screen.getByText('Open externally');
        await user.click(openButton);

        const popup = screen.getByTestId('dialog-popup');
        await waitFor(() => {
          expect(popup.getAnimations().length).not.to.equal(0);
        });

        const swapButton = screen.getByText('Swap animation');
        await user.click(swapButton);

        await flushMicrotasks();
        expect(onOpenChangeComplete.callCount).to.equal(0);

        await waitFor(() => {
          expect(onOpenChangeComplete.callCount).to.equal(1);
          expect(onOpenChangeComplete.firstCall.args[0]).to.equal(true);
        });
      });

      it('does not get called on open when dismissed during the enter animation', async () => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

        const onOpenChangeComplete = spy();

        function Test() {
          const style = `
            .animation-test-indicator {
              opacity: 0;
              transition: opacity 200ms linear;
            }

            .animation-test-indicator[data-open] {
              opacity: 1;
            }

            .animation-test-indicator[data-open][data-starting-style] {
              opacity: 0;
            }

            .animation-test-indicator[data-ending-style] {
              opacity: 0;
            }
          `;

          const [open, setOpen] = React.useState(false);

          return (
            <div>
              {/* eslint-disable-next-line react/no-danger */}
              <style dangerouslySetInnerHTML={{ __html: style }} />
              <button onClick={() => setOpen(true)}>Open externally</button>
              <TestDialog
                rootProps={{ open, onOpenChange: setOpen, onOpenChangeComplete }}
                popupProps={{
                  className: 'animation-test-indicator',
                }}
              />
            </div>
          );
        }

        const { user } = await render(<Test />);

        const openButton = screen.getByText('Open externally');
        await user.click(openButton);

        await waitFor(() => {
          expect(screen.queryByTestId('dialog-popup')).not.to.equal(null);
        });

        const popup = screen.getByTestId('dialog-popup');
        await waitFor(() => {
          const animations = popup.getAnimations();
          expect(animations.length).not.to.equal(0);
          expect(animations.some((anim) => anim.playState !== 'finished')).to.equal(true);
        });

        await user.click(document.body);

        await waitFor(() => {
          expect(screen.queryByTestId('dialog-popup')).to.equal(null);
        });

        expect(onOpenChangeComplete.callCount).to.equal(1);
        expect(onOpenChangeComplete.firstCall.args[0]).to.equal(false);
      });

      it('does not get called on mount when not open', async () => {
        const onOpenChangeComplete = spy();

        await render(<TestDialog rootProps={{ onOpenChangeComplete }} />);

        expect(onOpenChangeComplete.callCount).to.equal(0);
      });
    });
  });
});

type TestDialogProps = {
  rootProps?: Omit<Dialog.Root.Props, 'children'>;
  triggerProps?: Dialog.Trigger.Props;
  portalProps?: Dialog.Portal.Props;
  popupProps?: Dialog.Popup.Props;
  omitTrigger?: boolean;
  includeBackdrop?: boolean;
  triggerWrapper?: (trigger: React.ReactElement) => React.ReactElement;
};

function ContainedTriggerDialog(props: TestDialogProps) {
  const {
    rootProps,
    triggerProps,
    portalProps,
    popupProps,
    omitTrigger = false,
    includeBackdrop = false,
    triggerWrapper = (trigger) => trigger,
  } = props;

  const { children: triggerChildren, ...restTriggerProps } = triggerProps ?? {};
  const { children: popupChildren, ...restPopupProps } = popupProps ?? {};
  const { children: portalChildren, ...restPortalProps } = portalProps ?? {};

  return (
    <Dialog.Root {...rootProps}>
      {!omitTrigger
        ? triggerWrapper(
            <Dialog.Trigger data-testid="trigger" {...restTriggerProps}>
              {triggerChildren ?? 'Open'}
            </Dialog.Trigger>,
          )
        : null}
      <Dialog.Portal {...restPortalProps}>
        {portalChildren ?? (
          <React.Fragment>
            {includeBackdrop ? (
              <Dialog.Backdrop
                data-testid="backdrop"
                style={{ position: 'fixed', zIndex: 10, inset: 0 }}
              />
            ) : null}
            <Dialog.Popup
              data-testid="dialog-popup"
              style={{ position: 'fixed', zIndex: 10 }}
              {...restPopupProps}
            >
              {popupChildren ?? (
                <React.Fragment>
                  <p>Dialog content</p>
                  <Dialog.Close>Close</Dialog.Close>
                </React.Fragment>
              )}
            </Dialog.Popup>
          </React.Fragment>
        )}
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DetachedTriggerDialog(props: Omit<TestDialogProps, 'omitTrigger'>) {
  const { triggerProps, triggerWrapper = (trigger) => trigger } = props;

  const { children: triggerChildren, ...restTriggerProps } = triggerProps ?? {};
  const dialogHandle = Dialog.createHandle();

  return (
    <React.Fragment>
      {triggerWrapper(
        <Dialog.Trigger data-testid="trigger" {...restTriggerProps} handle={dialogHandle}>
          {triggerChildren ?? 'Open'}
        </Dialog.Trigger>,
      )}
      <ContainedTriggerDialog
        {...props}
        rootProps={{ ...props.rootProps, handle: dialogHandle }}
        omitTrigger
      />
    </React.Fragment>
  );
}

function MultipleDetachedTriggersDialog(props: Omit<TestDialogProps, 'omitTrigger'>) {
  const { triggerProps, triggerWrapper = (trigger) => trigger } = props;

  const { children: triggerChildren, ...restTriggerProps } = triggerProps ?? {};
  const dialogHandle = Dialog.createHandle();

  return (
    <React.Fragment>
      {triggerWrapper(
        <Dialog.Trigger data-testid="trigger" {...restTriggerProps} handle={dialogHandle}>
          {triggerChildren ?? 'Open'}
        </Dialog.Trigger>,
      )}
      <Dialog.Trigger data-testid="trigger-2" handle={dialogHandle}>
        Open another
      </Dialog.Trigger>
      <ContainedTriggerDialog
        {...props}
        rootProps={{ ...props.rootProps, handle: dialogHandle }}
        omitTrigger
      />
    </React.Fragment>
  );
}
