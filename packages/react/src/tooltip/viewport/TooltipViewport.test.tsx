import * as React from 'react';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

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
    expect(currentContainer).not.to.equal(null);
    expect(currentContainer!.textContent).to.equal('Content');
  });

  describe.skipIf(isJSDOM)('morphing containers with multiple triggers and payloads', () => {
    beforeEach(() => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
    });

    afterEach(() => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
    });

    it('should create morphing containers during transitions', async () => {
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

      await act(async () => trigger1.focus());
      await waitFor(() => {
        expect(screen.getByText('Content 0')).toBeVisible();
      });

      await act(async () => trigger2.focus());

      // Check for morphing containers during transition
      let previousContainer: HTMLElement | null = null;
      await waitFor(() => {
        previousContainer = document.querySelector('[data-previous]');
        expect(previousContainer).not.to.equal(null);
      });

      expect(previousContainer).to.have.attribute('inert');
      expect(previousContainer!.textContent).to.equal('Content 0');

      const nextContainer = document.querySelector('[data-current]');
      expect(nextContainer).not.to.equal(null);
      expect(nextContainer!.textContent).to.equal('Content 1');

      // Verify they are cleaned up after animation
      await waitFor(() => {
        expect(document.querySelector('[data-previous]')).to.equal(null);
      });

      expect(document.querySelector('[data-current]')).toBeVisible();
      expect(screen.getByText('Content 1')).toBeVisible();
    });

    it('should handle rapid trigger changes', async () => {
      function TestComponent() {
        return (
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
                        <Tooltip.Viewport>Content {payload as number}</Tooltip.Viewport>
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

      await act(async () => trigger1.focus());
      await act(async () => trigger2.focus());
      await act(async () => trigger3.focus());
      await act(async () => trigger1.focus());

      const content = await screen.findByText('Content 1');
      await waitFor(() => {
        expect(content).toBeVisible();
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

      await act(async () => triggerElement1.focus());

      await waitFor(() => {
        expect(screen.getByText('Content 0')).toBeVisible();
      });

      await act(async () => triggerElement2.focus());

      const viewport = screen.getByTestId('viewport');
      await waitFor(() => {
        expect(viewport).to.have.attribute('data-activation-direction');
      });

      const direction = viewport.getAttribute('data-activation-direction');

      if (expectedDirection.length === 0) {
        expect(direction?.trim()).to.equal('');
      } else {
        expectedDirection.forEach((dir) => {
          expect(direction).to.contain(dir);
        });
      }
    });
  });
});
