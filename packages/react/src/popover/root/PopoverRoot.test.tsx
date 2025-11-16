import * as React from 'react';
import { Popover } from '@base-ui-components/react/popover';
import { Combobox } from '@base-ui-components/react/combobox';
import { Menu } from '@base-ui-components/react/menu';
import { act, fireEvent, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { spy } from 'sinon';
import { createRenderer, isJSDOM, popupConformanceTests, wait, waitSingleFrame } from '#test-utils';
import { OPEN_DELAY } from '../utils/constants';

describe('<Popover.Root />', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render, clock } = createRenderer();

  popupConformanceTests({
    createComponent: (props) => (
      <Popover.Root {...props.root}>
        <Popover.Trigger {...props.trigger}>Open menu</Popover.Trigger>
        <Popover.Portal {...props.portal}>
          <Popover.Positioner>
            <Popover.Popup {...props.popup}>Content</Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    ),
    render,
    triggerMouseAction: 'click',
    expectedPopupRole: 'dialog',
  });

  it('should render the children', async () => {
    await render(
      <Popover.Root>
        <Popover.Trigger>Content</Popover.Trigger>
      </Popover.Root>,
    );

    expect(screen.getByText('Content')).not.to.equal(null);
  });

  describe('uncontrolled open', () => {
    it('should close when the anchor is clicked twice', async () => {
      await render(
        <Popover.Root>
          <Popover.Trigger />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const anchor = screen.getByRole('button');

      fireEvent.click(anchor);

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);

      fireEvent.click(anchor);

      expect(screen.queryByText('Content')).to.equal(null);
    });
  });

  describe('controlled open', () => {
    it('should call onChange when the open state changes', async () => {
      const handleChange = spy();

      function App() {
        const [open, setOpen] = React.useState(false);

        return (
          <Popover.Root
            open={open}
            onOpenChange={(nextOpen) => {
              handleChange(open);
              setOpen(nextOpen);
            }}
          >
            <Popover.Trigger />
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup>Content</Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        );
      }

      await render(<App />);

      expect(screen.queryByText('Content')).to.equal(null);

      const anchor = screen.getByRole('button');

      fireEvent.click(anchor);

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);

      fireEvent.click(anchor);

      expect(screen.queryByText('Content')).to.equal(null);
      expect(handleChange.callCount).to.equal(2);
      expect(handleChange.firstCall.args[0]).to.equal(false);
      expect(handleChange.secondCall.args[0]).to.equal(true);
    });
  });

  describe('nested menu interactions', () => {
    it('keeps the popover open when a nested menu opens via Enter using a shared container', async () => {
      function Test() {
        const [dialogNode, setDialogNode] = React.useState<HTMLDialogElement | null>(null);
        const handleDialogRef = React.useCallback((node: HTMLDialogElement | null) => {
          if (node) {
            setDialogNode(node);
          }
        }, []);

        return (
          <dialog open ref={handleDialogRef}>
            <Popover.Root>
              <Popover.Trigger>Open</Popover.Trigger>
              <Popover.Portal container={dialogNode ?? undefined}>
                <Popover.Positioner>
                  <Popover.Popup data-testid="popover-popup">
                    <Menu.Root>
                      <Menu.Trigger>Open nested</Menu.Trigger>
                      <Menu.Portal container={dialogNode ?? undefined}>
                        <Menu.Positioner>
                          <Menu.Popup data-testid="menu-popup">Nested Menu</Menu.Popup>
                        </Menu.Positioner>
                      </Menu.Portal>
                    </Menu.Root>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </dialog>
        );
      }

      const { user } = await render(<Test />);

      const popoverTrigger = screen.getByRole('button', { name: 'Open' });

      await act(async () => {
        popoverTrigger.focus();
      });

      await user.keyboard('{Enter}');
      await screen.findByTestId('popover-popup');

      const nestedTrigger = await screen.findByRole('button', { name: 'Open nested' });

      await act(async () => {
        nestedTrigger.focus();
      });

      await user.keyboard('{Enter}');
      await screen.findByTestId('menu-popup');

      expect(screen.getByTestId('popover-popup')).not.to.equal(null);
    });
  });

  describe('prop: defaultOpen', () => {
    it('should open when the component is rendered', async () => {
      await render(
        <Popover.Root defaultOpen>
          <Popover.Trigger />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should not open when the component is rendered and open is controlled', async () => {
      await render(
        <Popover.Root defaultOpen open={false}>
          <Popover.Trigger />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      expect(screen.queryByText('Content')).to.equal(null);
    });

    it('should not close when the component is rendered and open is controlled', async () => {
      await render(
        <Popover.Root defaultOpen open>
          <Popover.Trigger />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should remain uncontrolled', async () => {
      await render(
        <Popover.Root defaultOpen>
          <Popover.Trigger data-testid="trigger" />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      expect(screen.getByText('Content')).not.to.equal(null);

      const anchor = screen.getByTestId('trigger');

      fireEvent.click(anchor);

      expect(screen.queryByText('Content')).to.equal(null);
    });
  });

  describe('prop: delay', () => {
    clock.withFakeTimers();

    it('should open after delay with rest type by default', async () => {
      await render(
        <Popover.Root>
          <Popover.Trigger openOnHover delay={100} />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const anchor = screen.getByRole('button');

      fireEvent.mouseEnter(anchor);
      fireEvent.mouseMove(anchor);

      await flushMicrotasks();

      expect(screen.queryByText('Content')).to.equal(null);

      clock.tick(100);

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);
    });
  });

  describe('prop: closeDelay', () => {
    clock.withFakeTimers();

    it('should close after delay', async () => {
      await render(
        <Popover.Root>
          <Popover.Trigger openOnHover closeDelay={100} />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const anchor = screen.getByRole('button');

      fireEvent.mouseEnter(anchor);
      fireEvent.mouseMove(anchor);

      clock.tick(OPEN_DELAY);

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);

      fireEvent.mouseLeave(anchor);

      clock.tick(50);

      expect(screen.getByText('Content')).not.to.equal(null);

      clock.tick(50);

      expect(screen.queryByText('Content')).to.equal(null);
    });
  });

  describe('BaseUIChangeEventDetails', () => {
    it('onOpenChange cancel() prevents opening while uncontrolled', async () => {
      await render(
        <Popover.Root
          onOpenChange={(nextOpen, eventDetails) => {
            if (nextOpen) {
              eventDetails.cancel();
            }
          }}
        >
          <Popover.Trigger />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);
      await flushMicrotasks();

      expect(screen.queryByText('Content')).to.equal(null);
    });
  });

  describe('focus management', () => {
    it('focuses the trigger after the popover is closed but not unmounted', async () => {
      const { user } = await render(
        <div>
          <input type="text" />
          <Popover.Root>
            <Popover.Trigger>Toggle</Popover.Trigger>
            <Popover.Portal keepMounted>
              <Popover.Positioner>
                <Popover.Popup>
                  <Popover.Close>Close</Popover.Close>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
          <input type="text" />
        </div>,
      );

      const toggle = screen.getByRole('button', { name: 'Toggle' });

      await user.click(toggle);
      await flushMicrotasks();

      const close = screen.getByRole('button', { name: 'Close' });

      await user.click(close);

      await waitFor(
        () => {
          expect(toggle).toHaveFocus();
        },
        { timeout: 1500 },
      );
    });

    it('does not move focus to the popover when opened with hover', async () => {
      const { user } = await render(
        <Popover.Root>
          <Popover.Trigger openOnHover delay={0}>
            Toggle
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>
                <Popover.Close>Close</Popover.Close>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const toggle = screen.getByRole('button', { name: 'Toggle' });

      act(() => toggle.focus());

      await user.hover(toggle);
      await flushMicrotasks();

      const close = screen.getByRole('button', { name: 'Close' });

      expect(close).not.to.equal(null);
      expect(close).not.to.toHaveFocus();
    });

    it('does not change focus when opened with hover and closed', async () => {
      const style = `
        .popup {
          width: 100px;
          height: 100px;
          background-color: red;
          opacity: 1;
          transition: opacity 1ms;
        }

        .popup[data-exiting] {
          opacity: 0;
        }
      `;

      const { user } = await render(
        <div>
          {/* eslint-disable-next-line react/no-danger */}
          <style dangerouslySetInnerHTML={{ __html: style }} />
          <input type="text" data-testid="first-input" />
          <Popover.Root>
            <Popover.Trigger openOnHover delay={0} closeDelay={0}>
              Toggle
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup className="popup" />
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
          <input type="text" data-testid="last-input" />
        </div>,
      );

      const toggle = screen.getByRole('button', { name: 'Toggle' });
      const firstInput = screen.getByTestId('first-input');
      const lastInput = screen.getByTestId('last-input');

      await act(async () => lastInput.focus());

      await user.hover(toggle);
      await flushMicrotasks();

      await user.hover(firstInput);
      await flushMicrotasks();

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).to.equal(null);
      });

      expect(lastInput).toHaveFocus();
    });

    describe('with the popup following immediately the only trigger', () => {
      it('moves focus to the element following the trigger, excluding the popup, when tabbing forward from the open popup', async () => {
        const { user } = await render(
          <div>
            <input />
            <Popover.Root defaultOpen>
              <Popover.Trigger>Toggle</Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup data-testid="popup">
                    <input data-testid="input-inside" />
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
              <input data-testid="focus-target" />
            </Popover.Root>
            <input />
          </div>,
        );

        const inputInside = screen.getByTestId('input-inside');
        await act(async () => inputInside.focus());

        await user.tab();

        expect(screen.getByTestId('focus-target')).toHaveFocus();

        await waitFor(() => {
          expect(screen.queryByTestId('popup')).to.equal(null);
        });
      });

      it.skipIf(isJSDOM)(
        'moves focus to the trigger when tabbing backward from the open popup then to the popup when tabbing forward',
        async () => {
          const { user } = await render(
            <div>
              <input />
              <Popover.Root defaultOpen>
                <Popover.Trigger>Toggle</Popover.Trigger>
                <Popover.Portal>
                  <Popover.Positioner>
                    <Popover.Popup data-testid="popup">
                      <input data-testid="input-inside" />
                    </Popover.Popup>
                  </Popover.Positioner>
                </Popover.Portal>
              </Popover.Root>
              <input />
            </div>,
          );

          const inputInside = screen.getByTestId('input-inside');
          await act(async () => inputInside.focus());

          await wait(50);
          await user.tab({ shift: true });

          await waitFor(() => {
            expect(screen.getByRole('button')).toHaveFocus();
          });

          await waitFor(() => {
            expect(screen.queryByTestId('popup')).toBeVisible();
          });

          await wait(50);
          await user.keyboard('{Tab}');
          await waitFor(() => {
            expect(screen.getByTestId('input-inside')).toHaveFocus();
          });
        },
      );
    });

    describe('with focusable elements between the trigger and the popup', () => {
      it('moves focus to the element following the trigger when tabbing forward from the open popup', async () => {
        const { user } = await render(
          <div>
            <input />
            <Popover.Root defaultOpen>
              <Popover.Trigger>Toggle</Popover.Trigger>
              <input data-testid="focus-target" />
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup data-testid="popup">
                    <input data-testid="input-inside" />
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
            <input />
          </div>,
        );

        const inputInside = screen.getByTestId('input-inside');
        await act(async () => inputInside.focus());

        await user.tab();

        await waitFor(() => {
          expect(screen.getByTestId('focus-target')).toHaveFocus();
        });

        await waitFor(() => {
          expect(screen.queryByTestId('popup')).to.equal(null);
        });
      });

      it.skipIf(isJSDOM)(
        'moves focus to the trigger when tabbing backward from the open popup then to the popup when tabbing forward',
        async () => {
          const { user } = await render(
            <div>
              <input />
              <Popover.Root defaultOpen>
                <Popover.Trigger>Toggle</Popover.Trigger>
                <input />
                <Popover.Portal>
                  <Popover.Positioner>
                    <Popover.Popup data-testid="popup">
                      <input data-testid="input-inside" />
                    </Popover.Popup>
                  </Popover.Positioner>
                </Popover.Portal>
              </Popover.Root>
              <input />
            </div>,
          );

          const inputInside = screen.getByTestId('input-inside');
          await act(async () => inputInside.focus());

          await user.tab({ shift: true });

          await waitFor(() => {
            expect(screen.getByRole('button')).toHaveFocus();
          });

          await waitFor(() => {
            expect(screen.queryByTestId('popup')).toBeVisible();
          });

          await waitSingleFrame();
          await user.keyboard('{Tab}');
          await waitSingleFrame();
          await waitFor(() => {
            expect(screen.getByTestId('input-inside')).toHaveFocus();
          });
        },
      );
    });

    describe('with the popup preceding immediately the only trigger', () => {
      it('moves focus to the element following the trigger, excluding the popup, when tabbing forward from the open popup', async () => {
        const { user } = await render(
          <div>
            <input />
            <Popover.Root defaultOpen>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup data-testid="popup">
                    <input data-testid="input-inside" />
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
              <Popover.Trigger>Toggle</Popover.Trigger>
              <input data-testid="focus-target" />
            </Popover.Root>
            <input />
          </div>,
        );

        const inputInside = screen.getByTestId('input-inside');
        await act(async () => inputInside.focus());

        await user.tab();

        expect(screen.getByTestId('focus-target')).toHaveFocus();

        await waitFor(() => {
          expect(screen.queryByTestId('popup')).to.equal(null);
        });
      });

      it.skipIf(isJSDOM)(
        'moves focus to the trigger when tabbing backward from the open popup then to the popup when tabbing forward',
        async () => {
          const { user } = await render(
            <div>
              <input />
              <Popover.Root defaultOpen>
                <Popover.Portal>
                  <Popover.Positioner>
                    <Popover.Popup data-testid="popup">
                      <input data-testid="input-inside" />
                    </Popover.Popup>
                  </Popover.Positioner>
                </Popover.Portal>
                <Popover.Trigger>Toggle</Popover.Trigger>
              </Popover.Root>
              <input />
            </div>,
          );

          const inputInside = screen.getByTestId('input-inside');
          await act(async () => inputInside.focus());

          await wait(50);
          await user.tab({ shift: true });

          await waitFor(() => {
            expect(screen.getByRole('button')).toHaveFocus();
          });

          await waitFor(() => {
            expect(screen.queryByTestId('popup')).toBeVisible();
          });

          await wait(50);
          await user.keyboard('{Tab}');

          await waitFor(() => {
            expect(screen.getByTestId('input-inside')).toHaveFocus();
          });
        },
      );
    });
  });

  describe('outside press event with backdrops', () => {
    it('uses intentional outside press with user backdrop (mouse): closes on click, not on mousedown', async () => {
      const handleOpenChange = spy();

      await render(
        <Popover.Root defaultOpen onOpenChange={handleOpenChange}>
          <Popover.Trigger />
          <Popover.Portal>
            <Popover.Backdrop data-testid="backdrop" />
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
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
        <Popover.Root defaultOpen onOpenChange={handleOpenChange} modal>
          <Popover.Trigger>Open</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const internalBackdrop = document.querySelector('[role="presentation"]') as HTMLElement;

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

  describe.skipIf(isJSDOM)('pointerdown removal', () => {
    it('moves focus to the popup when a focused child is removed on pointerdown and outside press still dismisses', async () => {
      function Test() {
        const [showButton, setShowButton] = React.useState(true);
        return (
          <Popover.Root defaultOpen modal="trap-focus">
            <Popover.Trigger>Toggle</Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup data-testid="popup">
                  {showButton && (
                    <button data-testid="remove" onPointerDown={() => setShowButton(false)}>
                      Remove on pointer down
                    </button>
                  )}
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
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

  describe('prop: actionsRef', () => {
    it('unmounts the popover when the `unmount` method is called', async () => {
      const actionsRef = {
        current: {
          unmount: spy(),
          close: spy(),
        },
      };

      const { user } = await render(
        <Popover.Root
          actionsRef={actionsRef}
          onOpenChange={(open, details) => {
            details.preventUnmountOnClose();
          }}
        >
          <Popover.Trigger>Open</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
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

    it('closes the popover when the `close` method is called', async () => {
      const actionsRef = React.createRef<Popover.Root.Actions>();
      await render(
        <Popover.Root defaultOpen actionsRef={actionsRef}>
          <Popover.Trigger>Open</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      await act(async () => {
        actionsRef.current!.close();
      });

      await waitFor(() => {
        expect(screen.queryByText('Content')).to.equal(null);
      });
    });
  });

  describe('prop: modal', () => {
    it('should render an internal backdrop when `true`', async () => {
      const { user } = await render(
        <div>
          <Popover.Root modal>
            <Popover.Trigger>Open</Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner data-testid="positioner">
                <Popover.Popup>Content</Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
          <button>Outside</button>
        </div>,
      );

      const trigger = screen.getByRole('button', { name: 'Open' });

      await user.click(trigger);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.to.equal(null);
      });

      const positioner = screen.getByTestId('positioner');

      expect(positioner.previousElementSibling).to.have.attribute('role', 'presentation');
    });

    it('should not render an internal backdrop when `false`', async () => {
      const { user } = await render(
        <div>
          <Popover.Root modal={false}>
            <Popover.Trigger>Open</Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner data-testid="positioner">
                <Popover.Popup>Content</Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
          <button>Outside</button>
        </div>,
      );

      const trigger = screen.getByRole('button', { name: 'Open' });

      await user.click(trigger);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.to.equal(null);
      });

      const positioner = screen.getByTestId('positioner');

      expect(positioner.previousElementSibling).to.equal(null);
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
            <Popover.Root open={open} onOpenChangeComplete={onOpenChangeComplete}>
              <Popover.Trigger>Trigger</Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup data-testid="popup" />
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
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
            <Popover.Root open={open} onOpenChangeComplete={onOpenChangeComplete}>
              <Popover.Trigger>Trigger</Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup className="animation-test-indicator" data-testid="popup" />
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
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
            <Popover.Root open={open} onOpenChangeComplete={onOpenChangeComplete}>
              <Popover.Trigger>Trigger</Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup data-testid="popup" />
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
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
            <Popover.Root
              open={open}
              onOpenChange={(nextOpen) => setOpen(nextOpen)}
              onOpenChangeComplete={onOpenChangeComplete}
            >
              <Popover.Trigger>Trigger</Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup className="animation-test-indicator" data-testid="popup" />
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
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
        <Popover.Root onOpenChangeComplete={onOpenChangeComplete}>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup />
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      expect(onOpenChangeComplete.callCount).to.equal(0);
    });
  });

  it('should close child popover when clicking parent popover', async () => {
    const { user } = await render(
      <Popover.Root>
        <Popover.Trigger data-testid="parent-trigger">parent</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Popup data-testid="parent-popup">
              <Popover.Root>
                <Popover.Trigger data-testid="child-trigger">child</Popover.Trigger>
                <Popover.Portal>
                  <Popover.Positioner>
                    <Popover.Popup data-testid="child-popup" />
                  </Popover.Positioner>
                </Popover.Portal>
              </Popover.Root>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>,
    );

    expect(screen.queryByTestId('parent-popup')).to.equal(null);
    expect(screen.queryByTestId('child-popup')).to.equal(null);

    const parentTrigger = screen.getByTestId('parent-trigger');
    await user.click(parentTrigger);
    await flushMicrotasks();

    const parentPopup = screen.getByTestId('parent-popup');

    expect(parentPopup).not.to.equal(null);
    expect(screen.queryByTestId('child-popup')).to.equal(null);

    const childTrigger = screen.getByTestId('child-trigger');
    await user.click(childTrigger);
    await flushMicrotasks();

    expect(parentPopup).not.to.equal(null);
    expect(screen.getByTestId('child-popup')).not.to.equal(null);

    await user.click(parentPopup);
    await flushMicrotasks();

    expect(screen.queryByTestId('parent-popup')).not.to.equal(null);
    expect(screen.queryByTestId('child-popup')).to.equal(null);
  });

  describe.skipIf(isJSDOM)('multiple triggers within Root', () => {
    type NumberPayload = { payload: number | undefined };

    it('should open the popover with any trigger', async () => {
      const { user } = await render(
        <Popover.Root>
          <Popover.Trigger>Trigger 1</Popover.Trigger>
          <Popover.Trigger>Trigger 2</Popover.Trigger>
          <Popover.Trigger>Trigger 3</Popover.Trigger>

          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>
                Popover Content
                <Popover.Close>Close</Popover.Close>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });
      const trigger3 = screen.getByRole('button', { name: 'Trigger 3' });

      expect(screen.queryByText('Popover Content')).to.equal(null);

      await user.click(trigger1);
      expect(screen.getByText('Popover Content')).toBeVisible();
      await user.click(screen.getByText('Close'));
      expect(screen.queryByText('Popover Content')).to.equal(null);

      await user.click(trigger2);
      expect(screen.getByText('Popover Content')).toBeVisible();
      await user.click(screen.getByText('Close'));
      expect(screen.queryByText('Popover Content')).to.equal(null);

      await user.click(trigger3);
      expect(screen.getByText('Popover Content')).toBeVisible();
      await user.click(screen.getByText('Close'));
      expect(screen.queryByText('Popover Content')).to.equal(null);
    });

    it('should open the popover with any trigger', async () => {
      const { user } = await render(
        <Popover.Root>
          <Popover.Trigger>Trigger 1</Popover.Trigger>
          <Popover.Trigger>Trigger 2</Popover.Trigger>
          <Popover.Trigger>Trigger 3</Popover.Trigger>

          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>
                Popover Content
                <Popover.Close>Close</Popover.Close>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });
      const trigger3 = screen.getByRole('button', { name: 'Trigger 3' });

      expect(screen.queryByText('Popover Content')).to.equal(null);

      await user.click(trigger1);
      expect(screen.getByText('Popover Content')).toBeVisible();
      await user.click(screen.getByText('Close'));
      expect(screen.queryByText('Popover Content')).to.equal(null);

      await user.click(trigger2);
      expect(screen.getByText('Popover Content')).toBeVisible();
      await user.click(screen.getByText('Close'));
      expect(screen.queryByText('Popover Content')).to.equal(null);

      await user.click(trigger3);
      expect(screen.getByText('Popover Content')).toBeVisible();
      await user.click(screen.getByText('Close'));
      expect(screen.queryByText('Popover Content')).to.equal(null);
    });

    it('should set the payload and render content based on its value', async () => {
      const { user } = await render(
        <Popover.Root>
          {({ payload }: NumberPayload) => (
            <React.Fragment>
              <Popover.Trigger payload={1}>Trigger 1</Popover.Trigger>
              <Popover.Trigger payload={2}>Trigger 2</Popover.Trigger>

              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup>
                    <span data-testid="content">{payload}</span>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </React.Fragment>
          )}
        </Popover.Root>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await user.click(trigger1);
      expect(screen.getByTestId('content').textContent).to.equal('1');

      await user.click(trigger2);
      expect(screen.getByTestId('content').textContent).to.equal('2');
    });

    it('should reuse the popup and positioner DOM nodes when switching triggers', async () => {
      const { user } = await render(
        <Popover.Root>
          {({ payload }: NumberPayload) => (
            <React.Fragment>
              <Popover.Trigger payload={1}>Trigger 1</Popover.Trigger>
              <Popover.Trigger payload={2}>Trigger 2</Popover.Trigger>

              <Popover.Portal>
                <Popover.Positioner data-testid="positioner">
                  <Popover.Popup data-testid="popup">
                    <span>{payload}</span>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </React.Fragment>
          )}
        </Popover.Root>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await user.click(trigger1);
      const popupElement = screen.getByTestId('popup');
      const positionerElement = screen.getByTestId('positioner');

      await user.click(trigger2);
      expect(screen.getByTestId('popup')).to.equal(popupElement);
      expect(screen.getByTestId('positioner')).to.equal(positionerElement);
    });

    it('should allow controlling the popover state programmatically', async () => {
      function Test() {
        const [open, setOpen] = React.useState(false);
        const [activeTrigger, setActiveTrigger] = React.useState<string | null>(null);

        return (
          <div>
            <Popover.Root
              open={open}
              triggerId={activeTrigger}
              onOpenChange={(nextOpen, details) => {
                setActiveTrigger(details.trigger?.id ?? null);
                setOpen(nextOpen);
              }}
            >
              {({ payload }: NumberPayload) => (
                <React.Fragment>
                  <Popover.Trigger payload={1} id="trigger-1">
                    Trigger 1
                  </Popover.Trigger>
                  <Popover.Trigger payload={2} id="trigger-2">
                    Trigger 2
                  </Popover.Trigger>

                  <Popover.Portal>
                    <Popover.Positioner>
                      <Popover.Popup>
                        <span data-testid="content">{payload as number}</span>
                      </Popover.Popup>
                    </Popover.Positioner>
                  </Popover.Portal>
                </React.Fragment>
              )}
            </Popover.Root>
            <button
              onClick={() => {
                setOpen(true);
                setActiveTrigger('trigger-1');
              }}
            >
              Open Trigger 1
            </button>
            <button
              onClick={() => {
                setOpen(true);
                setActiveTrigger('trigger-2');
              }}
            >
              Open Trigger 2
            </button>
            <button onClick={() => setOpen(false)}>Close</button>
          </div>
        );
      }

      const { user } = await render(<Test />);
      await user.click(screen.getByRole('button', { name: 'Open Trigger 1' }));
      expect(screen.getByTestId('content').textContent).to.equal('1');
      await user.click(screen.getByRole('button', { name: 'Open Trigger 2' }));
      expect(screen.getByTestId('content').textContent).to.equal('2');
      await user.click(screen.getByRole('button', { name: 'Close' }));
      expect(screen.queryByTestId('content')).to.equal(null);
    });

    it('allows setting an initially open popover', async () => {
      const testPopover = Popover.createHandle<number>();
      await render(
        <Popover.Root handle={testPopover} defaultOpen defaultTriggerId="trigger-2">
          {({ payload }: NumberPayload) => (
            <React.Fragment>
              <Popover.Trigger handle={testPopover} payload={1} id="trigger-1">
                Trigger 1
              </Popover.Trigger>
              <Popover.Trigger handle={testPopover} payload={2} id="trigger-2">
                Trigger 2
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup data-testid="popup">
                    <span>{payload}</span>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </React.Fragment>
          )}
        </Popover.Root>,
      );

      expect(screen.getByTestId('popup').textContent).to.equal('2');
    });
  });

  describe.skipIf(isJSDOM)('multiple detached triggers', () => {
    type NumberPayload = { payload: number | undefined };

    it('should open the popover with any trigger', async () => {
      const testPopover = Popover.createHandle();
      const { user } = await render(
        <div>
          <Popover.Trigger handle={testPopover}>Trigger 1</Popover.Trigger>
          <Popover.Trigger handle={testPopover}>Trigger 2</Popover.Trigger>
          <Popover.Trigger handle={testPopover}>Trigger 3</Popover.Trigger>

          <Popover.Root handle={testPopover}>
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup>
                  Popover Content
                  <Popover.Close>Close</Popover.Close>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        </div>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });
      const trigger3 = screen.getByRole('button', { name: 'Trigger 3' });

      expect(screen.queryByText('Popover Content')).to.equal(null);

      await user.click(trigger1);
      expect(screen.getByText('Popover Content')).toBeVisible();
      await user.click(screen.getByText('Close'));
      expect(screen.queryByText('Popover Content')).to.equal(null);

      await user.click(trigger2);
      expect(screen.getByText('Popover Content')).toBeVisible();
      await user.click(screen.getByText('Close'));
      expect(screen.queryByText('Popover Content')).to.equal(null);

      await user.click(trigger3);
      expect(screen.getByText('Popover Content')).toBeVisible();
      await user.click(screen.getByText('Close'));
      expect(screen.queryByText('Popover Content')).to.equal(null);
    });

    it('should set the payload and render content based on its value', async () => {
      const testPopover = Popover.createHandle<number>();
      const { user } = await render(
        <div>
          <Popover.Trigger handle={testPopover} payload={1}>
            Trigger 1
          </Popover.Trigger>
          <Popover.Trigger handle={testPopover} payload={2}>
            Trigger 2
          </Popover.Trigger>

          <Popover.Root handle={testPopover}>
            {({ payload }: NumberPayload) => (
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup>
                    <span data-testid="content">{payload}</span>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            )}
          </Popover.Root>
        </div>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await user.click(trigger1);
      expect(screen.getByTestId('content').textContent).to.equal('1');

      await user.click(trigger2);
      expect(screen.getByTestId('content').textContent).to.equal('2');
    });

    it('should reuse the popup and positioner DOM nodes when switching triggers', async () => {
      const testPopover = Popover.createHandle<number>();
      const { user } = await render(
        <React.Fragment>
          <Popover.Trigger handle={testPopover} payload={1}>
            Trigger 1
          </Popover.Trigger>
          <Popover.Trigger handle={testPopover} payload={2}>
            Trigger 2
          </Popover.Trigger>

          <Popover.Root handle={testPopover}>
            {({ payload }: NumberPayload) => (
              <Popover.Portal>
                <Popover.Positioner data-testid="positioner">
                  <Popover.Popup data-testid="popup">
                    <span>{payload}</span>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            )}
          </Popover.Root>
        </React.Fragment>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await user.click(trigger1);
      const popupElement = screen.getByTestId('popup');
      const positionerElement = screen.getByTestId('positioner');

      await user.click(trigger2);
      expect(screen.getByTestId('popup')).to.equal(popupElement);
      expect(screen.getByTestId('positioner')).to.equal(positionerElement);
    });

    it('should allow controlling the popover state programmatically', async () => {
      const testPopover = Popover.createHandle<number>();
      function Test() {
        const [open, setOpen] = React.useState(false);
        const [activeTrigger, setActiveTrigger] = React.useState<string | null>(null);

        return (
          <div style={{ margin: 50 }}>
            <Popover.Trigger handle={testPopover} payload={1} id="trigger-1">
              Trigger 1
            </Popover.Trigger>
            <Popover.Trigger handle={testPopover} payload={2} id="trigger-2">
              Trigger 2
            </Popover.Trigger>

            <Popover.Root
              open={open}
              onOpenChange={(nextOpen, details) => {
                setActiveTrigger(details.trigger?.id ?? null);
                setOpen(nextOpen);
              }}
              triggerId={activeTrigger}
              handle={testPopover}
            >
              {({ payload }: NumberPayload) => (
                <Popover.Portal>
                  <Popover.Positioner data-testid="positioner" side="bottom" align="start">
                    <Popover.Popup>
                      <span data-testid="content">{payload}</span>
                    </Popover.Popup>
                  </Popover.Positioner>
                </Popover.Portal>
              )}
            </Popover.Root>

            <button
              onClick={() => {
                setOpen(true);
                setActiveTrigger('trigger-1');
              }}
            >
              Open Trigger 1
            </button>
            <button
              onClick={() => {
                setOpen(true);
                setActiveTrigger('trigger-2');
              }}
            >
              Open Trigger 2
            </button>
            <button onClick={() => setOpen(false)}>Close</button>
          </div>
        );
      }

      const { user } = await render(<Test />);

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await user.click(screen.getByRole('button', { name: 'Open Trigger 1' }));
      expect(screen.getByTestId('content').textContent).to.equal('1');

      await waitFor(() => {
        expect(screen.getByTestId('positioner').getBoundingClientRect().left).to.equal(
          trigger1.getBoundingClientRect().left,
        );
      });

      await user.click(screen.getByRole('button', { name: 'Open Trigger 2' }));
      expect(screen.getByTestId('content').textContent).to.equal('2');
      await waitFor(() => {
        expect(screen.getByTestId('positioner').getBoundingClientRect().left).to.equal(
          trigger2.getBoundingClientRect().left,
        );
      });

      await user.click(screen.getByRole('button', { name: 'Close' }));
      expect(screen.queryByTestId('content')).to.equal(null);
    });

    it('allows setting an initially open popover', async () => {
      const testPopover = Popover.createHandle<number>();
      await render(
        <React.Fragment>
          <Popover.Trigger handle={testPopover} payload={1} id="trigger-1">
            Trigger 1
          </Popover.Trigger>
          <Popover.Trigger handle={testPopover} payload={2} id="trigger-2">
            Trigger 2
          </Popover.Trigger>

          <Popover.Root handle={testPopover} defaultOpen defaultTriggerId="trigger-2">
            {({ payload }: NumberPayload) => (
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup data-testid="popup">
                    <span>{payload}</span>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            )}
          </Popover.Root>
        </React.Fragment>,
      );

      expect(screen.getByTestId('popup').textContent).to.equal('2');
    });
  });

  describe.skipIf(isJSDOM)('imperative actions on the handle', () => {
    it('opens and closes the dialog', async () => {
      const popover = Popover.createHandle();
      await render(
        <div>
          <Popover.Trigger handle={popover} id="trigger">
            Trigger
          </Popover.Trigger>
          <Popover.Root handle={popover}>
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup data-testid="content">Content</Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        </div>,
      );

      const trigger = screen.getByRole('button', { name: 'Trigger' });
      expect(screen.queryByRole('dialog')).to.equal(null);

      await act(() => popover.open('trigger'));
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.to.equal(null);
      });

      expect(screen.getByTestId('content').textContent).to.equal('Content');
      expect(trigger).to.have.attribute('aria-expanded', 'true');

      await act(() => popover.close());
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).to.equal(null);
      });

      expect(trigger).to.have.attribute('aria-expanded', 'false');
    });

    it('sets the payload assosiated with the trigger', async () => {
      const popover = Popover.createHandle<number>();
      await render(
        <div>
          <Popover.Trigger handle={popover} id="trigger1" payload={1}>
            Trigger 1
          </Popover.Trigger>
          <Popover.Trigger handle={popover} id="trigger2" payload={2}>
            Trigger 2
          </Popover.Trigger>
          <Popover.Root handle={popover}>
            {({ payload }: { payload: number | undefined }) => (
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup data-testid="content">{payload}</Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            )}
          </Popover.Root>
        </div>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });
      expect(screen.queryByRole('dialog')).to.equal(null);

      await act(() => popover.open('trigger2'));
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.to.equal(null);
      });

      expect(screen.getByTestId('content').textContent).to.equal('2');
      expect(trigger2).to.have.attribute('aria-expanded', 'true');
      expect(trigger1).not.to.have.attribute('aria-expanded', 'true');

      await act(() => popover.close());
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).to.equal(null);
      });

      expect(trigger2).to.have.attribute('aria-expanded', 'false');
    });
  });

  describe('nested popup interactions', () => {
    it.skipIf(isJSDOM)(
      'should not close popover when scrolling nested popup on touch',
      async () => {
        const fruits = Array.from({ length: 50 }, (_, i) => i);
        await render(
          <Popover.Root defaultOpen>
            <Popover.Trigger>Toggle</Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup data-testid="popover-popup">
                  <Combobox.Root items={fruits} defaultOpen>
                    <Combobox.Input placeholder="Choose a fruit" />
                    <Combobox.Portal>
                      <Combobox.Positioner>
                        <Combobox.Popup
                          data-testid="combobox-popup"
                          style={{ maxHeight: 200, overflow: 'auto' }}
                        >
                          <Combobox.List>
                            {(item: string) => (
                              <Combobox.Item key={item} value={item} style={{ height: 100 }}>
                                {item}
                              </Combobox.Item>
                            )}
                          </Combobox.List>
                        </Combobox.Popup>
                      </Combobox.Positioner>
                    </Combobox.Portal>
                  </Combobox.Root>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>,
        );

        const popoverPopup = screen.getByTestId('popover-popup');
        expect(popoverPopup).not.to.equal(null);

        await flushMicrotasks();

        const comboboxPopup = screen.getByTestId('combobox-popup');
        expect(comboboxPopup).not.to.equal(null);

        // Simulate touch scroll: touchstart + touchmove on the scrollable list
        const touch1 = new Touch({
          identifier: 1,
          target: comboboxPopup,
          clientX: 100,
          clientY: 100,
        });

        fireEvent.touchStart(comboboxPopup, {
          touches: [touch1],
        });

        // Wait for the markInsideReactTree timeout to finish
        await new Promise((resolve) => {
          setTimeout(resolve);
        });

        const touch2 = new Touch({
          identifier: 1,
          target: comboboxPopup,
          clientX: 100,
          clientY: 50,
        });

        fireEvent.touchMove(comboboxPopup, {
          touches: [touch2],
        });

        fireEvent.touchEnd(comboboxPopup, {
          changedTouches: [touch2],
        });

        await flushMicrotasks();

        expect(screen.queryByTestId('popover-popup')).not.to.equal(null);
        expect(screen.queryByTestId('combobox-popup')).not.to.equal(null);
      },
    );
  });
});
