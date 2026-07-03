import { expect, vi } from 'vitest';
import * as React from 'react';
import type { UserEvent } from '@testing-library/user-event';
import { createRenderer, isJSDOM } from '#test-utils';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { Popover } from '@base-ui/react/popover';

describe('<Popover.Root />', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render, clock } = createRenderer();

  describe.skipIf(isJSDOM)('handle-backed root ownership', () => {
    type NumberPayload = { payload: number | undefined };

    it('ignores imperative handle calls made before a root is attached', async () => {
      const handle = Popover.createHandle<number>();

      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      handle.open('trigger');
      handle.close();
      const detachedWarnings = consoleWarn.mock.calls.filter(
        ([message]) =>
          typeof message === 'string' && message.includes('no root using this handle is mounted'),
      );
      consoleWarn.mockRestore();

      expect(handle.isOpen).toBe(false);
      expect(detachedWarnings).toHaveLength(2);

      const { user } = await render(
        <React.Fragment>
          <Popover.Trigger handle={handle} id="trigger" payload={1}>
            Trigger
          </Popover.Trigger>
          <Popover.Root handle={handle}>
            {({ payload }: NumberPayload) => (
              <React.Fragment>
                <span data-testid="payload">{payload ?? 'No payload'}</span>
                <Popover.Portal>
                  <Popover.Positioner>
                    <Popover.Popup>Popover Content</Popover.Popup>
                  </Popover.Positioner>
                </Popover.Portal>
              </React.Fragment>
            )}
          </Popover.Root>
        </React.Fragment>,
      );

      expect(screen.queryByText('Popover Content')).toBe(null);
      expect(screen.getByTestId('payload').textContent).toBe('No payload');

      await user.click(screen.getByRole('button', { name: 'Trigger' }));
      await waitFor(() => {
        expect(screen.getByText('Popover Content')).toBeVisible();
      });
      expect(screen.getByTestId('payload').textContent).toBe('1');
    });

    it('ignores imperative handle calls made after the root is detached', async () => {
      const handle = Popover.createHandle<number>();

      function App() {
        const [mounted, setMounted] = React.useState(true);

        return (
          <React.Fragment>
            <Popover.Trigger handle={handle} id="trigger" payload={1}>
              Trigger
            </Popover.Trigger>
            {!mounted && (
              <button type="button" onClick={() => setMounted(true)}>
                Remount root
              </button>
            )}
            {mounted && (
              <Popover.Root handle={handle}>
                {({ payload }: NumberPayload) => (
                  <React.Fragment>
                    <span data-testid="payload">{payload ?? 'No payload'}</span>
                    <Popover.Portal>
                      <Popover.Positioner>
                        <Popover.Popup>
                          Popover Content
                          <button type="button" onClick={() => setMounted(false)}>
                            Unmount root
                          </button>
                        </Popover.Popup>
                      </Popover.Positioner>
                    </Popover.Portal>
                  </React.Fragment>
                )}
              </Popover.Root>
            )}
          </React.Fragment>
        );
      }

      const { user } = await render(<App />);
      const trigger = screen.getByRole('button', { name: 'Trigger' });

      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByText('Popover Content')).toBeVisible();
      });
      expect(screen.getByTestId('payload').textContent).toBe('1');

      await user.click(screen.getByRole('button', { name: 'Unmount root' }));
      expect(handle.isOpen).toBe(false);
      await waitFor(() => {
        expect(screen.queryByText('Popover Content')).toBe(null);
      });

      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      handle.open('trigger');
      handle.close();
      const detachedWarnings = consoleWarn.mock.calls.filter(
        ([message]) =>
          typeof message === 'string' && message.includes('no root using this handle is mounted'),
      );
      consoleWarn.mockRestore();

      expect(handle.isOpen).toBe(false);
      expect(detachedWarnings).toHaveLength(2);

      await user.click(screen.getByRole('button', { name: 'Remount root' }));
      expect(screen.queryByText('Popover Content')).toBe(null);
      expect(screen.getByTestId('payload').textContent).toBe('No payload');

      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByText('Popover Content')).toBeVisible();
      });
      expect(screen.getByTestId('payload').textContent).toBe('1');
    });

    it('registers a detached trigger declared after the root', async () => {
      const handle = Popover.createHandle();

      const { user } = await render(
        <React.Fragment>
          <Popover.Root handle={handle}>
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup>Popover Content</Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
          <Popover.Trigger handle={handle} id="trigger">
            Trigger
          </Popover.Trigger>
        </React.Fragment>,
      );

      const trigger = screen.getByRole('button', { name: 'Trigger' });

      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByText('Popover Content')).toBeVisible();
      });

      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('throws when called with an unregistered trigger id', async () => {
      const handle = Popover.createHandle();

      await render(
        <React.Fragment>
          <Popover.Root handle={handle}>
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup>Popover Content</Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
          <Popover.Trigger handle={handle} id="trigger">
            Trigger
          </Popover.Trigger>
        </React.Fragment>,
      );

      expect(() => handle.open('missing')).toThrow('No trigger found with id "missing"');
      expect(handle.isOpen).toBe(false);
    });

    describe('multiple roots sharing one handle', () => {
      // Fake timers so the deferred overlap check only runs when ticked, after the handoff settles.
      clock.withFakeTimers();

      it('warns when a handle stays attached to more than one mounted root', async () => {
        const handle = Popover.createHandle();
        const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        await render(
          <React.Fragment>
            <Popover.Root handle={handle}>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup>First</Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
            <Popover.Root handle={handle}>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup>Second</Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </React.Fragment>,
        );

        // Both roots stay mounted, so the deferred check still sees the overlap and warns.
        clock.tick(20);

        const overlapWarned = consoleWarn.mock.calls.some(
          ([message]) =>
            typeof message === 'string' && message.includes('more than one mounted root'),
        );
        expect(overlapWarned).toBe(true);
        consoleWarn.mockRestore();
      });

      it('resolves a trigger still registered to the previous root during a transient overlap', async () => {
        const handle = Popover.createHandle();
        const openErrors: unknown[] = [];

        function OpenOnMount() {
          React.useLayoutEffect(() => {
            try {
              handle.open('trigger');
            } catch (error) {
              openErrors.push(error);
            }
          }, []);
          return null;
        }

        function App({ phase }: { phase: 'outgoing' | 'overlap' | 'incoming' }) {
          return (
            <React.Fragment>
              <Popover.Trigger handle={handle} id="trigger">
                Trigger
              </Popover.Trigger>
              {(phase === 'outgoing' || phase === 'overlap') && (
                <Popover.Root key="outgoing" handle={handle}>
                  <Popover.Portal>
                    <Popover.Positioner>
                      <Popover.Popup>Outgoing</Popover.Popup>
                    </Popover.Positioner>
                  </Popover.Portal>
                </Popover.Root>
              )}
              {(phase === 'overlap' || phase === 'incoming') && (
                <React.Fragment>
                  <Popover.Root key="incoming" handle={handle}>
                    <Popover.Portal>
                      <Popover.Positioner>
                        <Popover.Popup>Incoming</Popover.Popup>
                      </Popover.Positioner>
                    </Popover.Portal>
                  </Popover.Root>
                  <OpenOnMount />
                </React.Fragment>
              )}
            </React.Fragment>
          );
        }

        // The detached trigger settles into the outgoing root's store (it is no longer in the
        // fallback map). The incoming root then attaches while the outgoing one is still mounted,
        // and a layout effect in that same commit opens by trigger id — before the trigger has
        // migrated to the incoming root's store.
        const { setProps } = await render(<App phase="outgoing" />);
        await setProps({ phase: 'overlap' });

        expect(openErrors).toHaveLength(0);
        expect(handle.isOpen).toBe(true);
        expect(screen.getByRole('button', { name: 'Trigger' })).toHaveAttribute(
          'aria-expanded',
          'true',
        );

        // Completing the handoff (the outgoing root unmounts) keeps the popup open and associated.
        await setProps({ phase: 'incoming' });
        expect(handle.isOpen).toBe(true);
      });
    });
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

      expect(screen.queryByText('Popover Content')).toBe(null);

      await user.click(trigger1);
      expect(screen.getByText('Popover Content')).toBeVisible();
      await user.click(screen.getByText('Close'));
      expect(screen.queryByText('Popover Content')).toBe(null);

      await user.click(trigger2);
      expect(screen.getByText('Popover Content')).toBeVisible();
      await user.click(screen.getByText('Close'));
      expect(screen.queryByText('Popover Content')).toBe(null);

      await user.click(trigger3);
      expect(screen.getByText('Popover Content')).toBeVisible();
      await user.click(screen.getByText('Close'));
      expect(screen.queryByText('Popover Content')).toBe(null);
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
      expect(screen.getByTestId('content').textContent).toBe('1');

      await user.click(trigger2);
      expect(screen.getByTestId('content').textContent).toBe('2');
    });

    it('synchronizes ARIA attributes in controlled mode', async () => {
      await render(
        <Popover.Root open triggerId="trigger-2">
          <Popover.Trigger id="trigger-1">Trigger 1</Popover.Trigger>
          <Popover.Trigger id="trigger-2">Trigger 2</Popover.Trigger>

          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Popover Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });
      const popup = await screen.findByRole('dialog');

      expect(trigger1).toHaveAttribute('aria-expanded', 'false');
      expect(trigger1).not.toHaveAttribute('aria-controls');
      expect(trigger2).toHaveAttribute('aria-expanded', 'true');
      expect(trigger2.getAttribute('aria-controls')).toBe(popup.getAttribute('id'));
    });

    it('synchronizes ARIA attributes for a controlled open single trigger without triggerId', async () => {
      await render(
        <Popover.Root open>
          <Popover.Trigger>Trigger</Popover.Trigger>

          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Popover Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const trigger = screen.getByRole('button', { name: 'Trigger' });
      const popup = await screen.findByRole('dialog');

      await waitFor(() => {
        expect(trigger.getAttribute('aria-controls')).toBe(popup.getAttribute('id'));
      });
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
      expect(screen.getByTestId('popup')).toBe(popupElement);
      expect(screen.getByTestId('positioner')).toBe(positionerElement);
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
                        <Popover.Close>Close</Popover.Close>
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
          </div>
        );
      }

      const { user } = await render(<Test />);
      await user.click(screen.getByRole('button', { name: 'Open Trigger 1' }));
      expect(screen.getByTestId('content').textContent).toBe('1');
      const openTrigger2Button = screen.getByRole('button', { name: 'Open Trigger 2' });
      await user.click(openTrigger2Button);
      expect(screen.getByTestId('content').textContent).toBe('2');
      await user.click(screen.getByRole('button', { name: 'Close' }));
      expect(screen.queryByTestId('content')).toBe(null);
      expect(openTrigger2Button).toHaveFocus();
    });

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

      expect(screen.getByTestId('popup').textContent).toBe('2');
    });
  });

  describe.skipIf(isJSDOM)('multiple detached triggers', () => {
    type NumberPayload = { payload: number | undefined };

    function TriggerWithNesting({
      handle,
      nesting,
    }: {
      handle: ReturnType<typeof Popover.createHandle>;
      nesting: 0 | 1 | 2 | 3;
    }) {
      const trigger = (
        <Popover.Trigger handle={handle} id="trigger">
          Trigger
        </Popover.Trigger>
      );

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
      handle: ReturnType<typeof Popover.createHandle>;
      nesting: 0 | 1 | 2 | 3;
    }) {
      return (
        <React.Fragment>
          <TriggerWithNesting handle={handle} nesting={nesting} />
          <Popover.Root handle={handle}>
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup>
                  Popover Content
                  <Popover.Close>Close</Popover.Close>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        </React.Fragment>
      );
    }

    async function openAndClosePopover(user: UserEvent) {
      await user.click(screen.getByRole('button', { name: 'Trigger' }));
      await waitFor(() => {
        expect(screen.getByText('Popover Content')).toBeVisible();
      });
      await user.click(screen.getByText('Close'));
      await waitFor(() => {
        expect(screen.queryByText('Popover Content')).toBe(null);
      });
    }

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

      expect(screen.queryByText('Popover Content')).toBe(null);

      await user.click(trigger1);
      expect(screen.getByText('Popover Content')).toBeVisible();
      await user.click(screen.getByText('Close'));
      expect(screen.queryByText('Popover Content')).toBe(null);

      await user.click(trigger2);
      expect(screen.getByText('Popover Content')).toBeVisible();
      await user.click(screen.getByText('Close'));
      expect(screen.queryByText('Popover Content')).toBe(null);

      await user.click(trigger3);
      expect(screen.getByText('Popover Content')).toBeVisible();
      await user.click(screen.getByText('Close'));
      expect(screen.queryByText('Popover Content')).toBe(null);
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
      expect(screen.getByTestId('content').textContent).toBe('1');

      await user.click(trigger2);
      expect(screen.getByTestId('content').textContent).toBe('2');
    });

    it('keeps detached triggers clickable when reparented (remove wrappers)', async () => {
      const testPopover = Popover.createHandle();
      const { user, setProps } = await render(
        <DetachedTriggerReparentingTest handle={testPopover} nesting={3} />,
      );

      await openAndClosePopover(user);

      await setProps({ nesting: 2 });
      await openAndClosePopover(user);

      await setProps({ nesting: 1 });
      await openAndClosePopover(user);

      await setProps({ nesting: 0 });
      await openAndClosePopover(user);
    });

    it('keeps detached triggers clickable when reparented (add wrappers)', async () => {
      const testPopover = Popover.createHandle();
      const { user, setProps } = await render(
        <DetachedTriggerReparentingTest handle={testPopover} nesting={0} />,
      );

      await openAndClosePopover(user);

      await setProps({ nesting: 1 });
      await openAndClosePopover(user);

      await setProps({ nesting: 2 });
      await openAndClosePopover(user);

      await setProps({ nesting: 3 });
      await openAndClosePopover(user);
    });

    it('keeps detached triggers clickable when reparented during Fast Refresh-like handle recreation', async () => {
      const handleA = Popover.createHandle();
      const { user, setProps } = await render(
        <DetachedTriggerReparentingTest handle={handleA} nesting={3} />,
      );

      await openAndClosePopover(user);

      await setProps({ handle: Popover.createHandle(), nesting: 2 });
      await openAndClosePopover(user);

      await setProps({ handle: Popover.createHandle(), nesting: 1 });
      await openAndClosePopover(user);

      await setProps({ handle: Popover.createHandle(), nesting: 0 });
      await openAndClosePopover(user);
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
      expect(screen.getByTestId('popup')).toBe(popupElement);
      expect(screen.getByTestId('positioner')).toBe(positionerElement);
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
                      <Popover.Close data-testid="close" id="close-button">
                        Close
                      </Popover.Close>
                    </Popover.Popup>
                  </Popover.Positioner>
                </Popover.Portal>
              )}
            </Popover.Root>
            <span data-testid="active-trigger">{activeTrigger}</span>

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
      expect(screen.getByTestId('content').textContent).toBe('1');

      await waitFor(() => {
        expect(
          Math.abs(
            screen.getByTestId('positioner').getBoundingClientRect().left -
              trigger1.getBoundingClientRect().left,
          ),
        ).toBeLessThanOrEqual(1);
      });

      await user.click(screen.getByRole('button', { name: 'Open Trigger 2' }));
      expect(screen.getByTestId('content').textContent).toBe('2');
      expect(screen.getByTestId('active-trigger').textContent).toBe('trigger-2');
      await waitFor(() => {
        expect(
          Math.abs(
            screen.getByTestId('positioner').getBoundingClientRect().left -
              trigger2.getBoundingClientRect().left,
          ),
        ).toBeLessThanOrEqual(1);
      });
      expect(trigger2.previousElementSibling).toHaveAttribute('data-base-ui-focus-guard');
      expect(trigger2.nextElementSibling).toHaveAttribute('data-base-ui-focus-guard');

      await user.click(screen.getByTestId('close'));
      expect(screen.queryByTestId('content')).toBe(null);
      expect(screen.getByTestId('active-trigger').textContent).toBe('trigger-2');
      expect(trigger2.previousElementSibling).not.toHaveAttribute('data-base-ui-focus-guard');
      expect(trigger2.nextElementSibling).not.toHaveAttribute('data-base-ui-focus-guard');
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

      expect(screen.getByTestId('popup').textContent).toBe('2');
    });

    it('should not have inline scale style after switching triggers', async () => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      const testPopover = Popover.createHandle<number>();

      function Test() {
        return (
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
                  <Popover.Positioner>
                    <Popover.Popup data-testid="popup">
                      <Popover.Viewport>
                        <span data-testid="content">{payload}</span>
                      </Popover.Viewport>
                    </Popover.Popup>
                  </Popover.Positioner>
                </Popover.Portal>
              )}
            </Popover.Root>
          </React.Fragment>
        );
      }

      const { user } = await render(<Test />);

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      // Open with Trigger 1
      await user.click(trigger1);
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).toBe('1');
      });

      // Switch to Trigger 2
      await user.click(trigger2);
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).toBe('2');
      });

      // The popup should not have an inline scale style that would override CSS transitions
      const popup = screen.getByTestId('popup');
      expect(popup.style.scale).toBe('');
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
      expect(screen.queryByRole('dialog')).toBe(null);

      await act(() => popover.open('trigger'));
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBe(null);
      });

      expect(screen.getByTestId('content').textContent).toBe('Content');
      expect(trigger).toHaveAttribute('aria-expanded', 'true');

      await act(() => popover.close());
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBe(null);
      });

      expect(trigger).toHaveAttribute('aria-expanded', 'false');
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
      expect(screen.queryByRole('dialog')).toBe(null);

      await act(() => popover.open('trigger2'));
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBe(null);
      });

      expect(screen.getByTestId('content').textContent).toBe('2');
      expect(trigger2).toHaveAttribute('aria-expanded', 'true');
      expect(trigger1).not.toHaveAttribute('aria-expanded', 'true');

      await act(() => popover.close());
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBe(null);
      });

      expect(trigger2).toHaveAttribute('aria-expanded', 'false');
    });
  });
});
