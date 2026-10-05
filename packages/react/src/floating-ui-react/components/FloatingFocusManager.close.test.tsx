import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { beforeAll, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { act, ignoreActWarnings, screen, waitFor } from '@mui/internal-test-utils';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { Dialog } from '@base-ui/react/dialog';
import { Menu } from '@base-ui/react/menu';
import { Popover } from '@base-ui/react/popover';
import { createRenderer, holdExit, isJSDOM, wait } from '#test-utils';

/** Records every element that receives focus from now until the test ends. */
function recordFocusedElements() {
  const focused: Element[] = [];
  function handleFocusIn(event: FocusEvent) {
    focused.push(event.target as Element);
  }
  document.addEventListener('focusin', handleFocusIn, true);
  onTestFinished(() => {
    document.removeEventListener('focusin', handleFocusIn, true);
  });
  return focused;
}

function expectFocusInside(testId: string) {
  expect(screen.getByTestId(testId)).toContainElement(document.activeElement as HTMLElement);
}

function HoverPopover() {
  return (
    <div>
      <input aria-label="Elsewhere" data-testid="elsewhere" />
      <Popover.Root>
        <Popover.Trigger openOnHover delay={0} closeDelay={0}>
          Trigger
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Popup data-testid="popup">
              <button data-testid="inside">Inside</button>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      <div data-testid="away" style={{ height: 100, marginTop: 200 }} />
    </div>
  );
}

async function hoverOpen(user: { hover: (element: Element) => Promise<unknown> }) {
  const trigger = screen.getByRole('button', { name: 'Trigger' });
  await user.hover(trigger);
  await screen.findByTestId('popup');
  return trigger;
}

describe('FloatingFocusManager: focus return at close', () => {
  const { render } = createRenderer();

  type User = Awaited<ReturnType<typeof render>>['user'];

  beforeEach(() => {
    // Exits wait for their animations, as they do in apps.
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
  });

  describe('during the exit animation', () => {
    function TestPopover() {
      return (
        <Popover.Root>
          <Popover.Trigger>Trigger</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner data-testid="positioner">
              <Popover.Popup data-testid="popup">
                <button data-testid="inside">Inside</button>
                <Popover.Close data-testid="close">Close</Popover.Close>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      );
    }

    async function openPopover(user: User) {
      const trigger = screen.getByRole('button', { name: 'Trigger' });
      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByTestId('inside')).toHaveFocus();
      });
      return trigger;
    }

    it('focuses the trigger once when closed with a pointer press on Popover.Close, before the popup unmounts', async () => {
      const exit = holdExit();
      const { user } = await render(<TestPopover />);
      const trigger = await openPopover(user);
      const focusSpy = vi.spyOn(trigger, 'focus');

      await user.click(screen.getByTestId('close'));

      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });
      const popup = screen.getByTestId('popup');
      expect(popup).toHaveAttribute('data-ending-style');
      expect(screen.getByTestId('positioner')).toHaveAttribute('inert');

      await exit.release();
      expect(screen.queryByTestId('popup')).toBe(null);
      expect(trigger).toHaveFocus();
      expect(focusSpy.mock.calls).toEqual([[{ preventScroll: true }]]);
    });
  });

  describe('reopened in the close commit', () => {
    function ReopeningPopover(props: { reopenRef: React.RefObject<boolean> }) {
      const { reopenRef } = props;
      const [handle] = React.useState(() => Popover.createHandle());
      const [open, setOpen] = React.useState(false);

      useIsoLayoutEffect(() => {
        if (open || !reopenRef.current) {
          return;
        }
        reopenRef.current = false;
        handle.open('reopening-trigger');
      }, [open, reopenRef, handle]);

      return (
        <Popover.Root handle={handle} open={open} onOpenChange={setOpen}>
          <Popover.Trigger id="reopening-trigger">Trigger</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup data-testid="popup">
                <button data-testid="inside">Inside</button>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      );
    }

    it('keeps the focus ring of an Escape close when reopened by a handle', async () => {
      const reopenRef: React.RefObject<boolean> = { current: false };
      const { user } = await render(<ReopeningPopover reopenRef={reopenRef} />);
      const trigger = screen.getByRole('button', { name: 'Trigger' });
      await act(async () => trigger.focus());
      await user.keyboard('{Enter}');
      await waitFor(() => {
        expect(screen.getByTestId('inside')).toHaveFocus();
      });
      const focusSpy = vi.spyOn(trigger, 'focus');

      reopenRef.current = true;
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true, focusVisible: true });
      });
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('nested Dialogs closed together', () => {
    function NestedDialogs(props: { childContainer: HTMLElement | undefined }) {
      const [parentOpen, setParentOpen] = React.useState(false);
      const [childOpen, setChildOpen] = React.useState(false);
      return (
        <div>
          <button
            onClick={(event) => {
              // Opens the parent with nothing focused, like an open from a timer or a store.
              event.currentTarget.blur();
              setParentOpen(true);
            }}
          >
            Open parent programmatically
          </button>
          <Dialog.Root open={parentOpen} onOpenChange={setParentOpen}>
            <Dialog.Trigger>Parent trigger</Dialog.Trigger>
            <Dialog.Portal>
              {/* Positioned so each popup stacks above its dialog's backdrop. */}
              <Dialog.Popup
                data-testid="parent-popup"
                style={{ position: 'fixed', top: 40, left: 40 }}
              >
                <Dialog.Root open={childOpen} onOpenChange={setChildOpen}>
                  <Dialog.Trigger>Child trigger</Dialog.Trigger>
                  <Dialog.Portal container={props.childContainer}>
                    <Dialog.Popup
                      data-testid="child-popup"
                      style={{ position: 'fixed', top: 120, left: 120 }}
                    >
                      <button
                        onClick={() => {
                          setChildOpen(false);
                          setParentOpen(false);
                        }}
                      >
                        Close both
                      </button>
                    </Dialog.Popup>
                  </Dialog.Portal>
                </Dialog.Root>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      );
    }

    it.each([
      { container: 'the default container', getContainer: () => undefined },
      { container: 'document.body', getContainer: () => document.body },
    ])(
      'focuses the parent trigger when the child portals into $container',
      async ({ getContainer }) => {
        holdExit();
        const { user } = await render(<NestedDialogs childContainer={getContainer()} />);

        await user.click(screen.getByRole('button', { name: 'Open parent programmatically' }));
        await waitFor(() => expectFocusInside('parent-popup'));
        await user.click(screen.getByRole('button', { name: 'Child trigger' }));
        await waitFor(() => expectFocusInside('child-popup'));

        // The child's own trigger is inside the closing parent, so it can't take focus.
        await user.click(screen.getByRole('button', { name: 'Close both' }));

        await waitFor(() => {
          expect(screen.getByRole('button', { name: 'Parent trigger' })).toHaveFocus();
        });
        expect(screen.getByTestId('parent-popup')).toHaveAttribute('data-ending-style');
      },
    );
  });

  describe('hover-opened Popover', () => {
    it('leaves focus alone on Escape when focus never entered the popup', async () => {
      holdExit();
      const { user } = await render(<HoverPopover />);
      await user.click(screen.getByTestId('elsewhere'));
      await hoverOpen(user);
      const focused = recordFocusedElements();

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.getByTestId('popup')).toHaveAttribute('data-ending-style');
      });
      await wait(50);
      expect(screen.getByTestId('elsewhere')).toHaveFocus();
      expect(focused).toEqual([]);
    });
  });

  // Real presses, hovers and Tab: the browser's own order of focus, pointer and React commits is
  // what's under test.
  describe.skipIf(isJSDOM)('with native input', () => {
    let user: Awaited<typeof import('vitest/browser')>['userEvent'];
    beforeAll(async () => {
      ({ userEvent: user } = await import('vitest/browser'));
    });

    beforeEach(() => {
      ignoreActWarnings();
    });

    describe('outside press', () => {
      beforeEach(() => {
        holdExit();
      });

      interface PopupProps {
        finalFocus: React.RefObject<HTMLButtonElement | null> | undefined;
      }

      // Closes on `pointerdown`, before the press moves focus.
      function SloppyMenu(props: PopupProps) {
        return (
          <Menu.Root modal={false}>
            <Menu.Trigger>Trigger</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup data-testid="popup" finalFocus={props.finalFocus}>
                  <Menu.Item>Item</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        );
      }

      // Closes on `click`, after the press moved focus.
      function IntentionalPopover(props: PopupProps) {
        return (
          <Popover.Root>
            <Popover.Trigger>Trigger</Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup data-testid="popup" finalFocus={props.finalFocus}>
                  <button>Inside</button>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        );
      }

      describe.each([
        { name: 'Menu', Popup: SloppyMenu },
        { name: 'Popover', Popup: IntentionalPopover },
      ])('$name', ({ Popup }) => {
        function TestCase(props: { explicitFinalFocus?: boolean }) {
          const finalFocusRef = React.useRef<HTMLButtonElement>(null);
          return (
            <div>
              <Popup finalFocus={props.explicitFinalFocus ? finalFocusRef : undefined} />
              <button ref={finalFocusRef} data-testid="final-focus">
                Final focus
              </button>
              <div style={{ marginTop: 200 }}>
                <div data-testid="blank" style={{ height: 50 }} />
                <label htmlFor="outside-input" data-testid="label">
                  Outside label
                </label>
                <input id="outside-input" data-testid="input" />
              </div>
            </div>
          );
        }

        async function openPopup() {
          const trigger = screen.getByRole('button', { name: 'Trigger' });
          await user.click(trigger);
          await waitFor(() => expectFocusInside('popup'));
          return trigger;
        }

        // A person holds the button down for a while; the return must wait for the press to land.
        function humanPress(testId: string) {
          return user.click(screen.getByTestId(testId), { delay: 100 });
        }

        it('focuses the trigger after a press on blank space', async () => {
          await render(<TestCase />);
          const trigger = await openPopup();

          await humanPress('blank');

          await waitFor(() => {
            expect(trigger).toHaveFocus();
          });
          expect(screen.getByTestId('popup')).toHaveAttribute('data-ending-style');
        });

        it.each([
          { target: 'an input', testId: 'input' },
          { target: 'a label for an input', testId: 'label' },
        ])('leaves focus on the input after a press on $target', async ({ testId }) => {
          await render(<TestCase />);
          const trigger = await openPopup();
          const focused = recordFocusedElements();

          await humanPress(testId);
          // Give a wrong return time to happen: it would run a task after the release.
          await wait(50);

          expect(screen.getByTestId('input')).toHaveFocus();
          expect(focused).not.toContain(trigger);
          expect(screen.getByTestId('popup')).toHaveAttribute('data-ending-style');
        });

        it('focuses an explicit finalFocus after a press on blank space', async () => {
          await render(<TestCase explicitFinalFocus />);
          const trigger = await openPopup();
          const focused = recordFocusedElements();

          await humanPress('blank');

          await waitFor(() => {
            expect(screen.getByTestId('final-focus')).toHaveFocus();
          });
          expect(focused).not.toContain(trigger);
        });
      });
    });

    describe('controlled closes', () => {
      it('does not reuse a refused close once the user presses inside again', async () => {
        function RefusingPopover(props: { closed?: boolean }) {
          const [open, setOpen] = React.useState(false);
          return (
            <div>
              {/* Refuses every close request; only the `closed` prop closes it. */}
              <Popover.Root
                open={open && !props.closed}
                onOpenChange={(nextOpen) => {
                  if (nextOpen) {
                    setOpen(true);
                  }
                }}
              >
                <Popover.Trigger>Trigger</Popover.Trigger>
                <Popover.Portal>
                  <Popover.Positioner>
                    <Popover.Popup data-testid="popup">
                      <button data-testid="inside">Inside</button>
                    </Popover.Popup>
                  </Popover.Positioner>
                </Popover.Portal>
              </Popover.Root>
              <button data-testid="after">After</button>
            </div>
          );
        }

        const { setProps } = await render(<RefusingPopover />);
        const trigger = screen.getByRole('button', { name: 'Trigger' });
        await user.click(trigger);
        await waitFor(() => {
          expect(screen.getByTestId('inside')).toHaveFocus();
        });

        // A keyboard focus-out close, refused. The focus guards wrap focus back inside.
        await user.tab();
        expect(trigger).toHaveAttribute('aria-expanded', 'true');

        await user.click(screen.getByTestId('inside'));
        const focusSpy = vi.spyOn(trigger, 'focus');
        await setProps({ closed: true });

        await waitFor(() => {
          expect(trigger).toHaveFocus();
        });
        // No focus ring: the refused keyboard close didn't outlive the press.
        expect(focusSpy.mock.calls).toEqual([[{ preventScroll: true }]]);
      });

      it('does not return focus when the consumer defers a hover-leave close', async () => {
        holdExit();
        function DeferringMenu() {
          const [open, setOpen] = React.useState(false);
          const closeTimeout = useTimeout();
          return (
            <div>
              <Menu.Root
                open={open}
                onOpenChange={(nextOpen) => {
                  if (nextOpen) {
                    closeTimeout.clear();
                    setOpen(true);
                  } else {
                    closeTimeout.start(50, () => setOpen(false));
                  }
                }}
              >
                <Menu.Trigger openOnHover delay={0} closeDelay={0}>
                  Trigger
                </Menu.Trigger>
                <Menu.Portal>
                  <Menu.Positioner>
                    <Menu.Popup data-testid="popup">
                      <Menu.Item data-testid="item">Item</Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
              <div data-testid="away" style={{ height: 100, marginTop: 200 }} />
            </div>
          );
        }

        await render(<DeferringMenu />);
        const trigger = screen.getByRole('button', { name: 'Trigger' });
        await user.hover(trigger);
        await user.hover(await screen.findByTestId('item'));
        await waitFor(() => {
          expect(screen.getByTestId('item')).toHaveFocus();
        });
        const focused = recordFocusedElements();

        await user.hover(screen.getByTestId('away'));

        await waitFor(() => {
          expect(screen.getByTestId('popup')).toHaveAttribute('data-ending-style');
        });
        await wait(50);
        expect(focused).not.toContain(trigger);
      });

      it('lets a guard close keep its destination when the consumer flushes it synchronously', async () => {
        holdExit();
        function FlushingPopover() {
          const [open, setOpen] = React.useState(false);
          const finalFocusRef = React.useRef<HTMLButtonElement>(null);
          return (
            <div>
              <button ref={finalFocusRef} data-testid="final-focus">
                Final focus
              </button>
              <button data-testid="before">Before</button>
              <Popover.Root
                open={open}
                onOpenChange={(nextOpen) => {
                  if (nextOpen) {
                    setOpen(true);
                  } else {
                    ReactDOM.flushSync(() => setOpen(false));
                  }
                }}
              >
                <Popover.Trigger>Trigger</Popover.Trigger>
                <Popover.Portal>
                  <Popover.Positioner>
                    <Popover.Popup
                      data-testid="popup"
                      initialFocus={false}
                      finalFocus={finalFocusRef}
                    >
                      <button>Inside</button>
                    </Popover.Popup>
                  </Popover.Positioner>
                </Popover.Portal>
              </Popover.Root>
            </div>
          );
        }

        await render(<FlushingPopover />);
        const trigger = screen.getByRole('button', { name: 'Trigger' });
        await user.click(trigger);
        await screen.findByTestId('popup');
        expect(trigger).toHaveFocus();
        const focused = recordFocusedElements();

        await user.keyboard('{Shift>}{Tab}{/Shift}');

        await waitFor(() => {
          expect(screen.getByTestId('popup')).toHaveAttribute('data-ending-style');
        });
        await wait(50);
        expect(screen.getByTestId('before')).toHaveFocus();
        expect(focused).not.toContain(screen.getByTestId('final-focus'));
      });
    });

    // The popup blocks pointer events until the pointer has crossed into it.
    describe('hover-opened Popover', () => {
      beforeEach(() => {
        holdExit();
      });

      it('focuses the trigger on Escape after the user moved focus inside', async () => {
        await render(<HoverPopover />);
        const trigger = await hoverOpen(user);
        await user.click(screen.getByTestId('inside'));
        expect(screen.getByTestId('inside')).toHaveFocus();

        await user.keyboard('{Escape}');

        await waitFor(() => {
          expect(trigger).toHaveFocus();
        });
        expect(screen.getByTestId('popup')).toHaveAttribute('data-ending-style');
      });

      it('does not focus the trigger when the pointer leaves with focus inside', async () => {
        await render(<HoverPopover />);
        const trigger = await hoverOpen(user);
        await user.click(screen.getByTestId('inside'));
        expect(screen.getByTestId('inside')).toHaveFocus();
        const focused = recordFocusedElements();

        await user.hover(screen.getByTestId('away'));

        await waitFor(() => {
          expect(screen.getByTestId('popup')).toHaveAttribute('data-ending-style');
        });
        await wait(50);
        expect(focused).not.toContain(trigger);
      });
    });
  });
});
