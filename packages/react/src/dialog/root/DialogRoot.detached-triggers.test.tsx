import { expect, vi } from 'vitest';
import * as React from 'react';
import type { UserEvent } from '@testing-library/user-event';
import { act, fireEvent, screen, waitFor, within } from '@mui/internal-test-utils';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { Dialog } from '@base-ui/react/dialog';
import { createRenderer, isJSDOM } from '#test-utils';

describe('<Dialog.Root />', () => {
  const { render, clock } = createRenderer();

  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  describe('handle-backed root ownership', () => {
    type NumberPayload = { payload: number | undefined };

    it('ignores imperative handle calls made before a root is attached', async () => {
      const handle = Dialog.createHandle<number>();

      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      handle.open('trigger');
      handle.openWithPayload(8);
      handle.close();
      const detachedWarnings = consoleWarn.mock.calls.filter(
        ([message]) =>
          typeof message === 'string' && message.includes('no root using this handle is mounted'),
      );
      consoleWarn.mockRestore();

      expect(handle.isOpen).toBe(false);
      expect(detachedWarnings).toHaveLength(3);

      const { user } = await render(
        <React.Fragment>
          <Dialog.Trigger handle={handle} id="trigger" payload={1}>
            Trigger
          </Dialog.Trigger>
          <Dialog.Root handle={handle}>
            {({ payload }: NumberPayload) => (
              <React.Fragment>
                <span data-testid="payload">{payload ?? 'No payload'}</span>
                <Dialog.Portal>
                  <Dialog.Popup>Dialog Content</Dialog.Popup>
                </Dialog.Portal>
              </React.Fragment>
            )}
          </Dialog.Root>
        </React.Fragment>,
      );

      expect(screen.queryByRole('dialog')).toBe(null);
      expect(screen.getByTestId('payload').textContent).toBe('No payload');

      await user.click(screen.getByRole('button', { name: 'Trigger' }));
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeVisible();
      });
      expect(screen.getByTestId('payload').textContent).toBe('1');
    });

    it('ignores imperative handle calls made after the root is detached', async () => {
      const handle = Dialog.createHandle<number>();

      function App() {
        const [mounted, setMounted] = React.useState(true);

        return (
          <React.Fragment>
            <Dialog.Trigger handle={handle} id="trigger" payload={1}>
              Trigger
            </Dialog.Trigger>
            {!mounted && (
              <button type="button" onClick={() => setMounted(true)}>
                Remount root
              </button>
            )}
            {mounted && (
              <Dialog.Root handle={handle}>
                {({ payload }: NumberPayload) => (
                  <React.Fragment>
                    <span data-testid="payload">{payload ?? 'No payload'}</span>
                    <Dialog.Portal>
                      <Dialog.Popup>
                        Dialog Content
                        <button type="button" onClick={() => setMounted(false)}>
                          Unmount root
                        </button>
                      </Dialog.Popup>
                    </Dialog.Portal>
                  </React.Fragment>
                )}
              </Dialog.Root>
            )}
          </React.Fragment>
        );
      }

      const { user } = await render(<App />);
      const trigger = screen.getByRole('button', { name: 'Trigger' });

      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeVisible();
      });
      expect(screen.getByTestId('payload').textContent).toBe('1');

      await user.click(
        within(screen.getByRole('dialog')).getByRole('button', { name: 'Unmount root' }),
      );
      expect(handle.isOpen).toBe(false);
      expect(screen.queryByRole('dialog')).toBe(null);

      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      handle.openWithPayload(8);
      handle.open('trigger');
      handle.close();
      const detachedWarnings = consoleWarn.mock.calls.filter(
        ([message]) =>
          typeof message === 'string' && message.includes('no root using this handle is mounted'),
      );
      consoleWarn.mockRestore();

      expect(handle.isOpen).toBe(false);
      expect(detachedWarnings).toHaveLength(3);

      await user.click(screen.getByRole('button', { name: 'Remount root' }));
      expect(screen.queryByRole('dialog')).toBe(null);
      expect(screen.getByTestId('payload').textContent).toBe('No payload');

      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeVisible();
      });
      expect(screen.getByTestId('payload').textContent).toBe('1');
    });

    it('does not attach a replacement root store from an abandoned transition render', async () => {
      const handle = Dialog.createHandle<number>();
      const replacementRender = vi.fn();
      const never = new Promise(() => {});

      function SuspendingReplacement(): React.JSX.Element {
        replacementRender();
        throw never;
      }

      function App() {
        const [showReplacement, setShowReplacement] = React.useState(false);
        const [, startTransition] = React.useTransition();

        return (
          <React.Fragment>
            <Dialog.Trigger handle={handle} id="trigger" payload={5}>
              Trigger
            </Dialog.Trigger>
            <button
              type="button"
              onClick={() => {
                startTransition(() => {
                  setShowReplacement(true);
                });
              }}
            >
              Start replacement
            </button>
            <button type="button" onClick={() => setShowReplacement(false)}>
              Cancel replacement
            </button>

            <Dialog.Root handle={handle} modal={false} disablePointerDismissal>
              {({ payload }: NumberPayload) => (
                <Dialog.Portal>
                  <Dialog.Popup>
                    Current dialog
                    <span data-testid="payload">{payload ?? 'No payload'}</span>
                  </Dialog.Popup>
                </Dialog.Portal>
              )}
            </Dialog.Root>

            <React.Suspense fallback={<div>Loading</div>}>
              {showReplacement && (
                <Dialog.Root handle={handle} modal={false} disablePointerDismissal>
                  <SuspendingReplacement />
                  <Dialog.Portal>
                    <Dialog.Popup>Replacement dialog</Dialog.Popup>
                  </Dialog.Portal>
                </Dialog.Root>
              )}
            </React.Suspense>
          </React.Fragment>
        );
      }

      const { user } = await render(<App />);
      const trigger = screen.getByRole('button', { name: 'Trigger' });

      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByText('Current dialog')).toBeVisible();
      });
      expect(screen.getByTestId('payload').textContent).toBe('5');
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(handle.isOpen).toBe(true);

      fireEvent.click(screen.getByRole('button', { name: 'Start replacement' }));
      expect(replacementRender).toHaveBeenCalled();

      expect(screen.queryByText('Replacement dialog')).toBe(null);
      expect(screen.getByText('Current dialog')).toBeVisible();
      expect(screen.getByTestId('payload').textContent).toBe('5');
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(handle.isOpen).toBe(true);

      fireEvent.click(screen.getByRole('button', { name: 'Cancel replacement' }));

      expect(screen.queryByText('Replacement dialog')).toBe(null);
      expect(screen.getByText('Current dialog')).toBeVisible();
      expect(screen.getByTestId('payload').textContent).toBe('5');
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(handle.isOpen).toBe(true);
    });

    it('attaches a fresh root store when the handle prop changes to a previously dirtied handle', async () => {
      const handleA = Dialog.createHandle<number>();
      const handleB = Dialog.createHandle<number>();

      function App() {
        const [phase, setPhase] = React.useState<'dirty' | 'main'>('dirty');
        const [handle, setHandle] = React.useState(handleA);

        if (phase === 'dirty') {
          return (
            <Dialog.Root handle={handleB}>
              {({ payload }: NumberPayload) => (
                <React.Fragment>
                  <span data-testid="dirty-payload">{payload ?? 'No payload'}</span>
                  <Dialog.Portal>
                    <Dialog.Popup>
                      Dirty dialog
                      <button type="button" onClick={() => setPhase('main')}>
                        Unmount dirty root
                      </button>
                    </Dialog.Popup>
                  </Dialog.Portal>
                </React.Fragment>
              )}
            </Dialog.Root>
          );
        }

        return (
          <React.Fragment>
            <Dialog.Trigger handle={handle} id="trigger" payload={1}>
              Trigger
            </Dialog.Trigger>
            <button type="button" onClick={() => setHandle(handleB)}>
              Switch to handle B
            </button>
            <Dialog.Root handle={handle}>
              {({ payload }: NumberPayload) => (
                <React.Fragment>
                  <span data-testid="payload">{payload ?? 'No payload'}</span>
                  <Dialog.Portal>
                    <Dialog.Popup>Dialog Content</Dialog.Popup>
                  </Dialog.Portal>
                </React.Fragment>
              )}
            </Dialog.Root>
          </React.Fragment>
        );
      }

      const { user } = await render(<App />);

      await act(() => handleB.openWithPayload(8));
      await waitFor(() => {
        expect(screen.getByText('Dirty dialog')).toBeVisible();
      });
      expect(screen.getByTestId('dirty-payload').textContent).toBe('8');

      await user.click(screen.getByRole('button', { name: 'Unmount dirty root' }));
      expect(handleB.isOpen).toBe(false);
      expect(screen.queryByRole('dialog')).toBe(null);
      expect(screen.getByTestId('payload').textContent).toBe('No payload');

      await user.click(screen.getByRole('button', { name: 'Switch to handle B' }));
      expect(handleB.isOpen).toBe(false);
      expect(screen.queryByRole('dialog')).toBe(null);
      expect(screen.getByTestId('payload').textContent).toBe('No payload');

      const trigger = screen.getByRole('button', { name: 'Trigger' });
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Dialog Content')).toBeVisible();
      });
      expect(screen.getByTestId('payload').textContent).toBe('1');
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('keeps a handle-backed dialog open and controllable across handle swaps on a live root', async () => {
      const handleA = Dialog.createHandle();
      const handleB = Dialog.createHandle();

      function App() {
        const [handle, setHandle] = React.useState(handleA);

        return (
          <React.Fragment>
            <Dialog.Trigger handle={handle} id="trigger">
              Trigger
            </Dialog.Trigger>
            <button type="button" onClick={() => setHandle(handleA)}>
              Use handle A
            </button>
            <button type="button" onClick={() => setHandle(handleB)}>
              Use handle B
            </button>
            <Dialog.Root handle={handle} modal={false} disablePointerDismissal>
              <Dialog.Portal>
                <Dialog.Popup>Dialog Content</Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          </React.Fragment>
        );
      }

      const { user } = await render(<App />);
      const trigger = screen.getByRole('button', { name: 'Trigger' });

      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByText('Dialog Content')).toBeVisible();
      });

      // The store is owned by the Root, so swapping the handle re-attaches it without resetting state.
      await user.click(screen.getByRole('button', { name: 'Use handle B' }));
      expect(screen.getByText('Dialog Content')).toBeVisible();
      expect(handleB.isOpen).toBe(true);
      expect(handleA.isOpen).toBe(false);
      await waitFor(() => {
        expect(trigger.getAttribute('aria-controls')).toBe(
          screen.getByRole('dialog').getAttribute('id'),
        );
      });

      // Swapping back to a previously-attached handle keeps working (no stale registrations).
      await user.click(screen.getByRole('button', { name: 'Use handle A' }));
      expect(screen.getByText('Dialog Content')).toBeVisible();
      expect(handleA.isOpen).toBe(true);
      expect(handleB.isOpen).toBe(false);

      // The currently-attached handle controls the live dialog.
      await act(() => handleA.close());
      await waitFor(() => {
        expect(screen.queryByText('Dialog Content')).toBe(null);
      });
    });

    it('registers a detached trigger declared after the root', async () => {
      const handle = Dialog.createHandle();

      const { user } = await render(
        <React.Fragment>
          <Dialog.Root handle={handle}>
            <Dialog.Portal>
              <Dialog.Popup>Dialog Content</Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
          <Dialog.Trigger handle={handle} id="trigger">
            Trigger
          </Dialog.Trigger>
        </React.Fragment>,
      );

      const trigger = screen.getByRole('button', { name: 'Trigger' });

      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByText('Dialog Content')).toBeVisible();
      });

      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(trigger.getAttribute('aria-controls')).toBe(
        screen.getByRole('dialog').getAttribute('id'),
      );
    });

    it('associates the requested trigger when opened by id in the same commit a root attaches', async () => {
      const handle = Dialog.createHandle<number>();

      function OpenOnMount() {
        // A layout effect runs in the same commit the root first attaches, after the root's attach
        // effect but before the detached triggers have re-registered into the root's store.
        useIsoLayoutEffect(() => {
          handle.open('trigger');
        }, []);
        return null;
      }

      await render(
        <React.Fragment>
          <Dialog.Trigger handle={handle} id="other" payload={9}>
            Other
          </Dialog.Trigger>
          <Dialog.Trigger handle={handle} id="trigger" payload={5}>
            Trigger
          </Dialog.Trigger>
          <Dialog.Root handle={handle}>
            {({ payload }: NumberPayload) => (
              <React.Fragment>
                <span data-testid="payload">{payload ?? 'No payload'}</span>
                <Dialog.Portal>
                  <Dialog.Popup>Dialog Content</Dialog.Popup>
                </Dialog.Portal>
              </React.Fragment>
            )}
          </Dialog.Root>
          <OpenOnMount />
        </React.Fragment>,
      );

      await waitFor(() => {
        expect(screen.getByText('Dialog Content')).toBeVisible();
      });

      // The requested trigger is associated (ARIA + its own payload), not the other detached trigger.
      const requestedTrigger = screen.getByRole('button', { name: 'Trigger', hidden: true });
      const otherTrigger = screen.getByRole('button', { name: 'Other', hidden: true });
      expect(requestedTrigger).toHaveAttribute('aria-expanded', 'true');
      expect(requestedTrigger.getAttribute('aria-controls')).toBe(
        screen.getByRole('dialog').getAttribute('id'),
      );
      expect(otherTrigger).not.toHaveAttribute('aria-controls');
      expect(screen.getByTestId('payload').textContent).toBe('5');
    });

    describe('multiple roots sharing one handle', () => {
      // Fake timers so the deferred overlap check only runs when ticked, after the handoff settles.
      clock.withFakeTimers();

      const overlapWarned = (consoleWarn: ReturnType<typeof vi.spyOn>) =>
        consoleWarn.mock.calls.some(
          ([message]: unknown[]) =>
            typeof message === 'string' && message.includes('more than one mounted root'),
        );

      it('does not warn when one root replaces another during a route transition', async () => {
        const handle = Dialog.createHandle();
        const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        function TransitioningRoots({ phase }: { phase: 'outgoing' | 'overlap' | 'incoming' }) {
          return (
            <React.Fragment>
              {(phase === 'outgoing' || phase === 'overlap') && (
                <Dialog.Root key="outgoing" handle={handle}>
                  <Dialog.Portal>
                    <Dialog.Popup>Outgoing</Dialog.Popup>
                  </Dialog.Portal>
                </Dialog.Root>
              )}
              {(phase === 'overlap' || phase === 'incoming') && (
                <Dialog.Root key="incoming" handle={handle}>
                  <Dialog.Portal>
                    <Dialog.Popup>Incoming</Dialog.Popup>
                  </Dialog.Portal>
                </Dialog.Root>
              )}
            </React.Fragment>
          );
        }

        const { setProps } = await render(<TransitioningRoots phase="outgoing" />);
        // The incoming root mounts while the outgoing one is still mounted (overlap)...
        await setProps({ phase: 'overlap' });
        // ...then the outgoing root unmounts, completing a clean handoff, all before the deferred
        // check runs.
        await setProps({ phase: 'incoming' });

        clock.tick(20);

        expect(overlapWarned(consoleWarn)).toBe(false);
        consoleWarn.mockRestore();
      });

      it('keeps the newer root attached after the older root unmounts', async () => {
        const handle = Dialog.createHandle();

        function TransitioningRoots({ phase }: { phase: 'outgoing' | 'overlap' | 'incoming' }) {
          return (
            <React.Fragment>
              {(phase === 'outgoing' || phase === 'overlap') && (
                <Dialog.Root key="outgoing" handle={handle}>
                  <Dialog.Portal>
                    <Dialog.Popup>Outgoing</Dialog.Popup>
                  </Dialog.Portal>
                </Dialog.Root>
              )}
              {(phase === 'overlap' || phase === 'incoming') && (
                <Dialog.Root key="incoming" handle={handle}>
                  <Dialog.Portal>
                    <Dialog.Popup>Incoming</Dialog.Popup>
                  </Dialog.Portal>
                </Dialog.Root>
              )}
            </React.Fragment>
          );
        }

        const { setProps } = await render(<TransitioningRoots phase="outgoing" />);
        await setProps({ phase: 'overlap' });
        await setProps({ phase: 'incoming' });

        clock.tick(20);

        await act(() => handle.open(null));

        expect(screen.getByText('Incoming')).toBeVisible();
        expect(screen.queryByText('Outgoing')).toBe(null);
        expect(handle.isOpen).toBe(true);
      });

      it('restores control to the previous root when a newer overlapping root detaches', async () => {
        const handle = Dialog.createHandle();
        const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        function TransitioningRoots({ phase }: { phase: 'outgoing' | 'overlap' | 'incoming' }) {
          return (
            <React.Fragment>
              {(phase === 'outgoing' || phase === 'overlap') && (
                <Dialog.Root key="outgoing" handle={handle}>
                  <Dialog.Portal>
                    <Dialog.Popup>Outgoing</Dialog.Popup>
                  </Dialog.Portal>
                </Dialog.Root>
              )}
              {(phase === 'overlap' || phase === 'incoming') && (
                <Dialog.Root key="incoming" handle={handle}>
                  <Dialog.Portal>
                    <Dialog.Popup>Incoming</Dialog.Popup>
                  </Dialog.Portal>
                </Dialog.Root>
              )}
            </React.Fragment>
          );
        }

        const { setProps } = await render(<TransitioningRoots phase="outgoing" />);
        // The incoming root mounts while the outgoing one is still mounted (overlap)...
        await setProps({ phase: 'overlap' });
        // ...then the transition is canceled: the newer (incoming) root unmounts first while the
        // older (outgoing) root stays mounted.
        await setProps({ phase: 'outgoing' });

        clock.tick(20);

        // The still-mounted outgoing root regains control of the handle instead of being left inert.
        await act(() => handle.open(null));

        expect(screen.getByText('Outgoing')).toBeVisible();
        expect(screen.queryByText('Incoming')).toBe(null);
        expect(handle.isOpen).toBe(true);
        // A canceled transient overlap should not warn.
        expect(overlapWarned(consoleWarn)).toBe(false);
        consoleWarn.mockRestore();
      });

      it('keeps the root attached through Strict Mode effect replay', async () => {
        const handle = Dialog.createHandle();
        const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        await render(
          <React.StrictMode>
            <Dialog.Root handle={handle}>
              <Dialog.Portal>
                <Dialog.Popup>Strict Mode Dialog</Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          </React.StrictMode>,
        );

        clock.tick(20);

        expect(overlapWarned(consoleWarn)).toBe(false);
        consoleWarn.mockRestore();

        await act(() => handle.open(null));

        expect(screen.getByText('Strict Mode Dialog')).toBeVisible();
        expect(handle.isOpen).toBe(true);
      });

      it('warns when a handle stays attached to more than one mounted root', async () => {
        const handle = Dialog.createHandle();
        const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        await render(
          <React.Fragment>
            <Dialog.Root handle={handle}>
              <Dialog.Portal>
                <Dialog.Popup>First</Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
            <Dialog.Root handle={handle}>
              <Dialog.Portal>
                <Dialog.Popup>Second</Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          </React.Fragment>,
        );

        // Both roots stay mounted, so the deferred check still sees the overlap and warns.
        clock.tick(20);

        expect(overlapWarned(consoleWarn)).toBe(true);
        consoleWarn.mockRestore();
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

      expect(screen.queryByText('Dialog Content')).toBe(null);

      await user.click(trigger1);
      await waitFor(() => {
        expect(screen.queryByText('Dialog Content')).not.toBe(null);
      });

      await user.click(screen.getByText('Close'));
      await waitFor(() => {
        expect(screen.queryByText('Dialog Content')).toBe(null);
      });

      await user.click(trigger2);
      await waitFor(() => {
        expect(screen.queryByText('Dialog Content')).not.toBe(null);
      });

      await user.click(screen.getByText('Close'));
      await waitFor(() => {
        expect(screen.queryByText('Dialog Content')).toBe(null);
      });

      await user.click(trigger3);
      await waitFor(() => {
        expect(screen.queryByText('Dialog Content')).not.toBe(null);
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
        expect(screen.getByTestId('content').textContent).toBe('1');
      });

      await user.click(trigger2);
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).toBe('2');
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
      expect(screen.getByTestId('dialog-popup')).toBe(popupElement);
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

      expect(trigger1).toHaveAttribute('aria-expanded', 'false');
      expect(trigger2).toHaveAttribute('aria-expanded', 'false');

      await user.click(trigger1);

      const dialog = await screen.findByRole('dialog');
      const trigger1Controls = trigger1.getAttribute('aria-controls');
      expect(trigger1Controls).not.toBe(null);
      expect(dialog.getAttribute('id')).toBe(trigger1Controls);
      await waitFor(() => {
        expect(trigger1).toHaveAttribute('aria-expanded', 'true');
      });
      expect(trigger2).toHaveAttribute('aria-expanded', 'false');
    });

    it('synchronizes ARIA attributes in controlled mode', async () => {
      await render(
        <Dialog.Root open triggerId="trigger-2">
          <Dialog.Trigger id="trigger-1">Trigger 1</Dialog.Trigger>
          <Dialog.Trigger id="trigger-2">Trigger 2</Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Popup>Dialog Content</Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
      );

      const trigger1 = screen.getByText('Trigger 1');
      const trigger2 = screen.getByText('Trigger 2');
      const dialog = await screen.findByRole('dialog');

      expect(trigger1).toHaveAttribute('aria-expanded', 'false');
      expect(trigger1).not.toHaveAttribute('aria-controls');
      expect(trigger2).toHaveAttribute('aria-expanded', 'true');
      expect(trigger2.getAttribute('aria-controls')).toBe(dialog.getAttribute('id'));
    });

    it('sets the payload when opening programmatically with a controlled triggerId', async () => {
      function App() {
        const [open, setOpen] = React.useState(false);
        const [triggerId, setTriggerId] = React.useState<string | null>(null);

        return (
          <div>
            <Dialog.Root open={open} triggerId={triggerId} onOpenChange={setOpen}>
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
                      <Dialog.Close>Close</Dialog.Close>
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
        expect(screen.getByTestId('content').textContent).toBe('2');
      });

      await user.click(screen.getByRole('button', { name: 'Close' }));

      await waitFor(() => {
        expect(screen.queryByTestId('content')).toBe(null);
      });
      expect(openButton).toHaveFocus();
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
        expect(screen.getByTestId('content').textContent).toBe('1');
      });

      const updateButton = screen.getByRole('button', { name: 'Update payloads' });
      await user.click(updateButton);
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).toBe('8');
      });
    });
  });

  describe.skipIf(isJSDOM)('multiple detached triggers', () => {
    type NumberPayload = { payload: number | undefined };

    function TriggerWithNesting({
      handle,
      nesting,
    }: {
      handle: ReturnType<typeof Dialog.createHandle>;
      nesting: 0 | 1 | 2 | 3;
    }) {
      const trigger = <Dialog.Trigger handle={handle}>Trigger</Dialog.Trigger>;

      if (nesting === 0) {
        return trigger;
      }

      if (nesting === 1) {
        return <div>{trigger}</div>;
      }

      if (nesting === 2) {
        return (
          <div>
            <div>{trigger}</div>
          </div>
        );
      }

      return (
        <div>
          <div>
            <div>{trigger}</div>
          </div>
        </div>
      );
    }

    function DetachedTriggerReparentingTest({
      handle,
      nesting,
    }: {
      handle: ReturnType<typeof Dialog.createHandle>;
      nesting: 0 | 1 | 2 | 3;
    }) {
      return (
        <React.Fragment>
          <TriggerWithNesting handle={handle} nesting={nesting} />
          <Dialog.Root handle={handle}>
            <Dialog.Portal>
              <Dialog.Popup>
                Dialog Content
                <Dialog.Close>Close</Dialog.Close>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </React.Fragment>
      );
    }

    async function openAndCloseDialog(user: UserEvent) {
      await user.click(screen.getByRole('button', { name: 'Trigger' }));
      await waitFor(() => {
        expect(screen.getByText('Dialog Content')).toBeVisible();
      });
      await user.click(screen.getByText('Close'));
      await waitFor(() => {
        expect(screen.queryByText('Dialog Content')).toBe(null);
      });
    }

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

      expect(screen.queryByText('Dialog Content')).toBe(null);

      await user.click(trigger1);
      await waitFor(() => {
        expect(screen.queryByText('Dialog Content')).not.toBe(null);
      });
      await user.click(screen.getByText('Close'));
      await waitFor(() => {
        expect(screen.queryByText('Dialog Content')).toBe(null);
      });

      await user.click(trigger2);
      await waitFor(() => {
        expect(screen.queryByText('Dialog Content')).not.toBe(null);
      });
      await user.click(screen.getByText('Close'));
      await waitFor(() => {
        expect(screen.queryByText('Dialog Content')).toBe(null);
      });

      await user.click(trigger3);
      await waitFor(() => {
        expect(screen.queryByText('Dialog Content')).not.toBe(null);
      });
    });

    it('attaches fresh root state when the root remounts after being unmounted while open', async () => {
      const testDialog = Dialog.createHandle();

      function App() {
        const [mounted, setMounted] = React.useState(true);

        return (
          <div>
            <Dialog.Trigger handle={testDialog} id="trigger-1">
              Trigger 1
            </Dialog.Trigger>
            <Dialog.Trigger handle={testDialog} id="trigger-2">
              Trigger 2
            </Dialog.Trigger>
            {!mounted && (
              <button type="button" onClick={() => setMounted(true)}>
                Remount root
              </button>
            )}

            {mounted && (
              <Dialog.Root handle={testDialog}>
                <Dialog.Portal>
                  <Dialog.Popup>
                    Dialog Content
                    <button type="button" onClick={() => setMounted(false)}>
                      Unmount root
                    </button>
                  </Dialog.Popup>
                </Dialog.Portal>
              </Dialog.Root>
            )}
          </div>
        );
      }

      const { user } = await render(<App />);
      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await user.click(trigger1);
      await waitFor(() => {
        expect(screen.getByText('Dialog Content')).toBeVisible();
      });

      await user.click(screen.getByRole('button', { name: 'Unmount root' }));
      expect(screen.queryByText('Dialog Content')).toBe(null);

      await user.click(screen.getByRole('button', { name: 'Remount root' }));
      expect(screen.queryByText('Dialog Content')).toBe(null);
      await waitFor(() => {
        expect(trigger1).toHaveAttribute('aria-expanded', 'false');
      });

      await user.click(trigger1);
      await waitFor(() => {
        expect(screen.getByText('Dialog Content')).toBeVisible();
      });

      expect(trigger1).toHaveAttribute('aria-expanded', 'true');
      expect(trigger1.getAttribute('aria-controls')).toBe(
        screen.getByRole('dialog').getAttribute('id'),
      );
      expect(trigger2).toHaveAttribute('aria-expanded', 'false');
    });

    it('resets stale payload when a handle-backed root remounts', async () => {
      const testDialog = Dialog.createHandle<number>();

      function App() {
        const [mounted, setMounted] = React.useState(true);

        return (
          <div>
            {!mounted && (
              <button type="button" onClick={() => setMounted(true)}>
                Remount root
              </button>
            )}

            {mounted && (
              <Dialog.Root handle={testDialog}>
                {({ payload }: NumberPayload) => (
                  <React.Fragment>
                    <span data-testid="payload">{payload ?? 'No payload'}</span>
                    <Dialog.Portal>
                      <Dialog.Popup>
                        Dialog Content
                        <button type="button" onClick={() => setMounted(false)}>
                          Unmount root
                        </button>
                      </Dialog.Popup>
                    </Dialog.Portal>
                  </React.Fragment>
                )}
              </Dialog.Root>
            )}
          </div>
        );
      }

      const { user } = await render(<App />);

      expect(screen.getByTestId('payload').textContent).toBe('No payload');

      await act(() => testDialog.openWithPayload(8));
      await waitFor(() => {
        expect(screen.getByText('Dialog Content')).toBeVisible();
      });
      expect(screen.getByTestId('payload').textContent).toBe('8');

      await user.click(
        within(screen.getByRole('dialog')).getByRole('button', { name: 'Unmount root' }),
      );
      expect(screen.queryByTestId('payload')).toBe(null);

      await user.click(screen.getByRole('button', { name: 'Remount root' }));
      expect(screen.queryByRole('dialog')).toBe(null);
      expect(screen.getByTestId('payload').textContent).toBe('No payload');
    });

    it('notifies persistent detached triggers after attaching fresh root state on remount', async () => {
      const testDialog = Dialog.createHandle();

      const HeaderTrigger = React.memo(function HeaderTrigger() {
        return (
          <Dialog.Trigger handle={testDialog} id="trigger">
            Trigger
          </Dialog.Trigger>
        );
      });

      function RouteRoot() {
        const [mounted, setMounted] = React.useState(true);

        return (
          <React.Fragment>
            {!mounted && (
              <button type="button" onClick={() => setMounted(true)}>
                Remount root
              </button>
            )}

            {mounted && (
              <Dialog.Root handle={testDialog}>
                <Dialog.Portal>
                  <Dialog.Popup>
                    Dialog Content
                    <button type="button" onClick={() => setMounted(false)}>
                      Unmount root
                    </button>
                  </Dialog.Popup>
                </Dialog.Portal>
              </Dialog.Root>
            )}
          </React.Fragment>
        );
      }

      function App() {
        return (
          <React.Fragment>
            <HeaderTrigger />
            <RouteRoot />
          </React.Fragment>
        );
      }

      const { user } = await render(<App />);
      const trigger = screen.getByRole('button', { name: 'Trigger' });

      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByText('Dialog Content')).toBeVisible();
      });

      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(trigger.getAttribute('aria-controls')).toBe(
        screen.getByRole('dialog').getAttribute('id'),
      );

      await user.click(
        within(screen.getByRole('dialog')).getByRole('button', { name: 'Unmount root' }),
      );
      expect(screen.queryByText('Dialog Content')).toBe(null);

      await user.click(screen.getByRole('button', { name: 'Remount root' }));
      expect(screen.queryByText('Dialog Content')).toBe(null);

      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
      });
      expect(trigger).not.toHaveAttribute('aria-controls');
    });

    it('resets stale controlled open state when a handle-backed root remounts uncontrolled', async () => {
      const testDialog = Dialog.createHandle();

      function App() {
        const [mode, setMode] = React.useState<'controlled' | 'unmounted' | 'uncontrolled'>(
          'controlled',
        );

        return (
          <div>
            <Dialog.Trigger handle={testDialog} id="trigger">
              Trigger
            </Dialog.Trigger>
            <button type="button" onClick={() => setMode('unmounted')}>
              Unmount root
            </button>
            {mode === 'unmounted' && (
              <button type="button" onClick={() => setMode('uncontrolled')}>
                Remount uncontrolled root
              </button>
            )}

            {mode === 'controlled' && (
              <Dialog.Root handle={testDialog} open triggerId="trigger">
                <Dialog.Portal>
                  <Dialog.Popup>
                    Dialog Content
                    <button type="button" onClick={() => setMode('unmounted')}>
                      Unmount root
                    </button>
                  </Dialog.Popup>
                </Dialog.Portal>
              </Dialog.Root>
            )}

            {mode === 'uncontrolled' && (
              <Dialog.Root handle={testDialog}>
                <Dialog.Portal>
                  <Dialog.Popup>Dialog Content</Dialog.Popup>
                </Dialog.Portal>
              </Dialog.Root>
            )}
          </div>
        );
      }

      const { user } = await render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Dialog Content')).toBeVisible();
      });

      await user.click(
        within(screen.getByRole('dialog')).getByRole('button', { name: 'Unmount root' }),
      );
      expect(screen.queryByText('Dialog Content')).toBe(null);

      await user.click(screen.getByRole('button', { name: 'Remount uncontrolled root' }));
      expect(screen.queryByText('Dialog Content')).toBe(null);
    });

    it('does not warn when a handle-backed root remounts controlled after being uncontrolled', async () => {
      const testDialog = Dialog.createHandle();
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        function App() {
          const [mode, setMode] = React.useState<'uncontrolled' | 'unmounted' | 'controlled'>(
            'uncontrolled',
          );

          return (
            <div>
              <Dialog.Trigger handle={testDialog} id="trigger">
                Trigger
              </Dialog.Trigger>
              <button type="button" onClick={() => setMode('unmounted')}>
                Unmount root
              </button>
              {mode === 'unmounted' && (
                <button type="button" onClick={() => setMode('controlled')}>
                  Remount controlled root
                </button>
              )}

              {mode === 'uncontrolled' && (
                <Dialog.Root handle={testDialog}>
                  <Dialog.Portal>
                    <Dialog.Popup>Dialog Content</Dialog.Popup>
                  </Dialog.Portal>
                </Dialog.Root>
              )}

              {mode === 'controlled' && (
                <Dialog.Root handle={testDialog} open triggerId="trigger">
                  <Dialog.Portal>
                    <Dialog.Popup>Dialog Content</Dialog.Popup>
                  </Dialog.Portal>
                </Dialog.Root>
              )}
            </div>
          );
        }

        const { user } = await render(<App />);

        await user.click(screen.getByRole('button', { name: 'Unmount root' }));
        expect(screen.queryByText('Dialog Content')).toBe(null);

        await user.click(screen.getByRole('button', { name: 'Remount controlled root' }));
        await waitFor(() => {
          expect(screen.getByText('Dialog Content')).toBeVisible();
        });

        expect(
          consoleError.mock.calls.some(([message]) => {
            return (
              typeof message === 'string' &&
              message.includes('controlled state of openProp') &&
              message.includes('controlled')
            );
          }),
        ).toBe(false);
      } finally {
        consoleError.mockRestore();
      }
    });

    it('keeps detached triggers clickable when reparented (remove wrappers)', async () => {
      const testDialog = Dialog.createHandle();
      const { user, setProps } = await render(
        <DetachedTriggerReparentingTest handle={testDialog} nesting={3} />,
      );

      await openAndCloseDialog(user);

      await setProps({ nesting: 2 });
      await openAndCloseDialog(user);

      await setProps({ nesting: 1 });
      await openAndCloseDialog(user);

      await setProps({ nesting: 0 });
      await openAndCloseDialog(user);
    });

    it('keeps detached triggers clickable when reparented (add wrappers)', async () => {
      const testDialog = Dialog.createHandle();
      const { user, setProps } = await render(
        <DetachedTriggerReparentingTest handle={testDialog} nesting={0} />,
      );

      await openAndCloseDialog(user);

      await setProps({ nesting: 1 });
      await openAndCloseDialog(user);

      await setProps({ nesting: 2 });
      await openAndCloseDialog(user);

      await setProps({ nesting: 3 });
      await openAndCloseDialog(user);
    });

    it('keeps detached triggers clickable during Fast Refresh-like handle recreation', async () => {
      function DetachedTriggerTest({ handle }: { handle: ReturnType<typeof Dialog.createHandle> }) {
        return (
          <React.Fragment>
            <Dialog.Trigger handle={handle}>Trigger</Dialog.Trigger>
            <Dialog.Root handle={handle}>
              <Dialog.Portal>
                <Dialog.Popup>
                  Dialog Content
                  <Dialog.Close>Close</Dialog.Close>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          </React.Fragment>
        );
      }

      const handleA = Dialog.createHandle();
      const { user, setProps } = await render(<DetachedTriggerTest handle={handleA} />);

      await openAndCloseDialog(user);

      await setProps({ handle: Dialog.createHandle() });
      await openAndCloseDialog(user);

      await setProps({ handle: Dialog.createHandle() });
      await openAndCloseDialog(user);
    });

    it('keeps ARIA controls in sync when a detached handle is recreated while open', async () => {
      function DetachedTriggerTest({ handle }: { handle: ReturnType<typeof Dialog.createHandle> }) {
        return (
          <React.Fragment>
            <Dialog.Trigger id="trigger" handle={handle}>
              Trigger
            </Dialog.Trigger>
            <Dialog.Root handle={handle} open triggerId="trigger" modal={false}>
              <Dialog.Portal>
                <Dialog.Popup data-testid="popup">Dialog Content</Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          </React.Fragment>
        );
      }

      const { setProps } = await render(<DetachedTriggerTest handle={Dialog.createHandle()} />);

      let trigger = screen.getByRole('button', { name: 'Trigger' });
      let popup = await screen.findByTestId('popup');

      await waitFor(() => {
        expect(trigger.getAttribute('aria-controls')).toBe(popup.getAttribute('id'));
      });

      await setProps({ handle: Dialog.createHandle() });

      trigger = screen.getByRole('button', { name: 'Trigger' });
      popup = await screen.findByTestId('popup');

      await waitFor(() => {
        expect(trigger.getAttribute('aria-controls')).toBe(popup.getAttribute('id'));
      });
    });

    it('keeps detached triggers clickable when reparented during Fast Refresh-like handle recreation', async () => {
      const handleA = Dialog.createHandle();
      const { user, setProps } = await render(
        <DetachedTriggerReparentingTest handle={handleA} nesting={3} />,
      );

      await openAndCloseDialog(user);

      await setProps({ handle: Dialog.createHandle(), nesting: 2 });
      await openAndCloseDialog(user);

      await setProps({ handle: Dialog.createHandle(), nesting: 1 });
      await openAndCloseDialog(user);

      await setProps({ handle: Dialog.createHandle(), nesting: 0 });
      await openAndCloseDialog(user);
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
        expect(screen.getByTestId('content').textContent).toBe('1');
      });

      await user.click(trigger2);
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).toBe('2');
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
      expect(screen.getByTestId('dialog-popup')).toBe(popupElement);
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
        expect(screen.getByTestId('content').textContent).toBe('1');
      });

      const updateButton = screen.getByRole('button', { name: 'Update payloads' });
      await user.click(updateButton);
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).toBe('8');
      });
    });

    it('closes a non-modal dialog with Escape from an inactive detached trigger', async () => {
      const testDialog = Dialog.createHandle();
      const { user } = await render(
        <React.Fragment>
          <Dialog.Trigger handle={testDialog}>Trigger 1</Dialog.Trigger>
          <Dialog.Trigger handle={testDialog}>Trigger 2</Dialog.Trigger>
          <Dialog.Root handle={testDialog} modal={false}>
            <Dialog.Portal>
              <Dialog.Popup>Dialog Content</Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </React.Fragment>,
      );

      await user.click(screen.getByRole('button', { name: 'Trigger 1' }));
      await waitFor(() => {
        expect(screen.getByText('Dialog Content')).toBeVisible();
      });

      const inactiveTrigger = screen.getByRole('button', { name: 'Trigger 2' });
      await act(async () => inactiveTrigger.focus());
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByText('Dialog Content')).toBe(null);
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
      expect(screen.queryByRole('dialog')).toBe(null);

      await act(() => dialog.open('trigger'));
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBe(null);
      });

      expect(screen.getByTestId('content').textContent).toBe('Content');
      expect(trigger).toHaveAttribute('aria-expanded', 'true');

      await act(() => dialog.close());
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBe(null);
      });

      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('associates an imperative open-by-id with a persistent detached trigger after the root remounts', async () => {
      const dialog = Dialog.createHandle<number>();

      function App() {
        const [mounted, setMounted] = React.useState(true);

        return (
          <div>
            <Dialog.Trigger handle={dialog} id="trigger" payload={7}>
              Trigger
            </Dialog.Trigger>
            {!mounted && (
              <button type="button" onClick={() => setMounted(true)}>
                Remount root
              </button>
            )}
            {mounted && (
              <Dialog.Root handle={dialog}>
                {({ payload }: { payload: number | undefined }) => (
                  <React.Fragment>
                    <span data-testid="payload">{payload ?? 'No payload'}</span>
                    <Dialog.Portal>
                      <Dialog.Popup>
                        Dialog Content
                        <button type="button" onClick={() => setMounted(false)}>
                          Unmount root
                        </button>
                      </Dialog.Popup>
                    </Dialog.Portal>
                  </React.Fragment>
                )}
              </Dialog.Root>
            )}
          </div>
        );
      }

      const { user } = await render(<App />);
      const trigger = screen.getByRole('button', { name: 'Trigger' });

      await act(() => dialog.open('trigger'));
      await waitFor(() => {
        expect(screen.getByText('Dialog Content')).toBeVisible();
      });
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(trigger.getAttribute('aria-controls')).toBe(
        screen.getByRole('dialog').getAttribute('id'),
      );
      expect(screen.getByTestId('payload').textContent).toBe('7');

      await user.click(
        within(screen.getByRole('dialog')).getByRole('button', { name: 'Unmount root' }),
      );
      expect(screen.queryByRole('dialog')).toBe(null);

      await user.click(screen.getByRole('button', { name: 'Remount root' }));
      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
      });

      // The trigger stayed mounted across the remount, so an imperative open-by-id must still
      // associate it (ARIA + payload), not open unassociated.
      await act(() => dialog.open('trigger'));
      await waitFor(() => {
        expect(screen.getByText('Dialog Content')).toBeVisible();
      });
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(trigger.getAttribute('aria-controls')).toBe(
        screen.getByRole('dialog').getAttribute('id'),
      );
      expect(screen.getByTestId('payload').textContent).toBe('7');
    });

    it('stops resolving a handle-A trigger after the root switches to handle B', async () => {
      const handleA = Dialog.createHandle<number>();
      const handleB = Dialog.createHandle<number>();
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        function App() {
          const [handle, setHandle] = React.useState(handleA);
          return (
            <div>
              <Dialog.Trigger handle={handleA} id="a" payload={1}>
                A trigger
              </Dialog.Trigger>
              <button type="button" onClick={() => setHandle(handleB)}>
                Switch root to B
              </button>
              <Dialog.Root handle={handle} modal={false} disablePointerDismissal>
                <Dialog.Portal>
                  <Dialog.Popup>Dialog Content</Dialog.Popup>
                </Dialog.Portal>
              </Dialog.Root>
            </div>
          );
        }

        const { user } = await render(<App />);
        const aTrigger = screen.getByRole('button', { name: 'A trigger' });

        // Positive control: while the root is on handle A, opening by the A-trigger's id associates it.
        await act(() => handleA.open('a'));
        await waitFor(() => {
          expect(screen.getByText('Dialog Content')).toBeVisible();
        });
        expect(aTrigger).toHaveAttribute('aria-expanded', 'true');
        await act(() => handleA.close());
        await waitFor(() => {
          expect(screen.queryByText('Dialog Content')).toBe(null);
        });

        // The A-trigger stays mounted on handle A; only the root moves to handle B.
        await user.click(screen.getByRole('button', { name: 'Switch root to B' }));

        // Handle B's root must no longer resolve the handle-A trigger: the trigger followed its own
        // handle's store off the root's store, so open-by-id finds nothing and warns.
        consoleWarn.mockClear();
        await act(() => handleB.open('a'));
        await waitFor(() => {
          expect(screen.getByText('Dialog Content')).toBeVisible();
        });
        expect(aTrigger).toHaveAttribute('aria-expanded', 'false');
        expect(
          consoleWarn.mock.calls.some(
            ([message]) => typeof message === 'string' && message.includes('No trigger found'),
          ),
        ).toBe(true);
      } finally {
        consoleWarn.mockRestore();
      }
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
      expect(screen.queryByRole('dialog')).toBe(null);

      await act(() => dialog.open('trigger2'));
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBe(null);
      });

      expect(screen.getByTestId('content').textContent).toBe('2');
      expect(trigger2).toHaveAttribute('aria-expanded', 'true');
      expect(trigger1).not.toHaveAttribute('aria-expanded', 'true');

      await act(() => dialog.close());
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBe(null);
      });

      expect(trigger2).toHaveAttribute('aria-expanded', 'false');
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
      expect(screen.queryByRole('dialog')).toBe(null);

      await act(() => dialog.openWithPayload(8));
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBe(null);
      });

      expect(screen.getByTestId('content').textContent).toBe('8');
      expect(trigger1).not.toHaveAttribute('aria-expanded', 'true');
      expect(trigger2).not.toHaveAttribute('aria-expanded', 'true');

      await act(() => dialog.close());
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBe(null);
      });
    });
  });
});
