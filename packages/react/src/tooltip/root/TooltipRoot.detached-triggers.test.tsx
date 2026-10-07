import { vi, expect, describe, beforeEach, it } from 'vitest';
import * as React from 'react';
import * as ReactDOMClient from 'react-dom/client';
import * as ReactDOMServer from 'react-dom/server';
import {
  createRenderer,
  detachedTriggersConformanceTests,
  isJSDOM,
  resetBrowserPointer,
} from '#test-utils';
import { Tooltip } from '@base-ui/react/tooltip';
import { screen, waitFor, act, fireEvent, flushMicrotasks } from '@mui/internal-test-utils';

describe('<Tooltip.Root />', () => {
  // Tests here leave the real pointer resting on a trigger, which the next render would put a
  // fresh trigger under, opening the tooltip before the test interacts.
  beforeEach(resetBrowserPointer);

  beforeEach(async () => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;

    await act(async () => {
      document.body.click();
    });

    // Wait for all tooltips to unmount (`expect` is not allowed outside test blocks)
    await waitFor(() => {
      const tooltips = document.querySelectorAll('[data-open]');
      if (tooltips.length > 0) {
        throw new Error(`${tooltips.length} tooltips still mounted`);
      }
    });
  });

  const { render, renderToString } = createRenderer();

  it.skipIf(!isJSDOM)(
    'keeps a default-open root open until its detached trigger hydrates',
    async () => {
      const handle = Tooltip.createHandle();
      let suspend = false;
      let resume: (() => void) | undefined;
      const hydrationGate = new Promise<void>((resolve) => {
        resume = resolve;
      });

      function DelayedTrigger(): React.JSX.Element {
        if (suspend) {
          throw hydrationGate;
        }

        return (
          <Tooltip.Trigger handle={handle} id="trigger">
            Trigger
          </Tooltip.Trigger>
        );
      }

      function App() {
        return (
          <React.Fragment>
            <Tooltip.Root handle={handle} defaultOpen defaultTriggerId="trigger" />
            <React.Suspense fallback="Loading">
              <DelayedTrigger />
            </React.Suspense>
          </React.Fragment>
        );
      }

      const { hydrate } = renderToString(<App />);
      const trigger = screen.getByRole('button', { name: 'Trigger' });
      expect(trigger).not.toHaveAttribute('data-popup-open');

      suspend = true;
      hydrate();

      try {
        await waitFor(() => {
          expect(handle.isOpen).toBe(true);
        });
        await flushMicrotasks();
        expect(handle.isOpen).toBe(true);
      } finally {
        suspend = false;
        await act(async () => {
          resume?.();
          await hydrationGate;
        });
      }

      await waitFor(() => {
        expect(trigger).toHaveAttribute('data-popup-open');
      });
    },
  );

  it.skipIf(!isJSDOM)(
    'keeps an open root open when ownership moves to a trigger that has not hydrated',
    async () => {
      const handle = Tooltip.createHandle();
      const onOpenChange = vi.fn();

      function TriggerB(): React.JSX.Element {
        return (
          <Tooltip.Trigger handle={handle} id="trigger-b">
            Trigger B
          </Tooltip.Trigger>
        );
      }

      function App() {
        const [open, setOpen] = React.useState(true);
        const [activeTriggerId, setActiveTriggerId] = React.useState('trigger-a');

        return (
          <React.Fragment>
            <button type="button" onClick={() => setActiveTriggerId('trigger-b')}>
              Switch to B
            </button>
            <Tooltip.Root
              handle={handle}
              open={open}
              triggerId={activeTriggerId}
              onOpenChange={(nextOpen, eventDetails) => {
                onOpenChange(nextOpen, eventDetails);
                setOpen(nextOpen);
              }}
            />
            {activeTriggerId === 'trigger-a' && (
              <Tooltip.Trigger handle={handle} id="trigger-a">
                Trigger A
              </Tooltip.Trigger>
            )}
          </React.Fragment>
        );
      }

      const { hydrate } = renderToString(<App />);
      const triggerBContainer = document.createElement('div');
      triggerBContainer.innerHTML = ReactDOMServer.renderToString(<TriggerB />);
      document.body.appendChild(triggerBContainer);

      let triggerBRoot: ReactDOMClient.Root | undefined;
      try {
        hydrate();

        await waitFor(() => {
          expect(handle.isOpen).toBe(true);
        });

        fireEvent.click(screen.getByRole('button', { name: 'Switch to B' }));
        await flushMicrotasks();

        expect(onOpenChange).not.toHaveBeenCalled();
        expect(handle.isOpen).toBe(true);

        await act(async () => {
          triggerBRoot = ReactDOMClient.hydrateRoot(triggerBContainer, <TriggerB />);
        });

        await waitFor(() => {
          expect(screen.getByRole('button', { name: 'Trigger B' })).toHaveAttribute(
            'data-popup-open',
          );
        });
      } finally {
        await act(async () => {
          triggerBRoot?.unmount();
        });
        triggerBContainer.remove();
      }
    },
  );

  detachedTriggersConformanceTests({
    render,
    createHandle: Tooltip.createHandle,
    Root: Tooltip.Root,
    Trigger: Tooltip.Trigger,
    Portal: Tooltip.Portal,
    Positioner: Tooltip.Positioner,
    Popup: Tooltip.Popup,
    Viewport: Tooltip.Viewport,
    // Keeps the real browser pointer from hovering the triggers; the suite dispatches the events.
    triggerProps: { delay: 0, style: { pointerEvents: 'none' } },
    openInteractions: ['hover', 'focus'],
    ariaExpanded: false,
    throwOnMissingTrigger: true,
  });

  describe.skipIf(isJSDOM)('handle-backed root ownership', () => {
    it('keeps a default-open root open while a detached trigger migrates after the initial commit', async () => {
      const handle = Tooltip.createHandle();
      const onOpenChange = vi.fn();
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = ReactDOMClient.createRoot(container);

      let isOpen = false;
      let popupIsOpen = false;
      let unexpectedErrors: unknown[][] = [];

      try {
        root.render(
          <React.Fragment>
            <Tooltip.Root
              handle={handle}
              defaultOpen
              defaultTriggerId="trigger"
              onOpenChange={onOpenChange}
            >
              <Tooltip.Portal>
                <Tooltip.Positioner>
                  <Tooltip.Popup data-testid="default-open-content">Content</Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </Tooltip.Root>
            <Tooltip.Trigger handle={handle} id="trigger">
              Trigger
            </Tooltip.Trigger>
          </React.Fragment>,
        );

        // Rendering outside act preserves the browser's native ordering: the queued "lost trigger"
        // microtask runs before useSyncExternalStore's passive subscription migrates the trigger.
        await waitFor(() => {
          expect(screen.getByRole('button', { name: 'Trigger' })).toHaveAttribute(
            'data-popup-open',
          );
        });

        isOpen = handle.isOpen;
        popupIsOpen =
          document
            .querySelector('[data-testid="default-open-content"]')
            ?.hasAttribute('data-open') ?? false;
      } finally {
        root.unmount();
        container.remove();
        // The spy only exists to silence the act() warnings caused by rendering outside act.
        unexpectedErrors = consoleError.mock.calls.filter(
          (call) => !String(call[0]).includes('act(...)'),
        );
        consoleError.mockRestore();
      }

      expect(unexpectedErrors).toEqual([]);
      expect(isOpen).toBe(true);
      expect(popupIsOpen).toBe(true);
      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });

  describe.skipIf(isJSDOM)('multiple triggers within Root', () => {
    type NumberPayload = { payload: number | undefined };

    it('hands off open state and payload to a trigger with its own DOM id while open', async () => {
      await render(
        <Tooltip.Root>
          {({ payload }: NumberPayload) => (
            <React.Fragment>
              <Tooltip.Trigger
                payload={1}
                delay={0}
                closeDelay={0}
                style={{ pointerEvents: 'none' }}
              >
                Trigger 1
              </Tooltip.Trigger>
              <Tooltip.Trigger
                payload={2}
                delay={0}
                closeDelay={0}
                style={{ pointerEvents: 'none' }}
                render={<button id="custom-button" type="button" />}
              >
                Trigger 2
              </Tooltip.Trigger>

              <Tooltip.Portal>
                <Tooltip.Positioner>
                  <Tooltip.Popup>
                    <span data-testid="content">{payload}</span>
                  </Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </React.Fragment>
          )}
        </Tooltip.Root>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      // Focus handoff keeps the popup open across the switch, so `open`/`triggerCount` do not change.
      await act(async () => trigger1.focus());
      await flushMicrotasks();
      expect(screen.getByTestId('content').textContent).toBe('1');

      await act(async () => trigger2.focus());
      await flushMicrotasks();
      expect(trigger2).toHaveAttribute('data-popup-open');
      expect(screen.getByTestId('content').textContent).toBe('2');
    });

    it('should close when the active trigger unmounts', async () => {
      let removeFirstTrigger: () => void = () => {};

      function Test() {
        const [showFirstTrigger, setShowFirstTrigger] = React.useState(true);
        removeFirstTrigger = () => setShowFirstTrigger(false);

        return (
          <div style={{ padding: 50 }}>
            <Tooltip.Root defaultOpen defaultTriggerId="trigger-1">
              {({ payload }: NumberPayload) => (
                <React.Fragment>
                  <div style={{ display: 'flex', gap: 120 }}>
                    {showFirstTrigger && (
                      <Tooltip.Trigger id="trigger-1" payload={1} delay={0}>
                        Trigger 1
                      </Tooltip.Trigger>
                    )}
                    <Tooltip.Trigger id="trigger-2" payload={2} delay={0}>
                      Trigger 2
                    </Tooltip.Trigger>
                  </div>

                  <Tooltip.Portal>
                    <Tooltip.Positioner side="bottom" align="start">
                      <Tooltip.Popup>
                        <span data-testid="content">{payload}</span>
                      </Tooltip.Popup>
                    </Tooltip.Positioner>
                  </Tooltip.Portal>
                </React.Fragment>
              )}
            </Tooltip.Root>
          </div>
        );
      }

      await render(<Test />);

      expect(await screen.findByTestId('content')).toHaveTextContent('1');

      await act(async () => removeFirstTrigger());

      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await waitFor(() => {
        expect(screen.queryByTestId('content')).toBe(null);
      });
      expect(screen.queryByRole('button', { name: 'Trigger 1' })).toBe(null);
      expect(trigger2).not.toHaveAttribute('data-popup-open');
    });

    it('should remain open when the active trigger unmount close is canceled', async () => {
      let removeFirstTrigger: () => void = () => {};
      const onOpenChange = vi.fn((nextOpen, details: Tooltip.Root.ChangeEventDetails) => {
        if (!nextOpen) {
          details.cancel();
        }
      });

      function Test() {
        const [showFirstTrigger, setShowFirstTrigger] = React.useState(true);
        removeFirstTrigger = () => setShowFirstTrigger(false);

        return (
          <div style={{ padding: 50 }}>
            <Tooltip.Root defaultOpen defaultTriggerId="trigger-1" onOpenChange={onOpenChange}>
              {({ payload }: NumberPayload) => (
                <React.Fragment>
                  <div style={{ display: 'flex', gap: 120 }}>
                    {showFirstTrigger && (
                      <Tooltip.Trigger id="trigger-1" payload={1} delay={0}>
                        Trigger 1
                      </Tooltip.Trigger>
                    )}
                    <Tooltip.Trigger id="trigger-2" payload={2} delay={0}>
                      Trigger 2
                    </Tooltip.Trigger>
                  </div>

                  <Tooltip.Portal>
                    <Tooltip.Positioner side="bottom" align="start">
                      <Tooltip.Popup>
                        <span data-testid="content">{payload}</span>
                      </Tooltip.Popup>
                    </Tooltip.Positioner>
                  </Tooltip.Portal>
                </React.Fragment>
              )}
            </Tooltip.Root>
          </div>
        );
      }

      await render(<Test />);

      expect(await screen.findByTestId('content')).toHaveTextContent('1');

      await act(async () => removeFirstTrigger());

      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(
          false,
          expect.objectContaining({ reason: 'none' }),
        );
      });
      expect(screen.queryByRole('button', { name: 'Trigger 1' })).toBe(null);
      expect(trigger2).not.toHaveAttribute('data-popup-open');
      expect(screen.getByTestId('content')).toHaveTextContent('1');
    });
  });

  describe.skipIf(isJSDOM)('multiple detached triggers', () => {
    type NumberPayload = { payload: number | undefined };

    it('should close when focusing a disabled trigger while another trigger is open', async () => {
      const testTooltip = Tooltip.createHandle<number>();
      await render(
        <div>
          <Tooltip.Trigger handle={testTooltip} payload={1}>
            Trigger 1
          </Tooltip.Trigger>
          <Tooltip.Trigger handle={testTooltip} payload={2} disabled>
            Trigger 2
          </Tooltip.Trigger>

          <Tooltip.Root handle={testTooltip}>
            {({ payload }: NumberPayload) => (
              <Tooltip.Portal>
                <Tooltip.Positioner>
                  <Tooltip.Popup>
                    <span data-testid="content">{payload}</span>
                  </Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            )}
          </Tooltip.Root>
        </div>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await act(async () => trigger1.focus());
      await flushMicrotasks();
      expect(screen.getByTestId('content').textContent).toBe('1');

      await act(async () => trigger2.focus());
      await flushMicrotasks();
      await waitFor(() => {
        expect(screen.queryByTestId('content')).toBe(null);
      });
      expect(trigger2).not.toHaveAttribute('data-popup-open');
    });

    it('should close when the active detached trigger unmounts', async () => {
      const testTooltip = Tooltip.createHandle<number>();
      let removeFirstTrigger: () => void = () => {};

      function Test() {
        const [showFirstTrigger, setShowFirstTrigger] = React.useState(true);
        removeFirstTrigger = () => setShowFirstTrigger(false);

        return (
          <div style={{ padding: 50 }}>
            <div style={{ display: 'flex', gap: 120 }}>
              {showFirstTrigger && (
                <Tooltip.Trigger handle={testTooltip} id="trigger-1" payload={1} delay={0}>
                  Trigger 1
                </Tooltip.Trigger>
              )}
              <Tooltip.Trigger handle={testTooltip} id="trigger-2" payload={2} delay={0}>
                Trigger 2
              </Tooltip.Trigger>
            </div>

            <Tooltip.Root handle={testTooltip} defaultOpen defaultTriggerId="trigger-1">
              {({ payload }: NumberPayload) => (
                <Tooltip.Portal>
                  <Tooltip.Positioner side="bottom" align="start">
                    <Tooltip.Popup>
                      <span data-testid="content">{payload}</span>
                    </Tooltip.Popup>
                  </Tooltip.Positioner>
                </Tooltip.Portal>
              )}
            </Tooltip.Root>
          </div>
        );
      }

      await render(<Test />);

      expect(await screen.findByTestId('content')).toHaveTextContent('1');

      await act(async () => removeFirstTrigger());

      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await waitFor(() => {
        expect(screen.queryByTestId('content')).toBe(null);
      });
      expect(screen.queryByRole('button', { name: 'Trigger 1' })).toBe(null);
      expect(trigger2).not.toHaveAttribute('data-popup-open');
    });

    it('should close when hovering a disabled trigger while another trigger is open', async () => {
      const testTooltip = Tooltip.createHandle<number>();
      await render(
        <div>
          <Tooltip.Trigger
            handle={testTooltip}
            payload={1}
            delay={0}
            style={{ pointerEvents: 'none' }}
          >
            Trigger 1
          </Tooltip.Trigger>
          <Tooltip.Trigger
            handle={testTooltip}
            payload={2}
            disabled
            style={{ pointerEvents: 'none' }}
          >
            Trigger 2
          </Tooltip.Trigger>

          <Tooltip.Root handle={testTooltip}>
            {({ payload }: NumberPayload) => (
              <Tooltip.Portal>
                <Tooltip.Positioner>
                  <Tooltip.Popup>
                    <span data-testid="content">{payload}</span>
                  </Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            )}
          </Tooltip.Root>
        </div>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      fireEvent.mouseEnter(trigger1);
      fireEvent.mouseMove(trigger1);
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).toBe('1');
      });

      fireEvent.mouseLeave(trigger1);
      fireEvent.mouseEnter(trigger2);
      fireEvent.mouseMove(trigger2);
      await waitFor(() => {
        expect(screen.queryByTestId('content')).toBe(null);
      });
      expect(trigger2).not.toHaveAttribute('data-popup-open');
    });

    it('should switch to a rendered disabled button trigger when trigger hover is enabled', async () => {
      const testTooltip = Tooltip.createHandle<number>();
      await render(
        <div>
          <Tooltip.Trigger
            handle={testTooltip}
            payload={1}
            delay={0}
            style={{ pointerEvents: 'none' }}
          >
            Trigger 1
          </Tooltip.Trigger>
          <Tooltip.Trigger
            handle={testTooltip}
            payload={2}
            delay={0}
            style={{ pointerEvents: 'none' }}
            render={
              <button type="button" disabled>
                Trigger 2
              </button>
            }
          />

          <Tooltip.Root handle={testTooltip}>
            {({ payload }: NumberPayload) => (
              <Tooltip.Portal>
                <Tooltip.Positioner>
                  <Tooltip.Popup>
                    <span data-testid="content">{payload}</span>
                  </Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            )}
          </Tooltip.Root>
        </div>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      fireEvent.mouseEnter(trigger1);
      fireEvent.mouseMove(trigger1);
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).toBe('1');
      });

      fireEvent.mouseLeave(trigger1);
      fireEvent.mouseEnter(trigger2);
      fireEvent.mouseMove(trigger2);
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).toBe('2');
      });
      await waitFor(() => {
        expect(trigger2).toHaveAttribute('data-popup-open');
      });
    });
  });
});
