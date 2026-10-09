import { expect, vi, describe, beforeEach, it } from 'vitest';
import * as React from 'react';
import { act, fireEvent, ignoreActWarnings, screen, waitFor } from '@mui/internal-test-utils';
import { Menu } from '@base-ui/react/menu';
import { StoreInspector } from '@base-ui/utils/store';
import { createRenderer, detachedTriggersConformanceTests, isJSDOM, wait } from '#test-utils';

describe('<MenuRoot />', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render } = createRenderer();

  detachedTriggersConformanceTests({
    render,
    createHandle: Menu.createHandle,
    Root: Menu.Root,
    Trigger: Menu.Trigger,
    Portal: Menu.Portal,
    Positioner: Menu.Positioner,
    Popup: Menu.Popup,
    Viewport: Menu.Viewport,
    openInteractions: ['click'],
    ariaExpanded: true,
    throwOnMissingTrigger: true,
    closesOnActiveTriggerUnmount: false,
  });

  describe.skipIf(isJSDOM)('multiple detached triggers', () => {
    type NumberPayload = { payload: number | undefined };

    /**
     * Mirrors the Popover detached-trigger hover fixture: two detached hover
     * triggers with a real position transition on the positioner and a real exit
     * transition on the popup, handed off from trigger 1 to trigger 2 so
     * `instantType` is `trigger-change`.
     */
    async function renderHoverDetachedTriggers({
      settleTriggerChange = true,
    }: {
      /**
       * Set to `false` to return while the positioner is still animating to the
       * new trigger, so the delayed `trigger-change` restoration is still pending.
       */
      settleTriggerChange?: boolean;
    } = {}) {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      const testMenu = Menu.createHandle<number>();
      const instantsWhileEnding: (string | undefined)[] = [];

      const utils = await render(
        <div style={{ position: 'relative', width: 400, height: 200 }}>
          <style>
            {`
              .positioner {
                transition:
                  top 120ms linear,
                  left 120ms linear,
                  transform 120ms linear;
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

          <Menu.Trigger
            handle={testMenu}
            payload={1}
            openOnHover
            delay={0}
            style={{ position: 'absolute', top: 20, left: 20 }}
          >
            Trigger 1
          </Menu.Trigger>
          <Menu.Trigger
            handle={testMenu}
            payload={2}
            openOnHover
            delay={0}
            style={{ position: 'absolute', top: 20, left: 220 }}
          >
            Trigger 2
          </Menu.Trigger>

          <Menu.Root handle={testMenu}>
            {({ payload }: NumberPayload) => (
              <Menu.Portal>
                <Menu.Positioner data-testid="positioner" className="positioner">
                  <Menu.Popup
                    data-testid="popup"
                    className="popup"
                    render={(props, state) => {
                      if (state.transitionStatus === 'ending') {
                        instantsWhileEnding.push(state.instant);
                      }
                      return <div {...props} />;
                    }}
                  >
                    <Menu.Item data-testid="content">{payload}</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            )}
          </Menu.Root>
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

            <Menu.Root
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
              <Menu.Trigger
                id="trigger-1"
                openOnHover
                delay={0}
                style={{ position: 'absolute', top: 20, left: 20 }}
              >
                Trigger 1
              </Menu.Trigger>
              <Menu.Trigger
                id="trigger-2"
                openOnHover
                delay={0}
                style={{ position: 'absolute', top: 20, left: 220 }}
              >
                Trigger 2
              </Menu.Trigger>

              <Menu.Portal>
                <Menu.Positioner data-testid="positioner" className="positioner">
                  <Menu.Popup
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
                    <Menu.Item>Item</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
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
  });

  describe.skipIf(isJSDOM)('nested menus', () => {
    describe.each([{ mode: 'contained' as const }, { mode: 'detached' as const }])(
      'with $mode triggers',
      ({ mode }) => {
        /**
         * Renders two triggers for one menu: as Root children (`contained`) or outside the Root,
         * connected with a handle (`detached`).
         */
        function TwoTriggerMenu({ children }: { children: React.ReactNode }) {
          const handle = React.useMemo(() => Menu.createHandle(), []);

          if (mode === 'contained') {
            return (
              <Menu.Root>
                <Menu.Trigger>Trigger 1</Menu.Trigger>
                <Menu.Trigger>Trigger 2</Menu.Trigger>
                {children}
              </Menu.Root>
            );
          }

          return (
            <React.Fragment>
              <Menu.Trigger handle={handle}>Trigger 1</Menu.Trigger>
              <Menu.Trigger handle={handle}>Trigger 2</Menu.Trigger>
              <Menu.Root handle={handle}>{children}</Menu.Root>
            </React.Fragment>
          );
        }

        it('supports keyboard navigation regardless of which trigger opened the menu', async () => {
          const { user } = await render(
            <TwoTriggerMenu>
              <Menu.Portal>
                <Menu.Positioner data-testid="menu">
                  <Menu.Popup>
                    <Menu.Item>Standalone</Menu.Item>
                    <Menu.SubmenuRoot>
                      <Menu.SubmenuTrigger data-testid="submenu-trigger">More</Menu.SubmenuTrigger>
                      <Menu.Portal>
                        <Menu.Positioner data-testid="submenu">
                          <Menu.Popup>
                            <Menu.Item data-testid="submenu-item">Nested</Menu.Item>
                          </Menu.Popup>
                        </Menu.Positioner>
                      </Menu.Portal>
                    </Menu.SubmenuRoot>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </TwoTriggerMenu>,
          );

          const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
          const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

          await user.click(trigger1);
          await screen.findByTestId('menu');
          // The menu focuses itself a frame after opening; keys sent earlier go to the trigger.
          await waitFor(() => {
            expect(screen.getByRole('menu')).toHaveFocus();
          });

          await user.keyboard('[ArrowDown]');
          await user.keyboard('[ArrowDown]');

          const submenuTrigger = await screen.findByTestId('submenu-trigger');
          await waitFor(() => {
            expect(submenuTrigger).toHaveFocus();
          });

          await user.keyboard('[ArrowRight]');

          const submenuItem = await screen.findByTestId('submenu-item');
          await waitFor(() => {
            expect(submenuItem).toHaveFocus();
          });

          await user.keyboard('[ArrowLeft]');
          await waitFor(() => {
            expect(screen.queryByTestId('submenu')).toBe(null);
          });
          expect(submenuTrigger).toHaveFocus();

          await user.keyboard('[Escape]');
          await waitFor(() => {
            expect(screen.queryByTestId('menu')).toBe(null);
          });

          await user.click(trigger2);
          await screen.findByTestId('menu');
        });

        it('opens a submenu on click when hover is disabled', async () => {
          const { user } = await render(
            <TwoTriggerMenu>
              <Menu.Portal>
                <Menu.Positioner data-testid="menu">
                  <Menu.Popup>
                    <Menu.Item>Standalone</Menu.Item>
                    <Menu.SubmenuRoot>
                      <Menu.SubmenuTrigger data-testid="submenu-trigger" openOnHover={false}>
                        More
                      </Menu.SubmenuTrigger>
                      <Menu.Portal>
                        <Menu.Positioner data-testid="submenu">
                          <Menu.Popup>
                            <Menu.Item data-testid="submenu-item">Nested</Menu.Item>
                          </Menu.Popup>
                        </Menu.Positioner>
                      </Menu.Portal>
                    </Menu.SubmenuRoot>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </TwoTriggerMenu>,
          );

          const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
          const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

          await user.click(trigger1);
          await screen.findByTestId('menu');
          expect(screen.queryByTestId('submenu')).toBe(null);

          const submenuTrigger = screen.getByTestId('submenu-trigger');
          await user.click(submenuTrigger);

          const submenuItem = await screen.findByTestId('submenu-item');
          expect(submenuItem.textContent).toBe('Nested');

          await user.click(submenuItem);
          await waitFor(() => {
            expect(screen.queryByTestId('menu')).toBe(null);
          });

          await user.click(trigger2);
          await screen.findByTestId('menu');
          expect(screen.queryByTestId('submenu')).toBe(null);
        });

        it('closes every level when clicking outside the deepest submenu', async () => {
          const { user } = await render(
            <div>
              <TwoTriggerMenu>
                <Menu.Portal>
                  <Menu.Positioner data-testid="level-1">
                    <Menu.Popup>
                      <Menu.Item>Item 1</Menu.Item>
                      <Menu.SubmenuRoot>
                        <Menu.SubmenuTrigger data-testid="submenu-trigger-1">
                          Level 2
                        </Menu.SubmenuTrigger>
                        <Menu.Portal>
                          <Menu.Positioner data-testid="level-2">
                            <Menu.Popup>
                              <Menu.Item>Item 2</Menu.Item>
                              <Menu.SubmenuRoot>
                                <Menu.SubmenuTrigger data-testid="submenu-trigger-2">
                                  Level 3
                                </Menu.SubmenuTrigger>
                                <Menu.Portal>
                                  <Menu.Positioner data-testid="level-3">
                                    <Menu.Popup>
                                      <Menu.Item>Deep Item</Menu.Item>
                                    </Menu.Popup>
                                  </Menu.Positioner>
                                </Menu.Portal>
                              </Menu.SubmenuRoot>
                            </Menu.Popup>
                          </Menu.Positioner>
                        </Menu.Portal>
                      </Menu.SubmenuRoot>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </TwoTriggerMenu>
              <button data-testid="outside">Outside</button>
            </div>,
          );

          const trigger = screen.getByRole('button', { name: 'Trigger 1' });
          await user.click(trigger);
          await screen.findByTestId('level-1');
          // The menu focuses itself a frame after opening; keys sent earlier go to the trigger.
          await waitFor(() => {
            expect(screen.getByRole('menu')).toHaveFocus();
          });

          await user.keyboard('[ArrowDown]');
          await user.keyboard('[ArrowDown]');

          const submenuTrigger1 = await screen.findByTestId('submenu-trigger-1');
          await waitFor(() => {
            expect(submenuTrigger1).toHaveFocus();
          });

          await user.keyboard('[ArrowRight]');
          await screen.findByTestId('level-2');
          await waitFor(() => {
            expect(screen.getByRole('menuitem', { name: 'Item 2' })).toHaveFocus();
          });

          await user.keyboard('[ArrowDown]');
          const submenuTrigger2 = await screen.findByTestId('submenu-trigger-2');
          await waitFor(() => {
            expect(submenuTrigger2).toHaveFocus();
          });

          await user.keyboard('[ArrowRight]');
          await screen.findByTestId('level-3');

          await user.click(screen.getByTestId('outside'));
          await waitFor(() => {
            expect(screen.queryByTestId('level-1')).toBe(null);
          });
          expect(screen.queryByTestId('level-2')).toBe(null);
          expect(screen.queryByTestId('level-3')).toBe(null);
        });

        it('selects nested items with click, drag, release', async () => {
          ignoreActWarnings();
          const clickSpy = vi.fn();
          const { user } = await render(
            <TwoTriggerMenu>
              <Menu.Portal>
                <Menu.Positioner data-testid="menu">
                  <Menu.Popup>
                    <Menu.Item>Item 1</Menu.Item>
                    <Menu.SubmenuRoot>
                      <Menu.SubmenuTrigger data-testid="submenu-trigger">More</Menu.SubmenuTrigger>
                      <Menu.Portal>
                        <Menu.Positioner data-testid="submenu">
                          <Menu.Popup>
                            <Menu.Item data-testid="submenu-item" onClick={clickSpy}>
                              Nested Action
                            </Menu.Item>
                          </Menu.Popup>
                        </Menu.Positioner>
                      </Menu.Portal>
                    </Menu.SubmenuRoot>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </TwoTriggerMenu>,
          );

          const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
          fireEvent.mouseDown(trigger1);

          await screen.findByTestId('menu');

          const submenuTrigger = await screen.findByTestId('submenu-trigger');
          await user.hover(submenuTrigger);
          await screen.findByTestId('submenu');

          // Wait 200ms to enable mouseup on menu items
          await wait(200);

          const submenuItem = await screen.findByTestId('submenu-item');
          fireEvent.mouseUp(submenuItem);

          await waitFor(() => {
            expect(screen.queryByTestId('menu')).toBe(null);
          });
          expect(clickSpy.mock.calls.length).toBe(1);

          const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });
          await user.click(trigger2);
          await screen.findByTestId('menu');
        });
      },
    );
  });

  describe('controlled open and triggerId fed from the change details, with the store inspected', () => {
    const handle = Menu.createHandle<string>();

    function App() {
      const [open, setOpen] = React.useState(false);
      const [triggerId, setTriggerId] = React.useState<string | null>(null);

      return (
        <React.Fragment>
          <StoreInspector handle={handle} />
          <Menu.Root
            handle={handle}
            open={open}
            triggerId={triggerId}
            onOpenChange={(nextOpen, eventDetails) => {
              setOpen(nextOpen);
              setTriggerId(eventDetails.trigger?.id ?? null);
            }}
          >
            {({ payload }) => (
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup data-testid="popup">
                    <Menu.Item>{payload}</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            )}
          </Menu.Root>
          <Menu.Trigger handle={handle} payload="Library">
            Library
          </Menu.Trigger>
          <Menu.Trigger handle={handle} payload="Playback" id="second-trigger">
            Playback
          </Menu.Trigger>
          <Menu.Trigger handle={handle} payload="Sharing">
            Sharing
          </Menu.Trigger>
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setTriggerId('second-trigger');
            }}
          >
            Open externally
          </button>
          <button type="button" onClick={() => handle.open('second-trigger')}>
            Open via handle
          </button>
        </React.Fragment>
      );
    }

    async function expectOpenWith(item: string) {
      await waitFor(() => {
        expect(screen.queryByTestId('popup')).not.toBe(null);
      });
      await waitFor(() => {
        expect(screen.getByRole('menuitem')).toHaveTextContent(item);
      });
    }

    async function expectClosed() {
      await waitFor(() => {
        expect(screen.queryByTestId('popup')).toBe(null);
      });
    }

    it('opens from each trigger, an item, and both external buttons', async () => {
      const { user } = await render(<App />);

      for (const name of ['Library', 'Playback', 'Sharing']) {
        const trigger = screen.getByRole('button', { name });
        // eslint-disable-next-line no-await-in-loop
        await user.click(trigger);
        // eslint-disable-next-line no-await-in-loop
        await expectOpenWith(name);
        expect(trigger).toHaveAttribute('aria-expanded', 'true');

        // eslint-disable-next-line no-await-in-loop
        await user.click(screen.getByRole('menuitem'));
        // eslint-disable-next-line no-await-in-loop
        await expectClosed();
      }

      await user.click(screen.getByRole('button', { name: 'Library' }));
      await expectOpenWith('Library');
      await user.click(screen.getByRole('button', { name: 'Sharing' }));
      await expectOpenWith('Sharing');
      await user.click(screen.getByRole('button', { name: 'Sharing' }));
      await expectClosed();

      await user.click(screen.getByRole('button', { name: 'Open externally' }));
      await expectOpenWith('Playback');
      await user.keyboard('[Escape]');
      await expectClosed();

      await user.click(screen.getByRole('button', { name: 'Open via handle' }));
      await expectOpenWith('Playback');
      await user.click(screen.getByRole('menuitem'));
      await expectClosed();
    });
  });
});
