import { expect } from 'vitest';
import * as React from 'react';
import { Popover } from '@base-ui/react/popover';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

describe('<Popover.Viewport />', () => {
  const { render } = createRenderer();

  describeConformance(<Popover.Viewport />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Popover.Root open>
          <Popover.Trigger>Trigger</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>{node}</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );
    },
  }));

  it('should render children in the `current` container by default', async () => {
    await render(
      <Popover.Root open>
        <Popover.Trigger>Trigger</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Popup>
              <Popover.Viewport>
                <div data-testid="content">Content</div>
              </Popover.Viewport>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>,
    );

    const currentContainer = screen.getByTestId('content').closest('[data-current]');
    expect(currentContainer).not.toBe(null);
    expect(currentContainer!.textContent).toBe('Content');
  });

  it('should remount the `current` container when the active trigger changes', async () => {
    const { user } = await render(
      <Popover.Root>
        {({ payload }) => (
          <React.Fragment>
            <Popover.Trigger payload="first" data-testid="trigger1">
              Trigger 1
            </Popover.Trigger>
            <Popover.Trigger payload="second" data-testid="trigger2">
              Trigger 2
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup>
                  <Popover.Viewport>
                    {payload === 'first' ? (
                      <img data-testid="payload-image-1" src="about:blank" alt="Preview 1" />
                    ) : null}
                    {payload === 'second' ? (
                      <img data-testid="payload-image-2" src="about:blank" alt="Preview 2" />
                    ) : null}
                  </Popover.Viewport>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </React.Fragment>
        )}
      </Popover.Root>,
    );

    const trigger1 = screen.getByTestId('trigger1');
    const trigger2 = screen.getByTestId('trigger2');

    await user.click(trigger1);

    const firstImage = await screen.findByTestId('payload-image-1');
    const firstContainer = firstImage.closest('[data-current]');
    expect(firstContainer).not.toBe(null);

    await user.click(trigger2);

    await waitFor(() => {
      const secondImage = screen.getByTestId('payload-image-2');
      const secondContainer = secondImage.closest('[data-current]');
      expect(secondContainer).not.toBe(null);
      expect(secondContainer).not.toBe(firstContainer);
    });
  });

  it('should remount the `current` container when the transition key changes', async () => {
    function TestComponent() {
      const [view, setView] = React.useState<React.Key | undefined>('initial');

      return (
        <Popover.Root open>
          <button type="button" onClick={() => setView(undefined)}>
            Change view
          </button>
          <Popover.Trigger>Trigger</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>
                <Popover.Viewport transitionKey={view}>
                  <div data-testid="content">Content {String(view)}</div>
                </Popover.Viewport>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      );
    }

    const { user } = await render(<TestComponent />);
    const firstContainer = screen.getByTestId('content').closest('[data-current]');

    await user.click(screen.getByRole('button', { name: 'Change view' }));

    const secondContainer = document.querySelector('[data-current]');
    expect(secondContainer).not.toBe(firstContainer);
    expect(secondContainer).toHaveTextContent('Content undefined');
  });

  it('should remount the `current` container when the transition key changes from undefined to an empty string', async () => {
    function TestComponent() {
      const [view, setView] = React.useState<React.Key | undefined>(undefined);

      return (
        <Popover.Root open>
          <button type="button" onClick={() => setView('')}>
            Change view
          </button>
          <Popover.Trigger>Trigger</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>
                <Popover.Viewport transitionKey={view}>
                  <div data-testid="content">Content</div>
                </Popover.Viewport>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      );
    }

    const { user } = await render(<TestComponent />);
    const firstContainer = screen.getByTestId('content').closest('[data-current]');

    await user.click(screen.getByRole('button', { name: 'Change view' }));

    expect(document.querySelector('[data-current]')).not.toBe(firstContainer);
  });

  it('should not remount the `current` container when the transition key is unchanged', async () => {
    function TestComponent() {
      const [content, setContent] = React.useState('first');

      return (
        <Popover.Root open>
          <button type="button" onClick={() => setContent('second')}>
            Change content
          </button>
          <Popover.Trigger>Trigger</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>
                <Popover.Viewport transitionKey="unchanged">
                  <div data-testid="content">{content}</div>
                </Popover.Viewport>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      );
    }

    const { user } = await render(<TestComponent />);
    const firstContainer = screen.getByTestId('content').closest('[data-current]');

    await user.click(screen.getByRole('button', { name: 'Change content' }));

    expect(screen.getByTestId('content').closest('[data-current]')).toBe(firstContainer);
    expect(document.querySelector('[data-previous]')).toBe(null);
  });

  it('should hand focus to the first tabbable element when the transition key changes', async () => {
    function TestComponent() {
      const [view, setView] = React.useState(0);

      return (
        <Popover.Root open>
          <Popover.Trigger>Trigger</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>
                <Popover.Viewport transitionKey={view}>
                  {view === 0 ? (
                    <button type="button" onClick={() => setView(1)}>
                      Change view
                    </button>
                  ) : (
                    <React.Fragment>
                      <button type="button">First control</button>
                      <button type="button">Second control</button>
                    </React.Fragment>
                  )}
                </Popover.Viewport>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      );
    }

    const { user } = await render(<TestComponent />);
    const changeViewButton = screen.getByRole('button', { name: 'Change view' });
    await act(async () => changeViewButton.focus());
    await user.click(changeViewButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'First control' })).toHaveFocus();
    });
  });

  it('should hand focus to the popup when the new content has no tabbable elements', async () => {
    function TestComponent() {
      const [view, setView] = React.useState(0);

      return (
        <Popover.Root open>
          <Popover.Trigger>Trigger</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup data-testid="popup">
                <Popover.Viewport transitionKey={view}>
                  {view === 0 ? (
                    <button type="button" onClick={() => setView(1)}>
                      Change view
                    </button>
                  ) : (
                    <p>Next view</p>
                  )}
                </Popover.Viewport>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      );
    }

    const { user } = await render(<TestComponent />);
    const changeViewButton = screen.getByRole('button', { name: 'Change view' });
    await act(async () => changeViewButton.focus());
    await user.click(changeViewButton);

    await waitFor(() => {
      expect(screen.getByTestId('popup')).toHaveFocus();
    });
  });

  it('should preserve focus placed by the new content', async () => {
    function TestComponent() {
      const [view, setView] = React.useState(0);

      return (
        <Popover.Root open>
          <Popover.Trigger>Trigger</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>
                <Popover.Viewport transitionKey={view}>
                  {view === 0 ? (
                    <button type="button" onClick={() => setView(1)}>
                      Change view
                    </button>
                  ) : (
                    <React.Fragment>
                      <button type="button">First control</button>
                      <input aria-label="Focused control" autoFocus />
                    </React.Fragment>
                  )}
                </Popover.Viewport>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      );
    }

    const { user } = await render(<TestComponent />);
    await user.click(screen.getByRole('button', { name: 'Change view' }));

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Focused control' })).toHaveFocus();
    });
  });

  it('should not steal focus after focus moves from the popup to outside', async () => {
    function TestComponent() {
      const [view, setView] = React.useState(0);

      return (
        <React.Fragment>
          <button type="button" onClick={() => setView(2)}>
            Change view externally
          </button>
          <Popover.Root open>
            <Popover.Trigger>Trigger</Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup data-testid="popup">
                  <Popover.Viewport transitionKey={view}>
                    {view === 0 ? (
                      <button type="button" onClick={() => setView(1)}>
                        Change view
                      </button>
                    ) : (
                      <p>View {view}</p>
                    )}
                  </Popover.Viewport>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        </React.Fragment>
      );
    }

    const { user } = await render(<TestComponent />);
    await user.click(screen.getByRole('button', { name: 'Change view' }));
    await waitFor(() => {
      expect(screen.getByTestId('popup')).toHaveFocus();
    });

    const externalButton = screen.getByRole('button', { name: 'Change view externally' });
    await user.click(externalButton);

    expect(externalButton).toHaveFocus();
  });

  it('should not move focus into the viewport when focus was outside before the transition', async () => {
    function TestComponent() {
      const [view, setView] = React.useState(0);

      return (
        <Popover.Root open>
          <button type="button" onClick={() => setView(1)}>
            Change view externally
          </button>
          <Popover.Trigger>Trigger</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>
                <Popover.Viewport transitionKey={view}>
                  <button type="button">View {view}</button>
                </Popover.Viewport>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      );
    }

    const { user } = await render(<TestComponent />);
    const externalButton = screen.getByRole('button', { name: 'Change view externally' });

    await user.click(externalButton);

    expect(externalButton).toHaveFocus();
  });

  describe.skipIf(isJSDOM)('morphing containers with multiple triggers and payloads', () => {
    beforeEach(() => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
    });

    afterEach(() => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
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
          <Popover.Root>
            {({ payload }) => (
              <React.Fragment>
                <Popover.Trigger
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
                </Popover.Trigger>
                <Popover.Trigger
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
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Positioner>
                    <Popover.Popup>
                      <Popover.Viewport>
                        <div data-testid="content">Content {payload as number}</div>
                      </Popover.Viewport>
                    </Popover.Popup>
                  </Popover.Positioner>
                </Popover.Portal>
              </React.Fragment>
            )}
          </Popover.Root>
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
            <Popover.Root open>
              <button type="button" onClick={() => setView(1)}>
                Change view
              </button>
              <Popover.Trigger>Trigger</Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup data-testid="popup">
                    <Popover.Viewport data-testid="viewport" transitionKey={view}>
                      <div style={{ width: view === 0 ? 100 : 200 }}>Content {view}</div>
                    </Popover.Viewport>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </div>
        );
      }

      await render(<TestComponent />);
      act(() => screen.getByRole('button', { name: 'Change view' }).click());

      const previousContainer = document.querySelector('[data-previous]');
      const currentContainer = document.querySelector('[data-current]');
      expect(previousContainer).not.toBe(null);
      expect(previousContainer).toHaveAttribute('inert');
      expect(previousContainer).toHaveTextContent('Content 0');
      expect(currentContainer).toHaveTextContent('Content 1');
      expect(currentContainer).toHaveAttribute('data-starting-style');
      expect(screen.getByTestId('viewport')).not.toHaveAttribute('data-activation-direction');
      expect(screen.getByTestId('popup').style.getPropertyValue('--popup-width')).not.toBe('');

      await waitFor(() => {
        expect(previousContainer).toHaveAttribute('data-ending-style');
      });

      // The starting styles must be committed before they flip so an actual
      // cross-fade transition runs instead of snapping to the final state.
      expect(previousContainer!.getAnimations().length).toBeGreaterThan(0);
      expect(currentContainer!.getAnimations().length).toBeGreaterThan(0);
    });

    it('should capture the latest previous content during rapid transition key changes', async () => {
      function TestComponent() {
        const [view, setView] = React.useState(0);

        return (
          <div>
            <style>
              {`
                [data-transitioning] [data-previous] {
                  animation: fade-out 0.5s linear forwards;
                }
                [data-transitioning] [data-current] {
                  animation: fade-in 0.5s linear forwards;
                }
                @keyframes fade-out {
                  from { opacity: 1; }
                  to { opacity: 0; }
                }
                @keyframes fade-in {
                  from { opacity: 0; }
                  to { opacity: 1; }
                }
              `}
            </style>
            <button type="button" onClick={() => setView(1)}>
              View 1
            </button>
            <button type="button" onClick={() => setView(2)}>
              View 2
            </button>
            <Popover.Root open>
              <Popover.Trigger>Trigger</Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup>
                    <Popover.Viewport transitionKey={view}>Content {view}</Popover.Viewport>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </div>
        );
      }

      const { user } = await render(<TestComponent />);
      await user.click(screen.getByRole('button', { name: 'View 1' }));
      await waitFor(() => {
        expect(document.querySelector('[data-previous]')).toHaveTextContent('Content 0');
      });

      await user.click(screen.getByRole('button', { name: 'View 2' }));
      await waitFor(() => {
        expect(document.querySelector('[data-previous]')).toHaveTextContent('Content 1');
      });
    });

    it('should create morphing containers after a kept-mounted popup closes and reopens', async () => {
      function TestComponent() {
        const [open, setOpen] = React.useState(false);

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
            <button type="button" onClick={() => setOpen(false)}>
              Close
            </button>
            <Popover.Root open={open} onOpenChange={setOpen}>
              {({ payload }) => (
                <React.Fragment>
                  <Popover.Trigger payload={0} data-testid="trigger1">
                    Trigger 1
                  </Popover.Trigger>
                  <Popover.Trigger payload={1} data-testid="trigger2">
                    Trigger 2
                  </Popover.Trigger>
                  <Popover.Portal keepMounted>
                    <Popover.Positioner>
                      <Popover.Popup data-testid="popup">
                        <Popover.Viewport>Content {payload as number}</Popover.Viewport>
                      </Popover.Popup>
                    </Popover.Positioner>
                  </Popover.Portal>
                </React.Fragment>
              )}
            </Popover.Root>
          </div>
        );
      }

      const { user } = await render(<TestComponent />);

      const trigger1 = screen.getByTestId('trigger1');
      const trigger2 = screen.getByTestId('trigger2');

      await user.click(trigger1);
      await waitFor(() => {
        expect(screen.getByText('Content 0')).toBeVisible();
      });

      await user.click(trigger2);
      await waitFor(() => {
        expect(document.querySelector('[data-previous]')).not.toBe(null);
      });
      await waitFor(() => {
        expect(document.querySelector('[data-previous]')).toBe(null);
      });

      await user.click(screen.getByRole('button', { name: 'Close' }));
      await waitFor(() => {
        expect(screen.getByTestId('popup')).not.toBeVisible();
      });

      await user.click(trigger1);
      await waitFor(() => {
        expect(screen.getByText('Content 0')).toBeVisible();
      });

      await user.click(trigger2);

      let previousContainer: HTMLElement | null = null;
      await waitFor(() => {
        previousContainer = document.querySelector('[data-previous]');
        expect(previousContainer).not.toBe(null);
      });

      expect(previousContainer!.textContent).toBe('Content 0');
      expect(screen.getByText('Content 1')).toBeVisible();
    });

    it('should clear an interrupted transition when a kept-mounted popup closes and reopens', async () => {
      function TestComponent() {
        const [open, setOpen] = React.useState(true);
        const [view, setView] = React.useState(0);

        return (
          <div>
            <style>
              {`
                [data-transitioning] [data-previous],
                [data-transitioning] [data-current] {
                  transition: opacity 0.5s linear;
                }
                [data-previous][data-ending-style],
                [data-current][data-starting-style] {
                  opacity: 0;
                }
              `}
            </style>
            <button type="button" onClick={() => setOpen(false)}>
              Close
            </button>
            <Popover.Root open={open} onOpenChange={setOpen}>
              <Popover.Trigger>Trigger</Popover.Trigger>
              <Popover.Portal keepMounted>
                <Popover.Positioner>
                  <Popover.Popup data-testid="popup">
                    <Popover.Viewport transitionKey={view}>
                      {view === 0 ? (
                        <button type="button" onClick={() => setView(1)}>
                          Change view
                        </button>
                      ) : (
                        <React.Fragment>Content {view}</React.Fragment>
                      )}
                    </Popover.Viewport>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </div>
        );
      }

      const { user } = await render(<TestComponent />);
      await user.click(screen.getByRole('button', { name: 'Change view' }));
      await waitFor(() => {
        expect(document.querySelector('[data-previous]')).not.toBe(null);
      });

      await user.click(screen.getByRole('button', { name: 'Close' }));
      await user.click(screen.getByRole('button', { name: 'Trigger' }));

      await waitFor(() => {
        expect(screen.getByTestId('popup')).toBeVisible();
      });
      expect(document.querySelector('[data-previous]')).toBe(null);
      expect(document.querySelector('[data-transitioning]')).toBe(null);
    });

    it('should not morph when the transition key changes while closed', async () => {
      function TestComponent() {
        const [open, setOpen] = React.useState(false);
        const [view, setView] = React.useState(0);

        return (
          <div>
            <button type="button" onClick={() => setView(1)}>
              Change view
            </button>
            <button type="button" onClick={() => setOpen(true)}>
              Open
            </button>
            <Popover.Root open={open} onOpenChange={setOpen}>
              <Popover.Trigger>Trigger</Popover.Trigger>
              <Popover.Portal keepMounted>
                <Popover.Positioner>
                  <Popover.Popup data-testid="popup">
                    <Popover.Viewport transitionKey={view}>Content {view}</Popover.Viewport>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </div>
        );
      }

      const { user } = await render(<TestComponent />);
      await user.click(screen.getByRole('button', { name: 'Change view' }));
      await user.click(screen.getByRole('button', { name: 'Open' }));

      await waitFor(() => {
        expect(screen.getByTestId('popup')).toBeVisible();
      });
      expect(document.querySelector('[data-previous]')).toBe(null);
      expect(document.querySelector('[data-transitioning]')).toBe(null);
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
            <Popover.Root>
              {({ payload }) => (
                <React.Fragment>
                  <Popover.Trigger payload={1} data-testid="trigger1">
                    Trigger 1
                  </Popover.Trigger>
                  <Popover.Trigger payload={2} data-testid="trigger2">
                    Trigger 2
                  </Popover.Trigger>
                  <Popover.Trigger payload={3} data-testid="trigger3">
                    Trigger 3
                  </Popover.Trigger>
                  <Popover.Portal>
                    <Popover.Positioner>
                      <Popover.Popup>
                        <Popover.Viewport>Content {payload as number}</Popover.Viewport>
                      </Popover.Popup>
                    </Popover.Positioner>
                  </Popover.Portal>
                </React.Fragment>
              )}
            </Popover.Root>
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
          <Popover.Root>
            {({ payload }) => (
              <React.Fragment>
                <Popover.Trigger
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
                </Popover.Trigger>
                <Popover.Trigger
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
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Positioner>
                    <Popover.Popup>
                      <Popover.Viewport data-testid="viewport">
                        <div data-testid="content">Content {payload as number}</div>
                      </Popover.Viewport>
                    </Popover.Popup>
                  </Popover.Positioner>
                </Popover.Portal>
              </React.Fragment>
            )}
          </Popover.Root>
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
