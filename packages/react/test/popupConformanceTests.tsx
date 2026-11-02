import * as React from 'react';
import { ownerDocument } from '@base-ui/utils/owner';
import { activeElement } from '@base-ui/utils/shadowDom';
import type { UserEvent } from '@testing-library/user-event';
import { expect, vi, describe, it, afterEach, beforeEach } from 'vitest';
import {
  act,
  fireEvent,
  flushMicrotasks,
  randomStringValue,
  screen,
  waitFor,
} from '@mui/internal-test-utils';
import type { createRenderer } from '#test-utils';
import { enterWithMouse, isJSDOM, wait } from '#test-utils';
import { REASONS } from '../src/internals/reasons';

// StrictMode replays effects in development, which reports an instant open completion twice.
// These tests render without it so they assert the real contract: one call per transition.
const NON_STRICT = { strict: false };

export function popupConformanceTests(config: PopupTestConfig) {
  const {
    createComponent,
    triggerMouseAction,
    render,
    expectedPopupRole,
    expectedAriaHasPopupValue = expectedPopupRole,
    alwaysMounted,
    combobox = false,
    exitAnimation = true,
    openReason = triggerMouseAction === 'click' ? REASONS.triggerPress : REASONS.triggerHover,
  } = config;

  const prepareComponent = (props: TestedComponentProps) => {
    return createComponent({
      ...props,
      trigger: {
        'data-testid': 'trigger',
        // Hover-opened popups open right away, so the tests don't depend on timers.
        ...(triggerMouseAction === 'hover' ? { delay: 0 } : {}),
        ...props.trigger,
      },
      popup: {
        'data-testid': 'popup',
        ...props.popup,
      },
    });
  };

  const openWithTrigger = async (user: UserEvent) => {
    const trigger = getTrigger();
    if (triggerMouseAction === 'click') {
      await user.click(trigger);
    } else {
      enterWithMouse(trigger);
      await flushMicrotasks();
    }
  };

  // Popups that stay mounted after opening are hidden instead of removed when they close.
  const expectPopupClosed = () => {
    if (alwaysMounted) {
      expect(getPopup()).toBeInaccessible();
    } else {
      expect(getPopup()).toBe(null);
    }
  };

  describe('Popup conformance', () => {
    describe('IME dismissal', () => {
      it('dismisses after a composition is dropped without compositionend', async () => {
        const handleOpenChange = vi.fn();
        const { user } = await render(
          prepareComponent({ root: { defaultOpen: true, onOpenChange: handleOpenChange } }),
        );
        const popup = getPopup()!;
        expect(popup).toBeVisible();

        fireEvent.compositionStart(popup);
        await user.keyboard('[Escape]');

        await waitFor(expectPopupClosed);
        expect(handleOpenChange).toHaveBeenCalledWith(
          false,
          expect.objectContaining({ reason: REASONS.escapeKey }),
        );
      });

      it.each([
        { name: 'isComposing', isComposing: true, keyCode: 27 },
        { name: 'keyCode 229', isComposing: false, keyCode: 229 },
      ])('preserves the popup for an IME Escape identified by $name', async (event) => {
        const handleOpenChange = vi.fn();
        await render(
          prepareComponent({ root: { defaultOpen: true, onOpenChange: handleOpenChange } }),
        );
        const popup = getPopup()!;
        expect(popup).toBeVisible();

        fireEvent.keyDown(activeElement(ownerDocument(popup))!, {
          key: 'Escape',
          isComposing: event.isComposing,
          keyCode: event.keyCode,
        });
        await flushMicrotasks();

        expect(popup).toBeVisible();
        expect(handleOpenChange).not.toHaveBeenCalled();
      });
    });

    describe('controlled mode', () => {
      it('opens the popup with the `open` prop', async () => {
        const { rerender } = await render(prepareComponent({ root: { open: false } }));
        expect(getPopup()).toBe(null);

        await rerender(prepareComponent({ root: { open: true } }));
        expect(getPopup()).not.toBe(null);
      });

      it('reports every close request while `open={true}` keeps the popup open', async () => {
        const handleOpenChange = vi.fn();
        const { user } = await render(
          prepareComponent({ root: { open: true, onOpenChange: handleOpenChange } }),
        );

        await user.keyboard('[Escape]');
        await flushMicrotasks();
        expect(getPopup()).toBeVisible();
        await user.keyboard('[Escape]');

        await waitFor(() => {
          expect(handleOpenChange).toHaveBeenCalledTimes(2);
        });
        expect(handleOpenChange).toHaveBeenNthCalledWith(
          2,
          false,
          expect.objectContaining({ reason: REASONS.escapeKey }),
        );
      });
    });

    describe('prop: defaultOpen', () => {
      it('opens initially and remains uncontrolled', async () => {
        const { user } = await render(prepareComponent({ root: { defaultOpen: true } }));
        expect(getPopup()).toBeVisible();

        await user.keyboard('[Escape]');
        await waitFor(expectPopupClosed);
      });

      it('is ignored when `open={false}` is passed', async () => {
        await render(prepareComponent({ root: { defaultOpen: true, open: false } }));
        expect(getPopup()).toBe(null);
      });

      it('is ignored when `open={true}` is passed, so Escape cannot close', async () => {
        const { user } = await render(
          prepareComponent({ root: { defaultOpen: true, open: true } }),
        );
        expect(getPopup()).toBeVisible();

        await user.keyboard('[Escape]');
        await flushMicrotasks();
        expect(getPopup()).toBeVisible();
      });
    });

    describe('prop: onOpenChange', () => {
      it('is called with the new open state and the change details', async () => {
        const handleOpenChange = vi.fn();
        const { user } = await render(
          prepareComponent({ root: { onOpenChange: handleOpenChange } }),
        );
        expect(handleOpenChange).not.toHaveBeenCalled();

        await openWithTrigger(user);
        await waitFor(() => {
          expect(handleOpenChange).toHaveBeenCalledTimes(1);
        });
        await waitFor(() => {
          expect(getPopup()).toBeVisible();
        });
        expect(handleOpenChange).toHaveBeenCalledTimes(1);
        expect(handleOpenChange).toHaveBeenNthCalledWith(
          1,
          true,
          expect.objectContaining({ reason: openReason, trigger: getTrigger() }),
        );

        await user.keyboard('[Escape]');
        await waitFor(expectPopupClosed);
        expect(handleOpenChange).toHaveBeenCalledTimes(2);
        expect(handleOpenChange).toHaveBeenNthCalledWith(
          2,
          false,
          expect.objectContaining({ reason: REASONS.escapeKey, trigger: getTrigger() }),
        );
      });

      it('keeps the popup closed when the open change is canceled', async () => {
        const handleOpenChange = vi.fn(
          (nextOpen: boolean, eventDetails: OpenChangeEventDetails) => {
            if (nextOpen) {
              eventDetails.cancel();
            }
          },
        );
        const { user } = await render(
          prepareComponent({ root: { onOpenChange: handleOpenChange } }),
        );

        await openWithTrigger(user);
        await waitFor(() => {
          expect(handleOpenChange).toHaveBeenCalledTimes(1);
        });
        await flushMicrotasks();

        // The open request was made, so a missing popup proves `cancel()` prevented it.
        expect(handleOpenChange).toHaveBeenCalledTimes(1);
        expect(handleOpenChange).toHaveBeenNthCalledWith(
          1,
          true,
          expect.objectContaining({ reason: openReason }),
        );
        expectPopupClosed();
        expect(getTrigger()).not.toHaveAttribute('data-popup-open');
      });

      it('is not called when the `close` action is called while closed', async () => {
        const handleOpenChange = vi.fn();
        const actionsRef = React.createRef<{ close: () => void; unmount: () => void }>();
        await render(prepareComponent({ root: { actionsRef, onOpenChange: handleOpenChange } }));

        await act(async () => {
          actionsRef.current!.close();
        });

        expect(handleOpenChange).not.toHaveBeenCalled();
        expect(getTrigger()).not.toHaveAttribute('data-popup-open');
      });

      it('is not called when the `close` action is called after the `open` prop opened and closed the popup', async () => {
        const handleOpenChange = vi.fn();
        const actionsRef = React.createRef<{ close: () => void; unmount: () => void }>();
        const renderRoot = (open: boolean) =>
          prepareComponent({ root: { actionsRef, onOpenChange: handleOpenChange, open } });
        const { user, rerender } = await render(renderRoot(false));

        // The parent ignores this open, so it stays recorded as a pending request until the prop
        // opens and closes the popup.
        await openWithTrigger(user);
        await waitFor(() => {
          expect(handleOpenChange).toHaveBeenCalledWith(true, expect.anything());
        });
        await rerender(renderRoot(true));
        await rerender(renderRoot(false));
        await waitFor(expectPopupClosed);
        handleOpenChange.mockClear();

        await act(async () => {
          actionsRef.current!.close();
        });

        expect(handleOpenChange).not.toHaveBeenCalled();
        expect(getTrigger()).not.toHaveAttribute('data-popup-open');
      });

      it('is called when the `close` action is called while open', async () => {
        const handleOpenChange = vi.fn();
        const actionsRef = React.createRef<{ close: () => void; unmount: () => void }>();
        await render(
          prepareComponent({
            root: { actionsRef, defaultOpen: true, onOpenChange: handleOpenChange },
          }),
        );
        expect(getPopup()).toBeVisible();

        await act(async () => {
          actionsRef.current!.close();
        });

        expect(handleOpenChange).toHaveBeenCalledTimes(1);
        expect(handleOpenChange).toHaveBeenNthCalledWith(
          1,
          false,
          expect.objectContaining({ reason: REASONS.imperativeAction }),
        );
        await waitFor(expectPopupClosed);
      });

      if (triggerMouseAction === 'hover') {
        it('cancels a pending hover open when the `close` action is called', async () => {
          const handleOpenChange = vi.fn();
          const actionsRef = React.createRef<{ close: () => void; unmount: () => void }>();
          await render(
            prepareComponent({
              root: { actionsRef, onOpenChange: handleOpenChange },
              trigger: { delay: 100 },
            }),
          );

          enterWithMouse(getTrigger());
          await act(async () => {
            actionsRef.current!.close();
            await wait(200);
          });

          expect(handleOpenChange).not.toHaveBeenCalled();
          expect(getPopup()).toBe(null);
        });

        it('cancels a pending hover open when the `close` action is called while the popup is still mounted', async () => {
          const handleOpenChange = vi.fn(
            (nextOpen: boolean, eventDetails: OpenChangeEventDetails) => {
              if (!nextOpen) {
                eventDetails.preventUnmountOnClose();
              }
            },
          );
          const actionsRef = React.createRef<{ close: () => void; unmount: () => void }>();
          const { user } = await render(
            prepareComponent({
              root: { actionsRef, defaultOpen: true, onOpenChange: handleOpenChange },
              trigger: { delay: 100 },
            }),
          );

          await user.keyboard('[Escape]');
          await flushMicrotasks();
          expect(getPopup()).not.toBe(null);
          expect(getPopup()).not.toHaveAttribute('data-open');
          handleOpenChange.mockClear();

          enterWithMouse(getTrigger());
          await act(async () => {
            actionsRef.current!.close();
            await wait(200);
          });

          expect(handleOpenChange).not.toHaveBeenCalled();
          expect(getPopup()).not.toHaveAttribute('data-open');
        });

        it('reopens a popup that is still mounted once the hover delay ends without a `close` action', async () => {
          const handleOpenChange = vi.fn(
            (nextOpen: boolean, eventDetails: OpenChangeEventDetails) => {
              if (!nextOpen) {
                eventDetails.preventUnmountOnClose();
              }
            },
          );
          const { user } = await render(
            prepareComponent({
              root: { defaultOpen: true, onOpenChange: handleOpenChange },
              trigger: { delay: 100 },
            }),
          );

          await user.keyboard('[Escape]');
          await flushMicrotasks();
          expect(getPopup()).not.toBe(null);
          expect(getPopup()).not.toHaveAttribute('data-open');
          handleOpenChange.mockClear();

          enterWithMouse(getTrigger());
          await act(async () => {
            await wait(200);
          });

          expect(handleOpenChange).toHaveBeenCalledWith(true, expect.anything());
          expect(getPopup()).toHaveAttribute('data-open');
        });

        it('is not called when the pointer leaves the trigger before the hover delay ends', async () => {
          const handleOpenChange = vi.fn();
          await render(
            prepareComponent({
              root: { onOpenChange: handleOpenChange },
              trigger: { delay: 100 },
            }),
          );
          const trigger = getTrigger();

          enterWithMouse(trigger);
          fireEvent.mouseLeave(trigger);
          await act(async () => {
            await wait(200);
          });

          expect(handleOpenChange).not.toHaveBeenCalled();
          expect(getPopup()).toBe(null);
        });

        it('opens once the hover delay ends without a `close` action', async () => {
          const handleOpenChange = vi.fn();
          await render(
            prepareComponent({
              root: { onOpenChange: handleOpenChange },
              trigger: { delay: 100 },
            }),
          );

          enterWithMouse(getTrigger());
          await act(async () => {
            await wait(200);
          });

          expect(handleOpenChange).toHaveBeenCalledWith(true, expect.anything());
          expect(getPopup()).not.toBe(null);
        });
      }

      it('closes normally after a canceled close that asked to keep the popup mounted', async () => {
        let closeCount = 0;
        const handleOpenChange = vi.fn(
          (nextOpen: boolean, eventDetails: OpenChangeEventDetails) => {
            if (!nextOpen) {
              closeCount += 1;
              if (closeCount === 1) {
                eventDetails.preventUnmountOnClose();
                eventDetails.cancel();
              }
            }
          },
        );
        const handleOpenChangeComplete = vi.fn();
        const { user } = await render(
          prepareComponent({
            root: {
              defaultOpen: true,
              onOpenChange: handleOpenChange,
              onOpenChangeComplete: handleOpenChangeComplete,
            },
          }),
        );

        await user.keyboard('[Escape]');
        await flushMicrotasks();
        expect(getPopup()).toBeVisible();

        await user.keyboard('[Escape]');
        await waitFor(() => {
          expect(closeCount).toBe(2);
        });
        await waitFor(expectPopupClosed);
        // A popup kept mounted doesn't finish closing until the `unmount` action is called.
        await waitFor(() => {
          expect(handleOpenChangeComplete).toHaveBeenCalledWith(false);
        });
      });

      it.each([
        { name: 'one close', closes: 1, synchronous: false },
        { name: 'a second close during the wait', closes: 2, synchronous: false },
        {
          name: 'a synchronous request and a second close during the wait',
          closes: 2,
          synchronous: true,
        },
      ])(
        'keeps a controlled popup from finishing its close when it prevents unmounting after an await, with $name',
        async ({ closes, synchronous }) => {
          const onOpenChangeComplete = vi.fn();
          const handleClose = vi.fn();

          function App() {
            const [open, setOpen] = React.useState(true);
            const busyRef = React.useRef(false);
            return prepareComponent({
              root: {
                open,
                onOpenChangeComplete,
                onOpenChange: async (nextOpen, eventDetails) => {
                  if (nextOpen) {
                    setOpen(true);
                    return;
                  }
                  handleClose();
                  // A close that arrives while the first one waits is ignored.
                  if (busyRef.current) {
                    return;
                  }
                  busyRef.current = true;
                  if (synchronous) {
                    eventDetails.preventUnmountOnClose();
                  }
                  await wait(50);
                  if (!synchronous) {
                    eventDetails.preventUnmountOnClose();
                  }
                  setOpen(false);
                },
              },
            });
          }

          const { user } = await render(<App />, NON_STRICT);
          expect(getPopup()).toBeVisible();

          await user.keyboard('[Escape]');
          if (closes === 2) {
            await user.keyboard('[Escape]');
          }
          expect(handleClose).toHaveBeenCalledTimes(closes);
          await waitFor(() => {
            expect(getTrigger()).not.toHaveAttribute('data-popup-open');
          });
          await act(async () => {
            await wait(100);
          });

          expect(onOpenChangeComplete).not.toHaveBeenCalledWith(false);
          expect(getPopup()).not.toBe(null);
        },
      );

      // A combobox keeps focus in its input, so only popups that take focus can return it.
      if (triggerMouseAction === 'click' && !combobox) {
        it('returns focus to the trigger on a second Escape after a canceled Escape close', async () => {
          let cancelClose = true;
          const handleOpenChange = vi.fn(
            (nextOpen: boolean, eventDetails: OpenChangeEventDetails) => {
              if (!nextOpen && cancelClose) {
                eventDetails.cancel();
              }
            },
          );
          const { user } = await render(
            prepareComponent({ root: { onOpenChange: handleOpenChange } }),
          );

          await openWithTrigger(user);
          await waitFor(() => {
            expect(getPopup()).toContainElement(activeElement(document) as HTMLElement);
          });

          await user.keyboard('[Escape]');
          await flushMicrotasks();
          expect(handleOpenChange).toHaveBeenLastCalledWith(
            false,
            expect.objectContaining({ reason: REASONS.escapeKey }),
          );
          expect(getPopup()).toBeVisible();
          expect(getPopup()).toContainElement(activeElement(document) as HTMLElement);

          cancelClose = false;
          await user.keyboard('[Escape]');

          await waitFor(expectPopupClosed);
          await waitFor(() => {
            expect(getTrigger()).toHaveFocus();
          });
        });
      }
    });

    if (expectedPopupRole || triggerMouseAction === 'click') {
      describe('ARIA attributes', () => {
        if (expectedPopupRole) {
          it(`has the ${expectedPopupRole} role on the popup`, async () => {
            await render(prepareComponent({ root: { open: true } }));
            expect(getPopup()).toHaveAttribute('role', expectedPopupRole);
          });
        }

        if (triggerMouseAction === 'click') {
          it('has the `aria-controls` attribute on the trigger', async () => {
            await render(prepareComponent({ root: { open: true } }));
            const trigger = getTrigger();
            const popup = getPopup();
            expect(trigger).toHaveAttribute('aria-controls', popup?.id);
          });

          it('opens on trigger click and sets `aria-expanded` on the trigger', async () => {
            const { user } = await render(prepareComponent({}));
            const trigger = getTrigger();
            expect(getPopup()).toBe(null);
            expect(trigger).toHaveAttribute('aria-expanded', 'false');
            await user.click(trigger);
            // A combobox popup is the listbox itself; other popups mark the open state.
            const [openAttribute, openValue] = combobox ? ['role', 'listbox'] : ['data-open', ''];
            await waitFor(() => {
              expect(getPopup()).toHaveAttribute(openAttribute, openValue);
            });
            expect(trigger).toHaveAttribute('aria-expanded', 'true');
          });

          if (expectedAriaHasPopupValue) {
            it('has the `aria-haspopup` attribute on the trigger', async () => {
              const { rerender } = await render(prepareComponent({ root: { open: false } }));
              expect(getTrigger()).toHaveAttribute('aria-haspopup', expectedAriaHasPopupValue);

              await rerender(prepareComponent({ root: { open: true } }));
              expect(getTrigger()).toHaveAttribute('aria-haspopup', expectedAriaHasPopupValue);
            });
          }

          it('allows a custom `id` prop', async () => {
            await render(prepareComponent({ root: { open: true }, popup: { id: 'TestId' } }));
            expect(getPopup()).toHaveAttribute('id', 'TestId');
            expect(getTrigger()).toHaveAttribute('aria-controls', 'TestId');
          });
        }
      });
    }

    describe('prop: onOpenChangeComplete without animations', () => {
      it('is called on open in the commit that mounts the popup', async () => {
        let commits = 0;
        let mountCommit: number | null = null;
        let completeCommit: number | null = null;

        function handleCommit() {
          commits += 1;
          if (mountCommit === null && getPopup() !== null) {
            mountCommit = commits;
          }
        }

        function onOpenChangeComplete(open: boolean) {
          if (open) {
            completeCommit = commits;
          }
        }

        function App(props: { open: boolean }) {
          return (
            <React.Profiler id="popup" onRender={handleCommit}>
              {prepareComponent({ root: { open: props.open, onOpenChangeComplete } })}
            </React.Profiler>
          );
        }

        const { rerender } = await render(<App open={false} />, NON_STRICT);
        await rerender(<App open />);
        await waitFor(() => {
          expect(completeCommit).not.toBe(null);
        });

        expect(completeCommit).toBe(mountCommit);
      });
    });

    describe.skipIf(isJSDOM)('prop: onOpenChangeComplete', () => {
      afterEach(() => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
      });

      it('is not called on mount when closed', async () => {
        const onOpenChangeComplete = vi.fn();
        await render(prepareComponent({ root: { onOpenChangeComplete } }));

        expect(onOpenChangeComplete).not.toHaveBeenCalled();
      });

      it('is called on open when there is no enter animation', async () => {
        const onOpenChangeComplete = vi.fn();
        const { rerender } = await render(
          prepareComponent({ root: { open: false, onOpenChangeComplete } }),
          NON_STRICT,
        );

        await rerender(prepareComponent({ root: { open: true, onOpenChangeComplete } }));
        await waitFor(() => {
          expect(onOpenChangeComplete).toHaveBeenCalled();
        });
        await flushMicrotasks();
        expect(onOpenChangeComplete.mock.calls).toEqual([[true]]);
      });

      it('is called on close when there is no exit animation', async () => {
        const onOpenChangeComplete = vi.fn();
        const { rerender } = await render(
          prepareComponent({ root: { open: true, onOpenChangeComplete } }),
          NON_STRICT,
        );

        await rerender(prepareComponent({ root: { open: false, onOpenChangeComplete } }));
        await waitFor(expectPopupClosed);
        await waitFor(() => {
          expect(onOpenChangeComplete).toHaveBeenLastCalledWith(false);
        });
        expect(onOpenChangeComplete.mock.calls).toEqual([[true], [false]]);
      });

      if (exitAnimation) {
        const animationName = `anim-${randomStringValue()}`;
        const className = `open-change-complete-${animationName}`;

        function AnimatedPopup(props: { open: boolean; onOpenChangeComplete: () => void }) {
          // Enter and exit use different keyframes: swapping the selector while keeping the
          // same animation name doesn't restart the animation.
          const style = `
            @keyframes ${animationName}-enter {
              from {
                opacity: 0;
              }
            }

            @keyframes ${animationName}-exit {
              to {
                opacity: 0;
              }
            }

            .${className}[data-open] {
              animation: ${animationName}-enter 200ms;
            }

            .${className}[data-ending-style] {
              animation: ${animationName}-exit 200ms;
            }
          `;

          return (
            <div>
              {/* eslint-disable-next-line react/no-danger */}
              <style dangerouslySetInnerHTML={{ __html: style }} />
              {prepareComponent({
                root: { open: props.open, onOpenChangeComplete: props.onOpenChangeComplete },
                popup: { className },
              })}
            </div>
          );
        }

        const isAnimating = () =>
          getPopup()!
            .getAnimations()
            .some((animation) => animation.playState === 'running');

        it('is not called on close when onOpenChange prevents unmounting after an await', async () => {
          globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
          const onOpenChangeComplete = vi.fn();
          const { user } = await render(
            <div>
              <style>
                {`@keyframes ${animationName}-exit { to { opacity: 0; } }
                  .${className}[data-ending-style] { animation: ${animationName}-exit 200ms; }`}
              </style>
              {prepareComponent({
                root: {
                  defaultOpen: true,
                  onOpenChangeComplete,
                  onOpenChange: async (nextOpen, eventDetails) => {
                    if (!nextOpen) {
                      await Promise.resolve();
                      eventDetails.preventUnmountOnClose();
                    }
                  },
                },
                popup: { className },
              })}
            </div>,
          );
          expect(getPopup()).toBeVisible();

          await user.keyboard('[Escape]');
          await waitFor(() => {
            expect(getPopup()).toHaveAttribute('data-ending-style');
          });
          await wait(400);

          expect(onOpenChangeComplete).not.toHaveBeenCalledWith(false);
          expect(getPopup()).not.toBe(null);
        });

        it('is called on open once the enter animation finishes', async () => {
          globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
          const onOpenChangeComplete = vi.fn();
          const { setProps } = await render(
            <AnimatedPopup open={false} onOpenChangeComplete={onOpenChangeComplete} />,
          );

          await setProps({ open: true });
          await waitFor(() => {
            expect(isAnimating()).toBe(true);
          });
          // Read synchronously after the check above: the animation is still running.
          expect(onOpenChangeComplete).not.toHaveBeenCalled();

          await waitFor(() => {
            expect(onOpenChangeComplete).toHaveBeenCalled();
          });
          expect(onOpenChangeComplete.mock.calls).toEqual([[true]]);
        });

        it('is called on close once the exit animation finishes', async () => {
          globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
          const onOpenChangeComplete = vi.fn();
          const { setProps } = await render(
            <AnimatedPopup open onOpenChangeComplete={onOpenChangeComplete} />,
          );
          await waitFor(() => {
            expect(onOpenChangeComplete).toHaveBeenCalled();
          });
          onOpenChangeComplete.mockClear();

          await setProps({ open: false });
          await waitFor(() => {
            expect(getPopup()).toHaveAttribute('data-ending-style');
          });
          await waitFor(() => {
            expect(isAnimating()).toBe(true);
          });
          expect(onOpenChangeComplete).not.toHaveBeenCalled();

          await waitFor(expectPopupClosed);
          expect(onOpenChangeComplete.mock.calls).toEqual([[false]]);
        });
      }
    });

    describe('animations', () => {
      beforeEach(() => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
      });

      afterEach(() => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
      });

      it.skipIf(isJSDOM)('removes the popup when there is no exit animation defined', async () => {
        const { rerender } = await render(prepareComponent({ root: { open: true } }));

        await waitFor(() => {
          expect(getPopup()).not.toBe(null);
        });

        await rerender(prepareComponent({ root: { open: false } }));
        await waitFor(expectPopupClosed);
      });

      it.skipIf(isJSDOM || !exitAnimation)(
        'hides the kept-mounted popup once the exit animation finishes',
        async () => {
          const animationName = `anim-${randomStringValue()}`;

          function Test(props: { open: boolean }) {
            const style = `
            @keyframes ${animationName} {
              to {
                opacity: 0;
              }
            }

            .animation-test-popup-${animationName}[data-open] {
              opacity: 1;
            }

            .animation-test-popup-${animationName}[data-ending-style] {
              animation: ${animationName} 150ms;
            }
          `;

            return (
              <div>
                {/* eslint-disable-next-line react/no-danger */}
                <style dangerouslySetInnerHTML={{ __html: style }} />
                {prepareComponent({
                  root: { open: props.open },
                  // Popups that stay mounted after opening don't accept `keepMounted`.
                  portal: alwaysMounted ? {} : { keepMounted: true },
                  popup: {
                    className: `animation-test-popup-${animationName}`,
                  },
                })}
              </div>
            );
          }

          const { setProps } = await render(<Test open />);
          await setProps({ open: false });

          // The popup stays visible while the exit animation runs...
          await waitFor(() => {
            expect(getPopup()).toHaveAttribute('data-ending-style');
          });
          expect(getPopup()!.getAnimations()).not.toHaveLength(0);
          expect(getPopup()).not.toBeInaccessible();

          // ...and is hidden once it finishes.
          await waitFor(() => {
            expect(getPopup()).toBeInaccessible();
          });
        },
      );
    });
  });
}

function getTrigger() {
  return screen.getByTestId('trigger');
}

function getPopup() {
  return screen.queryByTestId('popup');
}

export interface PopupTestConfig {
  /**
   * A function that returns a JSX tree with a component to test.
   * Its parameters contain props to be spread on the component's parts.
   */
  createComponent: (props: TestedComponentProps) => React.JSX.Element;
  /**
   * How the popup is triggered.
   */
  triggerMouseAction: 'click' | 'hover';
  /**
   * Render function returned from `createRenderer`.
   */
  render: ReturnType<typeof createRenderer>['render'];
  /**
   * Expected `role` attribute of the popup element.
   */
  expectedPopupRole?: string;
  /**
   * Expected `aria-haspopup` attribute of the trigger element.
   */
  expectedAriaHasPopupValue?: string;
  /**
   * Set to `'only-after-open'` when the popup stays mounted (inaccessible) after it first closes.
   */
  alwaysMounted?: 'only-after-open';
  /**
   * Whether the popup is a combobox.
   */
  combobox?: boolean;
  /**
   * Whether the element receiving the `popup` props plays the enter and exit animations.
   * @default true
   */
  exitAnimation?: boolean;
  /**
   * The `reason` passed to `onOpenChange` when the trigger opens the popup.
   * @default 'trigger-press' for click triggers, 'trigger-hover' for hover triggers
   */
  openReason?: string;
}

interface OpenChangeEventDetails {
  reason: string;
  cancel: () => void;
  preventUnmountOnClose: () => void;
}

interface RootProps {
  actionsRef?: React.RefObject<{ close: () => void; unmount: () => void } | null>;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, eventDetails: OpenChangeEventDetails) => void;
  onOpenChangeComplete?: (open: boolean) => void;
}

interface TriggerProps {
  'data-testid'?: string;
  delay?: number;
}

interface PopupProps {
  className?: string;
  id?: string;
  'data-testid'?: string;
}

interface PortalProps {
  keepMounted?: boolean;
}

interface TestedComponentProps {
  root?: RootProps;
  popup?: PopupProps;
  trigger?: TriggerProps;
  portal?: PortalProps;
}
