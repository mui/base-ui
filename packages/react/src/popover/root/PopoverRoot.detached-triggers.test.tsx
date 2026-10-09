import { expect, vi, describe, beforeEach, it } from 'vitest';
import * as React from 'react';
import { createRenderer, detachedTriggersConformanceTests, isJSDOM } from '#test-utils';
import { act, fireEvent, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { Popover } from '@base-ui/react/popover';
import { PATIENT_CLICK_THRESHOLD } from '../../internals/constants';

describe('<Popover.Root />', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render, clock } = createRenderer();

  // Stands in for ref mergers like `@rc-component/util`'s `useComposeRef`, which retain the
  // callback they were first given.
  const StaleRefButton = React.forwardRef<
    HTMLButtonElement,
    React.ComponentPropsWithoutRef<'button'> & { nodeKey?: string }
  >(function StaleRefButton({ nodeKey, ...props }, forwardedRef) {
    const staleRef = React.useRef(forwardedRef).current;
    return <button key={nodeKey} {...props} ref={staleRef} />;
  });

  it('opens by trigger from a descendant layout effect on initial mount', async () => {
    const handle = Popover.createHandle();
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    function OpenOnMount() {
      useIsoLayoutEffect(() => {
        handle.open('trigger');
      }, []);
      return null;
    }

    await render(
      <Popover.Root handle={handle}>
        <Popover.Trigger id="trigger">Trigger</Popover.Trigger>
        <OpenOnMount />
      </Popover.Root>,
    );

    const detachedWarned = consoleWarn.mock.calls.some(
      ([message]) =>
        typeof message === 'string' && message.includes('no root using this handle is mounted'),
    );
    consoleWarn.mockRestore();

    expect(detachedWarned).toBe(false);
    expect(handle.isOpen).toBe(true);
    expect(screen.getByRole('button', { name: 'Trigger' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('hands off hover between detached triggers when the rendered component retains a stale ref', async () => {
    const handle = Popover.createHandle<number>();
    const fallbackStore = handle.store;

    const { user } = await render(
      <React.Fragment>
        {[1, 2].map((payload) => (
          <Popover.Trigger
            key={payload}
            handle={handle}
            id={`trigger-${payload}`}
            payload={payload}
            openOnHover
            delay={0}
            // Forces the handoff path: without a close delay the popup just closes and reopens,
            // which works even when the trigger is registered on the wrong store.
            closeDelay={100}
            render={<StaleRefButton />}
          >
            Trigger {payload}
          </Popover.Trigger>
        ))}
        <Popover.Root handle={handle}>
          {({ payload }) => (
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup data-testid="popup">{payload}</Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          )}
        </Popover.Root>
      </React.Fragment>,
    );

    expect(fallbackStore.context.triggerElements.size).toBe(0);
    expect(handle.store.context.triggerElements.size).toBe(2);

    await user.hover(screen.getByRole('button', { name: 'Trigger 1' }));
    await waitFor(() => {
      expect(screen.getByTestId('popup')).toHaveTextContent('1');
    });

    await user.hover(screen.getByRole('button', { name: 'Trigger 2' }));
    await waitFor(() => {
      expect(screen.getByTestId('popup')).toHaveTextContent('2');
    });
  });

  it('keeps registration on the attached store when a stale-ref component swaps its host node', async () => {
    const handle = Popover.createHandle<number>();
    const fallbackStore = handle.store;

    function App() {
      const [nodeKey, setNodeKey] = React.useState('a');
      return (
        <React.Fragment>
          <button type="button" onClick={() => setNodeKey('b')}>
            Swap node
          </button>
          <Popover.Trigger
            handle={handle}
            id="trigger"
            payload={1}
            render={<StaleRefButton nodeKey={nodeKey} />}
          >
            Trigger
          </Popover.Trigger>
          <Popover.Root handle={handle}>
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup data-testid="popup">Content</Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        </React.Fragment>
      );
    }

    const { user } = await render(<App />);

    const initialTrigger = screen.getByRole('button', { name: 'Trigger' });
    expect(fallbackStore.context.triggerElements.size).toBe(0);
    expect(handle.store.context.triggerElements.getById('trigger')).toBe(initialTrigger);

    // Replacing the host node re-fires the retained ref callback after the migration.
    await user.click(screen.getByRole('button', { name: 'Swap node' }));

    const swappedTrigger = screen.getByRole('button', { name: 'Trigger' });
    // Guards the setup: without a real host swap the rest of the test proves nothing.
    expect(swappedTrigger).not.toBe(initialTrigger);
    expect(initialTrigger.isConnected).toBe(false);
    expect(fallbackStore.context.triggerElements.size).toBe(0);
    expect(handle.store.context.triggerElements.getById('trigger')).toBe(swappedTrigger);

    // `open()` searches attached stores first, so a registration left on the wrong store would
    // anchor the popup to the removed node.
    await act(async () => {
      handle.open('trigger');
    });

    await waitFor(() => {
      expect(screen.getByTestId('popup')).toBeVisible();
    });
    expect(handle.store.state.activeTriggerElement).toBe(swappedTrigger);
  });

  it('does not detach the consumer ref when the handle attaches to a root', async () => {
    const handle = Popover.createHandle();
    const refCalls: (Element | null)[] = [];

    await render(
      <React.Fragment>
        <Popover.Trigger
          handle={handle}
          id="trigger"
          ref={(element: HTMLElement | null) => {
            refCalls.push(element);
          }}
        >
          Trigger
        </Popover.Trigger>
        <Popover.Root handle={handle}>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </React.Fragment>,
      // Strict Mode replays the ref on its own, which would mask a migration-driven detach.
      { strict: false },
    );

    expect(handle.store.context.triggerElements.getById('trigger')).toBe(
      screen.getByRole('button', { name: 'Trigger' }),
    );
    // Migrating from the fallback store to the root's store must not churn the merged ref, which
    // would hand the consumer a spurious `null` and back.
    expect(refCalls).toEqual([screen.getByRole('button', { name: 'Trigger' })]);
  });

  detachedTriggersConformanceTests({
    render,
    createHandle: Popover.createHandle,
    Root: Popover.Root,
    Trigger: Popover.Trigger,
    Portal: Popover.Portal,
    Positioner: Popover.Positioner,
    Popup: Popover.Popup,
    Viewport: Popover.Viewport,
    Close: Popover.Close,
    openInteractions: ['click'],
    ariaExpanded: true,
    throwOnMissingTrigger: true,
    closesOnActiveTriggerUnmount: false,
  });

  describe('does not re-render inactive triggers', () => {
    async function renderPopover({
      rootProps,
      triggerProps,
      popupChildren,
    }: {
      rootProps?: Popover.Root.Props;
      triggerProps?: Popover.Trigger.Props;
      popupChildren?: React.ReactNode;
    } = {}) {
      const handle = Popover.createHandle();
      const inactiveTrigger = { renders: 0 };

      const { user } = await render(
        <div>
          <Popover.Trigger handle={handle} id="trigger-1" {...triggerProps}>
            Trigger 1
          </Popover.Trigger>
          <Popover.Trigger handle={handle} id="trigger-2" {...triggerProps}>
            Trigger 2
          </Popover.Trigger>
          <Popover.Trigger
            handle={handle}
            id="trigger-3"
            {...triggerProps}
            render={(props) => {
              inactiveTrigger.renders += 1;
              return <button {...props} />;
            }}
          >
            Trigger 3
          </Popover.Trigger>
          <Popover.Root handle={handle} {...rootProps}>
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup data-testid="popup">
                  Content
                  {popupChildren}
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        </div>,
      );

      inactiveTrigger.renders = 0;
      return {
        user,
        handle,
        inactiveTrigger,
        trigger: screen.getByRole('button', { name: 'Trigger 1' }),
        trigger2: screen.getByRole('button', { name: 'Trigger 2' }),
      };
    }

    async function expectOpenedBy(trigger: HTMLElement) {
      expect(await screen.findByTestId('popup')).not.toBe(null);
      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });
    }

    async function expectClosed(trigger: HTMLElement) {
      await waitFor(() => {
        expect(screen.queryByTestId('popup')).toBe(null);
      });
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    }

    it('when a click opens and closes the popup', async () => {
      const { user, inactiveTrigger, trigger } = await renderPopover();

      async function openAndClose() {
        await user.click(trigger);
        await expectOpenedBy(trigger);
        await user.click(trigger);
        await expectClosed(trigger);
      }

      await openAndClose();
      await openAndClose();

      expect(inactiveTrigger.renders).toBe(0);
    });

    it('when a touch press opens and closes the popup', async () => {
      const { user, inactiveTrigger, trigger } = await renderPopover();

      async function openAndClose() {
        await user.pointer({ keys: '[TouchA]', target: trigger });
        await expectOpenedBy(trigger);
        await user.pointer({ keys: '[TouchA]', target: trigger });
        await expectClosed(trigger);
      }

      await openAndClose();
      await openAndClose();

      expect(inactiveTrigger.renders).toBe(0);
    });

    it('when a modal popup closes from Popover.Close', async () => {
      const { user, inactiveTrigger, trigger } = await renderPopover({
        rootProps: { modal: true },
        popupChildren: <Popover.Close>Close</Popover.Close>,
      });

      async function openAndClose() {
        await user.click(trigger);
        await expectOpenedBy(trigger);
        await user.click(screen.getByRole('button', { name: 'Close' }));
        await expectClosed(trigger);
      }

      await openAndClose();
      await openAndClose();

      expect(inactiveTrigger.renders).toBe(0);
    });

    it('when the popup moves to another trigger', async () => {
      const { user, inactiveTrigger, trigger, trigger2 } = await renderPopover();

      await user.click(trigger);
      await expectOpenedBy(trigger);
      await user.click(trigger2);
      await expectOpenedBy(trigger2);
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).not.toHaveAttribute('data-pressed');
      expect(trigger2).toHaveAttribute('data-pressed');
      expect(trigger.previousElementSibling).toBe(null);
      expect(trigger2.previousElementSibling).toHaveAttribute('data-base-ui-focus-guard');
      expect(trigger2.nextElementSibling).toHaveAttribute('data-base-ui-focus-guard');
      await user.click(trigger2);
      await expectClosed(trigger2);

      expect(inactiveTrigger.renders).toBe(0);
    });

    describe('with openOnHover', () => {
      clock.withFakeTimers();

      it('when a hover opens the popup', async () => {
        const { handle, inactiveTrigger, trigger } = await renderPopover({
          triggerProps: { openOnHover: true, delay: 0, closeDelay: 0 },
        });

        async function openAndClose() {
          fireEvent.mouseEnter(trigger);
          fireEvent.mouseMove(trigger);
          await flushMicrotasks();
          expect(screen.queryByTestId('popup')).not.toBe(null);
          expect(trigger).toHaveAttribute('aria-expanded', 'true');

          // Covers the patient-click window ending while open.
          clock.tick(PATIENT_CLICK_THRESHOLD);
          fireEvent.mouseLeave(trigger);
          await act(() => handle.close());
          await flushMicrotasks();
          expect(screen.queryByTestId('popup')).toBe(null);
          expect(trigger).toHaveAttribute('aria-expanded', 'false');
        }

        await openAndClose();
        await openAndClose();

        expect(inactiveTrigger.renders).toBe(0);
      });

      it('when a press takes over a hover-opened popup', async () => {
        const { handle, inactiveTrigger, trigger } = await renderPopover({
          triggerProps: { openOnHover: true, delay: 0, closeDelay: 0 },
        });

        fireEvent.mouseEnter(trigger);
        fireEvent.mouseMove(trigger);
        await flushMicrotasks();
        expect(screen.queryByTestId('popup')).not.toBe(null);

        // A press inside the patient-click window keeps it open and changes the open reason.
        fireEvent.click(trigger);
        await flushMicrotasks();
        expect(trigger).toHaveAttribute('data-pressed');

        fireEvent.mouseLeave(trigger);
        await act(() => handle.close());
        await flushMicrotasks();
        expect(screen.queryByTestId('popup')).toBe(null);

        expect(inactiveTrigger.renders).toBe(0);
      });
    });
  });

  describe('after a prop-only reopen', () => {
    clock.withFakeTimers();

    it('keeps the popup open when the last hovered trigger is pressed', async () => {
      const handle = Popover.createHandle();
      let setOpen: (open: boolean) => void = () => {};

      function App() {
        const [open, setOpenState] = React.useState(false);
        setOpen = setOpenState;
        return (
          <div>
            <Popover.Trigger handle={handle} id="trigger-1" openOnHover delay={0}>
              Trigger 1
            </Popover.Trigger>
            <Popover.Trigger handle={handle} id="trigger-2">
              Trigger 2
            </Popover.Trigger>
            <Popover.Root handle={handle} open={open} onOpenChange={setOpenState}>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup data-testid="popup">Content</Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </div>
        );
      }

      await render(<App />);
      const trigger = screen.getByRole('button', { name: 'Trigger 1' });

      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);
      await flushMicrotasks();
      expect(screen.queryByTestId('popup')).not.toBe(null);
      // End the hover's patient-click window so only the close-time reset keeps the click sticky.
      clock.tick(PATIENT_CLICK_THRESHOLD);

      await act(async () => setOpen(false));
      await flushMicrotasks();
      expect(screen.queryByTestId('popup')).toBe(null);

      await act(async () => setOpen(true));
      await flushMicrotasks();
      expect(screen.queryByTestId('popup')).not.toBe(null);

      fireEvent.click(trigger);
      await flushMicrotasks();
      expect(screen.queryByTestId('popup')).not.toBe(null);
    });
  });

  it('dismisses a keyboard-reopened popup on a virtual outside click after a touch session', async () => {
    const handle = Popover.createHandle();
    const { user } = await render(
      <React.Fragment>
        <button>Outside</button>
        <Popover.Trigger handle={handle} id="trigger">
          Trigger
        </Popover.Trigger>
        <Popover.Root handle={handle}>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup data-testid="popup">Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </React.Fragment>,
    );

    const trigger = screen.getByRole('button', { name: 'Trigger' });
    await user.click(trigger);
    const popup = await screen.findByTestId('popup');

    fireEvent.pointerDown(popup, { pointerType: 'touch', button: 0 });
    fireEvent.pointerUp(popup, { pointerType: 'touch', button: 0 });
    fireEvent.click(popup);
    await user.keyboard('[Escape]');
    await waitFor(() => {
      expect(screen.queryByTestId('popup')).toBe(null);
    });

    await act(async () => trigger.focus());
    await user.keyboard('[Enter]');
    await screen.findByTestId('popup');

    // Virtual clicks have no pointerdown to replace the previous session's touch type.
    fireEvent.click(screen.getByRole('button', { name: 'Outside' }), { detail: 0 });
    await waitFor(() => {
      expect(screen.queryByTestId('popup')).toBe(null);
    });
  });

  describe.skipIf(isJSDOM)('multiple triggers within Root', () => {
    it('returns focus to the active trigger when opening programmatically from body focus', async () => {
      function Test() {
        const [open, setOpen] = React.useState(false);
        const [activeTrigger, setActiveTrigger] = React.useState<string | null>(null);

        return (
          <React.Fragment>
            <Popover.Root
              open={open}
              triggerId={activeTrigger}
              onOpenChange={(nextOpen, details) => {
                setActiveTrigger(details.trigger?.id ?? null);
                setOpen(nextOpen);
              }}
            >
              <Popover.Trigger payload={1} id="trigger-1">
                Trigger 1
              </Popover.Trigger>
              <Popover.Trigger payload={2} id="trigger-2">
                Trigger 2
              </Popover.Trigger>

              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup>
                    <span data-testid="content">Content</span>
                    <Popover.Close>Close</Popover.Close>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>

            <button
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setOpen(true);
                setActiveTrigger('trigger-2');
              }}
            >
              Open Trigger 2 without focus
            </button>
          </React.Fragment>
        );
      }

      const { user } = await render(<Test />);

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await user.click(trigger1);
      await user.click(screen.getByRole('button', { name: 'Close' }));
      await waitFor(() => {
        expect(trigger1).toHaveFocus();
      });

      trigger1.blur();
      expect(document.body).toHaveFocus();

      await user.click(screen.getByRole('button', { name: 'Open Trigger 2 without focus' }));
      await waitFor(() => {
        expect(screen.getByTestId('content')).toBeVisible();
      });

      await user.click(screen.getByRole('button', { name: 'Close' }));
      await waitFor(() => {
        expect(trigger2).toHaveFocus();
      });
    });

    it('returns focus to the previous element when the trigger unmounts while open', async () => {
      function Test() {
        const [open, setOpen] = React.useState(false);
        const [showTrigger, setShowTrigger] = React.useState(true);

        return (
          <React.Fragment>
            <button type="button">Focus fallback</button>

            <Popover.Root
              open={open}
              onOpenChange={(nextOpen) => {
                if (nextOpen) {
                  setShowTrigger(false);
                }
                setOpen(nextOpen);
              }}
            >
              {showTrigger && (
                <Popover.Trigger onMouseDown={(event) => event.preventDefault()}>
                  Disappearing trigger
                </Popover.Trigger>
              )}

              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup>
                    <span data-testid="content">Content</span>
                    <Popover.Close>Close</Popover.Close>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </React.Fragment>
        );
      }

      const { user } = await render(<Test />);

      const fallback = screen.getByRole('button', { name: 'Focus fallback' });
      await user.click(fallback);
      expect(fallback).toHaveFocus();

      await user.click(screen.getByRole('button', { name: 'Disappearing trigger' }));
      await waitFor(() => {
        expect(screen.getByTestId('content')).toBeVisible();
      });

      await user.click(screen.getByRole('button', { name: 'Close' }));
      await waitFor(() => {
        expect(screen.queryByTestId('content')).toBe(null);
      });
      expect(fallback).toHaveFocus();
    });
  });

  describe.skipIf(isJSDOM)('multiple detached triggers', () => {
    type NumberPayload = { payload: number | undefined };

    /**
     * Renders two detached hover triggers with a real position transition on the
     * positioner and a real exit transition on the popup, then hands the popover
     * off from trigger 1 to trigger 2 so `instantType` is `trigger-change`.
     *
     * `instantsWhileEnding` records the `instant` state of every closing render,
     * which is the only way to observe a stale value that a later render clears
     * before the DOM can be asserted on.
     */
    async function renderHoverDetachedTriggers({
      popupChildren,
      settleTriggerChange = true,
      switchDuration = 120,
      exitDuration = 250,
    }: {
      popupChildren?: React.ReactNode;
      /**
       * Set to `false` to return while the positioner is still animating to the
       * new trigger, so the delayed `trigger-change` restoration is still pending.
       */
      settleTriggerChange?: boolean;
      /** How long the positioner takes to move to the new trigger. */
      switchDuration?: number;
      /** How long the popup takes to fade out. */
      exitDuration?: number;
    } = {}) {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      const testPopover = Popover.createHandle<number>();
      const instantsWhileEnding: (string | undefined)[] = [];

      const utils = await render(
        <div style={{ position: 'relative', width: 400, height: 200 }}>
          <style>
            {`
              .positioner {
                transition:
                  top ${switchDuration}ms linear,
                  left ${switchDuration}ms linear,
                  transform ${switchDuration}ms linear;
              }

              .popup {
                opacity: 1;
                transition: opacity ${exitDuration}ms linear;
              }

              .popup[data-ending-style] {
                opacity: 0;
              }

              .positioner[data-instant],
              .popup[data-instant] {
                transition: none;
              }
            `}
          </style>

          <Popover.Trigger
            handle={testPopover}
            payload={1}
            openOnHover
            delay={0}
            style={{ position: 'absolute', top: 20, left: 20 }}
          >
            Trigger 1
          </Popover.Trigger>
          <Popover.Trigger
            handle={testPopover}
            payload={2}
            openOnHover
            delay={0}
            style={{ position: 'absolute', top: 20, left: 220 }}
          >
            Trigger 2
          </Popover.Trigger>

          <Popover.Root handle={testPopover}>
            {({ payload }: NumberPayload) => (
              <Popover.Portal>
                <Popover.Positioner data-testid="positioner" className="positioner">
                  <Popover.Popup
                    data-testid="popup"
                    className="popup"
                    render={(props, state) => {
                      if (state.transitionStatus === 'ending') {
                        instantsWhileEnding.push(state.instant);
                      }
                      return <div {...props} />;
                    }}
                  >
                    <span data-testid="content">{payload}</span>
                    {popupChildren}
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            )}
          </Popover.Root>
        </div>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await utils.user.hover(trigger1);
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).toBe('1');
      });

      await utils.user.hover(trigger2);
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).toBe('2');
      });

      if (settleTriggerChange) {
        await waitFor(() => {
          expect(screen.getByTestId('popup')).toHaveAttribute('data-instant', 'trigger-change');
        });
      }

      // The handoff itself legitimately renders `trigger-change` while closing
      // the previous trigger's popup. Only the close that follows matters.
      instantsWhileEnding.length = 0;

      return {
        ...utils,
        trigger1,
        trigger2,
        instantsWhileEnding,
        popup: screen.getByTestId('popup'),
      };
    }

    it('does not apply the trigger-change instant to a hover close after switching triggers', async () => {
      const { user, trigger2, popup, instantsWhileEnding } = await renderHoverDetachedTriggers();

      await user.unhover(trigger2);
      await waitFor(() => {
        expect(popup).toHaveAttribute('data-ending-style');
      });

      expect(instantsWhileEnding).not.toContain('trigger-change');
    });

    it('does not apply the trigger-change instant to a non-hover close after switching triggers', async () => {
      const { popup, instantsWhileEnding } = await renderHoverDetachedTriggers({
        popupChildren: <Popover.Close>Close</Popover.Close>,
      });

      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      await waitFor(() => {
        expect(popup).toHaveAttribute('data-ending-style');
      });

      expect(instantsWhileEnding).not.toContain('trigger-change');
    });

    it('does not apply the trigger-change instant after switching back to the original trigger', async () => {
      const { user, trigger1, instantsWhileEnding } = await renderHoverDetachedTriggers();

      await user.hover(trigger1);
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).toBe('1');
      });
      await waitFor(() => {
        expect(screen.getByTestId('popup')).toHaveAttribute('data-instant', 'trigger-change');
      });
      instantsWhileEnding.length = 0;

      await user.unhover(trigger1);
      await waitFor(() => {
        expect(screen.getByTestId('popup')).toHaveAttribute('data-ending-style');
      });

      expect(instantsWhileEnding).not.toContain('trigger-change');
    });

    it('does not restore the trigger-change instant after a reopen on the same trigger', async () => {
      // Leaving and returning mid-exit keeps the positioner mounted and the
      // trigger unchanged, so nothing re-runs the effect to cancel the pending
      // switch callback. A slow switch keeps it pending across the reopen.
      const { user, trigger2 } = await renderHoverDetachedTriggers({
        settleTriggerChange: false,
        switchDuration: 500,
        exitDuration: 400,
      });

      await user.unhover(trigger2);
      await waitFor(() => {
        expect(screen.getByTestId('popup')).toHaveAttribute('data-ending-style');
      });

      await user.hover(trigger2);
      await waitFor(() => {
        expect(screen.getByTestId('popup')).not.toHaveAttribute('data-ending-style');
      });

      const reopenedPopup = screen.getByTestId('popup');
      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 650);
        });
      });

      expect(reopenedPopup).not.toHaveAttribute('data-instant');
    });

    it('does not apply the trigger-change instant to a prop-driven close after a switch', async () => {
      // A controlled consumer can switch triggers and close entirely through
      // props, so neither transition passes through `setOpen`.
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      const endingInstants: (string | undefined)[] = [];
      const controls: { setOpen?: (v: boolean) => void; setTriggerId?: (v: string) => void } = {};

      function Test() {
        const [open, setOpen] = React.useState(false);
        const [triggerId, setTriggerId] = React.useState<string | null>(null);
        controls.setOpen = setOpen;
        controls.setTriggerId = setTriggerId;

        return (
          <div style={{ position: 'relative', width: 400, height: 240 }}>
            <style>
              {`
                .positioner {
                  transition:
                    top 300ms linear,
                    left 300ms linear,
                    transform 300ms linear;
                }

                .popup {
                  opacity: 1;
                  transition: opacity 400ms linear;
                }

                .popup[data-ending-style] {
                  opacity: 0;
                }

                .positioner[data-instant],
                .popup[data-instant] {
                  transition: none;
                }
              `}
            </style>

            <Popover.Root
              open={open}
              triggerId={triggerId}
              onOpenChange={(nextOpen, details) => {
                if (nextOpen) {
                  setTriggerId(details.trigger?.id ?? null);
                }
                setOpen(nextOpen);
              }}
            >
              <Popover.Trigger id="t1" style={{ position: 'absolute', top: 80, left: 20 }}>
                Trigger 1
              </Popover.Trigger>
              <Popover.Trigger id="t2" style={{ position: 'absolute', top: 80, left: 220 }}>
                Trigger 2
              </Popover.Trigger>

              <Popover.Portal>
                <Popover.Positioner data-testid="positioner" className="positioner">
                  <Popover.Popup
                    data-testid="popup"
                    className="popup"
                    render={(props, state) => {
                      if (state.transitionStatus === 'ending') {
                        endingInstants.push(state.instant);
                      }
                      return <div {...props} />;
                    }}
                  >
                    Content
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </div>
        );
      }

      const { user } = await render(<Test />);

      await user.click(screen.getByRole('button', { name: 'Trigger 1' }));
      await waitFor(() => {
        expect(screen.queryByTestId('popup')).not.toBe(null);
      });
      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
      });

      await act(async () => {
        controls.setTriggerId!('t2');
      });
      await waitFor(() => {
        expect(screen.getByTestId('popup')).toHaveAttribute('data-instant', 'trigger-change');
      });

      endingInstants.length = 0;
      await act(async () => {
        controls.setOpen!(false);
      });
      await waitFor(
        () => {
          expect(endingInstants.length).toBeGreaterThan(0);
        },
        { timeout: 2000 },
      );

      expect(endingInstants).not.toContain('trigger-change');

      // Reopening on the same trigger, again purely through props, must not
      // inherit the `trigger-change` the earlier switch had stored.
      await waitFor(() => {
        expect(screen.queryByTestId('popup')).toBe(null);
      });

      await act(async () => {
        controls.setOpen!(true);
      });
      await waitFor(() => {
        expect(screen.queryByTestId('popup')).not.toBe(null);
      });

      expect(screen.getByTestId('popup')).not.toHaveAttribute('data-instant');
    });

    it('does not restore the trigger-change instant when a controlled close commits late', async () => {
      // A controlled consumer can accept the close but commit `open={false}`
      // later. That commit goes straight through the prop without passing back
      // through `setOpen`, so a `trigger-change` restored in the meantime would
      // never be cleared and would collapse the exit transition.
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      const instantsWhileEnding: (string | undefined)[] = [];
      // Renders between the close request and its late commit. The restoration
      // has to land in this window, or the test isn't exercising the race.
      const instantsWhileClosePending: (string | undefined)[] = [];
      const openedTriggerIds: (string | undefined)[] = [];
      let closeRequested = false;
      const switchDuration = 200;
      const commitDelay = 400;

      function Test() {
        const [open, setOpen] = React.useState(false);
        const [activeTrigger, setActiveTrigger] = React.useState<string | null>(null);

        return (
          <div style={{ position: 'relative', width: 400, height: 200 }}>
            <style>
              {`
                .positioner {
                  transition:
                    top ${switchDuration}ms linear,
                    left ${switchDuration}ms linear,
                    transform ${switchDuration}ms linear;
                }

                .popup {
                  opacity: 1;
                  transition: opacity 250ms linear;
                }

                .popup[data-ending-style] {
                  opacity: 0;
                }

                .positioner[data-instant],
                .popup[data-instant] {
                  transition: none;
                }
              `}
            </style>

            <Popover.Root
              open={open}
              triggerId={activeTrigger}
              onOpenChange={(nextOpen, details) => {
                if (nextOpen) {
                  openedTriggerIds.push(details.trigger?.id);
                  setActiveTrigger(details.trigger?.id ?? null);
                  setOpen(true);
                  return;
                }

                closeRequested = true;
                setTimeout(() => setOpen(false), commitDelay);
              }}
            >
              <Popover.Trigger
                payload={1}
                id="trigger-1"
                openOnHover
                delay={0}
                style={{ position: 'absolute', top: 20, left: 20 }}
              >
                Trigger 1
              </Popover.Trigger>
              <Popover.Trigger
                payload={2}
                id="trigger-2"
                openOnHover
                delay={0}
                style={{ position: 'absolute', top: 20, left: 220 }}
              >
                Trigger 2
              </Popover.Trigger>

              <Popover.Portal>
                <Popover.Positioner data-testid="positioner" className="positioner">
                  <Popover.Popup
                    data-testid="popup"
                    className="popup"
                    render={(props, state) => {
                      if (state.transitionStatus === 'ending') {
                        instantsWhileEnding.push(state.instant);
                      } else if (closeRequested) {
                        instantsWhileClosePending.push(state.instant);
                      }
                      return <div {...props} />;
                    }}
                  >
                    Content
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </div>
        );
      }

      const { user } = await render(<Test />);

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await user.hover(trigger1);
      await waitFor(() => {
        expect(screen.queryByTestId('popup')).not.toBe(null);
      });

      // Let the first open settle so moving to trigger 2 is a real switch.
      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
      });

      await user.hover(trigger2);
      // Request the close while the switch is still animating.
      await user.unhover(trigger2);

      await waitFor(
        () => {
          expect(instantsWhileEnding.length).toBeGreaterThan(0);
        },
        { timeout: 2000 },
      );

      expect(openedTriggerIds).toEqual(['trigger-1', 'trigger-2']);
      expect(instantsWhileClosePending).toContain('trigger-change');
      expect(instantsWhileEnding).not.toContain('trigger-change');
    });

    it('does not restore the trigger-change instant after a hover close has started', async () => {
      const { user, trigger2, popup } = await renderHoverDetachedTriggers({
        settleTriggerChange: false,
      });

      const positioner = screen.getByTestId('positioner');
      await waitFor(() => {
        expect(positioner.getAnimations().length).toBeGreaterThan(0);
      });
      const switchAnimations = positioner.getAnimations();

      await user.unhover(trigger2);
      await waitFor(() => {
        expect(popup).toHaveAttribute('data-ending-style');
      });

      await act(async () => {
        await Promise.all(switchAnimations.map((animation) => animation.finished));
      });

      // Still mid-exit: the stale callback must not have marked it instant and
      // collapsed the transition.
      expect(screen.getByTestId('popup')).toBe(popup);
      expect(popup).toHaveAttribute('data-ending-style');
      expect(popup).not.toHaveAttribute('data-instant');
    });

    it('renders focus guards around the active detached trigger and reports it on close', async () => {
      const testPopover = Popover.createHandle();
      const onOpenChange = vi.fn();
      const { user } = await render(
        <React.Fragment>
          <Popover.Trigger handle={testPopover} id="trigger-1">
            Trigger 1
          </Popover.Trigger>
          <Popover.Trigger handle={testPopover} id="trigger-2">
            Trigger 2
          </Popover.Trigger>
          <span>After</span>
          <Popover.Root handle={testPopover} onOpenChange={onOpenChange}>
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup>
                  Content
                  <Popover.Close>Close</Popover.Close>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        </React.Fragment>,
      );

      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await user.click(trigger2);
      await waitFor(() => {
        expect(screen.getByText('Content')).toBeVisible();
      });
      expect(trigger2.previousElementSibling).toHaveAttribute('data-base-ui-focus-guard');
      expect(trigger2.nextElementSibling).toHaveAttribute('data-base-ui-focus-guard');

      await user.click(screen.getByRole('button', { name: 'Close' }));
      await waitFor(() => {
        expect(screen.queryByText('Content')).toBe(null);
      });
      expect(trigger2.previousElementSibling).not.toHaveAttribute('data-base-ui-focus-guard');
      expect(trigger2.nextElementSibling).not.toHaveAttribute('data-base-ui-focus-guard');
      // Closing with Popover.Close reports the active trigger.
      expect(onOpenChange).toHaveBeenCalledTimes(2);
      expect(onOpenChange.mock.calls[1][0]).toBe(false);
      expect(onOpenChange.mock.calls[1][1].trigger).toBe(trigger2);
    });

    it('keeps positioning correct when conditional triggers unmount and the tree remounts', async () => {
      const testPopover = Popover.createHandle();

      function Test() {
        const [key, setKey] = React.useState(1);
        const [showErrorDemo, setShowErrorDemo] = React.useState(true);

        return (
          <React.Fragment key={key}>
            <button
              onClick={() => {
                setShowErrorDemo((prev) => !prev);
                setKey((prev) => prev + 1);
              }}
            >
              Toggle
            </button>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 48,
                margin: 50,
              }}
            >
              <Popover.Trigger handle={testPopover} id="trigger-0">
                Trigger 0
              </Popover.Trigger>
              {showErrorDemo && (
                <Popover.Trigger handle={testPopover} id="trigger-1">
                  Trigger 1
                </Popover.Trigger>
              )}
            </div>

            <Popover.Root handle={testPopover} triggerId="trigger-0" open>
              <Popover.Portal>
                <Popover.Positioner data-testid="positioner" sideOffset={4} align="start">
                  <Popover.Popup>Content</Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </React.Fragment>
        );
      }

      const { user } = await render(<Test />);

      const trigger0 = screen.getByRole('button', { name: 'Trigger 0' });
      await waitFor(() => {
        expect(
          Math.abs(
            screen.getByTestId('positioner').getBoundingClientRect().left -
              trigger0.getBoundingClientRect().left,
          ),
        ).toBeLessThanOrEqual(1);
      });

      await user.click(screen.getByRole('button', { name: 'Toggle' }));
      const trigger0After = screen.getByRole('button', { name: 'Trigger 0' });
      await waitFor(() => {
        expect(
          Math.abs(
            screen.getByTestId('positioner').getBoundingClientRect().left -
              trigger0After.getBoundingClientRect().left,
          ),
        ).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('return focus', () => {
    it('returns focus to the detached trigger when the Root unmounts while open', async () => {
      const handle = Popover.createHandle();

      function App({ showRoot }: { showRoot: boolean }) {
        return (
          <div>
            <Popover.Trigger handle={handle}>Trigger</Popover.Trigger>
            {showRoot && (
              <Popover.Root handle={handle}>
                <Popover.Portal>
                  <Popover.Positioner>
                    <Popover.Popup data-testid="popup">
                      <button type="button">Inside</button>
                    </Popover.Popup>
                  </Popover.Positioner>
                </Popover.Portal>
              </Popover.Root>
            )}
          </div>
        );
      }

      const { user, setProps } = await render(<App showRoot />);
      const trigger = screen.getByRole('button', { name: 'Trigger' });

      await user.click(trigger);
      const popup = await screen.findByTestId('popup');
      await waitFor(() => {
        expect(popup).toContainElement(document.activeElement as HTMLElement);
      });

      await setProps({ showRoot: false });

      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });
    });

    it('returns focus to the owning trigger after it remounts while open', async () => {
      const handle = Popover.createHandle();

      function App({ triggerKey }: { triggerKey: number }) {
        return (
          <div>
            <Popover.Trigger handle={handle} key={triggerKey} id="trigger">
              Trigger
            </Popover.Trigger>
            <Popover.Root handle={handle}>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup data-testid="popup">
                    <button type="button">Inside</button>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </div>
        );
      }

      const { user, setProps } = await render(<App triggerKey={1} />);
      const firstTrigger = screen.getByRole('button', { name: 'Trigger' });

      await user.click(firstTrigger);
      const popup = await screen.findByTestId('popup');
      await waitFor(() => {
        expect(popup).toContainElement(document.activeElement as HTMLElement);
      });

      await setProps({ triggerKey: 2 });
      const remountedTrigger = screen.getByRole('button', { name: 'Trigger' });
      expect(remountedTrigger).not.toBe(firstTrigger);
      expect(screen.getByTestId('popup')).toBeVisible();

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByTestId('popup')).toBe(null);
      });
      await waitFor(() => {
        expect(remountedTrigger).toHaveFocus();
      });
    });
  });
});
