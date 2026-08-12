import { expect } from 'vitest';
import * as React from 'react';
import { Tooltip } from '@base-ui/react/tooltip';
import { act, ignoreActWarnings, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, describeConformance, isJSDOM, waitSingleFrame } from '#test-utils';

describe('<Tooltip.Viewport />', () => {
  const { render } = createRenderer();

  describeConformance(<Tooltip.Viewport />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Tooltip.Root open>
          <Tooltip.Trigger>Trigger</Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>{node}</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>,
      );
    },
  }));

  it('should render children in the `current` container by default', async () => {
    await render(
      <Tooltip.Root open>
        <Tooltip.Trigger>Trigger</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup>
              <Tooltip.Viewport>
                <div data-testid="content">Content</div>
              </Tooltip.Viewport>
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>,
    );

    const currentContainer = screen.getByTestId('content').closest('[data-current]');
    expect(currentContainer).not.toBe(null);
    expect(currentContainer!.textContent).toBe('Content');
  });

  it.skipIf(isJSDOM)('should mirror the instant animation type of the tooltip', async () => {
    await render(
      <Tooltip.Root>
        <Tooltip.Trigger delay={0} closeDelay={0}>
          Trigger
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup>
              <Tooltip.Viewport data-testid="viewport">Content</Tooltip.Viewport>
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>,
    );

    const trigger = screen.getByRole('button', { name: 'Trigger' });

    await act(async () => trigger.focus());

    await waitFor(() => {
      expect(screen.getByTestId('viewport')).toHaveAttribute('data-instant', 'focus');
    });
  });

  it('should remount the `current` container when the active trigger changes', async () => {
    ignoreActWarnings();
    await render(
      <Tooltip.Root>
        {({ payload }) => (
          <React.Fragment>
            <Tooltip.Trigger payload="first" delay={0} data-testid="trigger1">
              Trigger 1
            </Tooltip.Trigger>
            <Tooltip.Trigger payload="second" delay={0} data-testid="trigger2">
              Trigger 2
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup>
                  <Tooltip.Viewport>
                    {payload === 'first' ? (
                      <img data-testid="payload-image-1" src="about:blank" alt="Preview 1" />
                    ) : null}
                    {payload === 'second' ? (
                      <img data-testid="payload-image-2" src="about:blank" alt="Preview 2" />
                    ) : null}
                  </Tooltip.Viewport>
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </React.Fragment>
        )}
      </Tooltip.Root>,
    );

    const trigger1 = screen.getByTestId('trigger1');
    const trigger2 = screen.getByTestId('trigger2');

    await waitSingleFrame();
    await act(async () => trigger1.focus());

    const firstImage = await screen.findByTestId('payload-image-1');
    const firstContainer = firstImage.closest('[data-current]');
    expect(firstContainer).not.toBe(null);

    await waitSingleFrame();
    await act(async () => trigger2.focus());

    await waitFor(() => {
      const secondImage = screen.getByTestId('payload-image-2');
      const secondContainer = secondImage.closest('[data-current]');
      expect(secondContainer).not.toBe(null);
      expect(secondContainer).not.toBe(firstContainer);
    });
  });

  describe.skipIf(isJSDOM)('morphing containers with multiple triggers and payloads', () => {
    beforeEach(() => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
    });

    afterEach(() => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
    });

    it('should create morphing containers during transitions', async () => {
      ignoreActWarnings();
      await render(
        <div>
          <style>
            {`
              [data-transitioning] [data-previous] {
                animation: slide-out 0.3s ease-out forwards;
              }
              [data-transitioning] [data-current] {
                animation: slide-in 0.3s ease-out forwards;
              }
              @keyframes slide-out {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(-30%); opacity: 0; }
              }
              @keyframes slide-in {
                from { transform: translateX(30%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
              }
            `}
          </style>
          <Tooltip.Root>
            {({ payload }) => (
              <React.Fragment>
                <Tooltip.Trigger
                  payload={0}
                  delay={0}
                  data-testid="trigger1"
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    width: '100px',
                    height: '50px',
                  }}
                >
                  Trigger 1
                </Tooltip.Trigger>
                <Tooltip.Trigger
                  payload={1}
                  delay={0}
                  data-testid="trigger2"
                  style={{
                    position: 'absolute',
                    top: '100px',
                    left: '200px',
                    width: '100px',
                    height: '50px',
                  }}
                >
                  Trigger 2
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Positioner>
                    <Tooltip.Popup>
                      <Tooltip.Viewport>
                        <div data-testid="content">Content {payload as number}</div>
                      </Tooltip.Viewport>
                    </Tooltip.Popup>
                  </Tooltip.Positioner>
                </Tooltip.Portal>
              </React.Fragment>
            )}
          </Tooltip.Root>
        </div>,
      );

      const trigger1 = screen.getByTestId('trigger1');
      const trigger2 = screen.getByTestId('trigger2');

      await waitSingleFrame();
      await act(async () => trigger1.focus());

      await waitFor(() => {
        expect(screen.getByText('Content 0')).toBeVisible();
      });

      await waitSingleFrame();
      await act(async () => trigger2.focus());

      // Check for morphing containers during transition
      let previousContainer: HTMLElement | null = null;
      await waitFor(() => {
        previousContainer = document.querySelector('[data-previous]');
        expect(previousContainer).not.toBe(null);
      });

      expect(previousContainer).toHaveAttribute('inert');
      expect(previousContainer!.textContent).toBe('Content 0');

      const nextContainer = document.querySelector('[data-current]');
      expect(nextContainer).not.toBe(null);
      expect(nextContainer!.textContent).toBe('Content 1');

      // Verify they are cleaned up after animation
      await waitFor(() => {
        expect(document.querySelector('[data-previous]')).toBe(null);
      });

      expect(document.querySelector('[data-current]')).toBeVisible();
      expect(await screen.findByText('Content 1')).toBeVisible();
    });

    it('keeps the latest transition active during rapid trigger changes', async () => {
      ignoreActWarnings();
      function TestComponent() {
        return (
          <div>
            <style>
              {`
              [data-transitioning] [data-previous] {
                animation: slide-out 10s ease-out forwards;
              }
              [data-transitioning] [data-current] {
                animation: slide-in 10s ease-out forwards;
              }
              @keyframes slide-out {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(-30%); opacity: 0; }
              }
              @keyframes slide-in {
                from { transform: translateX(30%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
              }
            `}
            </style>
            <Tooltip.Root>
              {({ payload }) => (
                <React.Fragment>
                  <Tooltip.Trigger payload={1} delay={0} data-testid="trigger1">
                    Trigger 1
                  </Tooltip.Trigger>
                  <Tooltip.Trigger payload={2} delay={0} data-testid="trigger2">
                    Trigger 2
                  </Tooltip.Trigger>
                  <Tooltip.Trigger payload={3} delay={0} data-testid="trigger3">
                    Trigger 3
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Positioner>
                      <Tooltip.Popup>
                        <Tooltip.Viewport data-testid="viewport">
                          Content {payload as number}
                        </Tooltip.Viewport>
                      </Tooltip.Popup>
                    </Tooltip.Positioner>
                  </Tooltip.Portal>
                </React.Fragment>
              )}
            </Tooltip.Root>
          </div>
        );
      }

      await render(<TestComponent />);

      const trigger1 = screen.getByTestId('trigger1');
      const trigger2 = screen.getByTestId('trigger2');
      const trigger3 = screen.getByTestId('trigger3');

      await waitSingleFrame();
      await act(async () => trigger1.focus());
      await waitSingleFrame();
      await act(async () => trigger2.focus());

      await waitFor(() => {
        const currentContainer = screen.getByText('Content 2').closest('[data-current]');
        expect(currentContainer?.getAnimations().length).toBe(1);
      });
      // Allow `useAnimationsFinished` to begin waiting before replacing the current container.
      await waitSingleFrame();

      await act(async () => trigger3.focus());
      await waitSingleFrame();

      const currentContainer = screen.getByText('Content 3').closest('[data-current]');
      expect(currentContainer?.getAnimations().length).toBe(1);
      expect(screen.getByTestId('viewport')).toHaveAttribute('data-transitioning');
      expect(document.querySelector('[data-previous]')).toHaveTextContent('Content 2');
    });

    it('cleans up the transition when a lagging payload remounts the current container', async () => {
      ignoreActWarnings();

      let setPayload2: ((value: string | undefined) => void) | undefined;

      function TestComponent() {
        const [payload2, setPayload2State] = React.useState<string | undefined>(undefined);
        setPayload2 = setPayload2State;

        return (
          <div>
            <style>
              {`
              [data-transitioning] [data-current] {
                transition: transform 10s linear, opacity 10s linear;
              }
              [data-transitioning] [data-current][data-starting-style] {
                transform: translateX(30%);
                opacity: 0;
              }
              [data-transitioning] [data-previous] {
                transition: transform 10s linear, opacity 10s linear;
              }
              [data-transitioning] [data-previous][data-ending-style] {
                transform: translateX(-30%);
                opacity: 0;
              }
            `}
            </style>
            <Tooltip.Root>
              {({ payload }) => (
                <React.Fragment>
                  <Tooltip.Trigger
                    delay={0}
                    data-testid="trigger1"
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      width: '100px',
                      height: '50px',
                    }}
                  >
                    Trigger 1
                  </Tooltip.Trigger>
                  <Tooltip.Trigger
                    payload={payload2}
                    delay={0}
                    data-testid="trigger2"
                    style={{
                      position: 'absolute',
                      top: '100px',
                      left: '200px',
                      width: '100px',
                      height: '50px',
                    }}
                  >
                    Trigger 2
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Positioner>
                      <Tooltip.Popup>
                        <Tooltip.Viewport data-testid="viewport">
                          Content {String(payload)}
                        </Tooltip.Viewport>
                      </Tooltip.Popup>
                    </Tooltip.Positioner>
                  </Tooltip.Portal>
                </React.Fragment>
              )}
            </Tooltip.Root>
          </div>
        );
      }

      await render(<TestComponent />);

      const trigger1 = screen.getByTestId('trigger1');
      const trigger2 = screen.getByTestId('trigger2');

      await waitSingleFrame();
      await act(async () => trigger1.focus());

      await waitFor(() => {
        expect(document.querySelector('[data-current]')).not.toBe(null);
      });

      await waitSingleFrame();
      await act(async () => trigger2.focus());

      // The morph is in progress: the previous snapshot exists and both containers
      // are running their (long) transitions.
      await waitFor(() => {
        expect(document.querySelector('[data-previous]')).not.toBe(null);
      });
      await waitFor(() => {
        expect(
          document.querySelector('[data-previous]')?.getAnimations().length,
        ).toBeGreaterThanOrEqual(1);
      });
      await waitFor(() => {
        expect(
          document.querySelector('[data-current]')?.getAnimations().length,
        ).toBeGreaterThanOrEqual(1);
      });

      // Allow `useAnimationsFinished` to begin waiting before the container is replaced.
      await waitSingleFrame();
      await waitSingleFrame();

      const containerBeforePayload = document.querySelector('[data-current]');

      // The payload for the already-active trigger arrives a render later, which
      // bumps the content key and remounts the current container mid-morph.
      await act(async () => {
        setPayload2?.('ready');
      });

      await waitFor(() => {
        expect(document.querySelector('[data-current]')).not.toBe(containerBeforePayload);
      });

      // The remounted container must restart its entry transition, otherwise the
      // cleanup watcher finds nothing to await and truncates the exit transition.
      await waitFor(() => {
        expect(
          document.querySelector('[data-current]')?.getAnimations().length,
        ).toBeGreaterThanOrEqual(1);
      });

      // The previous container's exit transition is still running, so it must not
      // have been torn down in the frames right after the remount.
      await waitSingleFrame();
      await waitSingleFrame();
      await waitSingleFrame();
      await waitSingleFrame();
      expect(document.querySelector('[data-previous]')).not.toBe(null);

      // Finish the live animations so the cleanup watcher can settle.
      await waitFor(async () => {
        await act(async () => {
          document.querySelectorAll('[data-previous], [data-current]').forEach((el) => {
            el.getAnimations().forEach((animation) => animation.finish());
          });
        });
        expect(document.querySelector('[data-previous]')).toBe(null);
      });

      await waitFor(() => {
        expect(screen.getByTestId('viewport')).not.toHaveAttribute('data-transitioning');
      });
    });

    it.each([
      {
        name: 'should calculate "right down" direction',
        trigger1: { top: 10, left: 10 },
        trigger2: { top: 100, left: 200 },
        expectedDirection: ['right', 'down'],
      },
      {
        name: 'should calculate "left up" direction',
        trigger1: { top: 100, left: 200 },
        trigger2: { top: 10, left: 10 },
        expectedDirection: ['left', 'up'],
      },
      {
        name: 'should calculate "right" direction (horizontal only)',
        trigger1: { top: 50, left: 10 },
        trigger2: { top: 52, left: 200 }, // 2px vertical difference within tolerance
        expectedDirection: ['right'],
      },
      {
        name: 'should calculate "down" direction (vertical only)',
        trigger1: { top: 10, left: 50 },
        trigger2: { top: 100, left: 52 }, // 2px horizontal difference within tolerance
        expectedDirection: ['down'],
      },
      {
        name: 'should handle tolerance for small differences',
        trigger1: { top: 50, left: 50 },
        trigger2: { top: 52, left: 52 }, // Both differences within 5px tolerance
        expectedDirection: [],
      },
      {
        name: 'should calculate "left down" direction',
        trigger1: { top: 10, left: 200 },
        trigger2: { top: 100, left: 10 },
        expectedDirection: ['left', 'down'],
      },
      {
        name: 'should calculate "right up" direction',
        trigger1: { top: 100, left: 10 },
        trigger2: { top: 10, left: 200 },
        expectedDirection: ['right', 'up'],
      },
    ])('$name', async ({ trigger1, trigger2, expectedDirection }) => {
      ignoreActWarnings();
      await render(
        <div>
          <style>
            {`
              [data-transitioning] [data-previous] {
                animation: slide-out 0.2s ease-out forwards;
              }
              [data-transitioning] [data-current] {
                animation: slide-in 0.2s ease-out forwards;
              }
              @keyframes slide-out {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(-30%); opacity: 0; }
              }
              @keyframes slide-in {
                from { transform: translateX(30%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
              }
            `}
          </style>
          <Tooltip.Root>
            {({ payload }) => (
              <React.Fragment>
                <Tooltip.Trigger
                  payload={0}
                  delay={0}
                  data-testid="trigger1"
                  style={{
                    position: 'absolute',
                    top: `${trigger1.top}px`,
                    left: `${trigger1.left}px`,
                    width: '100px',
                    height: '50px',
                  }}
                >
                  Trigger 1
                </Tooltip.Trigger>
                <Tooltip.Trigger
                  payload={1}
                  delay={0}
                  data-testid="trigger2"
                  style={{
                    position: 'absolute',
                    top: `${trigger2.top}px`,
                    left: `${trigger2.left}px`,
                    width: '100px',
                    height: '50px',
                  }}
                >
                  Trigger 2
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Positioner>
                    <Tooltip.Popup>
                      <Tooltip.Viewport data-testid="viewport">
                        <div data-testid="content">Content {payload as number}</div>
                      </Tooltip.Viewport>
                    </Tooltip.Popup>
                  </Tooltip.Positioner>
                </Tooltip.Portal>
              </React.Fragment>
            )}
          </Tooltip.Root>
        </div>,
      );

      const triggerElement1 = screen.getByTestId('trigger1');
      const triggerElement2 = screen.getByTestId('trigger2');

      await waitSingleFrame();
      await act(async () => triggerElement1.focus());

      await waitFor(() => {
        expect(screen.getByText('Content 0')).toBeVisible();
      });

      await waitSingleFrame();
      await act(async () => triggerElement2.focus());

      const viewport = screen.getByTestId('viewport');
      await waitFor(() => {
        expect(viewport).toHaveAttribute('data-activation-direction');
      });

      const direction = viewport.getAttribute('data-activation-direction');

      if (expectedDirection.length === 0) {
        expect(direction?.trim()).toBe('');
      } else {
        expectedDirection.forEach((dir) => {
          expect(direction).toContain(dir);
        });
      }
    });
  });
});
