import { expect, vi, describe, beforeEach, it } from 'vitest';
import * as React from 'react';
import {
  act,
  fireEvent,
  ignoreActWarnings,
  reactMajor,
  screen,
  waitFor,
} from '@mui/internal-test-utils';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import { Dialog } from '@base-ui/react/dialog';
import { Menu } from '@base-ui/react/menu';
import { ScrollArea } from '@base-ui/react/scroll-area';
import userEvent from '@testing-library/user-event';
import { createRenderer, isJSDOM, resetBrowserPointer, waitSingleFrame } from '#test-utils';

// Mainline tests assert the non-VoiceOver submenu-trigger behavior deterministically on every OS.
vi.mock('@base-ui/utils/platform', async () => {
  const actual =
    await vi.importActual<typeof import('@base-ui/utils/platform')>('@base-ui/utils/platform');

  return {
    platform: {
      ...actual.platform,
      screenReader: { ...actual.platform.screenReader, voiceOver: false },
    },
  };
});

describe('<Menu.FilterProvider><Menu.Root/></Menu.FilterProvider>', () => {
  beforeEach(resetBrowserPointer);

  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render, renderToString } = createRenderer();

  describe('filtering', () => {
    it('marks the input focus-visible when the menu is opened with the keyboard', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item>Rename</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const trigger = screen.getByRole('button', { name: 'Actions' });
      await act(async () => {
        trigger.focus();
      });
      await user.keyboard('[Enter]');

      const input = await screen.findByRole('searchbox', { name: 'Filter actions' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      expect(input).toHaveAttribute('data-highlighted');
    });

    it('marks the input focus-visible when the menu is opened with a pointer', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item>Rename</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'Actions' }));

      const input = await screen.findByRole('searchbox', { name: 'Filter actions' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      expect(input).toHaveAttribute('data-highlighted');
    });

    describe('prop: autoHighlight', () => {
      it('automatically highlights the first match after the user types', async () => {
        const { user } = await render(
          <Menu.FilterProvider autoHighlight>
            <Menu.Root defaultOpen>
              <Menu.Trigger>Actions</Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.FilterInput aria-label="Filter actions" />
                    <Menu.List>
                      <Menu.Item>Rename</Menu.Item>
                      <Menu.Item>Duplicate</Menu.Item>
                      <Menu.Item>Delete</Menu.Item>
                    </Menu.List>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </Menu.FilterProvider>,
        );

        const input = screen.getByRole('searchbox', { name: 'Filter actions' });
        expect(input).not.toHaveAttribute('aria-activedescendant');

        await user.type(input, 'd');

        const duplicate = screen.getByRole('menuitem', { name: 'Duplicate' });
        await waitFor(() => {
          expect(duplicate).toHaveAttribute('data-highlighted');
        });
        expect(input).toHaveAttribute('aria-activedescendant', duplicate.id);

        await user.type(input, 'el');

        const deleteItem = screen.getByRole('menuitem', { name: 'Delete' });
        await waitFor(() => {
          expect(deleteItem).toHaveAttribute('data-highlighted');
        });
        expect(input).toHaveAttribute('aria-activedescendant', deleteItem.id);
      });

      it('updates the active descendant when filtering replaces a custom-id item', async () => {
        function Test(props: { inputValue: string }) {
          return (
            <Menu.FilterProvider
              autoHighlight="always"
              inputValue={props.inputValue}
              onInputValueChange={() => {}}
            >
              <Menu.Root open>
                <Menu.Portal>
                  <Menu.Positioner>
                    <Menu.Popup>
                      <Menu.FilterInput aria-label="Filter fruit" />
                      <Menu.List>
                        <Menu.Item render={<div id="apple-item" />}>Apple</Menu.Item>
                        <Menu.Item render={<div id="banana-item" />}>Banana</Menu.Item>
                      </Menu.List>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
            </Menu.FilterProvider>
          );
        }

        const { setProps } = await render(<Test inputValue="" />);

        const input = screen.getByRole('searchbox', { name: 'Filter fruit' });
        await waitFor(() => {
          expect(input).toHaveAttribute('aria-activedescendant', 'apple-item');
        });

        await setProps({ inputValue: 'ban' });

        await waitFor(() => {
          expect(input).toHaveAttribute('aria-activedescendant', 'banana-item');
        });
        expect(screen.queryByRole('menuitem', { name: 'Apple' })).toBe(null);
      });

      it('always highlights the first item when autoHighlight is "always"', async () => {
        await render(
          <Menu.FilterProvider autoHighlight="always">
            <Menu.Root open>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.FilterInput aria-label="Filter actions" />
                    <Menu.List>
                      <Menu.Item>Rename</Menu.Item>
                      <Menu.Item>Delete</Menu.Item>
                    </Menu.List>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </Menu.FilterProvider>,
        );

        const input = screen.getByRole('searchbox', { name: 'Filter actions' });
        const rename = screen.getByRole('menuitem', { name: 'Rename' });

        await waitFor(() => {
          expect(rename).toHaveAttribute('data-highlighted');
        });
        expect(input).toHaveAttribute('aria-activedescendant', rename.id);
      });

      it.each([true, 'always'] as const)(
        'keeps a highlight when typing does not change the trimmed query with autoHighlight=%s',
        async (autoHighlight) => {
          const { user } = await render(
            <Menu.FilterProvider autoHighlight={autoHighlight}>
              <Menu.Root open>
                <Menu.Portal>
                  <Menu.Positioner>
                    <Menu.Popup>
                      <Menu.FilterInput aria-label="Filter actions" />
                      <Menu.List>
                        <Menu.Item>Google Calendar</Menu.Item>
                        <Menu.Item>Google Chrome</Menu.Item>
                      </Menu.List>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
            </Menu.FilterProvider>,
          );

          const input = screen.getByRole('searchbox', { name: 'Filter actions' });
          await user.type(input, 'Google');

          const firstItem = screen.getByRole('menuitem', { name: 'Google Calendar' });
          await waitFor(() => {
            expect(firstItem).toHaveAttribute('data-highlighted');
          });

          await user.type(input, ' ');

          await waitFor(() => {
            expect(firstItem).toHaveAttribute('data-highlighted');
          });
          expect(input).toHaveAttribute('aria-activedescendant', firstItem.id);
        },
      );

      it.each([true, 'always'] as const)(
        'does not allow arrow navigation to escape when autoHighlight is %s',
        async (autoHighlight) => {
          const { user } = await render(
            <Menu.FilterProvider autoHighlight={autoHighlight}>
              <Menu.Root open>
                <Menu.Portal>
                  <Menu.Positioner>
                    <Menu.Popup>
                      <Menu.FilterInput aria-label="Filter actions" />
                      <Menu.List>
                        <Menu.Item>Rename</Menu.Item>
                        <Menu.Item>Delete</Menu.Item>
                      </Menu.List>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
            </Menu.FilterProvider>,
          );

          const input = screen.getByRole('searchbox', { name: 'Filter actions' });
          if (autoHighlight === true) {
            await user.type(input, 'e');
          } else {
            await act(async () => {
              input.focus();
            });
          }

          const firstItem = screen.getByRole('menuitem', { name: 'Rename' });
          await waitFor(() => {
            expect(firstItem).toHaveAttribute('data-highlighted');
          });

          await user.keyboard('[ArrowUp]');

          const lastItem = screen.getByRole('menuitem', { name: 'Delete' });
          await waitFor(() => {
            expect(lastItem).toHaveAttribute('data-highlighted');
          });
          expect(input).toHaveAttribute('aria-activedescendant', lastItem.id);

          await user.keyboard('[ArrowDown]');

          await waitFor(() => {
            expect(firstItem).toHaveAttribute('data-highlighted');
          });
          expect(input).toHaveAttribute('aria-activedescendant', firstItem.id);
        },
      );

      it('always highlights the first item when mounted inside an opened dialog', async () => {
        function App() {
          const [open, setOpen] = React.useState(false);

          return (
            <Dialog.Root open={open} onOpenChange={setOpen}>
              <Dialog.Trigger>Open palette</Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Popup aria-label="Command palette">
                  <Menu.FilterProvider autoHighlight="always">
                    <Menu.Root open>
                      <Menu.Portal>
                        <Menu.Positioner>
                          <Menu.Popup>
                            <Menu.FilterInput aria-label="Search commands" />
                            <Dialog.Close>Close palette</Dialog.Close>
                            <ScrollArea.Root>
                              <ScrollArea.Viewport>
                                <ScrollArea.Content>
                                  <Menu.List>
                                    <Menu.Group>
                                      <Menu.GroupLabel>Suggestions</Menu.GroupLabel>
                                      <Menu.Item>Linear</Menu.Item>
                                      <Menu.Item>Figma</Menu.Item>
                                    </Menu.Group>
                                  </Menu.List>
                                </ScrollArea.Content>
                              </ScrollArea.Viewport>
                              <ScrollArea.Scrollbar>
                                <ScrollArea.Thumb />
                              </ScrollArea.Scrollbar>
                            </ScrollArea.Root>
                          </Menu.Popup>
                        </Menu.Positioner>
                      </Menu.Portal>
                    </Menu.Root>
                  </Menu.FilterProvider>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          );
        }

        const { user } = await render(<App />);

        await user.click(screen.getByRole('button', { name: 'Open palette' }));

        const input = await screen.findByRole('searchbox', { name: 'Search commands' });
        const firstItem = screen.getByRole('menuitem', { name: 'Linear' });
        await waitFor(() => {
          expect(firstItem).toHaveAttribute('data-highlighted');
        });
        expect(input).toHaveAttribute('aria-activedescendant', firstItem.id);
      });

      it('clears the automatic highlight when a typed query is cleared', async () => {
        const { user } = await render(
          <Menu.FilterProvider autoHighlight>
            <Menu.Root open>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.FilterInput aria-label="Filter actions" />
                    <Menu.List>
                      <Menu.Item>Rename</Menu.Item>
                      <Menu.Item>Delete</Menu.Item>
                    </Menu.List>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </Menu.FilterProvider>,
        );

        const input = screen.getByRole('searchbox', { name: 'Filter actions' });
        await user.type(input, 'del');
        await waitFor(() => {
          expect(input).toHaveAttribute('aria-activedescendant');
        });

        await user.clear(input);

        await waitFor(() => {
          expect(input).not.toHaveAttribute('aria-activedescendant');
        });
        expect(screen.getByRole('menuitem', { name: 'Rename' })).not.toHaveAttribute(
          'data-highlighted',
        );
      });

      it('restores the first item when an always-highlighted query is cleared', async () => {
        const { user } = await render(
          <Menu.FilterProvider autoHighlight="always">
            <Menu.Root open>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.FilterInput aria-label="Filter actions" />
                    <Menu.List>
                      <Menu.Item>Rename</Menu.Item>
                      <Menu.Item>Delete</Menu.Item>
                    </Menu.List>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </Menu.FilterProvider>,
        );

        const input = screen.getByRole('searchbox', { name: 'Filter actions' });
        await user.type(input, 'del');
        const deleteItem = screen.getByRole('menuitem', { name: 'Delete' });
        await waitFor(() => {
          expect(deleteItem).toHaveAttribute('data-highlighted');
        });

        await user.clear(input);

        const rename = screen.getByRole('menuitem', { name: 'Rename' });
        await waitFor(() => {
          expect(rename).toHaveAttribute('data-highlighted');
        });
        expect(input).toHaveAttribute('aria-activedescendant', rename.id);
      });

      it('clears the highlight when no items match', async () => {
        const { user } = await render(
          <Menu.FilterProvider autoHighlight>
            <Menu.Root open>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.FilterInput aria-label="Filter actions" />
                    <Menu.List>
                      <Menu.Item>Rename</Menu.Item>
                      <Menu.Item>Delete</Menu.Item>
                    </Menu.List>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </Menu.FilterProvider>,
        );

        const input = screen.getByRole('searchbox', { name: 'Filter actions' });
        await user.type(input, 'missing');

        await waitFor(() => {
          expect(input).not.toHaveAttribute('aria-activedescendant');
        });
        expect(screen.queryAllByRole('menuitem')).toHaveLength(0);
      });

      it('continues keyboard navigation from the automatic highlight and activates it', async () => {
        const onDelete = vi.fn();
        const { user } = await render(
          <Menu.FilterProvider autoHighlight>
            <Menu.Root open>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.FilterInput aria-label="Filter actions" />
                    <Menu.List>
                      <Menu.Item>Duplicate</Menu.Item>
                      <Menu.Item onClick={onDelete}>Delete</Menu.Item>
                    </Menu.List>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </Menu.FilterProvider>,
        );

        const input = screen.getByRole('searchbox', { name: 'Filter actions' });
        await user.type(input, 'd');
        await waitFor(() => {
          expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toHaveAttribute(
            'data-highlighted',
          );
        });

        await user.keyboard('[ArrowDown][Enter]');

        expect(onDelete).toHaveBeenCalledTimes(1);
      });

      it('preserves a pointer highlight when autoHighlight is "always"', async () => {
        const { user } = await render(
          <Menu.FilterProvider autoHighlight="always">
            <Menu.Root open>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.FilterInput aria-label="Filter actions" />
                    <Menu.List>
                      <Menu.Item>Rename</Menu.Item>
                      <Menu.Item>Delete</Menu.Item>
                    </Menu.List>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </Menu.FilterProvider>,
        );

        const deleteItem = screen.getByRole('menuitem', { name: 'Delete' });
        await user.hover(deleteItem);

        await waitFor(() => {
          expect(deleteItem).toHaveAttribute('data-highlighted');
        });

        await user.unhover(deleteItem);

        expect(deleteItem).toHaveAttribute('data-highlighted');
      });

      it('supports a controlled query', async () => {
        function App() {
          const [query, setQuery] = React.useState('');

          return (
            <Menu.FilterProvider autoHighlight inputValue={query} onInputValueChange={setQuery}>
              <Menu.Root open>
                <Menu.Portal>
                  <Menu.Positioner>
                    <Menu.Popup>
                      <Menu.FilterInput aria-label="Filter actions" />
                      <Menu.List>
                        <Menu.Item>Rename</Menu.Item>
                        <Menu.Item>Delete</Menu.Item>
                      </Menu.List>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
            </Menu.FilterProvider>
          );
        }

        const { user } = await render(<App />);
        const input = screen.getByRole('searchbox', { name: 'Filter actions' });
        await user.type(input, 'del');

        const deleteItem = screen.getByRole('menuitem', { name: 'Delete' });
        await waitFor(() => {
          expect(deleteItem).toHaveAttribute('data-highlighted');
        });
        expect(input).toHaveAttribute('aria-activedescendant', deleteItem.id);
      });

      it('supports persistent always highlighting inside a filterable submenu', async () => {
        const { user } = await render(
          <Menu.Root open>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterProvider autoHighlight="always">
                    <Menu.SubmenuRoot defaultOpen>
                      <Menu.SubmenuTrigger>Move to</Menu.SubmenuTrigger>
                      <Menu.Portal>
                        <Menu.Positioner>
                          <Menu.Popup>
                            <Menu.FilterInput aria-label="Filter destinations" />
                            <Menu.List>
                              <Menu.Item>Documents</Menu.Item>
                              <Menu.Item>Downloads</Menu.Item>
                            </Menu.List>
                          </Menu.Popup>
                        </Menu.Positioner>
                      </Menu.Portal>
                    </Menu.SubmenuRoot>
                  </Menu.FilterProvider>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>,
        );

        const input = screen.getByRole('searchbox', { name: 'Filter destinations' });
        const firstItem = screen.getByRole('menuitem', { name: 'Documents' });
        await waitFor(() => {
          expect(firstItem).toHaveAttribute('data-highlighted');
        });
        expect(input).toHaveAttribute('aria-activedescendant', firstItem.id);

        await act(async () => {
          input.focus();
        });
        await user.keyboard('[ArrowUp]');

        const lastItem = screen.getByRole('menuitem', { name: 'Downloads' });
        await waitFor(() => {
          expect(lastItem).toHaveAttribute('data-highlighted');
        });
        expect(input).toHaveAttribute('aria-activedescendant', lastItem.id);
      });
    });

    it.skipIf(isJSDOM)(
      'does not highlight the first item while closing from the trigger with a pointer',
      async ({ onTestFinished }) => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
        onTestFinished(() => {
          globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
        });

        const { user } = await render(
          <React.Fragment>
            <style>{`
              @keyframes filter-menu-pointer-close-test {
                to { opacity: 0; }
              }
              .filter-menu-pointer-close-test[data-ending-style] {
                animation: filter-menu-pointer-close-test 10s linear;
              }
            `}</style>
            <Menu.FilterProvider>
              <Menu.Root>
                <Menu.Trigger>Actions</Menu.Trigger>
                <Menu.Portal>
                  <Menu.Positioner>
                    <Menu.Popup data-testid="popup" className="filter-menu-pointer-close-test">
                      <Menu.FilterInput aria-label="Filter actions" />
                      <Menu.List>
                        <Menu.Item>Rename</Menu.Item>
                      </Menu.List>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
            </Menu.FilterProvider>
          </React.Fragment>,
        );

        const trigger = screen.getByRole('button', { name: 'Actions' });
        await user.click(trigger);
        const input = await screen.findByRole('searchbox', { name: 'Filter actions' });
        const item = screen.getByRole('menuitem', { name: 'Rename' });
        expect(item).not.toHaveAttribute('data-highlighted');

        // Pressing the trigger can move focus before its close handler runs in Safari.
        await act(async () => {
          trigger.focus();
        });
        expect(item).not.toHaveAttribute('data-highlighted');
        await user.click(trigger);

        await waitFor(() => {
          expect(screen.getByTestId('popup')).toHaveAttribute('data-ending-style');
        });
        expect(input).not.toHaveAttribute('aria-activedescendant');
        expect(item).not.toHaveAttribute('data-highlighted');

        // The exit runs for 10s, so re-check past the first frames of it.
        await act(async () => {
          await waitSingleFrame();
          await waitSingleFrame();
        });
        expect(input).not.toHaveAttribute('aria-activedescendant');
        expect(item).not.toHaveAttribute('data-highlighted');
      },
    );

    it('moves focus past the menu when tabbing from the input', async () => {
      const { user } = await render(
        <div>
          <Menu.FilterProvider>
            <Menu.Root defaultOpen>
              <Menu.Trigger>Actions</Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.FilterInput aria-label="Filter actions" />
                    <Menu.List style={{ height: 1, overflow: 'auto' }}>
                      <Menu.Item style={{ height: 10 }}>Rename</Menu.Item>
                      <Menu.Item style={{ height: 10 }}>Duplicate</Menu.Item>
                    </Menu.List>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </Menu.FilterProvider>
          <input data-testid="after" />
        </div>,
      );

      const input = screen.getByRole<HTMLInputElement>('searchbox', {
        name: 'Filter actions',
      });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });

      if (isJSDOM) {
        await user.tab();
      } else {
        const { userEvent: browserUser } = await import('vitest/browser');
        await act(async () => {
          await browserUser.keyboard('[Tab]');
        });
      }

      await waitFor(() => {
        expect(screen.getByTestId('after')).toHaveFocus();
      });
    });

    it('matches items on their keywords', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root open>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item keywords={['remove', 'trash']}>Delete</Menu.Item>
                    <Menu.Item>Rename</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const input = await screen.findByRole('searchbox', { name: 'Filter actions' });
      await user.type(input, 'trash');
      await user.keyboard('[ArrowDown]');

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeVisible();
      });
      expect(screen.queryByRole('menuitem', { name: 'Rename' })).toBe(null);
    });

    it('uses the configured locale for default matching', async () => {
      await render(
        <Menu.FilterProvider defaultInputValue="ı" locale="tr">
          <Menu.Root open>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item>Istanbul</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'Istanbul' })).toBeVisible();
      });
    });

    it('keeps Home and End as caret keys until an item is highlighted', async () => {
      const { user } = await render(
        <Menu.FilterProvider defaultInputValue="rename">
          <Menu.Root open>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item>Rename</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const input = screen.getByRole<HTMLInputElement>('searchbox', {
        name: 'Filter actions',
      });
      await user.click(input);
      input.setSelectionRange(3, 3);

      await user.keyboard('[Home]');
      expect(input.selectionStart).toBe(0);
      expect(input).not.toHaveAttribute('aria-activedescendant');

      await user.keyboard('[End]');
      expect(input.selectionStart).toBe(input.value.length);
      expect(input).not.toHaveAttribute('aria-activedescendant');
    });

    it('keeps Home and End as caret keys while the input is empty', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root open>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item>Rename</Menu.Item>
                    <Menu.Item>Delete</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const input = screen.getByRole('searchbox', { name: 'Filter actions' });
      await user.click(input);

      await user.keyboard('[End]');
      expect(input).not.toHaveAttribute('aria-activedescendant');

      await user.keyboard('[Home]');
      expect(input).not.toHaveAttribute('aria-activedescendant');
    });

    it('uses Home and End for list navigation after an item is highlighted', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root open>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item>Rename</Menu.Item>
                    <Menu.Item>Duplicate</Menu.Item>
                    <Menu.Item>Delete</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const input = screen.getByRole('searchbox', { name: 'Filter actions' });
      const items = screen.getAllByRole('menuitem');
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      await user.keyboard('[ArrowDown][ArrowDown]');

      await user.keyboard('[Home]');
      expect(input).toHaveAttribute('aria-activedescendant', items[0]?.id);

      await user.keyboard('[End]');
      expect(input).toHaveAttribute('aria-activedescendant', items[2]?.id);
    });

    it('hides a group, label included, when the query filters out all of its items', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root open>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Group data-testid="file-group">
                      <Menu.GroupLabel>File</Menu.GroupLabel>
                      <Menu.Item>Save</Menu.Item>
                    </Menu.Group>
                    <Menu.Group data-testid="manage-group">
                      <Menu.GroupLabel>Manage</Menu.GroupLabel>
                      <Menu.Item>Rename</Menu.Item>
                    </Menu.Group>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const input = await screen.findByRole('searchbox', { name: 'Filter actions' });
      await user.type(input, 'ren');
      await user.keyboard('[ArrowDown]');

      await waitFor(() => {
        expect(screen.getByTestId('file-group')).not.toBeVisible();
      });
      expect(screen.getByTestId('manage-group')).toBeVisible();
      expect(screen.getByRole('menuitem', { name: 'Rename' })).toBeVisible();

      await user.clear(input);

      await waitFor(() => {
        expect(screen.getByTestId('file-group')).toBeVisible();
      });
    });

    it('closes a filterable submenu and moves focus to the next element when tabbing forward', async () => {
      const { user } = await render(
        <div>
          <input />
          <Menu.FilterProvider>
            <Menu.Root defaultOpen>
              <Menu.Trigger>Actions</Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.FilterInput aria-label="Filter actions" />
                    <Menu.List>
                      <Menu.FilterProvider>
                        <Menu.SubmenuRoot>
                          <Menu.SubmenuTrigger>Share</Menu.SubmenuTrigger>
                          <Menu.Portal>
                            <Menu.Positioner>
                              <Menu.Popup>
                                <Menu.FilterInput aria-label="Filter sharing options" />
                                <Menu.List>
                                  <Menu.Item>Email</Menu.Item>
                                </Menu.List>
                              </Menu.Popup>
                            </Menu.Positioner>
                          </Menu.Portal>
                        </Menu.SubmenuRoot>
                      </Menu.FilterProvider>
                    </Menu.List>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </Menu.FilterProvider>
          <input data-testid="after" />
        </div>,
      );

      const parentInput = screen.getByRole('searchbox', { name: 'Filter actions' });
      await waitFor(() => {
        expect(parentInput).toHaveFocus();
      });

      await user.keyboard('[ArrowDown][ArrowRight]');

      const submenuInput = await screen.findByRole('searchbox', { name: 'Filter sharing options' });
      await waitFor(() => {
        expect(submenuInput).toHaveFocus();
      });

      await user.tab();

      await waitFor(() => {
        expect(screen.getByTestId('after')).toHaveFocus();
      });
      await waitFor(() => {
        expect(screen.queryByRole('searchbox', { name: 'Filter actions' })).toBe(null);
      });
    });

    it('closes a pointer-opened filterable submenu and moves focus forward when tabbing', async ({
      onTestFinished,
    }) => {
      // Exit transitions keep the closing popups mounted while focus relocates.
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
      onTestFinished(() => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
      });

      const { user } = await render(
        <div>
          <style>{`
            .filter-popup { transition: opacity 50ms; opacity: 1; }
            .filter-popup[data-ending-style] { opacity: 0; }
          `}</style>
          <input />
          <Menu.FilterProvider>
            <Menu.Root>
              <Menu.Trigger>Actions</Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup className="filter-popup">
                    <Menu.FilterInput aria-label="Filter actions" />
                    <Menu.List>
                      <Menu.FilterProvider>
                        <Menu.SubmenuRoot>
                          <Menu.SubmenuTrigger delay={0}>Share</Menu.SubmenuTrigger>
                          <Menu.Portal>
                            <Menu.Positioner>
                              <Menu.Popup className="filter-popup">
                                <Menu.FilterInput aria-label="Filter sharing options" />
                                <Menu.List>
                                  <Menu.Item>Email</Menu.Item>
                                </Menu.List>
                              </Menu.Popup>
                            </Menu.Positioner>
                          </Menu.Portal>
                        </Menu.SubmenuRoot>
                      </Menu.FilterProvider>
                    </Menu.List>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </Menu.FilterProvider>
          <input data-testid="after" />
        </div>,
      );

      await user.click(screen.getByRole('button', { name: 'Actions' }));

      const submenuTrigger = await screen.findByRole('menuitem', { name: 'Share' });
      await user.click(submenuTrigger);

      const submenuInput = await screen.findByRole('searchbox', { name: 'Filter sharing options' });
      await waitFor(() => {
        expect(submenuInput).toHaveFocus();
      });

      await user.tab();

      await waitFor(() => {
        expect(screen.getByTestId('after')).toHaveFocus();
      });
      await waitFor(() => {
        expect(screen.queryByRole('searchbox', { name: 'Filter actions' })).toBe(null);
      });
    });

    it('focuses a click-opened filterable submenu input so typing filters the submenu', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.FilterProvider>
                      <Menu.SubmenuRoot>
                        <Menu.SubmenuTrigger openOnHover={false}>Share</Menu.SubmenuTrigger>
                        <Menu.Portal>
                          <Menu.Positioner>
                            <Menu.Popup>
                              <Menu.FilterInput aria-label="Filter sharing options" />
                              <Menu.List>
                                <Menu.Item>Email</Menu.Item>
                                <Menu.Item>Link</Menu.Item>
                              </Menu.List>
                            </Menu.Popup>
                          </Menu.Positioner>
                        </Menu.Portal>
                      </Menu.SubmenuRoot>
                    </Menu.FilterProvider>
                    <Menu.Item>Delete</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'Actions' }));

      const submenuTrigger = await screen.findByRole('menuitem', { name: 'Share' });
      await user.click(submenuTrigger);

      const submenuInput = await screen.findByRole('searchbox', { name: 'Filter sharing options' });
      await waitFor(() => {
        expect(submenuInput).toHaveFocus();
      });

      await user.keyboard('em');

      expect(submenuInput).toHaveValue('em');
      await waitFor(() => {
        expect(screen.queryByRole('menuitem', { name: 'Link' })).toBe(null);
      });
      expect(screen.getByRole('menuitem', { name: 'Email' })).toBeVisible();
      // The parent list did not filter: its own items are all still present.
      expect(screen.getByRole('menuitem', { name: 'Share' })).toBeVisible();
      expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeVisible();
    });

    // Only the submenu filters here; the outer menu is an ordinary one.
    function FilterableSubmenu({ portalled = true }: { portalled?: boolean }) {
      const SubmenuPortal = portalled ? Menu.Portal : React.Fragment;

      return (
        <Menu.Root defaultOpen>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Item>Rename</Menu.Item>
                <Menu.FilterProvider>
                  <Menu.SubmenuRoot>
                    <Menu.SubmenuTrigger delay={0}>Move to folder</Menu.SubmenuTrigger>
                    <SubmenuPortal>
                      <Menu.Positioner>
                        <Menu.Popup>
                          <Menu.FilterInput aria-label="Filter folders" />
                          <Menu.List>
                            <Menu.Item>Documents</Menu.Item>
                            <Menu.Item>Downloads</Menu.Item>
                          </Menu.List>
                        </Menu.Popup>
                      </Menu.Positioner>
                    </SubmenuPortal>
                  </Menu.SubmenuRoot>
                </Menu.FilterProvider>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      );
    }

    function ParentNavigationMenu(props: { loopFocus: boolean; triggerLast?: boolean }) {
      const submenu = (
        <Menu.FilterProvider>
          <Menu.SubmenuRoot>
            <Menu.SubmenuTrigger>Move to folder</Menu.SubmenuTrigger>
          </Menu.SubmenuRoot>
        </Menu.FilterProvider>
      );

      return (
        <Menu.Root defaultOpen loopFocus={props.loopFocus}>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                {!props.triggerLast && submenu}
                <Menu.Item disabled>Disabled</Menu.Item>
                <Menu.Item>Next</Menu.Item>
                {props.triggerLast && submenu}
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      );
    }

    it('uses dialog semantics for a filterable submenu', async () => {
      const { user } = await render(<FilterableSubmenu />);
      const submenuTrigger = screen.getByRole('menuitem', { name: 'Move to folder' });

      expect(submenuTrigger).toHaveAttribute('aria-haspopup', 'dialog');

      await user.hover(submenuTrigger);

      const popup = await screen.findByRole('dialog');
      expect(submenuTrigger).toHaveAttribute('aria-controls', popup.id);
      expect(popup).toHaveAttribute('aria-labelledby', submenuTrigger.id);
    });

    it('lets the ordinary parent menu own its main-axis navigation keys', async () => {
      const { user } = await render(<FilterableSubmenu />);
      const submenuTrigger = screen.getByRole('menuitem', { name: 'Move to folder' });

      await act(async () => {
        submenuTrigger.focus();
      });
      await user.keyboard('[ArrowUp]');

      expect(screen.getByRole('menuitem', { name: 'Rename' })).toHaveFocus();
      expect(screen.queryByRole('dialog')).toBe(null);
    });

    it('keeps disabled parent items reachable during main-axis navigation', async () => {
      const { user } = await render(<ParentNavigationMenu loopFocus />);
      const submenuTrigger = screen.getByRole('menuitem', { name: 'Move to folder' });

      await act(async () => {
        submenuTrigger.focus();
      });
      await user.keyboard('[ArrowDown]');

      // The parent menu passes `disabledIndices: EMPTY_ARRAY` to `useListNavigation`, so its own
      // items land on `aria-disabled` neighbours. Arrowing off this trigger must match.
      expect(screen.getByRole('menuitem', { name: 'Disabled' })).toHaveFocus();
    });

    it('wraps parent navigation when loopFocus is enabled', async () => {
      const { user } = await render(<ParentNavigationMenu loopFocus triggerLast />);
      const submenuTrigger = screen.getByRole('menuitem', { name: 'Move to folder' });

      await act(async () => {
        submenuTrigger.focus();
      });
      await user.keyboard('[ArrowDown]');

      // The trigger is last, so this wraps to the first item, which is the disabled one.
      expect(screen.getByRole('menuitem', { name: 'Disabled' })).toHaveFocus();
    });

    it('stops parent navigation at the boundary when loopFocus is disabled', async () => {
      const { user } = await render(<ParentNavigationMenu loopFocus={false} triggerLast />);
      const submenuTrigger = screen.getByRole('menuitem', { name: 'Move to folder' });

      await act(async () => {
        submenuTrigger.focus();
      });
      await user.keyboard('[ArrowDown]');

      expect(submenuTrigger).toHaveFocus();
    });

    it('resets the input value once when the popup closes', async () => {
      const onInputValueChange = vi.fn();

      function Test() {
        const [open, setOpen] = React.useState(true);

        return (
          <React.Fragment>
            <button type="button" onClick={() => setOpen(false)}>
              Close
            </button>
            <Menu.FilterProvider onInputValueChange={onInputValueChange}>
              <Menu.Root open={open}>
                <Menu.Trigger>Fruit</Menu.Trigger>
                <Menu.Portal>
                  <Menu.Positioner>
                    <Menu.Popup>
                      <Menu.FilterInput aria-label="Filter fruit" />
                      <Menu.List>
                        <Menu.Item>Apple</Menu.Item>
                      </Menu.List>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
            </Menu.FilterProvider>
          </React.Fragment>
        );
      }

      const { user } = await render(<Test />);
      const input = await screen.findByRole('searchbox', { name: 'Filter fruit' });

      await user.type(input, 'app');
      onInputValueChange.mockClear();

      await user.click(screen.getByRole('button', { name: 'Close' }));

      await waitFor(() => {
        expect(onInputValueChange).toHaveBeenCalledTimes(1);
      });
      expect(onInputValueChange.mock.calls[0][0]).toBe('');
      expect(onInputValueChange.mock.calls[0][1].reason).toBe('popup-close');
    });

    it.skipIf(isJSDOM)(
      'keeps submenu filtering updated during the exit transition',
      async ({ onTestFinished }) => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
        onTestFinished(() => {
          globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
        });

        let addApricot = () => {};
        let closeSubmenu = () => {};

        function Test() {
          const [open, setOpen] = React.useState(true);
          const [items, setItems] = React.useState(['Apple', 'Banana']);
          addApricot = () => setItems((currentItems) => [...currentItems, 'Apricot']);
          closeSubmenu = () => setOpen(false);

          return (
            <React.Fragment>
              <style>{`
                @keyframes filter-menu-close-test {
                  to { opacity: 0; }
                }
                .filter-menu-close-test[data-ending-style] {
                  animation: filter-menu-close-test 10s linear;
                }
              `}</style>
              <Menu.Root defaultOpen>
                <Menu.Trigger>Actions</Menu.Trigger>
                <Menu.Portal>
                  <Menu.Positioner>
                    <Menu.Popup>
                      <Menu.FilterProvider>
                        <Menu.SubmenuRoot open={open} onOpenChange={setOpen}>
                          <Menu.SubmenuTrigger>Fruit</Menu.SubmenuTrigger>
                          <Menu.Portal>
                            <Menu.Positioner>
                              <Menu.Popup data-testid="popup" className="filter-menu-close-test">
                                <Menu.FilterInput aria-label="Filter fruit" />
                                <Menu.List>
                                  {items.map((item) => (
                                    <Menu.Item key={item}>{item}</Menu.Item>
                                  ))}
                                </Menu.List>
                              </Menu.Popup>
                            </Menu.Positioner>
                          </Menu.Portal>
                        </Menu.SubmenuRoot>
                      </Menu.FilterProvider>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
            </React.Fragment>
          );
        }

        const { user } = await render(<Test />);
        const input = screen.getByRole('searchbox', { name: 'Filter fruit' });
        await user.click(input);
        await user.type(input, 'ap');
        await waitFor(() => {
          expect(input).toHaveValue('ap');
        });
        await act(async () => {
          closeSubmenu();
        });

        const popup = screen.getByTestId('popup');
        await waitFor(() => {
          expect(popup).toHaveAttribute('data-ending-style');
        });
        expect(input).toHaveValue('ap');
        await act(async () => {
          addApricot();
        });
        await waitFor(() => {
          expect(screen.getByRole('menuitem', { name: 'Apricot' })).toBeVisible();
        });
        expect(screen.queryByRole('menuitem', { name: 'Banana' })).toBe(null);

        popup.getAnimations().forEach((animation) => animation.finish());
        await waitFor(() => {
          expect(screen.queryByTestId('popup')).toBe(null);
        });

        await user.click(screen.getByRole('menuitem', { name: 'Fruit' }));
        expect(await screen.findByRole('searchbox', { name: 'Filter fruit' })).toHaveValue('');
        expect(await screen.findByRole('menuitem', { name: 'Banana' })).toBeVisible();
      },
    );

    it('leaves the uncontrolled query and visible items unchanged when a change is canceled', async () => {
      const { user } = await render(
        <Menu.FilterProvider
          defaultInputValue="app"
          onInputValueChange={(_, eventDetails) => eventDetails.cancel()}
        >
          <Menu.Root open>
            <Menu.Trigger>Fruit</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter fruit" />
                  <Menu.FilterClear aria-label="Clear filter" />
                  <Menu.List>
                    <Menu.Item>Apple</Menu.Item>
                    <Menu.Item>Banana</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const input = await screen.findByRole('searchbox', { name: 'Filter fruit' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      await user.keyboard('[ArrowDown]');
      await waitFor(() => {
        expect(input).toHaveAttribute(
          'aria-activedescendant',
          screen.getByRole('menuitem', { name: 'Apple' }).id,
        );
      });

      expect(input).toHaveValue('app');
      expect(screen.getByRole('menuitem', { name: 'Apple' })).toBeVisible();
      expect(screen.queryByRole('menuitem', { name: 'Banana' })).toBe(null);

      // Typing is rejected.
      await user.type(input, 'x', { skipClick: true });

      expect(input).toHaveValue('app');
      expect(screen.getByRole('menuitem', { name: 'Apple' })).toBeVisible();
      expect(screen.queryByRole('menuitem', { name: 'Banana' })).toBe(null);
      expect(input).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('menuitem', { name: 'Apple' }).id,
      );

      // Clearing is rejected.
      await user.click(screen.getByRole('button', { name: 'Clear filter' }));

      expect(input).toHaveValue('app');
      expect(screen.getByRole('menuitem', { name: 'Apple' })).toBeVisible();
      expect(screen.queryByRole('menuitem', { name: 'Banana' })).toBe(null);
      expect(input).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('menuitem', { name: 'Apple' }).id,
      );
    });

    it('clears a positional highlight when a controlled query replaces the visible item', async () => {
      const onAppleClick = vi.fn();

      function Test(props: { inputValue: string }) {
        return (
          <Menu.FilterProvider inputValue={props.inputValue} onInputValueChange={() => {}}>
            <Menu.Root open>
              <Menu.Trigger>Fruit</Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.FilterInput aria-label="Filter fruit" />
                    <Menu.List>
                      <Menu.Item onClick={onAppleClick}>Apple</Menu.Item>
                      <Menu.Item>Banana</Menu.Item>
                    </Menu.List>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </Menu.FilterProvider>
        );
      }

      const { user, setProps } = await render(<Test inputValue="ban" />);
      const input = screen.getByRole('searchbox', { name: 'Filter fruit' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      await user.keyboard('[ArrowDown]');
      await waitFor(() => {
        expect(input).toHaveAttribute(
          'aria-activedescendant',
          screen.getByRole('menuitem', { name: 'Banana' }).id,
        );
      });

      await setProps({ inputValue: 'app' });

      expect(screen.getByRole('menuitem', { name: 'Apple' })).toBeVisible();
      expect(screen.queryByRole('menuitem', { name: 'Banana' })).toBe(null);
      expect(input).not.toHaveAttribute('aria-activedescendant');
      await user.keyboard('[Enter]');
      expect(onAppleClick).not.toHaveBeenCalled();
    });

    it('supports a detached trigger in a filterable menu', async () => {
      function Test() {
        const handle = useRefWithInit(() => new Menu.Handle({ filterable: true })).current;

        return (
          <React.Fragment>
            <Menu.FilterProvider>
              <Menu.Root handle={handle}>
                <Menu.Portal>
                  <Menu.Positioner>
                    <Menu.Popup>
                      <Menu.FilterInput aria-label="Filter fruit" />
                      <Menu.List data-testid="list">
                        <Menu.Item>Apple</Menu.Item>
                      </Menu.List>
                      <Menu.FilterEmpty>No fruit found</Menu.FilterEmpty>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
            </Menu.FilterProvider>
            <Menu.Trigger id="fruit-trigger" handle={handle}>
              Fruit
            </Menu.Trigger>
          </React.Fragment>
        );
      }

      const { user } = await render(<Test />);
      const trigger = screen.getByRole('button', { name: 'Fruit' });

      expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');

      await user.click(trigger);

      const popup = await screen.findByRole('dialog', { name: 'Fruit' });
      const list = screen.getByTestId('list');
      const input = screen.getByRole('searchbox', { name: 'Filter fruit' });

      expect(trigger).toHaveAttribute('aria-controls', popup.id);
      expect(popup).toHaveAttribute('aria-labelledby', trigger.id);
      expect(list).toHaveAttribute('aria-labelledby', trigger.id);
      expect(screen.queryByRole('status')).toBe(null);

      await user.type(input, 'zz');

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('No fruit found');
      });
    });

    it('uses the id from a custom trigger render element for popup labelling', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root>
            <Menu.Trigger render={<button id="custom-trigger" />}>Fruit</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter fruit" />
                  <Menu.List>
                    <Menu.Item>Apple</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'Fruit' }));

      expect(await screen.findByRole('dialog')).toHaveAttribute(
        'aria-labelledby',
        'custom-trigger',
      );
      expect(screen.getByRole('menu')).toHaveAttribute('aria-labelledby', 'custom-trigger');
    });

    it('uses an explicit popup label instead of the trigger label', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root>
            <Menu.Trigger>Fruit</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup aria-label="Available commands">
                  <Menu.FilterInput aria-label="Filter fruit" />
                  <Menu.List>
                    <Menu.Item>Apple</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'Fruit' }));

      const popup = await screen.findByRole('dialog', { name: 'Available commands' });
      expect(popup).not.toHaveAttribute('aria-labelledby');
    });

    it('uses an explicit label from the popup render element', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root>
            <Menu.Trigger>Fruit</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup render={<section aria-label="Available commands" />}>
                  <Menu.FilterInput aria-label="Filter fruit" />
                  <Menu.List>
                    <Menu.Item>Apple</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'Fruit' }));

      const popup = await screen.findByRole('dialog', { name: 'Available commands' });
      expect(popup).not.toHaveAttribute('aria-labelledby');
    });

    it('releases a popup id override when the prop is removed', async () => {
      function Test() {
        const [customId, setCustomId] = React.useState(true);
        return (
          <Menu.FilterProvider>
            <Menu.Root defaultOpen>
              <Menu.Trigger>Fruit</Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup id={customId ? 'custom-popup' : undefined}>
                    <Menu.FilterInput aria-label="Filter fruit" />
                    <Menu.List>
                      <Menu.Item>Apple</Menu.Item>
                    </Menu.List>
                    <button type="button" onClick={() => setCustomId(false)}>
                      Remove id
                    </button>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </Menu.FilterProvider>
        );
      }

      const { user } = await render(<Test />);
      const trigger = screen.getByRole('button', { name: 'Fruit' });
      const popup = screen.getByRole('dialog');
      expect(popup).toHaveAttribute('id', 'custom-popup');

      await user.click(screen.getByRole('button', { name: 'Remove id' }));

      await waitFor(() => {
        expect(popup).not.toHaveAttribute('id', 'custom-popup');
      });
      expect(trigger.getAttribute('aria-controls')).toBe(popup.id);
      expect(screen.getByRole('menuitem', { name: 'Apple' }).id).toBe(`${popup.id}-0`);
    });

    it.skipIf(isJSDOM)(
      'focuses the input when a filterable submenu opens with the keyboard',
      async () => {
        const { user } = await render(<FilterableSubmenu />);
        const parentMenu = screen.getByRole('menu');

        await waitFor(() => {
          expect(parentMenu).toHaveFocus();
        });
        await user.keyboard('[ArrowDown][ArrowDown][ArrowRight]');

        const input = await screen.findByRole('searchbox', { name: 'Filter folders' });
        await waitFor(() => {
          expect(input).toHaveFocus();
        });
        expect(input).toHaveAttribute('data-highlighted');

        const item = screen.getByText('Documents');
        await user.hover(item);
        expect(input).toHaveAttribute('aria-activedescendant', item.id);
        expect(input).toHaveAttribute('data-highlighted');

        await user.hover(input);
        expect(input).not.toHaveAttribute('aria-activedescendant');
        expect(input).toHaveAttribute('data-highlighted');

        await user.keyboard('[ArrowDown]');
        expect(input).not.toHaveAttribute('data-highlighted');

        await user.keyboard('[ArrowUp]');
        expect(input).not.toHaveAttribute('aria-activedescendant');
        expect(input).toHaveAttribute('data-highlighted');
      },
    );

    it('opens a virtually focused submenu with the keyboard', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.FilterProvider>
                      <Menu.SubmenuRoot>
                        <Menu.SubmenuTrigger>Move to folder</Menu.SubmenuTrigger>
                        <Menu.Portal>
                          <Menu.Positioner>
                            <Menu.Popup>
                              <Menu.FilterInput aria-label="Filter folders" />
                              <Menu.List>
                                <Menu.Item>Documents</Menu.Item>
                              </Menu.List>
                            </Menu.Popup>
                          </Menu.Positioner>
                        </Menu.Portal>
                      </Menu.SubmenuRoot>
                    </Menu.FilterProvider>
                    <Menu.Item>Delete</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const parentInput = screen.getByRole('searchbox', { name: 'Filter actions' });
      await waitFor(() => {
        expect(parentInput).toHaveFocus();
      });

      await user.keyboard('[ArrowDown]');

      const submenuTrigger = screen.getByRole('menuitem', { name: 'Move to folder' });
      expect(parentInput).toHaveAttribute('aria-activedescendant', submenuTrigger.id);

      await user.keyboard('[ArrowRight]');

      const submenuInput = await screen.findByRole('searchbox', { name: 'Filter folders' });
      fireEvent.mouseMove(submenuInput);
      await waitFor(() => {
        expect(submenuInput).toHaveFocus();
      });
      expect(submenuInput).toHaveAttribute('data-highlighted');
      expect(parentInput).not.toHaveAttribute('aria-activedescendant');

      await user.keyboard('[ArrowLeft]');

      await waitFor(() => {
        expect(parentInput).toHaveFocus();
      });
      expect(parentInput).toHaveAttribute('aria-activedescendant', submenuTrigger.id);

      await user.keyboard('[ArrowDown]');

      const nextItem = screen.getByRole('menuitem', { name: 'Delete' });
      expect(parentInput).toHaveAttribute('aria-activedescendant', nextItem.id);
    });

    it('keeps cross-axis keys as caret keys while the submenu query is not empty', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.FilterProvider>
                      <Menu.SubmenuRoot>
                        <Menu.SubmenuTrigger>Move to folder</Menu.SubmenuTrigger>
                        <Menu.Portal>
                          <Menu.Positioner>
                            <Menu.Popup>
                              <Menu.FilterInput aria-label="Filter folders" />
                              <Menu.List>
                                <Menu.Item>Documents</Menu.Item>
                              </Menu.List>
                            </Menu.Popup>
                          </Menu.Positioner>
                        </Menu.Portal>
                      </Menu.SubmenuRoot>
                    </Menu.FilterProvider>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const parentInput = screen.getByRole('searchbox', { name: 'Filter actions' });
      await waitFor(() => {
        expect(parentInput).toHaveFocus();
      });

      await user.keyboard('[ArrowDown][ArrowRight]');

      const submenuInput = await screen.findByRole<HTMLInputElement>('searchbox', {
        name: 'Filter folders',
      });
      await waitFor(() => {
        expect(submenuInput).toHaveFocus();
      });

      await user.keyboard('doc');
      expect(submenuInput).toHaveValue('doc');

      // Editing the query must not leave the submenu; the caret moves instead.
      await user.keyboard('[ArrowLeft]');

      expect(submenuInput).toHaveFocus();
      expect(submenuInput.selectionStart).toBe(2);
      expect(screen.getByRole('searchbox', { name: 'Filter folders' })).not.toBe(null);
    });

    it('uses RTL cross-axis keys to enter and leave a filterable submenu', async () => {
      const { user } = await render(
        <DirectionProvider direction="rtl">
          <Menu.FilterProvider>
            <Menu.Root defaultOpen>
              <Menu.Trigger>Actions</Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.FilterInput aria-label="Filter actions" />
                    <Menu.List>
                      <Menu.FilterProvider>
                        <Menu.SubmenuRoot>
                          <Menu.SubmenuTrigger>Move to folder</Menu.SubmenuTrigger>
                          <Menu.Portal>
                            <Menu.Positioner>
                              <Menu.Popup>
                                <Menu.FilterInput aria-label="Filter folders" />
                                <Menu.List>
                                  <Menu.Item>Documents</Menu.Item>
                                </Menu.List>
                              </Menu.Popup>
                            </Menu.Positioner>
                          </Menu.Portal>
                        </Menu.SubmenuRoot>
                      </Menu.FilterProvider>
                    </Menu.List>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </Menu.FilterProvider>
        </DirectionProvider>,
      );

      const parentInput = screen.getByRole('searchbox', { name: 'Filter actions' });
      await waitFor(() => {
        expect(parentInput).toHaveFocus();
      });

      await user.keyboard('[ArrowDown][ArrowLeft]');

      const submenuInput = await screen.findByRole('searchbox', { name: 'Filter folders' });
      fireEvent.mouseMove(submenuInput);
      await waitFor(() => {
        expect(submenuInput).toHaveFocus();
      });

      await user.keyboard('[ArrowRight]');

      await waitFor(() => {
        expect(screen.queryByRole('searchbox', { name: 'Filter folders' })).toBe(null);
      });
      expect(parentInput).toHaveFocus();
      expect(parentInput).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('menuitem', { name: 'Move to folder' }).id,
      );
    });

    it('returns virtual focus to the parent input on Escape and resumes filtering', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.FilterProvider>
                      <Menu.SubmenuRoot>
                        <Menu.SubmenuTrigger>Move to folder</Menu.SubmenuTrigger>
                        <Menu.Portal>
                          <Menu.Positioner>
                            <Menu.Popup>
                              <Menu.FilterInput aria-label="Filter folders" />
                              <Menu.List>
                                <Menu.Item>Documents</Menu.Item>
                              </Menu.List>
                            </Menu.Popup>
                          </Menu.Positioner>
                        </Menu.Portal>
                      </Menu.SubmenuRoot>
                    </Menu.FilterProvider>
                    <Menu.Item>Rename</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const parentInput = screen.getByRole('searchbox', { name: 'Filter actions' });
      await waitFor(() => {
        expect(parentInput).toHaveFocus();
      });

      await user.keyboard('[ArrowDown][ArrowRight]');

      const submenuInput = await screen.findByRole('searchbox', { name: 'Filter folders' });
      fireEvent.mouseMove(submenuInput);
      await waitFor(() => {
        expect(submenuInput).toHaveFocus();
      });

      await user.keyboard('[Escape]');

      const submenuTrigger = screen.getByRole('menuitem', { name: 'Move to folder' });
      await waitFor(() => {
        expect(parentInput).toHaveFocus();
      });
      expect(parentInput).toHaveAttribute('aria-activedescendant', submenuTrigger.id);

      await user.type(parentInput, 'ren');

      expect(parentInput).toHaveValue('ren');
      expect(screen.getByRole('menuitem', { name: 'Rename' })).toBeVisible();
      expect(screen.queryByRole('menuitem', { name: 'Move to folder' })).toBe(null);
    });

    it('does not reclaim focus when a controlled submenu closes after focus moves outside', async () => {
      let closeSubmenu = () => {};

      function Test() {
        const [submenuOpen, setSubmenuOpen] = React.useState(false);
        closeSubmenu = () => setSubmenuOpen(false);

        return (
          <React.Fragment>
            <Menu.FilterProvider>
              <Menu.Root defaultOpen>
                <Menu.Trigger>Actions</Menu.Trigger>
                <Menu.Portal>
                  <Menu.Positioner>
                    <Menu.Popup>
                      <Menu.FilterInput aria-label="Filter actions" />
                      <Menu.List>
                        <Menu.FilterProvider>
                          <Menu.SubmenuRoot open={submenuOpen} onOpenChange={setSubmenuOpen}>
                            <Menu.SubmenuTrigger>Move to folder</Menu.SubmenuTrigger>
                            <Menu.Portal>
                              <Menu.Positioner>
                                <Menu.Popup>
                                  <Menu.FilterInput aria-label="Filter folders" />
                                  <Menu.List>
                                    <Menu.Item>Documents</Menu.Item>
                                  </Menu.List>
                                </Menu.Popup>
                              </Menu.Positioner>
                            </Menu.Portal>
                          </Menu.SubmenuRoot>
                        </Menu.FilterProvider>
                      </Menu.List>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
            </Menu.FilterProvider>
            <button type="button">Outside</button>
          </React.Fragment>
        );
      }

      const { user } = await render(<Test />);
      await waitFor(() => {
        expect(screen.getByRole('searchbox', { name: 'Filter actions' })).toHaveFocus();
      });
      await user.keyboard('[ArrowDown][ArrowRight]');
      await waitFor(() => {
        expect(screen.getByRole('searchbox', { name: 'Filter folders' })).toHaveFocus();
      });

      const outside = screen.getByRole('button', { name: 'Outside' });
      await act(async () => {
        outside.focus();
        closeSubmenu();
      });

      await waitFor(() => {
        expect(outside).toHaveFocus();
      });
    });

    it('opens a submenu from a filterable submenu input', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.FilterProvider>
                      <Menu.SubmenuRoot>
                        <Menu.SubmenuTrigger>Move to folder</Menu.SubmenuTrigger>
                        <Menu.Portal>
                          <Menu.Positioner>
                            <Menu.Popup>
                              <Menu.FilterInput aria-label="Filter folders" />
                              <Menu.List>
                                <Menu.SubmenuRoot>
                                  <Menu.SubmenuTrigger>More folders</Menu.SubmenuTrigger>
                                  <Menu.Portal>
                                    <Menu.Positioner>
                                      <Menu.Popup>
                                        <Menu.Item>Archive</Menu.Item>
                                      </Menu.Popup>
                                    </Menu.Positioner>
                                  </Menu.Portal>
                                </Menu.SubmenuRoot>
                              </Menu.List>
                            </Menu.Popup>
                          </Menu.Positioner>
                        </Menu.Portal>
                      </Menu.SubmenuRoot>
                    </Menu.FilterProvider>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const parentInput = screen.getByRole('searchbox', { name: 'Filter actions' });
      await waitFor(() => {
        expect(parentInput).toHaveFocus();
      });

      await user.keyboard('[ArrowDown][ArrowRight]');

      const submenuTrigger = screen.getByRole('menuitem', { name: 'Move to folder' });
      const submenuInput = await screen.findByRole('searchbox', { name: 'Filter folders' });
      fireEvent.mouseMove(submenuInput);
      await waitFor(() => {
        expect(submenuInput).toHaveFocus();
      });

      await user.keyboard('[ArrowDown]');

      const nestedTrigger = screen.getByRole('menuitem', { name: 'More folders' });
      expect(submenuInput).toHaveAttribute('aria-activedescendant', nestedTrigger.id);

      await user.keyboard('[ArrowRight]');

      const nestedItem = await screen.findByRole('menuitem', { name: 'Archive' });
      await waitFor(() => {
        expect(nestedItem).toHaveFocus();
      });

      await user.keyboard('[ArrowLeft]');

      await waitFor(() => {
        expect(submenuInput).toHaveFocus();
      });
      await waitFor(() => {
        expect(submenuInput).toHaveAttribute('aria-activedescendant', nestedTrigger.id);
      });

      await user.keyboard('[ArrowLeft]');

      await waitFor(() => {
        expect(parentInput).toHaveFocus();
      });
      await waitFor(() => {
        expect(parentInput).toHaveAttribute('aria-activedescendant', submenuTrigger.id);
      });
    });

    it('opens a virtually focused submenu with Enter from the input', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.FilterProvider>
                      <Menu.SubmenuRoot>
                        <Menu.SubmenuTrigger>Share</Menu.SubmenuTrigger>
                        <Menu.Portal>
                          <Menu.Positioner>
                            <Menu.Popup>
                              <Menu.FilterInput aria-label="Filter sharing options" />
                              <Menu.List>
                                <Menu.Item>Email</Menu.Item>
                              </Menu.List>
                            </Menu.Popup>
                          </Menu.Positioner>
                        </Menu.Portal>
                      </Menu.SubmenuRoot>
                    </Menu.FilterProvider>
                    <Menu.Item>Delete</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const parentInput = screen.getByRole('searchbox', { name: 'Filter actions' });
      const submenuTrigger = screen.getByRole('menuitem', { name: 'Share' });
      await waitFor(() => {
        expect(parentInput).toHaveFocus();
      });
      await user.keyboard('[ArrowDown]');
      await waitFor(() => {
        expect(parentInput).toHaveAttribute('aria-activedescendant', submenuTrigger.id);
      });

      await user.keyboard('[Enter]');

      const submenuInput = screen.getByRole('searchbox', { name: 'Filter sharing options' });
      await waitFor(() => {
        expect(submenuInput).toHaveFocus();
      });
      expect(parentInput).not.toHaveAttribute('aria-activedescendant');

      await user.keyboard('[ArrowLeft]');

      await waitFor(() => {
        expect(parentInput).toHaveFocus();
      });
      expect(parentInput).toHaveAttribute('aria-activedescendant', submenuTrigger.id);

      await user.keyboard('[ArrowDown]');

      const nextItem = screen.getByRole('menuitem', { name: 'Delete' });
      expect(parentInput).toHaveAttribute('aria-activedescendant', nextItem.id);
    });

    it('does not reopen a stale submenu with a cross-axis key', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item>Rename</Menu.Item>
                    <Menu.FilterProvider>
                      <Menu.SubmenuRoot>
                        <Menu.SubmenuTrigger>Share</Menu.SubmenuTrigger>
                        <Menu.Portal>
                          <Menu.Positioner>
                            <Menu.Popup>
                              <Menu.FilterInput aria-label="Filter sharing options" />
                              <Menu.List>
                                <Menu.Item>Email</Menu.Item>
                              </Menu.List>
                            </Menu.Popup>
                          </Menu.Positioner>
                        </Menu.Portal>
                      </Menu.SubmenuRoot>
                    </Menu.FilterProvider>
                    <Menu.FilterProvider>
                      <Menu.SubmenuRoot>
                        <Menu.SubmenuTrigger>Export</Menu.SubmenuTrigger>
                        <Menu.Portal>
                          <Menu.Positioner>
                            <Menu.Popup>
                              <Menu.FilterInput aria-label="Filter export options" />
                              <Menu.List>
                                <Menu.Item>PDF</Menu.Item>
                              </Menu.List>
                            </Menu.Popup>
                          </Menu.Positioner>
                        </Menu.Portal>
                      </Menu.SubmenuRoot>
                    </Menu.FilterProvider>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const input = screen.getByRole('searchbox', { name: 'Filter actions' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });

      await user.keyboard('[ArrowDown][ArrowDown][ArrowRight]');
      expect(
        await screen.findByRole('searchbox', { name: 'Filter sharing options' }),
      ).toHaveFocus();

      await user.keyboard('[Escape]');
      const shareTrigger = screen.getByRole('menuitem', { name: 'Share' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      expect(input).toHaveAttribute('aria-activedescendant', shareTrigger.id);

      await user.keyboard('[ArrowUp]');
      const item = screen.getByRole('menuitem', { name: 'Rename' });
      expect(input).toHaveFocus();
      expect(input).toHaveAttribute('aria-activedescendant', item.id);

      await user.keyboard('[ArrowRight]');
      expect(screen.queryByRole('searchbox', { name: 'Filter sharing options' })).toBe(null);

      await user.keyboard('[ArrowDown][ArrowDown][ArrowRight]');
      expect(screen.queryByRole('searchbox', { name: 'Filter sharing options' })).toBe(null);
      expect(await screen.findByRole('searchbox', { name: 'Filter export options' })).toHaveFocus();
    });

    it.skipIf(isJSDOM)(
      'moves focus into the submenu input once the pointer enters it',
      async () => {
        const { user } = await render(
          <Menu.FilterProvider>
            <Menu.Root defaultOpen>
              <Menu.Trigger>Actions</Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.FilterInput aria-label="Filter actions" />
                    <Menu.List>
                      <Menu.FilterProvider>
                        <Menu.SubmenuRoot>
                          <Menu.SubmenuTrigger delay={0}>Move to folder</Menu.SubmenuTrigger>
                          <Menu.Portal>
                            <Menu.Positioner>
                              <Menu.Popup>
                                <Menu.FilterInput aria-label="Filter folders" />
                                <Menu.List>
                                  <Menu.Item>Documents</Menu.Item>
                                </Menu.List>
                              </Menu.Popup>
                            </Menu.Positioner>
                          </Menu.Portal>
                        </Menu.SubmenuRoot>
                      </Menu.FilterProvider>
                    </Menu.List>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </Menu.FilterProvider>,
        );

        const parentInput = screen.getByRole('searchbox', { name: 'Filter actions' });
        await waitFor(() => {
          expect(parentInput).toHaveFocus();
        });
        await user.keyboard('[ArrowDown]');
        const submenuTrigger = screen.getByRole('menuitem', { name: 'Move to folder' });
        await user.hover(submenuTrigger);

        // Hovering only opens the submenu; the parent input keeps focus until the pointer enters.
        const submenuInput = await screen.findByRole('searchbox', { name: 'Filter folders' });
        expect(parentInput).toHaveFocus();

        fireEvent.mouseMove(submenuInput);
        await waitFor(() => {
          expect(submenuInput).toHaveFocus();
        });
        expect(submenuInput).toHaveAttribute('data-highlighted');
        expect(submenuInput).not.toHaveAttribute('aria-activedescendant');
        // The parent keeps the trigger highlighted as the submenu's origin.
        expect(parentInput).toHaveAttribute('aria-activedescendant', submenuTrigger.id);
      },
    );

    it('closes a hover-opened submenu from a virtually focused parent', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.FilterProvider>
                      <Menu.SubmenuRoot>
                        <Menu.SubmenuTrigger delay={0}>Move to folder</Menu.SubmenuTrigger>
                        <Menu.Portal>
                          <Menu.Positioner>
                            <Menu.Popup>
                              <Menu.FilterInput aria-label="Filter folders" />
                              <Menu.List>
                                <Menu.Item>Documents</Menu.Item>
                              </Menu.List>
                            </Menu.Popup>
                          </Menu.Positioner>
                        </Menu.Portal>
                      </Menu.SubmenuRoot>
                    </Menu.FilterProvider>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const parentInput = screen.getByRole('searchbox', { name: 'Filter actions' });
      await waitFor(() => {
        expect(parentInput).toHaveFocus();
      });
      await user.keyboard('[ArrowDown]');
      const submenuTrigger = screen.getByRole('menuitem', { name: 'Move to folder' });
      await user.hover(submenuTrigger);

      const submenuInput = await screen.findByRole('searchbox', { name: 'Filter folders' });
      fireEvent.mouseMove(submenuInput);
      await waitFor(() => {
        expect(submenuInput).toHaveFocus();
      });
      expect(parentInput).toHaveAttribute('aria-activedescendant', submenuTrigger.id);

      await user.keyboard('[ArrowLeft]');

      await waitFor(() => {
        expect(screen.queryByRole('searchbox', { name: 'Filter folders' })).toBe(null);
      });
      await waitFor(() => {
        expect(parentInput).toHaveFocus();
      });
      expect(parentInput).toHaveAttribute('aria-activedescendant', submenuTrigger.id);
    });

    it('focuses the first item when entering a hover-opened submenu from a filterable menu', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.SubmenuRoot>
                      <Menu.SubmenuTrigger delay={0}>Move to folder</Menu.SubmenuTrigger>
                      <Menu.Portal>
                        <Menu.Positioner>
                          <Menu.Popup>
                            <Menu.Item>Documents</Menu.Item>
                            <Menu.Item>Downloads</Menu.Item>
                          </Menu.Popup>
                        </Menu.Positioner>
                      </Menu.Portal>
                    </Menu.SubmenuRoot>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const parentInput = screen.getByRole('searchbox', { name: 'Filter actions' });
      await waitFor(() => {
        expect(parentInput).toHaveFocus();
      });
      await user.keyboard('[ArrowDown]');
      const submenuTrigger = screen.getByRole('menuitem', { name: 'Move to folder' });
      await user.hover(submenuTrigger);

      const firstItem = await screen.findByRole('menuitem', { name: 'Documents' });
      // Focus moves are scheduled in a frame, so let one pass before asserting it never happens.
      await act(async () => {
        await waitSingleFrame();
      });
      expect(parentInput).toHaveFocus();

      await user.keyboard('[ArrowRight]');

      await waitFor(() => {
        expect(firstItem).toHaveFocus();
      });
    });

    it('filters items and selects the active item while focus remains on the input', async () => {
      const onClick = vi.fn();
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root>
            <Menu.Trigger>Fruit</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter fruit" />
                  <Menu.List data-testid="list">
                    <Menu.Item>Apple</Menu.Item>
                    <Menu.Item onClick={onClick} closeOnClick={false}>
                      Banana
                    </Menu.Item>
                  </Menu.List>
                  <Menu.FilterEmpty>No fruit found</Menu.FilterEmpty>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const trigger = screen.getByRole('button', { name: 'Fruit' });
      await user.click(trigger);

      const popup = await screen.findByRole('dialog');
      const list = screen.getByTestId('list');
      const input = screen.getByRole('searchbox', { name: 'Filter fruit' });

      expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      expect(popup).toContainElement(list);

      await waitFor(() => {
        expect(input).toHaveFocus();
      });

      const firstItem = screen.getByText('Apple');
      expect(firstItem).not.toHaveAttribute('data-highlighted');
      expect(input).not.toHaveAttribute('aria-activedescendant');

      await waitFor(() => {
        expect(screen.getByText('Apple')).toHaveAttribute('tabindex', '-1');
      });
      await waitFor(() => {
        expect(screen.getByText('Banana')).toHaveAttribute('tabindex', '-1');
      });

      await user.type(input, 'ban');

      expect(screen.queryByRole('menuitem', { name: 'Apple' })).toBe(null);
      expect(screen.getByText('Banana')).toBeVisible();

      if (isJSDOM) {
        Object.defineProperty(list, 'scrollTo', {
          configurable: true,
          value: vi.fn(),
        });
      }

      await user.keyboard('{ArrowDown}');

      expect(input).toHaveFocus();
      const activeItem = screen.getByRole('menuitem', { name: 'Banana' });
      expect(activeItem).toHaveAttribute('data-highlighted', '');
      expect(activeItem).toHaveAttribute('tabindex', '-1');
      expect(input).toHaveAttribute('aria-activedescendant', activeItem.id);
      expect(popup).not.toHaveAttribute('aria-activedescendant');

      await user.keyboard('{Enter}');

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not activate the highlighted item when Enter commits an IME composition', async () => {
      const onClick = vi.fn();
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item onClick={onClick}>Rename</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const input = screen.getByRole('searchbox', { name: 'Filter actions' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      await user.keyboard('[ArrowDown]');
      expect(input).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('menuitem', { name: 'Rename' }).id,
      );

      fireEvent.keyDown(input, { key: 'Enter', keyCode: 229, which: 229 });

      expect(onClick).not.toHaveBeenCalled();
    });

    it('does not forward submenu navigation keys while composing text', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.FilterProvider>
                      <Menu.SubmenuRoot>
                        <Menu.SubmenuTrigger openOnHover={false}>
                          Move to folder
                        </Menu.SubmenuTrigger>
                        <Menu.Portal>
                          <Menu.Positioner>
                            <Menu.Popup>
                              <Menu.FilterInput aria-label="Filter folders" />
                              <Menu.List>
                                <Menu.Item>Documents</Menu.Item>
                              </Menu.List>
                            </Menu.Popup>
                          </Menu.Positioner>
                        </Menu.Portal>
                      </Menu.SubmenuRoot>
                    </Menu.FilterProvider>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const input = screen.getByRole('searchbox', { name: 'Filter actions' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      await user.keyboard('[ArrowDown]');

      fireEvent.keyDown(input, {
        key: 'ArrowRight',
        // React derives SyntheticEvent.which from the native keyCode.
        keyCode: 229,
        which: 229,
      });

      expect(screen.queryByRole('searchbox', { name: 'Filter folders' })).toBe(null);
    });

    it('disables filter controls when the root is disabled', async () => {
      await render(
        <Menu.FilterProvider defaultInputValue="a">
          <Menu.Root open disabled>
            <Menu.Trigger>Fruit</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter fruit" />
                  <Menu.FilterClear aria-label="Clear filter" />
                  <Menu.List>
                    <Menu.Item>Apple</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      expect(screen.getByRole('searchbox', { name: 'Filter fruit' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Clear filter' })).toBeDisabled();
    });

    it('uses an updated custom filter function', async () => {
      const startsWith = (item: string, query: string) => item.toLowerCase().startsWith(query);
      const endsWith = (item: string, query: string) => item.toLowerCase().endsWith(query);

      function Test() {
        const [filter, setFilter] = React.useState(() => startsWith);

        return (
          <React.Fragment>
            <button type="button" onClick={() => setFilter(() => endsWith)}>
              Change filter
            </button>
            <Menu.FilterProvider filter={filter} defaultInputValue="a">
              <Menu.Root open>
                <Menu.Trigger>Fruit</Menu.Trigger>
                <Menu.Portal>
                  <Menu.Positioner>
                    <Menu.Popup>
                      <Menu.FilterInput aria-label="Filter fruit" />
                      <Menu.List>
                        <Menu.Item>Apple</Menu.Item>
                        <Menu.Item>Banana</Menu.Item>
                      </Menu.List>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
            </Menu.FilterProvider>
          </React.Fragment>
        );
      }

      const { user } = await render(<Test />);
      const input = screen.getByRole('searchbox', { name: 'Filter fruit' });
      await user.click(input);
      await user.keyboard('[ArrowDown]');

      expect(screen.getByRole('menuitem', { name: 'Apple' })).toBeVisible();
      expect(screen.queryByRole('menuitem', { name: 'Banana' })).toBe(null);

      await user.click(screen.getByRole('button', { name: 'Change filter' }));
      await user.click(input);
      await user.keyboard('[ArrowDown]');

      expect(screen.queryByRole('menuitem', { name: 'Apple' })).toBe(null);
      expect(screen.getByRole('menuitem', { name: 'Banana' })).toBeVisible();
    });

    it('applies a custom filter to item keywords', async () => {
      await render(
        <Menu.FilterProvider
          defaultInputValue="directory"
          filter={(itemText, query) => itemText.startsWith(query)}
        >
          <Menu.Root open>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item keywords={['directory']}>Move to folder</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'Move to folder' })).toBeVisible();
      });
    });

    it('filters a non-filterable submenu trigger from a filterable parent', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item>Rename</Menu.Item>
                    <Menu.FilterProvider>
                      <Menu.SubmenuRoot>
                        <Menu.SubmenuTrigger>Move to folder</Menu.SubmenuTrigger>
                        <Menu.Portal>
                          <Menu.Positioner>
                            <Menu.Popup>
                              <Menu.Item>Documents</Menu.Item>
                            </Menu.Popup>
                          </Menu.Positioner>
                        </Menu.Portal>
                      </Menu.SubmenuRoot>
                    </Menu.FilterProvider>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const input = screen.getByRole('searchbox', { name: 'Filter actions' });
      await user.type(input, 'rename');
      await user.keyboard('[ArrowDown]');

      expect(screen.getByRole('menuitem', { name: 'Rename' })).toBeVisible();
      expect(screen.queryByRole('menuitem', { name: 'Move to folder' })).toBe(null);
    });

    it('keeps a submenu trigger visible when the query matches its label', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item>Rename</Menu.Item>
                    <Menu.FilterProvider>
                      <Menu.SubmenuRoot>
                        <Menu.SubmenuTrigger>Move to folder</Menu.SubmenuTrigger>
                        <Menu.Portal>
                          <Menu.Positioner>
                            <Menu.Popup>
                              <Menu.Item>Documents</Menu.Item>
                            </Menu.Popup>
                          </Menu.Positioner>
                        </Menu.Portal>
                      </Menu.SubmenuRoot>
                    </Menu.FilterProvider>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const input = screen.getByRole('searchbox', { name: 'Filter actions' });
      await user.type(input, 'move');

      expect(screen.queryByRole('menuitem', { name: 'Rename' })).toBe(null);
      expect(screen.getByRole('menuitem', { name: 'Move to folder' })).toBeVisible();
    });

    it('keeps a submenu trigger visible when the query matches its keywords', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item>Rename</Menu.Item>
                    <Menu.FilterProvider>
                      <Menu.SubmenuRoot>
                        <Menu.SubmenuTrigger keywords={['directory']}>
                          Move to folder
                        </Menu.SubmenuTrigger>
                        <Menu.Portal>
                          <Menu.Positioner>
                            <Menu.Popup>
                              <Menu.Item>Documents</Menu.Item>
                            </Menu.Popup>
                          </Menu.Positioner>
                        </Menu.Portal>
                      </Menu.SubmenuRoot>
                    </Menu.FilterProvider>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const input = screen.getByRole('searchbox', { name: 'Filter actions' });
      await user.type(input, 'directory');

      expect(screen.queryByRole('menuitem', { name: 'Rename' })).toBe(null);
      expect(screen.getByRole('menuitem', { name: 'Move to folder' })).toBeVisible();
    });

    it('filters a Menu.SubmenuTrigger used inside a plain submenu root', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item>Rename</Menu.Item>
                    <Menu.SubmenuRoot>
                      <Menu.SubmenuTrigger>Move to folder</Menu.SubmenuTrigger>
                      <Menu.Portal>
                        <Menu.Positioner>
                          <Menu.Popup>
                            <Menu.Item>Documents</Menu.Item>
                          </Menu.Popup>
                        </Menu.Positioner>
                      </Menu.Portal>
                    </Menu.SubmenuRoot>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const input = screen.getByRole('searchbox', { name: 'Filter actions' });
      await user.type(input, 'rename');

      expect(screen.getByRole('menuitem', { name: 'Rename' })).toBeVisible();
      expect(screen.queryByRole('menuitem', { name: 'Move to folder' })).toBe(null);

      await user.clear(input);
      await user.type(input, 'move');

      expect(screen.queryByRole('menuitem', { name: 'Rename' })).toBe(null);
      expect(screen.getByRole('menuitem', { name: 'Move to folder' })).toBeVisible();
    });

    it('keeps plain menu items and submenu triggers out of the tab order in a filterable list', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item>Plain item</Menu.Item>
                    <Menu.SubmenuRoot>
                      <Menu.SubmenuTrigger delay={0}>More folders</Menu.SubmenuTrigger>
                      <Menu.Portal>
                        <Menu.Positioner>
                          <Menu.Popup>
                            <Menu.Item>Archive</Menu.Item>
                          </Menu.Popup>
                        </Menu.Positioner>
                      </Menu.Portal>
                    </Menu.SubmenuRoot>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const input = screen.getByRole('searchbox', { name: 'Filter actions' });
      await act(async () => {
        input.focus();
      });
      await user.keyboard('[ArrowDown][ArrowDown]');

      // Virtual navigation keeps DOM focus on the input even for highlighted plain items.
      const plainItem = screen.getByRole('menuitem', { name: 'Plain item' });
      expect(plainItem).toHaveAttribute('tabindex', '-1');
      // `aria-expanded` is only valid on an item that owns a popup.
      expect(plainItem).not.toHaveAttribute('aria-expanded');
      const submenuTrigger = screen.getByRole('menuitem', { name: 'More folders' });
      expect(submenuTrigger).toHaveAttribute('tabindex', '-1');
      expect(submenuTrigger).toHaveAttribute('aria-expanded', 'false');
      expect(input).toHaveFocus();
    });

    it('retains the parent highlight when a submenu opens from a pointer', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.FilterProvider>
                      <Menu.SubmenuRoot>
                        <Menu.SubmenuTrigger delay={0}>Move to folder</Menu.SubmenuTrigger>
                        <Menu.Portal>
                          <Menu.Positioner>
                            <Menu.Popup>
                              <Menu.FilterInput aria-label="Filter folders" />
                              <Menu.List>
                                <Menu.Item>Documents</Menu.Item>
                              </Menu.List>
                            </Menu.Popup>
                          </Menu.Positioner>
                        </Menu.Portal>
                      </Menu.SubmenuRoot>
                    </Menu.FilterProvider>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const parentInput = screen.getByRole('searchbox', { name: 'Filter actions' });
      await waitFor(() => {
        expect(parentInput).toHaveFocus();
      });

      const submenuTrigger = screen.getByRole('menuitem', { name: 'Move to folder' });
      await user.hover(submenuTrigger);

      await screen.findByRole('searchbox', { name: 'Filter folders' });
      expect(parentInput).toHaveAttribute('aria-activedescendant', submenuTrigger.id);
    });

    it('closes the submenu when the query filters out its trigger', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item>Rename</Menu.Item>
                    <Menu.FilterProvider>
                      <Menu.SubmenuRoot>
                        <Menu.SubmenuTrigger delay={0}>Move to folder</Menu.SubmenuTrigger>
                        <Menu.Portal>
                          <Menu.Positioner>
                            <Menu.Popup>
                              <Menu.FilterInput aria-label="Filter folders" />
                              <Menu.List>
                                <Menu.Item>Documents</Menu.Item>
                              </Menu.List>
                            </Menu.Popup>
                          </Menu.Positioner>
                        </Menu.Portal>
                      </Menu.SubmenuRoot>
                    </Menu.FilterProvider>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const parentInput = screen.getByRole('searchbox', { name: 'Filter actions' });
      await waitFor(() => {
        expect(parentInput).toHaveFocus();
      });

      await user.hover(screen.getByRole('menuitem', { name: 'Move to folder' }));
      await screen.findByRole('searchbox', { name: 'Filter folders' });

      // The parent input still holds DOM focus, so the query can change while the submenu is open.
      await user.type(parentInput, 'rename');

      expect(screen.queryByRole('menuitem', { name: 'Move to folder' })).toBe(null);
      await waitFor(() => {
        expect(screen.queryByRole('searchbox', { name: 'Filter folders' })).toBe(null);
      });
      expect(screen.getByRole('menuitem', { name: 'Rename' })).toBeVisible();
    });

    it('keeps an open submenu trigger mounted when its filter close is canceled', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item>Rename</Menu.Item>
                    <Menu.Group>
                      <Menu.FilterProvider>
                        <Menu.SubmenuRoot
                          open
                          onOpenChange={(open, details) => {
                            if (!open) {
                              details.cancel();
                            }
                          }}
                        >
                          <Menu.SubmenuTrigger delay={0}>Move to folder</Menu.SubmenuTrigger>
                          <Menu.Portal>
                            <Menu.Positioner>
                              <Menu.Popup>
                                <Menu.FilterInput aria-label="Filter folders" />
                                <Menu.List>
                                  <Menu.Item>Documents</Menu.Item>
                                </Menu.List>
                              </Menu.Popup>
                            </Menu.Positioner>
                          </Menu.Portal>
                        </Menu.SubmenuRoot>
                      </Menu.FilterProvider>
                    </Menu.Group>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const parentInput = screen.getByRole('searchbox', { name: 'Filter actions' });
      await screen.findByRole('searchbox', { name: 'Filter folders' });

      await user.type(parentInput, 'zzz');

      // The query really ran: it matches nothing, so only the canceled submenu trigger survives.
      expect(parentInput).toHaveValue('zzz');
      await waitFor(() => {
        expect(screen.queryByRole('menuitem', { name: 'Rename' })).toBe(null);
      });

      expect(screen.getByRole('menuitem', { name: 'Move to folder' })).toBeVisible();
      expect(screen.getByRole('searchbox', { name: 'Filter folders' })).toBeVisible();
    });

    it('filters each menu item variant without changing its role', async () => {
      const { user } = await render(
        <Menu.FilterProvider defaultInputValue="banana">
          <Menu.Root open>
            <Menu.Trigger>Fruit</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter fruit" />
                  <Menu.List>
                    <Menu.Item>Apple</Menu.Item>
                    <Menu.CheckboxItem>Banana</Menu.CheckboxItem>
                    <Menu.RadioGroup>
                      <Menu.RadioItem value="cherry">Cherry</Menu.RadioItem>
                    </Menu.RadioGroup>
                    <Menu.LinkItem href="#date">Date</Menu.LinkItem>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const input = screen.getByRole('searchbox', { name: 'Filter fruit' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      await user.keyboard('[ArrowDown]');

      expect(screen.getByRole('menuitemcheckbox', { name: 'Banana' })).not.toHaveAttribute(
        'aria-expanded',
      );
      expect(screen.queryByRole('menuitem', { name: 'Apple' })).toBe(null);

      await user.clear(input);
      await user.type(input, 'cherry');
      await user.keyboard('[ArrowDown]');

      expect(screen.getByRole('menuitemradio', { name: 'Cherry' })).not.toHaveAttribute(
        'aria-expanded',
      );
      expect(screen.queryByRole('menuitemcheckbox', { name: 'Banana' })).toBe(null);

      await user.clear(input);
      await user.type(input, 'date');
      await user.keyboard('[ArrowDown]');

      expect(screen.getByRole('menuitem', { name: 'Date' })).not.toHaveAttribute('aria-expanded');
      expect(screen.queryByRole('menuitemradio', { name: 'Cherry' })).toBe(null);
    });

    it('preserves uncontrolled checkbox state while the item is filtered out', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root open>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter settings" />
                  <Menu.List>
                    <Menu.CheckboxItem defaultChecked>Show details</Menu.CheckboxItem>
                    <Menu.Item>Rename</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const input = screen.getByRole('searchbox', { name: 'Filter settings' });
      const checkbox = screen.getByRole('menuitemcheckbox', { name: 'Show details' });
      await user.click(checkbox);
      expect(checkbox).toHaveAttribute('aria-checked', 'false');

      await user.type(input, 'rename');
      expect(screen.queryByRole('menuitemcheckbox', { name: 'Show details' })).toBe(null);

      await user.clear(input);
      expect(screen.getByRole('menuitemcheckbox', { name: 'Show details' })).toHaveAttribute(
        'aria-checked',
        'false',
      );
    });
  });

  describe('keyboard navigation', () => {
    it('does not rerender unaffected items when the highlight moves', async () => {
      const firstRender = vi.fn();
      const secondRender = vi.fn();

      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root open>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item
                      render={(props) => {
                        firstRender();
                        return <div {...props} />;
                      }}
                    >
                      Rename
                    </Menu.Item>
                    <Menu.Item
                      render={(props) => {
                        secondRender();
                        return <div {...props} />;
                      }}
                    >
                      Delete
                    </Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const input = screen.getByRole('searchbox', { name: 'Filter actions' });
      await user.click(input);
      firstRender.mockClear();
      secondRender.mockClear();

      await user.keyboard('[ArrowDown]');

      expect(firstRender).toHaveBeenCalled();
      expect(secondRender).not.toHaveBeenCalled();
    });

    function KeyboardNavigationMenu() {
      return (
        <Menu.FilterProvider>
          <Menu.Root>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item>Rename</Menu.Item>
                    <Menu.Item>Duplicate</Menu.Item>
                    <Menu.Item>Delete</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>
      );
    }

    async function openWithKeyboard(user: ReturnType<typeof userEvent.setup>) {
      const trigger = screen.getByRole('button', { name: 'Actions' });
      await act(async () => {
        trigger.focus();
      });
      await user.keyboard('[Enter]');
      const input = await screen.findByRole('searchbox', { name: 'Filter actions' });
      // The popup hands focus to the input asynchronously, so keys pressed before it lands
      // reach the body instead.
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      return input;
    }

    it('walks the list with the arrow keys and releases the highlight at the end', async () => {
      const { user } = await render(<KeyboardNavigationMenu />);
      const input = await openWithKeyboard(user);

      expect(input).not.toHaveAttribute('aria-activedescendant');

      await user.keyboard('[ArrowDown]');
      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'Rename' })).toHaveAttribute(
          'data-highlighted',
        );
      });
      expect(input).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('menuitem', { name: 'Rename' }).id,
      );

      await user.keyboard('[ArrowDown][ArrowDown]');
      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveAttribute(
          'data-highlighted',
        );
      });

      // Past the last item the highlight is released back to the input, matching Combobox.
      await user.keyboard('[ArrowDown]');
      await waitFor(() => {
        expect(input).not.toHaveAttribute('aria-activedescendant');
      });

      await user.keyboard('[ArrowDown]');
      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'Rename' })).toHaveAttribute(
          'data-highlighted',
        );
      });
    });

    it('starts navigation from the top again after closing and reopening', async () => {
      const { user } = await render(<KeyboardNavigationMenu />);
      await openWithKeyboard(user);

      await user.keyboard('[ArrowDown][ArrowDown]');
      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toHaveAttribute(
          'data-highlighted',
        );
      });

      await user.keyboard('[Escape]');
      await waitFor(() => {
        expect(screen.queryByRole('menu')).toBe(null);
      });

      const reopenedInput = await openWithKeyboard(user);
      expect(reopenedInput).not.toHaveAttribute('aria-activedescendant');

      await user.keyboard('[ArrowDown]');
      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'Rename' })).toHaveAttribute(
          'data-highlighted',
        );
      });
      expect(screen.getByRole('menuitem', { name: 'Duplicate' })).not.toHaveAttribute(
        'data-highlighted',
      );
    });

    it('keeps the highlight index in step with the highlighted item after the input is refocused', async () => {
      const { user } = await render(<KeyboardNavigationMenu />);
      const input = await openWithKeyboard(user);

      await user.keyboard('[ArrowDown][ArrowDown]');
      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toHaveAttribute(
          'data-highlighted',
        );
      });

      // Refocusing the input keeps the highlight, and list navigation must keep its cursor on
      // the same item. If the two drift apart, the next arrow key moves from the wrong position.
      await act(async () => {
        input.blur();
        input.focus();
      });

      expect(input).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('menuitem', { name: 'Duplicate' }).id,
      );

      await user.keyboard('[ArrowDown]');
      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveAttribute(
          'data-highlighted',
        );
      });
    });

    it('resets the highlight when the query changes and rebuilds it from the first match', async () => {
      const { user } = await render(<KeyboardNavigationMenu />);
      const input = await openWithKeyboard(user);

      await user.keyboard('[ArrowDown][ArrowDown]');
      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toHaveAttribute(
          'data-highlighted',
        );
      });

      await user.type(input, 'e');
      await waitFor(() => {
        expect(input).not.toHaveAttribute('aria-activedescendant');
      });

      await user.keyboard('[ArrowDown]');
      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'Rename' })).toHaveAttribute(
          'data-highlighted',
        );
      });
    });
  });

  describe('typeahead', () => {
    it('does not move the highlight while typing into the input', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item>Rename</Menu.Item>
                    <Menu.Item>Duplicate</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const input = screen.getByRole('searchbox', { name: 'Filter actions' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });

      await user.keyboard('d');
      await waitFor(() => {
        expect(screen.queryByRole('menuitem', { name: 'Rename' })).toBe(null);
      });
      expect(input).not.toHaveAttribute('aria-activedescendant');
    });
  });

  it('keeps component-rendered item text after the item is filtered out', async () => {
    function Label(props: { text: string }) {
      return <span>{props.text}</span>;
    }

    function App() {
      const [query, setQuery] = React.useState('');

      return (
        <Menu.FilterProvider
          inputValue={query}
          onInputValueChange={(nextQuery) => setQuery(nextQuery)}
        >
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item>
                      <Label text="Rename" />
                    </Menu.Item>
                    <Menu.Item>Delete</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>
      );
    }

    const { user } = await render(<App />);
    const input = screen.getByRole('searchbox', { name: 'Filter actions' });

    await user.type(input, 'del');
    await waitFor(() => {
      expect(screen.queryByRole('menuitem', { name: 'Rename' })).toBe(null);
    });

    await user.clear(input);
    await user.type(input, 'ren');

    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'Rename' })).toBeVisible();
    });
  });

  it('preserves input focus on item and list presses without blocking the scrollbar', async () => {
    await render(
      <Menu.FilterProvider>
        <Menu.Root defaultOpen>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.FilterInput aria-label="Filter actions" />
                <Menu.List>
                  <Menu.Item>Rename</Menu.Item>
                </Menu.List>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </Menu.FilterProvider>,
    );

    const list = screen.getByRole('menu');
    const item = screen.getByRole('menuitem', { name: 'Rename' });
    const itemMouseDown = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    const backgroundMouseDown = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    const scrollbarMouseDown = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    Object.defineProperties(list, {
      clientHeight: { configurable: true, value: 100 },
      clientWidth: { configurable: true, value: 100 },
      offsetHeight: { configurable: true, value: 100 },
      offsetWidth: { configurable: true, value: 115 },
      scrollHeight: { configurable: true, value: 200 },
    });
    Object.defineProperty(scrollbarMouseDown, 'offsetX', { value: 110 });

    await act(async () => {
      item.dispatchEvent(itemMouseDown);
      list.dispatchEvent(backgroundMouseDown);
      list.dispatchEvent(scrollbarMouseDown);
    });

    expect(itemMouseDown.defaultPrevented).toBe(true);
    expect(backgroundMouseDown.defaultPrevented).toBe(true);
    expect(scrollbarMouseDown.defaultPrevented).toBe(false);
  });

  it('returns focus to the input with the RTL submenu close key', async () => {
    await render(
      <DirectionProvider direction="rtl">
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <button type="button">Auxiliary action</button>
                  <Menu.List>
                    <Menu.Item>Rename</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>
      </DirectionProvider>,
    );

    const input = screen.getByRole('searchbox', { name: 'Filter actions' });
    const auxiliaryAction = screen.getByRole('button', { name: 'Auxiliary action' });
    await act(async () => {
      auxiliaryAction.focus();
    });

    fireEvent.keyDown(auxiliaryAction, { key: 'ArrowRight' });

    expect(input).toHaveFocus();
  });

  it('releases the highlight when the query is cleared', async () => {
    const onClick = vi.fn();
    const { user } = await render(
      <Menu.FilterProvider>
        <Menu.Root defaultOpen>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.FilterInput aria-label="Filter actions" />
                <Menu.FilterClear aria-label="Clear filter" />
                <Menu.List>
                  <Menu.Item onClick={onClick}>Apple</Menu.Item>
                  <Menu.Item>Banana</Menu.Item>
                </Menu.List>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </Menu.FilterProvider>,
    );

    const input = screen.getByRole('searchbox', { name: 'Filter actions' });
    await user.type(input, 'ban');
    await waitFor(() => {
      expect(screen.queryByRole('menuitem', { name: 'Apple' })).toBe(null);
    });

    // Banana is now index 0.
    await user.keyboard('[ArrowDown]');
    expect(input).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('menuitem', { name: 'Banana' }).id,
    );

    await user.click(screen.getByRole('button', { name: 'Clear filter' }));

    // Apple takes index 0 back, so a kept highlight would activate the wrong item.
    await waitFor(() => {
      expect(input).not.toHaveAttribute('aria-activedescendant');
    });
    await user.keyboard('[Enter]');
    expect(onClick).toHaveBeenCalledTimes(0);
  });

  it('keeps the query when the popup-close reset is canceled', async () => {
    if (reactMajor <= 18) {
      // React 18 reports external-store transition updates after the controlled close event's
      // act scope, even though the interaction and observable transition are both awaited.
      ignoreActWarnings();
    }

    function App() {
      const [open, setOpen] = React.useState(true);
      const [inputValue, setInputValue] = React.useState('');
      return (
        <React.Fragment>
          <button onClick={() => setOpen((value) => !value)}>toggle</button>
          <Menu.FilterProvider
            inputValue={inputValue}
            onInputValueChange={(value, details) => {
              if (details.reason === 'popup-close') {
                details.cancel();
                return;
              }
              setInputValue(value);
            }}
          >
            <Menu.Root open={open} onOpenChange={setOpen}>
              <Menu.Trigger>Actions</Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.FilterInput aria-label="Filter actions" />
                    <Menu.List>
                      <Menu.Item>Rename</Menu.Item>
                      <Menu.Item>Delete</Menu.Item>
                    </Menu.List>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </Menu.FilterProvider>
        </React.Fragment>
      );
    }

    const { user } = await render(<App />);

    await user.type(screen.getByRole('searchbox', { name: 'Filter actions' }), 'ren');
    await waitFor(() => {
      expect(screen.queryByRole('menuitem', { name: 'Delete' })).toBe(null);
    });

    const toggle = screen.getByRole('button', { name: 'toggle' });
    await act(async () => {
      toggle.click();
    });
    await waitFor(() => {
      expect(screen.queryByRole('menu')).toBe(null);
    });

    await act(async () => {
      toggle.click();
    });

    const input = await screen.findByRole('searchbox', { name: 'Filter actions' });
    expect(input).toHaveValue('ren');
    await waitFor(() => {
      expect(input).toHaveFocus();
    });
    await waitFor(() => {
      expect(screen.queryByRole('menuitem', { name: 'Delete' })).toBe(null);
    });
    expect(screen.getByRole('menuitem', { name: 'Rename' })).toBeVisible();
  });

  it('renders Empty when no items are registered at all', async () => {
    await render(
      <Menu.FilterProvider>
        <Menu.Root defaultOpen>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.FilterInput aria-label="Filter actions" />
                <Menu.FilterEmpty>No actions found</Menu.FilterEmpty>
                <Menu.List />
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </Menu.FilterProvider>,
    );

    await waitFor(() => {
      expect(screen.queryAllByText('No actions found').length).toBeGreaterThan(0);
    });
  });

  it('keeps a group with no registered items visible while filtering', async () => {
    const { user } = await render(
      <Menu.FilterProvider>
        <Menu.Root defaultOpen>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.FilterInput aria-label="Filter actions" />
                <Menu.List>
                  <Menu.Group>
                    <Menu.GroupLabel>Empty section</Menu.GroupLabel>
                  </Menu.Group>
                  <Menu.Item>Rename</Menu.Item>
                </Menu.List>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </Menu.FilterProvider>,
    );

    await user.type(screen.getByRole('searchbox', { name: 'Filter actions' }), 'ren');

    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'Rename' })).toBeVisible();
    });
    expect(screen.getByText('Empty section')).toBeVisible();
  });

  it('re-filters an item whose rendered text changes while it is hidden', async () => {
    function App() {
      const [label, setLabel] = React.useState('Archive');
      return (
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  {/* Inside the popup so pressing it does not dismiss the menu. */}
                  <button type="button" onClick={() => setLabel('Rename')}>
                    rename
                  </button>
                  <Menu.List>
                    <Menu.Item>{label}</Menu.Item>
                    <Menu.Item>Delete</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>
      );
    }

    const { user } = await render(<App />);

    await user.type(screen.getByRole('searchbox', { name: 'Filter actions' }), 'rename');
    await waitFor(() => {
      expect(screen.queryByRole('menuitem', { name: 'Archive' })).toBe(null);
    });

    // The item is unmounted, so its text can only come from the rendered children.
    await user.click(screen.getByRole('button', { name: 'rename' }));
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'Rename' })).toBeVisible();
    });
  });

  it('preserves modifiers when the input activates a link item', async () => {
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault());
    const { user } = await render(
      <Menu.FilterProvider>
        <Menu.Root defaultOpen>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.FilterInput aria-label="Filter actions" />
                <Menu.List>
                  <Menu.LinkItem href="#docs" onClick={onClick}>
                    Docs
                  </Menu.LinkItem>
                </Menu.List>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </Menu.FilterProvider>,
    );

    const input = screen.getByRole('searchbox', { name: 'Filter actions' });
    await waitFor(() => {
      expect(input).toHaveFocus();
    });
    await user.keyboard('[ArrowDown]{Control>}[Enter]{/Control}');

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick.mock.calls[0][0]).toHaveProperty('ctrlKey', true);
  });

  it('leaves modified editing keys to the input while an item is highlighted', async () => {
    const { user } = await render(
      <Menu.FilterProvider>
        <Menu.Root defaultOpen>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.FilterInput aria-label="Filter actions" />
                <Menu.List>
                  <Menu.Item>Rename</Menu.Item>
                  <Menu.Item>Duplicate</Menu.Item>
                </Menu.List>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </Menu.FilterProvider>,
    );

    const input = screen.getByRole('searchbox', { name: 'Filter actions' });
    await waitFor(() => {
      expect(input).toHaveFocus();
    });

    await user.keyboard('[ArrowDown]');
    const rename = screen.getByRole('menuitem', { name: 'Rename' });
    await waitFor(() => {
      expect(input).toHaveAttribute('aria-activedescendant', rename.id);
    });

    // `fireEvent` returns `false` when a handler called `preventDefault`, which would break the
    // browser-native selection and word/boundary movement these shortcuts perform.
    expect(fireEvent.keyDown(input, { key: 'ArrowDown', shiftKey: true })).toBe(true);
    expect(input).toHaveAttribute('aria-activedescendant', rename.id);

    expect(fireEvent.keyDown(input, { key: 'ArrowLeft', shiftKey: true })).toBe(true);
    expect(fireEvent.keyDown(input, { key: 'ArrowRight', altKey: true })).toBe(true);
    expect(fireEvent.keyDown(input, { key: 'Home', metaKey: true })).toBe(true);
    expect(fireEvent.keyDown(input, { key: 'End', shiftKey: true })).toBe(true);
    expect(input).toHaveAttribute('aria-activedescendant', rename.id);
  });

  it('does not open a highlighted submenu with a modified cross-axis key from the input', async () => {
    const { user } = await render(
      <Menu.FilterProvider>
        <Menu.Root defaultOpen>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.FilterInput aria-label="Filter actions" />
                <Menu.List>
                  <Menu.SubmenuRoot>
                    <Menu.SubmenuTrigger delay={0}>Share</Menu.SubmenuTrigger>
                    <Menu.Portal>
                      <Menu.Positioner>
                        <Menu.Popup data-testid="submenu-list">
                          <Menu.Item>Email</Menu.Item>
                        </Menu.Popup>
                      </Menu.Positioner>
                    </Menu.Portal>
                  </Menu.SubmenuRoot>
                </Menu.List>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </Menu.FilterProvider>,
    );

    const input = screen.getByRole('searchbox', { name: 'Filter actions' });
    await waitFor(() => {
      expect(input).toHaveFocus();
    });

    await user.keyboard('[ArrowDown]');
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'Share' })).toHaveAttribute('data-highlighted');
    });

    fireEvent.keyDown(input, { key: 'ArrowRight', metaKey: true });
    expect(screen.queryByTestId('submenu-list')).toBe(null);

    await user.keyboard('[ArrowRight]');
    await screen.findByTestId('submenu-list');
  });

  it('calls onOpenChangeComplete when the menu opens and closes', async () => {
    const onOpenChangeComplete = vi.fn();
    const { user } = await render(
      <Menu.FilterProvider>
        <Menu.Root onOpenChangeComplete={onOpenChangeComplete}>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.FilterInput aria-label="Filter actions" />
                <Menu.List>
                  <Menu.Item>Rename</Menu.Item>
                </Menu.List>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </Menu.FilterProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await waitFor(() => {
      expect(onOpenChangeComplete).toHaveBeenCalledWith(true);
    });

    await user.keyboard('[Escape]');
    await waitFor(() => {
      expect(onOpenChangeComplete).toHaveBeenCalledWith(false);
    });
  });

  it('does not seed a highlight when the trigger regains focus while open', async () => {
    const { user } = await render(
      <Menu.FilterProvider>
        <Menu.Root>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.FilterInput aria-label="Filter actions" />
                <Menu.List>
                  <Menu.Item>Rename</Menu.Item>
                </Menu.List>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </Menu.FilterProvider>,
    );

    const trigger = screen.getByRole('button', { name: 'Actions' });
    await user.click(trigger);
    const input = await screen.findByRole('searchbox', { name: 'Filter actions' });
    await waitFor(() => {
      expect(input).toHaveFocus();
    });

    // Safari focuses the trigger on mousedown before the closing click lands.
    await act(async () => {
      trigger.focus();
    });

    expect(input).not.toHaveAttribute('aria-activedescendant');
    expect(trigger).not.toHaveAttribute('aria-activedescendant');
    expect(screen.getByRole('menuitem', { name: 'Rename' })).not.toHaveAttribute(
      'data-highlighted',
    );
  });

  it('prefers the label prop over rendered text for matching', async () => {
    const { user } = await render(
      <Menu.FilterProvider>
        <Menu.Root defaultOpen>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.FilterInput aria-label="Filter actions" />
                <Menu.List>
                  <Menu.Item label="Apple">Fruit one</Menu.Item>
                  <Menu.Item>Banana</Menu.Item>
                </Menu.List>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </Menu.FilterProvider>,
    );

    const input = screen.getByRole('searchbox', { name: 'Filter actions' });
    await user.type(input, 'app');
    await waitFor(() => {
      expect(screen.queryByRole('menuitem', { name: 'Banana' })).toBe(null);
    });
    expect(screen.getByRole('menuitem', { name: 'Fruit one' })).toBeVisible();

    await user.clear(input);
    await user.type(input, 'fruit');
    await waitFor(() => {
      expect(screen.queryByRole('menuitem', { name: 'Fruit one' })).toBe(null);
    });
  });

  it('removes Empty once the query matches again', async () => {
    const { user } = await render(
      <Menu.FilterProvider>
        <Menu.Root defaultOpen>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.FilterInput aria-label="Filter actions" />
                <Menu.FilterEmpty>No actions found</Menu.FilterEmpty>
                <Menu.List>
                  <Menu.Item>Rename</Menu.Item>
                </Menu.List>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </Menu.FilterProvider>,
    );

    const input = screen.getByRole('searchbox', { name: 'Filter actions' });
    expect(screen.queryByText('No actions found')).toBe(null);

    await user.type(input, 'zzz');
    await waitFor(() => {
      expect(screen.queryAllByText('No actions found').length).toBeGreaterThan(0);
    });

    await user.clear(input);
    await user.type(input, 'ren');
    await waitFor(() => {
      expect(screen.queryByText('No actions found')).toBe(null);
    });
    expect(screen.getByRole('menuitem', { name: 'Rename' })).toBeVisible();
  });

  describe('server-side rendering', () => {
    it('shows the empty state after hydration when no items are rendered', async () => {
      const { hydrate } = renderToString(
        <Menu.FilterProvider>
          <Menu.Root open>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.FilterEmpty data-testid="empty">No actions found</Menu.FilterEmpty>
                  <Menu.List />
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      expect(screen.queryByTestId('empty')).toBe(null);

      hydrate();

      await waitFor(() => {
        expect(screen.getByTestId('empty')).toHaveTextContent('No actions found');
      });
    });
  });

  it('does not set aria-selected on highlighted items outside WebKit', async () => {
    const { user } = await render(
      <Menu.FilterProvider>
        <Menu.Root defaultOpen>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.FilterInput aria-label="Filter actions" />
                <Menu.List>
                  <Menu.Item>Rename</Menu.Item>
                </Menu.List>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </Menu.FilterProvider>,
    );

    const input = screen.getByRole('searchbox', { name: 'Filter actions' });
    await waitFor(() => {
      expect(input).toHaveFocus();
    });
    await user.keyboard('[ArrowDown]');

    const item = screen.getByRole('menuitem', { name: 'Rename' });
    await waitFor(() => {
      expect(item).toHaveAttribute('data-highlighted');
    });
    expect(item).not.toHaveAttribute('aria-selected');
  });

  describe.skipIf(isJSDOM)('hover-opened submenu ownership', () => {
    function HoverMenu() {
      return (
        <Menu.FilterProvider>
          <Menu.Root>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner sideOffset={8}>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item>Rename</Menu.Item>
                    <Menu.Item>Duplicate</Menu.Item>
                    <Menu.FilterProvider>
                      <Menu.SubmenuRoot>
                        <Menu.SubmenuTrigger delay={0}>Share</Menu.SubmenuTrigger>
                        <Menu.Portal>
                          <Menu.Positioner sideOffset={4}>
                            <Menu.Popup>
                              <Menu.FilterInput aria-label="Filter sharing options" />
                              <Menu.List>
                                <Menu.Item>Email</Menu.Item>
                              </Menu.List>
                            </Menu.Popup>
                          </Menu.Positioner>
                        </Menu.Portal>
                      </Menu.SubmenuRoot>
                    </Menu.FilterProvider>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>
      );
    }

    async function openAndHoverTrigger(user: ReturnType<typeof userEvent.setup>) {
      await user.click(screen.getByRole('button', { name: 'Actions' }));
      await screen.findByRole('searchbox', { name: 'Filter actions' });
      await user.hover(screen.getByRole('menuitem', { name: 'Share' }));
      const submenuInput = await screen.findByRole('searchbox', { name: 'Filter sharing options' });
      fireEvent.mouseMove(submenuInput);
      return submenuInput;
    }

    it('closes when the pointer sweeps off the trigger', async () => {
      const { user } = await render(<HoverMenu />);
      await openAndHoverTrigger(user);

      await user.hover(screen.getByRole('menuitem', { name: 'Rename' }));

      await waitFor(() => {
        expect(screen.queryByRole('searchbox', { name: 'Filter sharing options' })).toBe(null);
      });
    });

    it('closes when the pointer leaves the submenu popup', async () => {
      const { user } = await render(<HoverMenu />);
      await openAndHoverTrigger(user);

      await user.hover(await screen.findByRole('menuitem', { name: 'Email' }));
      await user.hover(screen.getByRole('menuitem', { name: 'Duplicate' }));

      await waitFor(() => {
        expect(screen.queryByRole('searchbox', { name: 'Filter sharing options' })).toBe(null);
      });
    });

    it('closes and resets after a query was typed into the hover-opened submenu', async () => {
      const { user } = await render(<HoverMenu />);
      const submenuInput = await openAndHoverTrigger(user);

      // The hover hand-off makes the submenu input the typing target.
      await waitFor(() => {
        expect(submenuInput).toHaveFocus();
      });
      fireEvent.change(submenuInput, { target: { value: 'em' } });
      await waitFor(() => {
        expect(submenuInput).toHaveValue('em');
      });

      await user.hover(screen.getByRole('menuitem', { name: 'Rename' }));

      await waitFor(() => {
        expect(screen.queryByRole('searchbox', { name: 'Filter sharing options' })).toBe(null);
      });

      // Reopening starts from an empty query rather than the previous one.
      await user.hover(screen.getByRole('menuitem', { name: 'Share' }));
      const reopenedInput = await screen.findByRole('searchbox', {
        name: 'Filter sharing options',
      });
      await waitFor(() => {
        expect(reopenedInput).toHaveValue('');
      });
    });
  });

  describe('prop: filter', () => {
    function CustomFilterMenu(props: { filter?: Menu.FilterProvider.Props['filter'] }) {
      return (
        <Menu.FilterProvider filter={props.filter}>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item keywords={['trash']}>Delete</Menu.Item>
                    <Menu.Item>Rename</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>
      );
    }

    it('applies a custom filter to item text and keywords', async () => {
      const filter = vi.fn((text: string, query: string) => text.toLowerCase().startsWith(query));

      const { user } = await render(<CustomFilterMenu filter={filter} />);

      await user.type(screen.getByRole('searchbox', { name: 'Filter actions' }), 'tra');

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeVisible();
      });
      expect(screen.queryByRole('menuitem', { name: 'Rename' })).toBe(null);
      expect(filter).toHaveBeenCalledWith('Delete', 'tra');
      expect(filter).toHaveBeenCalledWith('trash', 'tra');
      expect(filter).toHaveBeenCalledWith('Rename', 'tra');
      expect(filter.mock.calls.every((args) => args.length === 2)).toBe(true);
    });

    it('keeps every item visible when filtering is turned off with null', async () => {
      const { user } = await render(<CustomFilterMenu filter={null} />);

      await user.type(screen.getByRole('searchbox', { name: 'Filter actions' }), 'zzz');

      expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeVisible();
      expect(screen.getByRole('menuitem', { name: 'Rename' })).toBeVisible();
    });
  });

  describe('canceling changes', () => {
    it('stays closed when onOpenChange is canceled', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root onOpenChange={(_, eventDetails) => eventDetails.cancel()}>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item>Rename</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'Actions' }));

      expect(screen.queryByRole('menu')).toBe(null);
    });

    it('leaves a checkbox item unchecked when onCheckedChange is canceled', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.CheckboxItem
                      closeOnClick={false}
                      onCheckedChange={(_, eventDetails) => eventDetails.cancel()}
                    >
                      Show hidden
                    </Menu.CheckboxItem>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const item = screen.getByRole('menuitemcheckbox', { name: 'Show hidden' });
      await user.click(item);

      expect(item).toHaveAttribute('aria-checked', 'false');
    });

    it('tracks a controlled checkbox item', async () => {
      function ControlledCheckbox() {
        const [checked, setChecked] = React.useState(false);

        return (
          <Menu.FilterProvider>
            <Menu.Root defaultOpen>
              <Menu.Trigger>Actions</Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.FilterInput aria-label="Filter actions" />
                    <Menu.List>
                      <Menu.CheckboxItem
                        closeOnClick={false}
                        checked={checked}
                        onCheckedChange={setChecked}
                      >
                        Show hidden
                      </Menu.CheckboxItem>
                    </Menu.List>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </Menu.FilterProvider>
        );
      }

      const { user } = await render(<ControlledCheckbox />);

      const item = screen.getByRole('menuitemcheckbox', { name: 'Show hidden' });
      expect(item).toHaveAttribute('aria-checked', 'false');

      await user.click(item);

      await waitFor(() => {
        expect(item).toHaveAttribute('aria-checked', 'true');
      });
    });
  });

  describe('input value change reasons', () => {
    async function renderReasonMenu(onInputValueChange: (value: string, reason: string) => void) {
      return render(
        <Menu.FilterProvider
          onInputValueChange={(value, eventDetails) =>
            onInputValueChange(value, eventDetails.reason)
          }
        >
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.FilterClear aria-label="Clear filter" />
                  <Menu.List>
                    <Menu.Item>Rename</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );
    }

    it('reports input-change while typing', async () => {
      const onInputValueChange = vi.fn();
      const { user } = await renderReasonMenu(onInputValueChange);

      await user.type(screen.getByRole('searchbox', { name: 'Filter actions' }), 'r');

      expect(onInputValueChange).toHaveBeenCalledWith('r', 'input-change');
    });

    it('reports input-clear when the field is emptied', async () => {
      const onInputValueChange = vi.fn();
      const { user } = await renderReasonMenu(onInputValueChange);

      const input = screen.getByRole('searchbox', { name: 'Filter actions' });
      await user.type(input, 'r');
      await user.clear(input);

      expect(onInputValueChange).toHaveBeenLastCalledWith('', 'input-clear');
    });

    it('reports clear-press when the clear button is used', async () => {
      const onInputValueChange = vi.fn();
      const { user } = await renderReasonMenu(onInputValueChange);

      await user.type(screen.getByRole('searchbox', { name: 'Filter actions' }), 'r');
      await user.click(screen.getByRole('button', { name: 'Clear filter' }));

      expect(onInputValueChange).toHaveBeenLastCalledWith('', 'clear-press');
    });

    it('reports popup-close when a controlled close discards the query', async () => {
      const onInputValueChange = vi.fn();

      function ControlledOpen(props: { open: boolean }) {
        return (
          <Menu.FilterProvider
            defaultInputValue="ren"
            onInputValueChange={(value, eventDetails) =>
              onInputValueChange(value, eventDetails.reason)
            }
          >
            <Menu.Root open={props.open}>
              <Menu.Trigger>Actions</Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.FilterInput aria-label="Filter actions" />
                    <Menu.List>
                      <Menu.Item>Rename</Menu.Item>
                    </Menu.List>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </Menu.FilterProvider>
        );
      }

      const { setProps } = await render(<ControlledOpen open />);
      await setProps({ open: false });

      expect(onInputValueChange).toHaveBeenCalledWith('', 'popup-close');
    });
  });

  describe('accessible names', () => {
    it('does not point the popup or list at a trigger that never rendered', async () => {
      await render(
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item>Rename</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-labelledby');
      expect(screen.getByRole('menu')).not.toHaveAttribute('aria-labelledby');
    });

    it('labels the list with the trigger when no label is given', async () => {
      await render(
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item>Rename</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const trigger = screen.getByRole('button', { name: 'Actions' });
      expect(screen.getByRole('menu')).toHaveAttribute('aria-labelledby', trigger.id);
    });

    it('keeps a list label supplied through a render element', async () => {
      await render(
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List render={<div aria-label="Commands" />}>
                    <Menu.Item>Rename</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const list = screen.getByRole('menu');
      expect(list).toHaveAttribute('aria-label', 'Commands');
      expect(list).not.toHaveAttribute('aria-labelledby');
    });

    it('omits aria-controls when the list renders with an explicitly empty id', async () => {
      await render(
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List render={<div id="" />}>
                    <Menu.Item>Rename</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const input = screen.getByRole('searchbox', { name: 'Filter actions' });
      await waitFor(() => {
        expect(input).not.toHaveAttribute('aria-controls');
      });
      expect(screen.getByRole('menu').id).toBe('');
    });

    it('omits the list label when the trigger renders with an explicitly empty id', async () => {
      await render(
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger render={<button id="" />}>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item>Rename</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const list = screen.getByRole('menu');
      await waitFor(() => {
        expect(list).not.toHaveAttribute('aria-labelledby');
      });
      expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-labelledby');
    });
  });

  describe('handle', () => {
    it('opens from a trigger rendered outside the root', async () => {
      function DetachedTriggerMenu() {
        const handle = useRefWithInit(() => Menu.createHandle({ filterable: true })).current;

        return (
          <React.Fragment>
            <Menu.FilterProvider>
              <Menu.Root handle={handle}>
                <Menu.Portal>
                  <Menu.Positioner>
                    <Menu.Popup>
                      <Menu.FilterInput aria-label="Filter actions" />
                      <Menu.List>
                        <Menu.Item>Rename</Menu.Item>
                      </Menu.List>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
            </Menu.FilterProvider>
            <Menu.Trigger handle={handle}>Actions</Menu.Trigger>
          </React.Fragment>
        );
      }

      const { user } = await render(<DetachedTriggerMenu />);

      expect(screen.queryByRole('menu')).toBe(null);

      await user.click(screen.getByRole('button', { name: 'Actions' }));

      await waitFor(() => {
        expect(screen.getByRole('menu')).not.toBe(null);
      });
      await waitFor(() => {
        expect(screen.getByRole('searchbox', { name: 'Filter actions' })).toHaveFocus();
      });
      expect(screen.getByRole('menuitem', { name: 'Rename' })).toBeVisible();
    });
  });

  describe('consumer props', () => {
    // `Menu.Trigger`, `Menu.FilterInput`, and `Menu.Popup` each render two nested
    // layers. Consumer props must land on the inner one only, or every handler fires twice.
    it('runs a consumer handler once per interaction on each two-layer part', async () => {
      const onTriggerClick = vi.fn();
      const onInputKeyDown = vi.fn();
      const onPopupKeyDown = vi.fn();

      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root>
            <Menu.Trigger onClick={onTriggerClick}>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup onKeyDown={onPopupKeyDown}>
                  <Menu.FilterInput aria-label="Filter actions" onKeyDown={onInputKeyDown} />
                  <Menu.List>
                    <Menu.Item>Rename</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'Actions' }));
      expect(onTriggerClick).toHaveBeenCalledTimes(1);

      const input = await screen.findByRole('searchbox', { name: 'Filter actions' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });

      // Dispatched directly: this counts handler invocations, and typing through `userEvent`
      // right after the open-time focus hand-off trips React's act/suspend warning in Chromium.
      fireEvent.keyDown(input, { key: 'r' });

      // A printable key stays on the input: it must not reach the popup's handler.
      expect(onInputKeyDown).toHaveBeenCalledTimes(1);
      expect(onPopupKeyDown).toHaveBeenCalledTimes(0);

      // Escape is not consumed by the input, so it reaches the popup exactly once.
      fireEvent.keyDown(input, { key: 'Escape' });
      expect(onPopupKeyDown).toHaveBeenCalledTimes(1);
    });
  });

  describe('focus ownership inside the popup', () => {
    it('leaves focus on another control in the popup when the pointer moves', async () => {
      await render(
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup data-testid="popup">
                  <Menu.FilterInput aria-label="Filter actions" />
                  <button type="button">Auxiliary action</button>
                  <Menu.List>
                    <Menu.Item>Rename</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const auxiliary = screen.getByRole('button', { name: 'Auxiliary action' });
      await act(async () => {
        auxiliary.focus();
      });

      fireEvent.mouseMove(screen.getByTestId('popup'));

      expect(auxiliary).toHaveFocus();
    });

    it('keeps focus in an open auto-focused submenu while the pointer crosses the parent popup', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item>Rename</Menu.Item>
                    <Menu.FilterProvider>
                      <Menu.SubmenuRoot>
                        {/* Crossing a sibling item only schedules the close. */}
                        <Menu.SubmenuTrigger delay={0} closeDelay={1000}>
                          Move to folder
                        </Menu.SubmenuTrigger>
                        <Menu.Portal>
                          <Menu.Positioner>
                            <Menu.Popup>
                              <Menu.FilterInput aria-label="Filter folders" autoFocus />
                              <Menu.List>
                                <Menu.Item>Documents</Menu.Item>
                              </Menu.List>
                            </Menu.Popup>
                          </Menu.Positioner>
                        </Menu.Portal>
                      </Menu.SubmenuRoot>
                    </Menu.FilterProvider>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      await user.hover(screen.getByRole('menuitem', { name: 'Move to folder' }));
      const submenuInput = await screen.findByRole('searchbox', { name: 'Filter folders' });
      await waitFor(() => {
        expect(submenuInput).toHaveFocus();
      });

      fireEvent.mouseMove(screen.getByRole('menuitem', { name: 'Rename' }));

      expect(submenuInput).toHaveFocus();
    });

    it('returns focus to the parent input when the pointer moves back over the parent popup', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.FilterProvider>
                      <Menu.SubmenuRoot>
                        <Menu.SubmenuTrigger delay={0} closeDelay={1000}>
                          Move to folder
                        </Menu.SubmenuTrigger>
                        <Menu.Portal>
                          <Menu.Positioner>
                            <Menu.Popup>
                              <Menu.FilterInput aria-label="Filter folders" />
                              <Menu.List>
                                <Menu.Item>Documents</Menu.Item>
                              </Menu.List>
                            </Menu.Popup>
                          </Menu.Positioner>
                        </Menu.Portal>
                      </Menu.SubmenuRoot>
                    </Menu.FilterProvider>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const rootInput = screen.getByRole('searchbox', { name: 'Filter actions' });
      const submenuTrigger = screen.getByRole('menuitem', { name: 'Move to folder' });
      await user.hover(submenuTrigger);
      const submenuInput = await screen.findByRole('searchbox', { name: 'Filter folders' });
      fireEvent.mouseMove(submenuInput);
      await waitFor(() => {
        expect(submenuInput).toHaveAttribute('data-highlighted');
      });

      // Back over the still-open submenu's trigger.
      fireEvent.mouseMove(submenuTrigger);

      expect(rootInput).toHaveFocus();
      await waitFor(() => {
        expect(rootInput).toHaveAttribute('data-highlighted');
      });
      expect(submenuInput).not.toHaveAttribute('data-highlighted');
      expect(submenuInput).toBeVisible();
    });

    it('returns focus to the parent input once a pointer-opened submenu unmounts', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item>Rename</Menu.Item>
                    <Menu.FilterProvider>
                      <Menu.SubmenuRoot>
                        <Menu.SubmenuTrigger delay={0} closeDelay={0}>
                          Move to folder
                        </Menu.SubmenuTrigger>
                        <Menu.Portal>
                          <Menu.Positioner>
                            <Menu.Popup>
                              <Menu.FilterInput aria-label="Filter folders" />
                              <Menu.List>
                                <Menu.Item>Documents</Menu.Item>
                              </Menu.List>
                            </Menu.Popup>
                          </Menu.Positioner>
                        </Menu.Portal>
                      </Menu.SubmenuRoot>
                    </Menu.FilterProvider>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      await user.hover(screen.getByRole('menuitem', { name: 'Move to folder' }));
      const submenuInput = await screen.findByRole('searchbox', { name: 'Filter folders' });
      fireEvent.mouseMove(submenuInput);
      await waitFor(() => {
        expect(submenuInput).toHaveFocus();
      });

      await user.hover(screen.getByRole('menuitem', { name: 'Rename' }));
      await waitFor(() => {
        expect(submenuInput).not.toBeInTheDocument();
      });

      const rootInput = screen.getByRole('searchbox', { name: 'Filter actions' });
      await waitFor(() => {
        expect(rootInput).toHaveFocus();
      });
      await waitFor(() => {
        expect(rootInput).toHaveAttribute('data-highlighted');
      });
    });

    it('returns focus to the parent input when the pointer leaves a submenu trigger', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item>Rename</Menu.Item>
                    <Menu.FilterProvider>
                      <Menu.SubmenuRoot>
                        <Menu.SubmenuTrigger delay={0} closeDelay={0}>
                          Move to folder
                        </Menu.SubmenuTrigger>
                        <Menu.Portal>
                          <Menu.Positioner>
                            <Menu.Popup>
                              {/* Focus enters on hover, so the pointer never has to land on the popup. */}
                              <Menu.FilterInput aria-label="Filter folders" autoFocus />
                              <Menu.List>
                                <Menu.Item>Documents</Menu.Item>
                              </Menu.List>
                            </Menu.Popup>
                          </Menu.Positioner>
                        </Menu.Portal>
                      </Menu.SubmenuRoot>
                    </Menu.FilterProvider>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const submenuTrigger = screen.getByRole('menuitem', { name: 'Move to folder' });
      await user.hover(submenuTrigger);
      const submenuInput = await screen.findByRole('searchbox', { name: 'Filter folders' });
      await waitFor(() => {
        expect(submenuInput).toHaveFocus();
      });

      // The hover interaction closes with the trigger's `mouseleave`, which makes the focus
      // manager skip its return focus.
      fireEvent.mouseLeave(submenuTrigger);
      await waitFor(() => {
        expect(submenuInput).not.toBeInTheDocument();
      });

      const rootInput = screen.getByRole('searchbox', { name: 'Filter actions' });
      expect(rootInput).toHaveFocus();
      await waitFor(() => {
        expect(rootInput).toHaveAttribute('data-highlighted');
      });
    });

    function SiblingSubmenus(props: { autoFocus?: boolean; onRootInputFocus: () => void }) {
      function Submenu(submenuProps: { label: string; delay: number }) {
        return (
          <Menu.FilterProvider>
            <Menu.SubmenuRoot>
              {/* The close waits until the pointer has highlighted the next trigger. */}
              <Menu.SubmenuTrigger delay={submenuProps.delay} closeDelay={10}>
                {submenuProps.label}
              </Menu.SubmenuTrigger>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.FilterInput
                      aria-label={`Filter ${submenuProps.label}`}
                      autoFocus={props.autoFocus}
                    />
                    <Menu.List>
                      <Menu.Item>Option</Menu.Item>
                    </Menu.List>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.SubmenuRoot>
          </Menu.FilterProvider>
        );
      }

      return (
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" onFocus={props.onRootInputFocus} />
                  <Menu.List>
                    <Submenu label="Move to folder" delay={0} />
                    {/* Opens only after the first submenu has unmounted. */}
                    <Submenu label="Share" delay={50} />
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>
      );
    }

    it('opens a hovered submenu without moving focus until the pointer enters it', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.FilterProvider>
                      <Menu.SubmenuRoot>
                        <Menu.SubmenuTrigger delay={0}>Move to folder</Menu.SubmenuTrigger>
                        <Menu.Portal>
                          <Menu.Positioner>
                            <Menu.Popup data-testid="submenu-popup">
                              <Menu.FilterInput aria-label="Filter folders" />
                              <Menu.List>
                                <Menu.Item>Documents</Menu.Item>
                              </Menu.List>
                            </Menu.Popup>
                          </Menu.Positioner>
                        </Menu.Portal>
                      </Menu.SubmenuRoot>
                    </Menu.FilterProvider>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const rootInput = screen.getByRole('searchbox', { name: 'Filter actions' });
      await waitFor(() => {
        expect(rootInput).toHaveFocus();
      });

      const submenuTrigger = screen.getByRole('menuitem', { name: 'Move to folder' });
      await user.hover(submenuTrigger);
      const submenuInput = await screen.findByRole('searchbox', { name: 'Filter folders' });
      await act(() => waitSingleFrame());
      expect(rootInput).toHaveFocus();
      expect(rootInput).toHaveAttribute('data-highlighted');

      fireEvent.mouseMove(screen.getByTestId('submenu-popup'));
      expect(submenuInput).toHaveFocus();
      await waitFor(() => {
        expect(submenuInput).toHaveAttribute('data-highlighted');
      });
    });

    it('focuses a submenu input with autoFocus as soon as its trigger is hovered', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item>Rename</Menu.Item>
                    <Menu.FilterProvider>
                      <Menu.SubmenuRoot>
                        <Menu.SubmenuTrigger delay={0} closeDelay={1000}>
                          Move to folder
                        </Menu.SubmenuTrigger>
                        <Menu.Portal>
                          <Menu.Positioner>
                            <Menu.Popup>
                              <Menu.FilterInput aria-label="Filter folders" autoFocus />
                              <Menu.List>
                                <Menu.Item>Documents</Menu.Item>
                              </Menu.List>
                            </Menu.Popup>
                          </Menu.Positioner>
                        </Menu.Portal>
                      </Menu.SubmenuRoot>
                    </Menu.FilterProvider>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const rootInput = screen.getByRole('searchbox', { name: 'Filter actions' });
      await waitFor(() => {
        expect(rootInput).toHaveFocus();
      });

      await user.hover(screen.getByRole('menuitem', { name: 'Move to folder' }));
      const submenuInput = await screen.findByRole('searchbox', { name: 'Filter folders' });
      await waitFor(() => {
        expect(submenuInput).toHaveFocus();
      });
      await waitFor(() => {
        expect(submenuInput).toHaveAttribute('data-highlighted');
      });
      expect(rootInput).not.toHaveAttribute('data-highlighted');

      // The parent doesn't pull focus back while the pointer crosses it.
      fireEvent.mouseMove(screen.getByRole('menuitem', { name: 'Rename' }));
      expect(submenuInput).toHaveFocus();
    });

    it('moves focus back to the parent input while the pointer moves between submenu triggers', async () => {
      const { user } = await render(<SiblingSubmenus onRootInputFocus={() => {}} />);
      const rootInput = screen.getByRole('searchbox', { name: 'Filter actions' });

      await user.hover(screen.getByRole('menuitem', { name: 'Move to folder' }));
      const firstInput = await screen.findByRole('searchbox', { name: 'Filter Move to folder' });
      fireEvent.mouseMove(firstInput);
      await waitFor(() => {
        expect(firstInput).toHaveFocus();
      });

      await user.hover(screen.getByRole('menuitem', { name: 'Share' }));
      await waitFor(() => {
        expect(rootInput).toHaveFocus();
      });
      const secondInput = await screen.findByRole('searchbox', { name: 'Filter Share' });
      // Let the second submenu's open settle without moving focus.
      await act(() => waitSingleFrame());
      expect(rootInput).toHaveFocus();

      fireEvent.mouseMove(secondInput);
      expect(secondInput).toHaveFocus();
    });

    it('hands focus straight to the next auto-focusing submenu when the pointer moves between submenu triggers', async () => {
      const onRootInputFocus = vi.fn();
      const { user } = await render(
        <SiblingSubmenus autoFocus onRootInputFocus={onRootInputFocus} />,
      );

      await user.hover(screen.getByRole('menuitem', { name: 'Move to folder' }));
      const firstInput = await screen.findByRole('searchbox', { name: 'Filter Move to folder' });
      await waitFor(() => {
        expect(firstInput).toHaveFocus();
      });
      const rootFocusCount = onRootInputFocus.mock.calls.length;

      await user.hover(screen.getByRole('menuitem', { name: 'Share' }));
      await waitFor(() => {
        expect(firstInput).not.toBeInTheDocument();
      });
      await waitFor(() => {
        expect(screen.getByRole('searchbox', { name: 'Filter Share' })).toHaveFocus();
      });

      expect(onRootInputFocus).toHaveBeenCalledTimes(rootFocusCount);
      expect(screen.getByRole('searchbox', { name: 'Filter actions' })).not.toHaveAttribute(
        'data-highlighted',
      );
    });
  });

  describe('leaving the menu', () => {
    function QueryMenu() {
      return (
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item>Rename</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>
      );
    }

    it('closes on Escape even with a query typed', async () => {
      const { user } = await render(<QueryMenu />);

      const input = screen.getByRole('searchbox', { name: 'Filter actions' });
      // `fireEvent.change` rather than typing: typing straight after the open-time focus
      // hand-off leaves an un-acted update that trips React's act warning in Chromium.
      fireEvent.change(input, { target: { value: 'ren' } });
      expect(input).toHaveValue('ren');
      await waitFor(() => {
        expect(input).toHaveFocus();
      });

      await user.keyboard('[Escape]');

      // Escape closes outright; it does not clear the query first.
      await waitFor(() => {
        expect(screen.queryByRole('menu')).toBe(null);
      });
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Actions' })).toHaveFocus();
      });
    });

    it('closes and returns focus to the trigger on Shift+Tab from the input', async () => {
      const { user } = await render(<QueryMenu />);

      const input = screen.getByRole('searchbox', { name: 'Filter actions' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });

      if (isJSDOM) {
        await user.tab({ shift: true });
      } else {
        const { userEvent: browserUser } = await import('vitest/browser');
        await act(async () => {
          await browserUser.keyboard('{Shift>}[Tab]{/Shift}');
        });
      }

      // Backward tabbing mirrors a plain menu: the popup closes and the trigger regains focus.
      await waitFor(() => {
        expect(screen.queryByRole('menu')).toBe(null);
      });
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Actions' })).toHaveFocus();
      });
    });
  });

  describe('prop: keepMounted', () => {
    it('resets the query and highlight across a close and reopen', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal keepMounted>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item>Rename</Menu.Item>
                    <Menu.Item>Delete</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const trigger = screen.getByRole('button', { name: 'Actions' });
      await user.click(trigger);

      const input = await screen.findByRole('searchbox', { name: 'Filter actions' });
      await user.type(input, 'ren');
      await waitFor(() => {
        expect(screen.queryByRole('menuitem', { name: 'Delete' })).toBe(null);
      });

      await user.keyboard('[ArrowDown]');
      expect(input).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('menuitem', { name: 'Rename' }).id,
      );

      await user.keyboard('[Escape]');
      await user.click(trigger);

      // The parts stay mounted, so the query has to be cleared explicitly on close.
      await waitFor(() => {
        expect(screen.getByRole('searchbox', { name: 'Filter actions' })).toHaveValue('');
      });
      expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeVisible();
      expect(screen.getByRole('searchbox', { name: 'Filter actions' })).not.toHaveAttribute(
        'aria-activedescendant',
      );
    });
  });

  describe('with a Viewport', () => {
    it('keeps real focus on the input while the cursor moves through the list', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.Viewport>
                    <Menu.List>
                      <Menu.Item>Rename</Menu.Item>
                      <Menu.Item>Delete</Menu.Item>
                    </Menu.List>
                  </Menu.Viewport>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const input = screen.getByRole('searchbox', { name: 'Filter actions' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });

      await user.keyboard('[ArrowDown]');

      expect(input).toHaveFocus();
      expect(input).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('menuitem', { name: 'Rename' }).id,
      );
    });
  });

  describe('prop: autoHighlight', () => {
    it('clears a pointer highlight on pointer leave by default', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item>Rename</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const item = screen.getByRole('menuitem', { name: 'Rename' });
      await user.hover(item);
      await waitFor(() => {
        expect(item).toHaveAttribute('data-highlighted');
      });

      await user.unhover(item);

      // The mirror of the `autoHighlight="always"` case, which retains the highlight.
      await waitFor(() => {
        expect(item).not.toHaveAttribute('data-highlighted');
      });
    });
  });
});
