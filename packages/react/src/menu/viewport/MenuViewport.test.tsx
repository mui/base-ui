import { expect } from 'vitest';
import * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

describe('<Menu.Viewport />', () => {
  const { render } = createRenderer();

  describeConformance(<Menu.Viewport />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Menu.Root open>
          <Menu.Trigger>Trigger</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>{node}</Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );
    },
  }));

  it('should render children in the `current` container by default', async () => {
    await render(
      <Menu.Root open>
        <Menu.Trigger>Trigger</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Viewport>
                <div data-testid="content">Content</div>
              </Menu.Viewport>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );

    const currentContainer = screen.getByTestId('content').closest('[data-current]');
    expect(currentContainer).not.toBe(null);
    expect(currentContainer!.textContent).toBe('Content');
  });

  it('should remount the content and clear the highlight when the active trigger changes', async () => {
    const { user } = await render(
      <Menu.Root>
        {({ payload }) => (
          <React.Fragment>
            <Menu.Trigger payload="first" data-testid="trigger1">
              Trigger 1
            </Menu.Trigger>
            <Menu.Trigger payload="second" data-testid="trigger2">
              Trigger 2
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup data-testid="popup">
                  <Menu.Viewport>
                    {payload === 'first' ? (
                      <React.Fragment>
                        <img data-testid="payload-image-1" src="about:blank" alt="Preview 1" />
                        <Menu.Item>First item</Menu.Item>
                      </React.Fragment>
                    ) : null}
                    {payload === 'second' ? (
                      <React.Fragment>
                        <img data-testid="payload-image-2" src="about:blank" alt="Preview 2" />
                        <Menu.Item>Second item</Menu.Item>
                      </React.Fragment>
                    ) : null}
                  </Menu.Viewport>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </React.Fragment>
        )}
      </Menu.Root>,
    );

    const trigger1 = screen.getByTestId('trigger1');
    const trigger2 = screen.getByTestId('trigger2');

    await user.click(trigger1);

    const firstImage = await screen.findByTestId('payload-image-1');
    const firstContainer = firstImage.closest('[data-current]');
    expect(firstContainer).not.toBe(null);

    await act(async () => screen.getByTestId('popup').focus());
    await user.keyboard('{ArrowDown}');
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'First item' })).toHaveAttribute(
        'data-highlighted',
      );
    });

    await user.click(trigger2);

    await waitFor(() => {
      const secondImage = screen.getByTestId('payload-image-2');
      const secondContainer = secondImage.closest('[data-current]');
      expect(secondContainer).not.toBe(null);
      expect(secondContainer).not.toBe(firstContainer);
    });
    expect(trigger2).toHaveFocus();
    expect(screen.getByRole('menuitem', { name: 'Second item' })).not.toHaveAttribute(
      'data-highlighted',
    );
  });

  it('should reset the highlight and focus the popup when the transition key changes', async () => {
    function TestComponent({ view }: { view: 'main' | 'more' }) {
      return (
        <Menu.Root open>
          <Menu.Trigger>Trigger</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup data-testid="popup">
                <Menu.Viewport data-testid="viewport" transitionKey={view}>
                  {view === 'main' ? (
                    <React.Fragment>
                      <Menu.Item>New window</Menu.Item>
                      <Menu.Item>More tools</Menu.Item>
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <Menu.Item>Back</Menu.Item>
                      <Menu.Item>Developer tools</Menu.Item>
                    </React.Fragment>
                  )}
                </Menu.Viewport>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      );
    }

    const { setProps, user } = await render(<TestComponent view="main" />);

    const popup = screen.getByTestId('popup');
    await act(async () => popup.focus());
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');

    const moreTools = screen.getByRole('menuitem', { name: 'More tools' });
    await waitFor(() => {
      expect(moreTools).toHaveFocus();
    });
    await waitFor(() => {
      expect(moreTools).toHaveAttribute('data-highlighted');
    });

    const firstContainer = moreTools.closest('[data-current]');
    expect(firstContainer).not.toBe(null);
    await setProps({ view: 'more' });

    const back = screen.getByRole('menuitem', { name: 'Back' });
    const developerTools = screen.getByRole('menuitem', { name: 'Developer tools' });
    expect(back.closest('[data-current]')).not.toBe(firstContainer);
    await waitFor(() => {
      expect(popup).toHaveFocus();
    });
    expect(back).not.toHaveAttribute('data-highlighted');
    expect(developerTools).not.toHaveAttribute('data-highlighted');
    expect(screen.getByTestId('viewport')).not.toHaveAttribute('data-activation-direction');

    await user.keyboard('{ArrowDown}');

    await waitFor(() => {
      expect(back).toHaveFocus();
    });
    await waitFor(() => {
      expect(back).toHaveAttribute('data-highlighted');
    });
  });

  it('should clear the highlight without moving focus when focus was outside the swapped content', async () => {
    function TestComponent({ view }: { view: 'main' | 'more' }) {
      return (
        <React.Fragment>
          <button type="button">Outside</button>
          <Menu.Root open>
            <Menu.Trigger>Trigger</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup data-testid="popup">
                  <Menu.Viewport transitionKey={view}>
                    <Menu.Item>{view === 'main' ? 'More tools' : 'Back'}</Menu.Item>
                  </Menu.Viewport>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </React.Fragment>
      );
    }

    const { setProps, user } = await render(<TestComponent view="main" />);

    await act(async () => screen.getByTestId('popup').focus());
    await user.keyboard('{ArrowDown}');

    const moreTools = screen.getByRole('menuitem', { name: 'More tools' });
    await waitFor(() => {
      expect(moreTools).toHaveAttribute('data-highlighted');
    });

    const outside = screen.getByRole('button', { name: 'Outside' });
    await act(async () => outside.focus());
    await setProps({ view: 'more' });

    expect(outside).toHaveFocus();
    expect(screen.getByRole('menuitem', { name: 'Back' })).not.toHaveAttribute('data-highlighted');
  });

  describe.skipIf(isJSDOM)('morphing containers', () => {
    beforeEach(() => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
    });

    afterEach(() => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
    });

    it('should create morphing containers and resize when the transition key changes', async () => {
      function TestComponent() {
        const [view, setView] = React.useState(0);

        return (
          <div>
            <style>
              {`
                [data-transitioning] [data-previous],
                [data-transitioning] [data-current] {
                  transition: opacity 0.3s linear;
                }
                [data-previous][data-ending-style],
                [data-current][data-starting-style] {
                  opacity: 0;
                }
              `}
            </style>
            <button type="button" onClick={() => setView(1)}>
              Change view
            </button>
            <Menu.Root open>
              <Menu.Trigger>Trigger</Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup data-testid="popup">
                    <Menu.Viewport data-testid="viewport" transitionKey={view}>
                      <div style={{ width: view === 0 ? 100 : 200 }}>Content {view}</div>
                    </Menu.Viewport>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </div>
        );
      }

      await render(<TestComponent />);

      const popup = screen.getByTestId('popup');
      expect(popup.style.getPropertyValue('--popup-width')).toBe('auto');

      act(() => screen.getByRole('button', { name: 'Change view' }).click());

      const previousContainer = document.querySelector<HTMLElement>('[data-previous]');
      const currentContainer = document.querySelector<HTMLElement>('[data-current]');
      expect(previousContainer).not.toBe(null);
      expect(previousContainer).toHaveAttribute('inert');
      expect(previousContainer).toHaveTextContent('Content 0');
      expect(currentContainer).toHaveTextContent('Content 1');
      expect(currentContainer).toHaveAttribute('data-starting-style');
      expect(screen.getByTestId('viewport')).not.toHaveAttribute('data-activation-direction');

      await waitFor(() => {
        expect(popup.style.getPropertyValue('--popup-width')).toMatch(/px$/);
      });
      await waitFor(() => {
        expect(parseFloat(popup.style.getPropertyValue('--popup-width'))).toBeGreaterThanOrEqual(
          200,
        );
      });
      await waitFor(() => {
        expect(previousContainer).toHaveAttribute('data-ending-style');
      });

      expect(previousContainer!.getAnimations().length).toBeGreaterThan(0);
      expect(currentContainer!.getAnimations().length).toBeGreaterThan(0);
    });

    it('should create morphing containers during transitions', async () => {
      const { user } = await render(
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
          <Menu.Root>
            {({ payload }) => (
              <React.Fragment>
                <Menu.Trigger
                  payload={0}
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
                </Menu.Trigger>
                <Menu.Trigger
                  payload={1}
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
                </Menu.Trigger>
                <Menu.Portal>
                  <Menu.Positioner>
                    <Menu.Popup>
                      <Menu.Viewport>
                        <div data-testid="content">Content {payload as number}</div>
                      </Menu.Viewport>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </React.Fragment>
            )}
          </Menu.Root>
        </div>,
      );

      const trigger1 = screen.getByTestId('trigger1');
      const trigger2 = screen.getByTestId('trigger2');

      await user.click(trigger1);
      await waitFor(() => {
        expect(screen.getByText('Content 0')).toBeVisible();
      });

      // Click second trigger to trigger morphing
      await user.click(trigger2);

      // Check for morphing containers during transition
      let previousContainer: HTMLElement | null = null;
      await waitFor(() => {
        previousContainer = document.querySelector('[data-previous]');
        expect(previousContainer).not.toBe(null);
      });

      expect(previousContainer).toHaveAttribute('inert');
      expect(previousContainer!.textContent).toBe('Content 0');
      expect(previousContainer!.style.getPropertyValue('--popup-width')).toMatch(
        /^\d+(?:\.\d+)?px$/,
      );
      expect(previousContainer!.style.getPropertyValue('--popup-height')).toMatch(
        /^\d+(?:\.\d+)?px$/,
      );

      const nextContainer = document.querySelector('[data-current]');
      expect(nextContainer).not.toBe(null);
      expect(nextContainer!.textContent).toBe('Content 1');

      // Verify they are cleaned up after animation
      await waitFor(() => {
        expect(document.querySelector('[data-previous]')).toBe(null);
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
            <Menu.Root>
              {({ payload }) => (
                <React.Fragment>
                  <Menu.Trigger payload={1} data-testid="trigger1">
                    Trigger 1
                  </Menu.Trigger>
                  <Menu.Trigger payload={2} data-testid="trigger2">
                    Trigger 2
                  </Menu.Trigger>
                  <Menu.Trigger payload={3} data-testid="trigger3">
                    Trigger 3
                  </Menu.Trigger>
                  <Menu.Portal>
                    <Menu.Positioner>
                      <Menu.Popup>
                        <Menu.Viewport>Content {payload as number}</Menu.Viewport>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </React.Fragment>
              )}
            </Menu.Root>
          </div>
        );
      }

      const { user } = await render(<TestComponent />);

      const trigger1 = screen.getByTestId('trigger1');
      const trigger2 = screen.getByTestId('trigger2');
      const trigger3 = screen.getByTestId('trigger3');

      await user.click(trigger1);
      await user.click(trigger2);
      await user.click(trigger3);
      await user.click(trigger1);

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
      const { user } = await render(
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
          <Menu.Root>
            {({ payload }) => (
              <React.Fragment>
                <Menu.Trigger
                  payload={0}
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
                </Menu.Trigger>
                <Menu.Trigger
                  payload={1}
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
                </Menu.Trigger>
                <Menu.Portal>
                  <Menu.Positioner>
                    <Menu.Popup>
                      <Menu.Viewport data-testid="viewport">
                        <div data-testid="content">Content {payload as number}</div>
                      </Menu.Viewport>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </React.Fragment>
            )}
          </Menu.Root>
        </div>,
      );

      const triggerElement1 = screen.getByTestId('trigger1');
      const triggerElement2 = screen.getByTestId('trigger2');

      await user.click(triggerElement1);

      await waitFor(() => {
        expect(screen.getByText('Content 0')).toBeVisible();
      });

      await user.click(triggerElement2);

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
