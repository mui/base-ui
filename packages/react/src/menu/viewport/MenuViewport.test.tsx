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

  it('should remount the `current` container when the active trigger changes', async () => {
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
                <Menu.Popup>
                  <Menu.Viewport>
                    {payload === 'first' ? (
                      <img data-testid="payload-image-1" src="about:blank" alt="Preview 1" />
                    ) : null}
                    {payload === 'second' ? (
                      <img data-testid="payload-image-2" src="about:blank" alt="Preview 2" />
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

    await user.click(trigger2);

    await waitFor(() => {
      const secondImage = screen.getByTestId('payload-image-2');
      const secondContainer = secondImage.closest('[data-current]');
      expect(secondContainer).not.toBe(null);
      expect(secondContainer).not.toBe(firstContainer);
    });
  });

  it('should focus the first item when navigating forward with the keyboard and restore the originating item when navigating back', async () => {
    function TestComponent() {
      const [view, setView] = React.useState<'main' | 'more'>('main');

      return (
        <Menu.Root open>
          <Menu.Trigger>Trigger</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Viewport
                  data-testid="viewport"
                  transitionKey={view}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowLeft' && view === 'more') {
                      queueMicrotask(() => setView('main'));
                    }
                  }}
                >
                  {view === 'main' ? (
                    <React.Fragment>
                      <Menu.Item>New window</Menu.Item>
                      <Menu.Item>Open file</Menu.Item>
                      <Menu.Item
                        closeOnClick={false}
                        onClick={() => queueMicrotask(() => setView('more'))}
                        onKeyDown={(event) => {
                          if (event.key === 'ArrowRight') {
                            queueMicrotask(() => setView('more'));
                          }
                        }}
                      >
                        More tools
                      </Menu.Item>
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <Menu.Item closeOnClick={false} onClick={() => setView('main')}>
                        Back
                      </Menu.Item>
                      <Menu.Item>Developer tools</Menu.Item>
                      <Menu.Item>Task manager</Menu.Item>
                    </React.Fragment>
                  )}
                </Menu.Viewport>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      );
    }

    const { user } = await render(<TestComponent />);

    const moreToolsItem = screen.getByRole('menuitem', { name: 'More tools' });
    await act(async () => moreToolsItem.focus());
    await user.keyboard('{ArrowRight}');

    const backItem = await screen.findByRole('menuitem', { name: 'Back' });
    expect(screen.getByTestId('viewport')).toHaveAttribute('data-activation-direction', 'forward');
    await waitFor(() => {
      expect(backItem).toHaveFocus();
    });
    await waitFor(() => {
      expect(backItem).toHaveAttribute('data-highlighted');
    });

    // The item at the previous highlight position must not stay highlighted.
    expect(screen.getByRole('menuitem', { name: 'Task manager' })).not.toHaveAttribute(
      'data-highlighted',
    );

    await user.keyboard('{ArrowLeft}');

    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'More tools' })).toHaveFocus();
    });
    expect(screen.getByTestId('viewport')).toHaveAttribute('data-activation-direction', 'back');
    expect(screen.getByRole('menuitem', { name: 'More tools' })).toHaveAttribute(
      'data-highlighted',
    );

    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'Back' })).toHaveFocus();
    });
    await user.keyboard('{ArrowLeft}');
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'More tools' })).toHaveFocus();
    });

    await user.keyboard(' ');
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'Back' })).toHaveFocus();
    });
    await user.keyboard('{ArrowLeft}');
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'More tools' })).toHaveFocus();
    });
  });

  it('should restore the originating item when returning multiple levels at once', async () => {
    function TestComponent() {
      const [view, setView] = React.useState<'main' | 'more' | 'deep'>('main');

      return (
        <Menu.Root open>
          <Menu.Trigger>Trigger</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Viewport data-testid="viewport" transitionKey={view}>
                  {view === 'main' && (
                    <React.Fragment>
                      <Menu.Item>New window</Menu.Item>
                      <Menu.Item>Open file</Menu.Item>
                      <Menu.Item
                        closeOnClick={false}
                        onKeyDown={(event) => {
                          if (event.key === 'ArrowRight') {
                            queueMicrotask(() => setView('more'));
                          }
                        }}
                      >
                        More tools
                      </Menu.Item>
                    </React.Fragment>
                  )}
                  {view === 'more' && (
                    <React.Fragment>
                      <Menu.Item closeOnClick={false} onClick={() => setView('main')}>
                        Back
                      </Menu.Item>
                      <Menu.Item
                        closeOnClick={false}
                        onKeyDown={(event) => {
                          if (event.key === 'ArrowRight') {
                            queueMicrotask(() => setView('deep'));
                          }
                        }}
                      >
                        Deep tools
                      </Menu.Item>
                      <Menu.Item>Task manager</Menu.Item>
                    </React.Fragment>
                  )}
                  {view === 'deep' && (
                    <React.Fragment>
                      <Menu.Item
                        closeOnClick={false}
                        onClick={() => queueMicrotask(() => setView('main'))}
                      >
                        Home
                      </Menu.Item>
                      <Menu.Item>Deep setting</Menu.Item>
                    </React.Fragment>
                  )}
                </Menu.Viewport>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      );
    }

    const { user } = await render(<TestComponent />);

    // main -> more from "More tools" (index 2), then more -> deep from "Deep tools" (index 1).
    const moreToolsItem = screen.getByRole('menuitem', { name: 'More tools' });
    await act(async () => moreToolsItem.focus());
    await user.keyboard('{ArrowRight}');
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'Back' })).toHaveFocus();
    });
    await user.keyboard('{ArrowDown}');
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'Deep tools' })).toHaveFocus();
    });
    await user.keyboard('{ArrowRight}');
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'Home' })).toHaveFocus();
    });

    // Jump two levels back at once: deep -> main. The restored highlight must be
    // "More tools" (index 2 in main), not the intermediate view's return index.
    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'More tools' })).toHaveFocus();
    });
    expect(screen.getByTestId('viewport')).toHaveAttribute('data-activation-direction', 'back');
    expect(screen.getByRole('menuitem', { name: 'More tools' })).toHaveAttribute(
      'data-highlighted',
    );
  });

  it('should reset the view history when the menu closes', async () => {
    function TestComponent() {
      const [open, setOpen] = React.useState(true);
      const [view, setView] = React.useState<'main' | 'more'>('main');

      return (
        <React.Fragment>
          <button type="button" data-testid="toggle" onClick={() => setOpen((o) => !o)}>
            toggle
          </button>
          <Menu.Root
            open={open}
            onOpenChangeComplete={(nextOpen) => {
              if (!nextOpen) {
                setView('main');
              }
            }}
          >
            <Menu.Trigger>Trigger</Menu.Trigger>
            <Menu.Portal keepMounted>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.Viewport data-testid="viewport" transitionKey={view}>
                    {view === 'main' ? (
                      <Menu.Item
                        closeOnClick={false}
                        onKeyDown={(event) => {
                          if (event.key === 'ArrowRight') {
                            queueMicrotask(() => setView('more'));
                          }
                        }}
                      >
                        More tools
                      </Menu.Item>
                    ) : (
                      <Menu.Item>Developer tools</Menu.Item>
                    )}
                  </Menu.Viewport>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </React.Fragment>
      );
    }

    const { user } = await render(<TestComponent />);

    const moreTools = screen.getByRole('menuitem', { name: 'More tools' });
    await act(async () => moreTools.focus());
    await user.keyboard('{ArrowRight}');
    await waitFor(() => {
      expect(screen.getByTestId('viewport')).toHaveAttribute(
        'data-activation-direction',
        'forward',
      );
    });

    // Close and reopen: the history must not remember the previous session's views.
    await user.click(screen.getByTestId('toggle'));
    await waitFor(() => {
      expect(screen.queryByRole('menuitem')).toBe(null);
    });
    await waitFor(() => {
      expect(screen.getByTestId('viewport')).not.toHaveAttribute('data-activation-direction');
    });
    await user.click(screen.getByTestId('toggle'));

    const reopenedMoreTools = await screen.findByRole('menuitem', { name: 'More tools' });
    await act(async () => reopenedMoreTools.focus());
    await user.keyboard('{ArrowRight}');

    // A stale history entry for 'more' would classify this as 'back'.
    await waitFor(() => {
      expect(screen.getByTestId('viewport')).toHaveAttribute(
        'data-activation-direction',
        'forward',
      );
    });
  });

  it('should restore the originating item at index 0 when navigating back', async () => {
    function TestComponent() {
      const [view, setView] = React.useState<'main' | 'more'>('main');

      return (
        <Menu.Root open>
          <Menu.Trigger>Trigger</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Viewport
                  transitionKey={view}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowLeft' && view === 'more') {
                      queueMicrotask(() => setView('main'));
                    }
                  }}
                >
                  {view === 'main' ? (
                    <React.Fragment>
                      <Menu.Item
                        closeOnClick={false}
                        onKeyDown={(event) => {
                          if (event.key === 'ArrowRight') {
                            queueMicrotask(() => setView('more'));
                          }
                        }}
                      >
                        More tools
                      </Menu.Item>
                      <Menu.Item>New window</Menu.Item>
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <Menu.Item>Developer tools</Menu.Item>
                      <Menu.Item>Task manager</Menu.Item>
                    </React.Fragment>
                  )}
                </Menu.Viewport>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      );
    }

    const { user } = await render(<TestComponent />);

    // The originating item sits at index 0 in its view.
    const moreTools = screen.getByRole('menuitem', { name: 'More tools' });
    await act(async () => moreTools.focus());
    await user.keyboard('{ArrowRight}');
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'Developer tools' })).toHaveFocus();
    });

    await user.keyboard('{ArrowLeft}');
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'More tools' })).toHaveFocus();
    });
    expect(screen.getByRole('menuitem', { name: 'More tools' })).toHaveAttribute(
      'data-highlighted',
    );
  });

  it('should focus the popup without highlighting an item when navigating with the pointer', async () => {
    function TestComponent() {
      const [view, setView] = React.useState<'main' | 'more'>('main');

      return (
        <Menu.Root open>
          <Menu.Trigger>Trigger</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup data-testid="popup">
                <Menu.Viewport transitionKey={view}>
                  {view === 'main' ? (
                    <React.Fragment>
                      <Menu.Item>New window</Menu.Item>
                      <Menu.Item closeOnClick={false} onClick={() => setView('more')}>
                        More tools
                      </Menu.Item>
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <Menu.Item closeOnClick={false} onClick={() => setView('main')}>
                        Back
                      </Menu.Item>
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

    const { user } = await render(<TestComponent />);
    const popup = screen.getByTestId('popup');

    // Establish focus inside the viewport explicitly rather than relying on the click
    // implicitly focusing the item before the swap commits.
    const moreTools = screen.getByRole('menuitem', { name: 'More tools' });
    await act(async () => moreTools.focus());
    await user.click(moreTools);

    const backItem = await screen.findByRole('menuitem', { name: 'Back' });
    await waitFor(() => {
      expect(popup).toHaveFocus();
    });
    expect(backItem).not.toHaveAttribute('data-highlighted');

    await user.click(backItem);

    const moreToolsItem = await screen.findByRole('menuitem', { name: 'More tools' });
    await waitFor(() => {
      expect(popup).toHaveFocus();
    });
    expect(moreToolsItem).not.toHaveAttribute('data-highlighted');
  });

  it('should not highlight an item when returning to a view that had no highlight', async () => {
    function TestComponent() {
      const [view, setView] = React.useState<'main' | 'more'>('main');

      return (
        <Menu.Root open>
          <Menu.Trigger>Trigger</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup
                data-testid="popup"
                onKeyDown={(event) => {
                  if (event.key === 'ArrowRight' && view === 'main') {
                    queueMicrotask(() => setView('more'));
                  }
                }}
              >
                <Menu.Viewport
                  transitionKey={view}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowLeft' && view === 'more') {
                      queueMicrotask(() => setView('main'));
                    }
                  }}
                >
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

    const { user } = await render(<TestComponent />);

    // Leaving the main view from the popup itself (no item interaction) stores no highlight
    // to restore when returning to it.
    await act(async () => screen.getByTestId('popup').focus());
    await user.keyboard('{ArrowRight}');

    const backItem = await screen.findByRole('menuitem', { name: 'Back' });
    await act(async () => backItem.focus());
    await user.keyboard('{ArrowLeft}');

    const moreTools = await screen.findByRole('menuitem', { name: 'More tools' });
    await waitFor(() => {
      expect(screen.getByTestId('popup')).toHaveFocus();
    });
    expect(moreTools).not.toHaveAttribute('data-highlighted');
    expect(screen.getByRole('menuitem', { name: 'New window' })).not.toHaveAttribute(
      'data-highlighted',
    );
  });

  it('should not highlight an item when the menu closes before the swap settles', async () => {
    function CloseOnMount({ close }: { close: () => void }) {
      React.useLayoutEffect(() => close(), [close]);
      return null;
    }

    function TestComponent() {
      const [open, setOpen] = React.useState(true);
      const [view, setView] = React.useState<'main' | 'more'>('main');
      const close = React.useCallback(() => setOpen(false), []);

      return (
        <Menu.Root open={open} onOpenChange={setOpen}>
          <Menu.Trigger>Trigger</Menu.Trigger>
          <Menu.Portal keepMounted>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Viewport transitionKey={view}>
                  {view === 'main' ? (
                    <Menu.Item
                      closeOnClick={false}
                      onKeyDown={(event) => {
                        if (event.key === 'ArrowRight') {
                          queueMicrotask(() => setView('more'));
                        }
                      }}
                    >
                      More tools
                    </Menu.Item>
                  ) : (
                    <React.Fragment>
                      <CloseOnMount close={close} />
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

    const { user } = await render(<TestComponent />);

    const moreTools = screen.getByRole('menuitem', { name: 'More tools' });
    await act(async () => moreTools.focus());
    // The new view closes the menu in a layout effect, before the highlight re-seed settles.
    await user.keyboard('{ArrowRight}');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Trigger' })).toHaveAttribute(
        'aria-expanded',
        'false',
      );
    });
    expect(screen.getByText('Developer tools')).not.toHaveAttribute('data-highlighted');
  });

  it('should keep list navigation in sync after the content swaps', async () => {
    function TestComponent() {
      const [view, setView] = React.useState<'main' | 'more'>('main');

      return (
        <Menu.Root open>
          <Menu.Trigger>Trigger</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Viewport transitionKey={view}>
                  {view === 'main' ? (
                    <React.Fragment>
                      <Menu.Item>New window</Menu.Item>
                      <Menu.Item closeOnClick={false} onClick={() => setView('more')}>
                        More tools
                      </Menu.Item>
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <Menu.Item closeOnClick={false} onClick={() => setView('main')}>
                        Back
                      </Menu.Item>
                      <Menu.Item>Developer tools</Menu.Item>
                      <Menu.Item>Task manager</Menu.Item>
                    </React.Fragment>
                  )}
                </Menu.Viewport>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      );
    }

    const { user } = await render(<TestComponent />);

    const moreToolsItem = screen.getByRole('menuitem', { name: 'More tools' });
    await act(async () => moreToolsItem.focus());
    await user.keyboard('{Enter}');

    const backItem = await screen.findByRole('menuitem', { name: 'Back' });
    await waitFor(() => {
      expect(backItem).toHaveFocus();
    });

    await user.keyboard('{ArrowDown}');

    const developerToolsItem = screen.getByRole('menuitem', { name: 'Developer tools' });
    await waitFor(() => {
      expect(developerToolsItem).toHaveFocus();
    });
    expect(developerToolsItem).toHaveAttribute('data-highlighted');
  });

  it('should clear the highlight without moving focus when focus was outside the swapped content', async () => {
    function TestComponent({ view }: { view: 'main' | 'more' }) {
      return (
        <Menu.Root open>
          <Menu.Trigger>Trigger</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup data-testid="popup">
                <Menu.Viewport transitionKey={view}>
                  {view === 'main' ? (
                    <Menu.Item>New window</Menu.Item>
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

    const { setProps } = await render(<TestComponent view="main" />);

    const popup = screen.getByTestId('popup');
    await act(async () => popup.focus());

    await setProps({ view: 'more' });

    const backItem = await screen.findByRole('menuitem', { name: 'Back' });
    expect(backItem).not.toHaveAttribute('data-highlighted');
    expect(popup).toHaveFocus();
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
