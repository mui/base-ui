import { expect, vi } from 'vitest';
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
import { FilterMenu } from '@base-ui/react/filter-menu';
import { ScrollArea } from '@base-ui/react/scroll-area';
import userEvent from '@testing-library/user-event';
import { createRenderer, isJSDOM, resetBrowserPointer } from '#test-utils';

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

describe('<FilterMenu.Root />', () => {
  beforeEach(resetBrowserPointer);

  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render } = createRenderer();

  describe('filtering', () => {
    it('marks the input focus-visible when the menu is opened with the keyboard', async () => {
      const { user } = await render(
        <FilterMenu.Root>
          <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter actions" />
                <FilterMenu.List>
                  <FilterMenu.Item>Rename</FilterMenu.Item>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
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
      expect(input).toHaveAttribute('data-focus-visible');
    });

    it('marks the input focus-visible when the menu is opened with a pointer', async () => {
      const { user } = await render(
        <FilterMenu.Root>
          <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter actions" />
                <FilterMenu.List>
                  <FilterMenu.Item>Rename</FilterMenu.Item>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
      );

      await user.click(screen.getByRole('button', { name: 'Actions' }));

      const input = await screen.findByRole('searchbox', { name: 'Filter actions' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      expect(input).toHaveAttribute('data-focus-visible');
    });

    describe('prop: autoHighlight', () => {
      it('automatically highlights the first match after the user types', async () => {
        const { user } = await render(
          <FilterMenu.Root defaultOpen autoHighlight>
            <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
            <FilterMenu.Portal>
              <FilterMenu.Positioner>
                <FilterMenu.Popup>
                  <FilterMenu.Input aria-label="Filter actions" />
                  <FilterMenu.List>
                    <FilterMenu.Item>Rename</FilterMenu.Item>
                    <FilterMenu.Item>Duplicate</FilterMenu.Item>
                    <FilterMenu.Item>Delete</FilterMenu.Item>
                  </FilterMenu.List>
                </FilterMenu.Popup>
              </FilterMenu.Positioner>
            </FilterMenu.Portal>
          </FilterMenu.Root>,
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

      it('always highlights the first item when autoHighlight is "always"', async () => {
        await render(
          <FilterMenu.Root inline open autoHighlight="always">
            <FilterMenu.Input aria-label="Filter actions" />
            <FilterMenu.List>
              <FilterMenu.Item>Rename</FilterMenu.Item>
              <FilterMenu.Item>Delete</FilterMenu.Item>
            </FilterMenu.List>
          </FilterMenu.Root>,
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
            <FilterMenu.Root inline open autoHighlight={autoHighlight}>
              <FilterMenu.Input aria-label="Filter actions" />
              <FilterMenu.List>
                <FilterMenu.Item>Google Calendar</FilterMenu.Item>
                <FilterMenu.Item>Google Chrome</FilterMenu.Item>
              </FilterMenu.List>
            </FilterMenu.Root>,
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
            <FilterMenu.Root inline open autoHighlight={autoHighlight}>
              <FilterMenu.Input aria-label="Filter actions" />
              <FilterMenu.List>
                <FilterMenu.Item>Rename</FilterMenu.Item>
                <FilterMenu.Item>Delete</FilterMenu.Item>
              </FilterMenu.List>
            </FilterMenu.Root>,
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
                  <FilterMenu.Root inline open autoHighlight="always">
                    <FilterMenu.Input aria-label="Search commands" />
                    <Dialog.Close>Close palette</Dialog.Close>
                    <ScrollArea.Root>
                      <ScrollArea.Viewport>
                        <ScrollArea.Content>
                          <FilterMenu.List>
                            <FilterMenu.Group>
                              <FilterMenu.GroupLabel>Suggestions</FilterMenu.GroupLabel>
                              <FilterMenu.Item>Linear</FilterMenu.Item>
                              <FilterMenu.Item>Figma</FilterMenu.Item>
                            </FilterMenu.Group>
                          </FilterMenu.List>
                        </ScrollArea.Content>
                      </ScrollArea.Viewport>
                      <ScrollArea.Scrollbar>
                        <ScrollArea.Thumb />
                      </ScrollArea.Scrollbar>
                    </ScrollArea.Root>
                  </FilterMenu.Root>
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
          <FilterMenu.Root inline open autoHighlight>
            <FilterMenu.Input aria-label="Filter actions" />
            <FilterMenu.List>
              <FilterMenu.Item>Rename</FilterMenu.Item>
              <FilterMenu.Item>Delete</FilterMenu.Item>
            </FilterMenu.List>
          </FilterMenu.Root>,
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
          <FilterMenu.Root inline open autoHighlight="always">
            <FilterMenu.Input aria-label="Filter actions" />
            <FilterMenu.List>
              <FilterMenu.Item>Rename</FilterMenu.Item>
              <FilterMenu.Item>Delete</FilterMenu.Item>
            </FilterMenu.List>
          </FilterMenu.Root>,
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
          <FilterMenu.Root inline open autoHighlight>
            <FilterMenu.Input aria-label="Filter actions" />
            <FilterMenu.List>
              <FilterMenu.Item>Rename</FilterMenu.Item>
              <FilterMenu.Item>Delete</FilterMenu.Item>
            </FilterMenu.List>
          </FilterMenu.Root>,
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
          <FilterMenu.Root inline open autoHighlight>
            <FilterMenu.Input aria-label="Filter actions" />
            <FilterMenu.List>
              <FilterMenu.Item>Duplicate</FilterMenu.Item>
              <FilterMenu.Item onClick={onDelete}>Delete</FilterMenu.Item>
            </FilterMenu.List>
          </FilterMenu.Root>,
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
          <FilterMenu.Root inline open autoHighlight="always">
            <FilterMenu.Input aria-label="Filter actions" />
            <FilterMenu.List>
              <FilterMenu.Item>Rename</FilterMenu.Item>
              <FilterMenu.Item>Delete</FilterMenu.Item>
            </FilterMenu.List>
          </FilterMenu.Root>,
        );

        const deleteItem = screen.getByRole('menuitem', { name: 'Delete' });
        await user.hover(deleteItem);

        await waitFor(() => {
          expect(deleteItem).toHaveAttribute('data-highlighted');
        });

        fireEvent.pointerLeave(deleteItem, {
          pointerType: 'mouse',
          relatedTarget: document.body,
        });

        expect(deleteItem).toHaveAttribute('data-highlighted');
      });

      it('supports a controlled query', async () => {
        function App() {
          const [query, setQuery] = React.useState('');

          return (
            <FilterMenu.Root
              inline
              open
              autoHighlight
              inputValue={query}
              onInputValueChange={setQuery}
            >
              <FilterMenu.Input aria-label="Filter actions" />
              <FilterMenu.List>
                <FilterMenu.Item>Rename</FilterMenu.Item>
                <FilterMenu.Item>Delete</FilterMenu.Item>
              </FilterMenu.List>
            </FilterMenu.Root>
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
                  <FilterMenu.SubmenuRoot defaultOpen autoHighlight="always">
                    <FilterMenu.SubmenuTrigger>Move to</FilterMenu.SubmenuTrigger>
                    <FilterMenu.Portal>
                      <FilterMenu.Positioner>
                        <FilterMenu.Popup>
                          <FilterMenu.Input aria-label="Filter destinations" />
                          <FilterMenu.List>
                            <FilterMenu.Item>Documents</FilterMenu.Item>
                            <FilterMenu.Item>Downloads</FilterMenu.Item>
                          </FilterMenu.List>
                        </FilterMenu.Popup>
                      </FilterMenu.Positioner>
                    </FilterMenu.Portal>
                  </FilterMenu.SubmenuRoot>
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
            <FilterMenu.Root>
              <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
              <FilterMenu.Portal>
                <FilterMenu.Positioner>
                  <FilterMenu.Popup data-testid="popup" className="filter-menu-pointer-close-test">
                    <FilterMenu.Input aria-label="Filter actions" />
                    <FilterMenu.List>
                      <FilterMenu.Item>Rename</FilterMenu.Item>
                    </FilterMenu.List>
                  </FilterMenu.Popup>
                </FilterMenu.Positioner>
              </FilterMenu.Portal>
            </FilterMenu.Root>
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
      },
    );

    it('moves focus past the menu when tabbing from the input', async () => {
      const { user } = await render(
        <div>
          <FilterMenu.Root defaultOpen>
            <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
            <FilterMenu.Portal>
              <FilterMenu.Positioner>
                <FilterMenu.Popup>
                  <FilterMenu.Input aria-label="Filter actions" />
                  <FilterMenu.List style={{ height: 1, overflow: 'auto' }}>
                    <FilterMenu.Item style={{ height: 10 }}>Rename</FilterMenu.Item>
                    <FilterMenu.Item style={{ height: 10 }}>Duplicate</FilterMenu.Item>
                  </FilterMenu.List>
                </FilterMenu.Popup>
              </FilterMenu.Positioner>
            </FilterMenu.Portal>
          </FilterMenu.Root>
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
        <FilterMenu.Root open>
          <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter actions" />
                <FilterMenu.List>
                  <FilterMenu.Item keywords={['remove', 'trash']}>Delete</FilterMenu.Item>
                  <FilterMenu.Item>Rename</FilterMenu.Item>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
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
        <FilterMenu.Root open defaultInputValue="ı" locale="tr">
          <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter actions" />
                <FilterMenu.List>
                  <FilterMenu.Item>Istanbul</FilterMenu.Item>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
      );

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'Istanbul' })).toBeVisible();
      });
    });

    it('keeps Home and End as caret keys until an item is highlighted', async () => {
      const { user } = await render(
        <FilterMenu.Root open defaultInputValue="rename">
          <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter actions" />
                <FilterMenu.List>
                  <FilterMenu.Item>Rename</FilterMenu.Item>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
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

    it('uses Home and End for list navigation after an item is highlighted', async () => {
      const { user } = await render(
        <FilterMenu.Root open>
          <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter actions" />
                <FilterMenu.List>
                  <FilterMenu.Item>Rename</FilterMenu.Item>
                  <FilterMenu.Item>Duplicate</FilterMenu.Item>
                  <FilterMenu.Item>Delete</FilterMenu.Item>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
      );

      const input = screen.getByRole('searchbox', { name: 'Filter actions' });
      const items = screen.getAllByRole('menuitem');
      await user.keyboard('[ArrowDown][ArrowDown]');

      await user.keyboard('[Home]');
      expect(input).toHaveAttribute('aria-activedescendant', items[0]?.id);

      await user.keyboard('[End]');
      expect(input).toHaveAttribute('aria-activedescendant', items[2]?.id);
    });

    it('hides a group, label included, when the query filters out all of its items', async () => {
      const { user } = await render(
        <FilterMenu.Root open>
          <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter actions" />
                <FilterMenu.List>
                  <FilterMenu.Group data-testid="file-group">
                    <FilterMenu.GroupLabel>File</FilterMenu.GroupLabel>
                    <FilterMenu.Item>Save</FilterMenu.Item>
                  </FilterMenu.Group>
                  <FilterMenu.Group data-testid="manage-group">
                    <FilterMenu.GroupLabel>Manage</FilterMenu.GroupLabel>
                    <FilterMenu.Item>Rename</FilterMenu.Item>
                  </FilterMenu.Group>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
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
          <FilterMenu.Root defaultOpen>
            <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
            <FilterMenu.Portal>
              <FilterMenu.Positioner>
                <FilterMenu.Popup>
                  <FilterMenu.Input aria-label="Filter actions" />
                  <FilterMenu.List>
                    <FilterMenu.SubmenuRoot>
                      <FilterMenu.SubmenuTrigger>Share</FilterMenu.SubmenuTrigger>
                      <FilterMenu.Portal>
                        <FilterMenu.Positioner>
                          <FilterMenu.Popup>
                            <FilterMenu.Input aria-label="Filter sharing options" />
                            <FilterMenu.List>
                              <FilterMenu.Item>Email</FilterMenu.Item>
                            </FilterMenu.List>
                          </FilterMenu.Popup>
                        </FilterMenu.Positioner>
                      </FilterMenu.Portal>
                    </FilterMenu.SubmenuRoot>
                  </FilterMenu.List>
                </FilterMenu.Popup>
              </FilterMenu.Positioner>
            </FilterMenu.Portal>
          </FilterMenu.Root>
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

    it('closes a pointer-opened filterable submenu and moves focus forward when tabbing', async () => {
      const { user } = await render(
        <div>
          {/* Exit transitions keep the closing popups mounted while focus relocates. */}
          <style>{`
            .filter-popup { transition: opacity 50ms; opacity: 1; }
            .filter-popup[data-ending-style] { opacity: 0; }
          `}</style>
          <input />
          <FilterMenu.Root>
            <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
            <FilterMenu.Portal>
              <FilterMenu.Positioner>
                <FilterMenu.Popup className="filter-popup">
                  <FilterMenu.Input aria-label="Filter actions" />
                  <FilterMenu.List>
                    <FilterMenu.SubmenuRoot>
                      <FilterMenu.SubmenuTrigger delay={0}>Share</FilterMenu.SubmenuTrigger>
                      <FilterMenu.Portal>
                        <FilterMenu.Positioner>
                          <FilterMenu.Popup className="filter-popup">
                            <FilterMenu.Input aria-label="Filter sharing options" />
                            <FilterMenu.List>
                              <FilterMenu.Item>Email</FilterMenu.Item>
                            </FilterMenu.List>
                          </FilterMenu.Popup>
                        </FilterMenu.Positioner>
                      </FilterMenu.Portal>
                    </FilterMenu.SubmenuRoot>
                  </FilterMenu.List>
                </FilterMenu.Popup>
              </FilterMenu.Positioner>
            </FilterMenu.Portal>
          </FilterMenu.Root>
          <input data-testid="after" />
        </div>,
      );

      await user.click(screen.getByRole('button', { name: 'Actions' }));

      const submenuTrigger = await screen.findByRole('menuitem', { name: 'Share' });
      await user.click(submenuTrigger);

      const submenuInput = await screen.findByRole('searchbox', { name: 'Filter sharing options' });
      await act(async () => {
        submenuInput.focus();
      });
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
                <FilterMenu.SubmenuRoot>
                  <FilterMenu.SubmenuTrigger delay={0}>Move to folder</FilterMenu.SubmenuTrigger>
                  <SubmenuPortal>
                    <FilterMenu.Positioner>
                      <FilterMenu.Popup>
                        <FilterMenu.Input aria-label="Filter folders" />
                        <FilterMenu.List>
                          <FilterMenu.Item>Documents</FilterMenu.Item>
                          <FilterMenu.Item>Downloads</FilterMenu.Item>
                        </FilterMenu.List>
                      </FilterMenu.Popup>
                    </FilterMenu.Positioner>
                  </SubmenuPortal>
                </FilterMenu.SubmenuRoot>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      );
    }

    function ParentNavigationMenu(props: { loopFocus: boolean; triggerLast?: boolean }) {
      const submenu = (
        <FilterMenu.SubmenuRoot>
          <FilterMenu.SubmenuTrigger>Move to folder</FilterMenu.SubmenuTrigger>
        </FilterMenu.SubmenuRoot>
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

    it('skips disabled parent items during main-axis navigation', async () => {
      const { user } = await render(<ParentNavigationMenu loopFocus />);
      const submenuTrigger = screen.getByRole('menuitem', { name: 'Move to folder' });

      await act(async () => {
        submenuTrigger.focus();
      });
      await user.keyboard('[ArrowDown]');

      expect(screen.getByRole('menuitem', { name: 'Next' })).toHaveFocus();
    });

    it('wraps parent navigation when loopFocus is enabled', async () => {
      const { user } = await render(<ParentNavigationMenu loopFocus triggerLast />);
      const submenuTrigger = screen.getByRole('menuitem', { name: 'Move to folder' });

      await act(async () => {
        submenuTrigger.focus();
      });
      await user.keyboard('[ArrowDown]');

      expect(screen.getByRole('menuitem', { name: 'Next' })).toHaveFocus();
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

    it('uses the root list as the virtual focus owner when only the submenu has an input', async () => {
      const { user } = await render(
        <FilterMenu.Root defaultOpen>
          <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.List data-testid="root-list">
                  <FilterMenu.Item>Rename</FilterMenu.Item>
                  <FilterMenu.SubmenuRoot>
                    <FilterMenu.SubmenuTrigger>Share</FilterMenu.SubmenuTrigger>
                    <FilterMenu.Portal>
                      <FilterMenu.Positioner>
                        <FilterMenu.Popup>
                          <FilterMenu.Input aria-label="Filter sharing options" />
                          <FilterMenu.List data-testid="submenu-list">
                            <FilterMenu.Item>Email</FilterMenu.Item>
                            <FilterMenu.Item>Messages</FilterMenu.Item>
                          </FilterMenu.List>
                        </FilterMenu.Popup>
                      </FilterMenu.Positioner>
                    </FilterMenu.Portal>
                  </FilterMenu.SubmenuRoot>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
      );

      const rootList = screen.getByTestId('root-list');
      await waitFor(() => {
        expect(rootList).toHaveFocus();
      });
      expect(rootList).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('menuitem', { name: 'Rename' }).id,
      );

      await user.keyboard('[ArrowDown][ArrowRight]');

      const input = await screen.findByRole('searchbox', { name: 'Filter sharing options' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });

      await user.keyboard('[ArrowDown]');
      expect(input).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('menuitem', { name: 'Email' }).id,
      );
    });

    it('uses the submenu list as the virtual focus owner when only the root has an input', async () => {
      const { user } = await render(
        <FilterMenu.Root defaultOpen>
          <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter actions" />
                <FilterMenu.List data-testid="root-list">
                  <FilterMenu.SubmenuRoot>
                    <FilterMenu.SubmenuTrigger>Share</FilterMenu.SubmenuTrigger>
                    <FilterMenu.Portal>
                      <FilterMenu.Positioner>
                        <FilterMenu.Popup>
                          <FilterMenu.List data-testid="submenu-list">
                            <FilterMenu.Item>Email</FilterMenu.Item>
                            <FilterMenu.Item>Messages</FilterMenu.Item>
                          </FilterMenu.List>
                        </FilterMenu.Popup>
                      </FilterMenu.Positioner>
                    </FilterMenu.Portal>
                  </FilterMenu.SubmenuRoot>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
      );

      const input = screen.getByRole('searchbox', { name: 'Filter actions' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });

      await user.keyboard('[ArrowDown][ArrowRight]');

      const submenuList = await screen.findByTestId('submenu-list');
      await waitFor(() => {
        expect(submenuList).toHaveFocus();
      });
      expect(submenuList).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('menuitem', { name: 'Email' }).id,
      );

      await user.keyboard('[ArrowDown]');
      expect(submenuList).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('menuitem', { name: 'Messages' }).id,
      );
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
            <FilterMenu.Root open={open} onInputValueChange={onInputValueChange}>
              <FilterMenu.Trigger>Fruit</FilterMenu.Trigger>
              <FilterMenu.Portal>
                <FilterMenu.Positioner>
                  <FilterMenu.Popup>
                    <FilterMenu.Input aria-label="Filter fruit" />
                    <FilterMenu.List>
                      <FilterMenu.Item>Apple</FilterMenu.Item>
                    </FilterMenu.List>
                  </FilterMenu.Popup>
                </FilterMenu.Positioner>
              </FilterMenu.Portal>
            </FilterMenu.Root>
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
                      <FilterMenu.SubmenuRoot open={open} onOpenChange={setOpen}>
                        <FilterMenu.SubmenuTrigger>Fruit</FilterMenu.SubmenuTrigger>
                        <FilterMenu.Portal>
                          <FilterMenu.Positioner>
                            <FilterMenu.Popup
                              data-testid="popup"
                              className="filter-menu-close-test"
                            >
                              <FilterMenu.Input aria-label="Filter fruit" />
                              <FilterMenu.List>
                                {items.map((item) => (
                                  <FilterMenu.Item key={item}>{item}</FilterMenu.Item>
                                ))}
                              </FilterMenu.List>
                            </FilterMenu.Popup>
                          </FilterMenu.Positioner>
                        </FilterMenu.Portal>
                      </FilterMenu.SubmenuRoot>
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
        <FilterMenu.Root
          open
          defaultInputValue="app"
          onInputValueChange={(_, eventDetails) => eventDetails.cancel()}
        >
          <FilterMenu.Trigger>Fruit</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter fruit" />
                <FilterMenu.Clear aria-label="Clear filter" />
                <FilterMenu.List>
                  <FilterMenu.Item>Apple</FilterMenu.Item>
                  <FilterMenu.Item>Banana</FilterMenu.Item>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
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
          <FilterMenu.Root open inputValue={props.inputValue} onInputValueChange={() => {}}>
            <FilterMenu.Trigger>Fruit</FilterMenu.Trigger>
            <FilterMenu.Portal>
              <FilterMenu.Positioner>
                <FilterMenu.Popup>
                  <FilterMenu.Input aria-label="Filter fruit" />
                  <FilterMenu.List>
                    <FilterMenu.Item onClick={onAppleClick}>Apple</FilterMenu.Item>
                    <FilterMenu.Item>Banana</FilterMenu.Item>
                  </FilterMenu.List>
                </FilterMenu.Popup>
              </FilterMenu.Positioner>
            </FilterMenu.Portal>
          </FilterMenu.Root>
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
        const handle = useRefWithInit(() => new FilterMenu.Handle()).current;

        return (
          <React.Fragment>
            <FilterMenu.Root handle={handle}>
              <FilterMenu.Portal>
                <FilterMenu.Positioner>
                  <FilterMenu.Popup>
                    <FilterMenu.Input aria-label="Filter fruit" />
                    <FilterMenu.List data-testid="list">
                      <FilterMenu.Item>Apple</FilterMenu.Item>
                    </FilterMenu.List>
                    <FilterMenu.Empty>No fruit found</FilterMenu.Empty>
                  </FilterMenu.Popup>
                </FilterMenu.Positioner>
              </FilterMenu.Portal>
            </FilterMenu.Root>
            <FilterMenu.Trigger id="fruit-trigger" handle={handle}>
              Fruit
            </FilterMenu.Trigger>
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
      expect(screen.getByRole('status')).toHaveTextContent('');

      await user.type(input, 'zz');

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('No fruit found');
      });
    });

    it('uses the id from a custom trigger render element for popup labelling', async () => {
      const { user } = await render(
        <FilterMenu.Root>
          <FilterMenu.Trigger render={<button id="custom-trigger" />}>Fruit</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter fruit" />
                <FilterMenu.List>
                  <FilterMenu.Item>Apple</FilterMenu.Item>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
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
        <FilterMenu.Root>
          <FilterMenu.Trigger>Fruit</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup aria-label="Available commands">
                <FilterMenu.Input aria-label="Filter fruit" />
                <FilterMenu.List>
                  <FilterMenu.Item>Apple</FilterMenu.Item>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
      );

      await user.click(screen.getByRole('button', { name: 'Fruit' }));

      const popup = await screen.findByRole('dialog', { name: 'Available commands' });
      expect(popup).not.toHaveAttribute('aria-labelledby');
    });

    it('uses an explicit label from the popup render element', async () => {
      const { user } = await render(
        <FilterMenu.Root>
          <FilterMenu.Trigger>Fruit</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup render={<section aria-label="Available commands" />}>
                <FilterMenu.Input aria-label="Filter fruit" />
                <FilterMenu.List>
                  <FilterMenu.Item>Apple</FilterMenu.Item>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
      );

      await user.click(screen.getByRole('button', { name: 'Fruit' }));

      const popup = await screen.findByRole('dialog', { name: 'Available commands' });
      expect(popup).not.toHaveAttribute('aria-labelledby');
    });

    it('releases a popup id override when the prop is removed', async () => {
      function Test() {
        const [customId, setCustomId] = React.useState(true);
        return (
          <FilterMenu.Root defaultOpen>
            <FilterMenu.Trigger>Fruit</FilterMenu.Trigger>
            <FilterMenu.Portal>
              <FilterMenu.Positioner>
                <FilterMenu.Popup id={customId ? 'custom-popup' : undefined}>
                  <FilterMenu.Input aria-label="Filter fruit" />
                  <FilterMenu.List>
                    <FilterMenu.Item>Apple</FilterMenu.Item>
                  </FilterMenu.List>
                  <button type="button" onClick={() => setCustomId(false)}>
                    Remove id
                  </button>
                </FilterMenu.Popup>
              </FilterMenu.Positioner>
            </FilterMenu.Portal>
          </FilterMenu.Root>
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

    it.each([
      ['portalled', true],
      ['inline', false],
    ] as const)(
      'allows its input to be focused with a pointer when %s',
      async (_name, portalled) => {
        const { user } = await render(<FilterableSubmenu portalled={portalled} />);

        await user.hover(screen.getByRole('menuitem', { name: 'Move to folder' }));

        const input = await screen.findByRole('searchbox', { name: 'Filter folders' });
        await userEvent.click(input);

        expect(input).toHaveFocus();
      },
    );

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
        expect(input).toHaveAttribute('data-focus-visible');

        const item = screen.getByText('Documents');
        await user.hover(item);
        expect(input).toHaveAttribute('aria-activedescendant', item.id);
        expect(input).toHaveAttribute('data-focus-visible');

        await user.hover(input);
        expect(input).not.toHaveAttribute('aria-activedescendant');
        expect(input).toHaveAttribute('data-focus-visible');

        await user.keyboard('[ArrowDown]');
        expect(input).not.toHaveAttribute('data-focus-visible');

        await user.keyboard('[ArrowUp]');
        expect(input).not.toHaveAttribute('aria-activedescendant');
        expect(input).toHaveAttribute('data-focus-visible');
      },
    );

    it('opens a virtually focused submenu with the keyboard', async () => {
      const { user } = await render(
        <FilterMenu.Root defaultOpen>
          <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter actions" />
                <FilterMenu.List>
                  <FilterMenu.SubmenuRoot>
                    <FilterMenu.SubmenuTrigger>Move to folder</FilterMenu.SubmenuTrigger>
                    <FilterMenu.Portal>
                      <FilterMenu.Positioner>
                        <FilterMenu.Popup>
                          <FilterMenu.Input aria-label="Filter folders" />
                          <FilterMenu.List>
                            <FilterMenu.Item>Documents</FilterMenu.Item>
                          </FilterMenu.List>
                        </FilterMenu.Popup>
                      </FilterMenu.Positioner>
                    </FilterMenu.Portal>
                  </FilterMenu.SubmenuRoot>
                  <FilterMenu.Item>Delete</FilterMenu.Item>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
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
      await waitFor(() => {
        expect(submenuInput).toHaveFocus();
      });
      expect(submenuInput).toHaveAttribute('data-focus-visible');
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

    it('uses RTL cross-axis keys to enter and leave a filterable submenu', async () => {
      const { user } = await render(
        <DirectionProvider direction="rtl">
          <FilterMenu.Root defaultOpen>
            <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
            <FilterMenu.Portal>
              <FilterMenu.Positioner>
                <FilterMenu.Popup>
                  <FilterMenu.Input aria-label="Filter actions" />
                  <FilterMenu.List>
                    <FilterMenu.SubmenuRoot>
                      <FilterMenu.SubmenuTrigger>Move to folder</FilterMenu.SubmenuTrigger>
                      <FilterMenu.Portal>
                        <FilterMenu.Positioner>
                          <FilterMenu.Popup>
                            <FilterMenu.Input aria-label="Filter folders" />
                            <FilterMenu.List>
                              <FilterMenu.Item>Documents</FilterMenu.Item>
                            </FilterMenu.List>
                          </FilterMenu.Popup>
                        </FilterMenu.Positioner>
                      </FilterMenu.Portal>
                    </FilterMenu.SubmenuRoot>
                  </FilterMenu.List>
                </FilterMenu.Popup>
              </FilterMenu.Positioner>
            </FilterMenu.Portal>
          </FilterMenu.Root>
        </DirectionProvider>,
      );

      const parentInput = screen.getByRole('searchbox', { name: 'Filter actions' });
      await waitFor(() => {
        expect(parentInput).toHaveFocus();
      });

      await user.keyboard('[ArrowDown][ArrowLeft]');

      const submenuInput = await screen.findByRole('searchbox', { name: 'Filter folders' });
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
        <FilterMenu.Root defaultOpen>
          <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter actions" />
                <FilterMenu.List>
                  <FilterMenu.SubmenuRoot>
                    <FilterMenu.SubmenuTrigger>Move to folder</FilterMenu.SubmenuTrigger>
                    <FilterMenu.Portal>
                      <FilterMenu.Positioner>
                        <FilterMenu.Popup>
                          <FilterMenu.Input aria-label="Filter folders" />
                          <FilterMenu.List>
                            <FilterMenu.Item>Documents</FilterMenu.Item>
                          </FilterMenu.List>
                        </FilterMenu.Popup>
                      </FilterMenu.Positioner>
                    </FilterMenu.Portal>
                  </FilterMenu.SubmenuRoot>
                  <FilterMenu.Item>Rename</FilterMenu.Item>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
      );

      const parentInput = screen.getByRole('searchbox', { name: 'Filter actions' });
      await waitFor(() => {
        expect(parentInput).toHaveFocus();
      });

      await user.keyboard('[ArrowDown][ArrowRight]');

      const submenuInput = await screen.findByRole('searchbox', { name: 'Filter folders' });
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
            <FilterMenu.Root defaultOpen>
              <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
              <FilterMenu.Portal>
                <FilterMenu.Positioner>
                  <FilterMenu.Popup>
                    <FilterMenu.Input aria-label="Filter actions" />
                    <FilterMenu.List>
                      <FilterMenu.SubmenuRoot open={submenuOpen} onOpenChange={setSubmenuOpen}>
                        <FilterMenu.SubmenuTrigger>Move to folder</FilterMenu.SubmenuTrigger>
                        <FilterMenu.Portal>
                          <FilterMenu.Positioner>
                            <FilterMenu.Popup>
                              <FilterMenu.Input aria-label="Filter folders" />
                              <FilterMenu.List>
                                <FilterMenu.Item>Documents</FilterMenu.Item>
                              </FilterMenu.List>
                            </FilterMenu.Popup>
                          </FilterMenu.Positioner>
                        </FilterMenu.Portal>
                      </FilterMenu.SubmenuRoot>
                    </FilterMenu.List>
                  </FilterMenu.Popup>
                </FilterMenu.Positioner>
              </FilterMenu.Portal>
            </FilterMenu.Root>
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
        <FilterMenu.Root defaultOpen>
          <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter actions" />
                <FilterMenu.List>
                  <FilterMenu.SubmenuRoot>
                    <FilterMenu.SubmenuTrigger>Move to folder</FilterMenu.SubmenuTrigger>
                    <FilterMenu.Portal>
                      <FilterMenu.Positioner>
                        <FilterMenu.Popup>
                          <FilterMenu.Input aria-label="Filter folders" />
                          <FilterMenu.List>
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
                          </FilterMenu.List>
                        </FilterMenu.Popup>
                      </FilterMenu.Positioner>
                    </FilterMenu.Portal>
                  </FilterMenu.SubmenuRoot>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
      );

      const parentInput = screen.getByRole('searchbox', { name: 'Filter actions' });
      await waitFor(() => {
        expect(parentInput).toHaveFocus();
      });

      await user.keyboard('[ArrowDown][ArrowRight]');

      const submenuTrigger = screen.getByRole('menuitem', { name: 'Move to folder' });
      const submenuInput = await screen.findByRole('searchbox', { name: 'Filter folders' });
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
        <FilterMenu.Root defaultOpen>
          <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter actions" />
                <FilterMenu.List>
                  <FilterMenu.SubmenuRoot>
                    <FilterMenu.SubmenuTrigger>Share</FilterMenu.SubmenuTrigger>
                    <FilterMenu.Portal>
                      <FilterMenu.Positioner>
                        <FilterMenu.Popup>
                          <FilterMenu.Input aria-label="Filter sharing options" />
                          <FilterMenu.List>
                            <FilterMenu.Item>Email</FilterMenu.Item>
                          </FilterMenu.List>
                        </FilterMenu.Popup>
                      </FilterMenu.Positioner>
                    </FilterMenu.Portal>
                  </FilterMenu.SubmenuRoot>
                  <FilterMenu.Item>Delete</FilterMenu.Item>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
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
        <FilterMenu.Root defaultOpen>
          <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter actions" />
                <FilterMenu.List>
                  <FilterMenu.Item>Rename</FilterMenu.Item>
                  <FilterMenu.SubmenuRoot>
                    <FilterMenu.SubmenuTrigger>Share</FilterMenu.SubmenuTrigger>
                    <FilterMenu.Portal>
                      <FilterMenu.Positioner>
                        <FilterMenu.Popup>
                          <FilterMenu.Input aria-label="Filter sharing options" />
                          <FilterMenu.List>
                            <FilterMenu.Item>Email</FilterMenu.Item>
                          </FilterMenu.List>
                        </FilterMenu.Popup>
                      </FilterMenu.Positioner>
                    </FilterMenu.Portal>
                  </FilterMenu.SubmenuRoot>
                  <FilterMenu.SubmenuRoot>
                    <FilterMenu.SubmenuTrigger>Export</FilterMenu.SubmenuTrigger>
                    <FilterMenu.Portal>
                      <FilterMenu.Positioner>
                        <FilterMenu.Popup>
                          <FilterMenu.Input aria-label="Filter export options" />
                          <FilterMenu.List>
                            <FilterMenu.Item>PDF</FilterMenu.Item>
                          </FilterMenu.List>
                        </FilterMenu.Popup>
                      </FilterMenu.Positioner>
                    </FilterMenu.Portal>
                  </FilterMenu.SubmenuRoot>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
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
      'focuses the input when entering a hover-opened filterable submenu with the keyboard',
      async () => {
        const { user } = await render(
          <FilterMenu.Root defaultOpen>
            <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
            <FilterMenu.Portal>
              <FilterMenu.Positioner>
                <FilterMenu.Popup>
                  <FilterMenu.Input aria-label="Filter actions" />
                  <FilterMenu.List>
                    <FilterMenu.SubmenuRoot>
                      <FilterMenu.SubmenuTrigger delay={0}>
                        Move to folder
                      </FilterMenu.SubmenuTrigger>
                      <FilterMenu.Portal>
                        <FilterMenu.Positioner>
                          <FilterMenu.Popup>
                            <FilterMenu.Input aria-label="Filter folders" />
                            <FilterMenu.List>
                              <FilterMenu.Item>Documents</FilterMenu.Item>
                            </FilterMenu.List>
                          </FilterMenu.Popup>
                        </FilterMenu.Positioner>
                      </FilterMenu.Portal>
                    </FilterMenu.SubmenuRoot>
                  </FilterMenu.List>
                </FilterMenu.Popup>
              </FilterMenu.Positioner>
            </FilterMenu.Portal>
          </FilterMenu.Root>,
        );

        const parentInput = screen.getByRole('searchbox', { name: 'Filter actions' });
        await waitFor(() => {
          expect(parentInput).toHaveFocus();
        });
        await user.keyboard('[ArrowDown]');
        const submenuTrigger = screen.getByRole('menuitem', { name: 'Move to folder' });
        await user.hover(submenuTrigger);

        const submenuInput = await screen.findByRole('searchbox', { name: 'Filter folders' });
        expect(parentInput).toHaveFocus();

        await user.keyboard('[ArrowRight]');

        expect(submenuInput).toHaveFocus();
        expect(submenuInput).toHaveAttribute('data-focus-visible');
        expect(submenuInput).not.toHaveAttribute('aria-activedescendant');
        expect(parentInput).not.toHaveAttribute('aria-activedescendant');
      },
    );

    it('closes a hover-opened submenu from a virtually focused parent', async () => {
      const { user } = await render(
        <FilterMenu.Root defaultOpen>
          <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter actions" />
                <FilterMenu.List>
                  <FilterMenu.SubmenuRoot>
                    <FilterMenu.SubmenuTrigger delay={0}>Move to folder</FilterMenu.SubmenuTrigger>
                    <FilterMenu.Portal>
                      <FilterMenu.Positioner>
                        <FilterMenu.Popup>
                          <FilterMenu.Input aria-label="Filter folders" />
                          <FilterMenu.List>
                            <FilterMenu.Item>Documents</FilterMenu.Item>
                          </FilterMenu.List>
                        </FilterMenu.Popup>
                      </FilterMenu.Positioner>
                    </FilterMenu.Portal>
                  </FilterMenu.SubmenuRoot>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
      );

      const parentInput = screen.getByRole('searchbox', { name: 'Filter actions' });
      await waitFor(() => {
        expect(parentInput).toHaveFocus();
      });
      await user.keyboard('[ArrowDown]');
      const submenuTrigger = screen.getByRole('menuitem', { name: 'Move to folder' });
      await user.hover(submenuTrigger);

      await screen.findByRole('searchbox', { name: 'Filter folders' });
      expect(parentInput).toHaveFocus();
      expect(parentInput).toHaveAttribute('aria-activedescendant', submenuTrigger.id);

      await user.keyboard('[ArrowLeft]');

      await waitFor(() => {
        expect(screen.queryByRole('searchbox', { name: 'Filter folders' })).toBe(null);
      });
      expect(parentInput).toHaveFocus();
      expect(parentInput).toHaveAttribute('aria-activedescendant', submenuTrigger.id);
    });

    it('focuses the first item when entering a hover-opened submenu from a filterable menu', async () => {
      const { user } = await render(
        <FilterMenu.Root defaultOpen>
          <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter actions" />
                <FilterMenu.List>
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
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
      );

      const parentInput = screen.getByRole('searchbox', { name: 'Filter actions' });
      await waitFor(() => {
        expect(parentInput).toHaveFocus();
      });
      await user.keyboard('[ArrowDown]');
      const submenuTrigger = screen.getByRole('menuitem', { name: 'Move to folder' });
      await user.hover(submenuTrigger);

      const firstItem = await screen.findByRole('menuitem', { name: 'Documents' });
      expect(parentInput).toHaveFocus();

      await user.keyboard('[ArrowRight]');

      await waitFor(() => {
        expect(firstItem).toHaveFocus();
      });
    });

    it('filters items and selects the active item while focus remains on the input', async () => {
      const onClick = vi.fn();
      const { user } = await render(
        <FilterMenu.Root>
          <FilterMenu.Trigger>Fruit</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter fruit" />
                <FilterMenu.List data-testid="list">
                  <FilterMenu.Item>Apple</FilterMenu.Item>
                  <FilterMenu.Item onClick={onClick} closeOnClick={false}>
                    Banana
                  </FilterMenu.Item>
                </FilterMenu.List>
                <FilterMenu.Empty>No fruit found</FilterMenu.Empty>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
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
        <FilterMenu.Root defaultOpen>
          <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter actions" />
                <FilterMenu.List>
                  <FilterMenu.Item onClick={onClick}>Rename</FilterMenu.Item>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
      );

      const input = screen.getByRole('searchbox', { name: 'Filter actions' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      await user.keyboard('[ArrowDown]');

      fireEvent.keyDown(input, { key: 'Enter', keyCode: 229, which: 229 });

      expect(onClick).not.toHaveBeenCalled();
    });

    it('disables filter controls when the root is disabled', async () => {
      await render(
        <FilterMenu.Root open disabled defaultInputValue="a">
          <FilterMenu.Trigger>Fruit</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter fruit" />
                <FilterMenu.Clear aria-label="Clear filter" />
                <FilterMenu.List>
                  <FilterMenu.Item>Apple</FilterMenu.Item>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
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
            <FilterMenu.Root filter={filter} open defaultInputValue="a">
              <FilterMenu.Trigger>Fruit</FilterMenu.Trigger>
              <FilterMenu.Portal>
                <FilterMenu.Positioner>
                  <FilterMenu.Popup>
                    <FilterMenu.Input aria-label="Filter fruit" />
                    <FilterMenu.List>
                      <FilterMenu.Item>Apple</FilterMenu.Item>
                      <FilterMenu.Item>Banana</FilterMenu.Item>
                    </FilterMenu.List>
                  </FilterMenu.Popup>
                </FilterMenu.Positioner>
              </FilterMenu.Portal>
            </FilterMenu.Root>
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

    it('does not fall back to keyword matching when a custom filter rejects an item', async () => {
      await render(
        <FilterMenu.Root
          open
          defaultInputValue="directory"
          filter={(itemText, query) => itemText.startsWith(query)}
        >
          <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter actions" />
                <FilterMenu.List>
                  <FilterMenu.Item keywords={['directory']}>Move to folder</FilterMenu.Item>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
      );

      await waitFor(() => {
        expect(screen.queryByRole('menuitem', { name: 'Move to folder' })).toBe(null);
      });
    });

    it('filters a non-filterable submenu trigger from a filterable parent', async () => {
      const { user } = await render(
        <FilterMenu.Root defaultOpen>
          <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter actions" />
                <FilterMenu.List>
                  <FilterMenu.Item>Rename</FilterMenu.Item>
                  <FilterMenu.SubmenuRoot>
                    <FilterMenu.SubmenuTrigger>Move to folder</FilterMenu.SubmenuTrigger>
                    <FilterMenu.Portal>
                      <FilterMenu.Positioner>
                        <FilterMenu.Popup>
                          <FilterMenu.Item>Documents</FilterMenu.Item>
                        </FilterMenu.Popup>
                      </FilterMenu.Positioner>
                    </FilterMenu.Portal>
                  </FilterMenu.SubmenuRoot>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
      );

      const input = screen.getByRole('searchbox', { name: 'Filter actions' });
      await user.type(input, 'rename');
      await user.keyboard('[ArrowDown]');

      expect(screen.getByRole('menuitem', { name: 'Rename' })).toBeVisible();
      expect(screen.queryByRole('menuitem', { name: 'Move to folder' })).toBe(null);
    });

    it('keeps a submenu trigger visible when the query matches its label', async () => {
      const { user } = await render(
        <FilterMenu.Root defaultOpen>
          <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter actions" />
                <FilterMenu.List>
                  <FilterMenu.Item>Rename</FilterMenu.Item>
                  <FilterMenu.SubmenuRoot>
                    <FilterMenu.SubmenuTrigger>Move to folder</FilterMenu.SubmenuTrigger>
                    <FilterMenu.Portal>
                      <FilterMenu.Positioner>
                        <FilterMenu.Popup>
                          <FilterMenu.Item>Documents</FilterMenu.Item>
                        </FilterMenu.Popup>
                      </FilterMenu.Positioner>
                    </FilterMenu.Portal>
                  </FilterMenu.SubmenuRoot>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
      );

      const input = screen.getByRole('searchbox', { name: 'Filter actions' });
      await user.type(input, 'move');

      expect(screen.queryByRole('menuitem', { name: 'Rename' })).toBe(null);
      expect(screen.getByRole('menuitem', { name: 'Move to folder' })).toBeVisible();
    });

    it('keeps a submenu trigger visible when the query matches its keywords', async () => {
      const { user } = await render(
        <FilterMenu.Root defaultOpen>
          <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter actions" />
                <FilterMenu.List>
                  <FilterMenu.Item>Rename</FilterMenu.Item>
                  <FilterMenu.SubmenuRoot>
                    <FilterMenu.SubmenuTrigger keywords={['directory']}>
                      Move to folder
                    </FilterMenu.SubmenuTrigger>
                    <FilterMenu.Portal>
                      <FilterMenu.Positioner>
                        <FilterMenu.Popup>
                          <FilterMenu.Item>Documents</FilterMenu.Item>
                        </FilterMenu.Popup>
                      </FilterMenu.Positioner>
                    </FilterMenu.Portal>
                  </FilterMenu.SubmenuRoot>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
      );

      const input = screen.getByRole('searchbox', { name: 'Filter actions' });
      await user.type(input, 'directory');

      expect(screen.queryByRole('menuitem', { name: 'Rename' })).toBe(null);
      expect(screen.getByRole('menuitem', { name: 'Move to folder' })).toBeVisible();
    });

    it('filters a FilterMenu.SubmenuTrigger used inside a plain submenu root', async () => {
      const { user } = await render(
        <FilterMenu.Root defaultOpen>
          <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter actions" />
                <FilterMenu.List>
                  <FilterMenu.Item>Rename</FilterMenu.Item>
                  <Menu.SubmenuRoot>
                    <FilterMenu.SubmenuTrigger>Move to folder</FilterMenu.SubmenuTrigger>
                    <Menu.Portal>
                      <Menu.Positioner>
                        <Menu.Popup>
                          <Menu.Item>Documents</Menu.Item>
                        </Menu.Popup>
                      </Menu.Positioner>
                    </Menu.Portal>
                  </Menu.SubmenuRoot>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
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
        <FilterMenu.Root defaultOpen>
          <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter actions" />
                <FilterMenu.List>
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
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
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

      // Items inside the nested plain submenu keep the roving tab index.
      await user.hover(submenuTrigger);
      const nestedItem = await screen.findByRole('menuitem', { name: 'Archive' });
      expect(nestedItem).toHaveAttribute('tabindex', '-1');
    });

    it('retains the parent highlight when a submenu opens from a pointer', async () => {
      const { user } = await render(
        <FilterMenu.Root defaultOpen>
          <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter actions" />
                <FilterMenu.List>
                  <FilterMenu.SubmenuRoot>
                    <FilterMenu.SubmenuTrigger delay={0}>Move to folder</FilterMenu.SubmenuTrigger>
                    <FilterMenu.Portal>
                      <FilterMenu.Positioner>
                        <FilterMenu.Popup>
                          <FilterMenu.Input aria-label="Filter folders" />
                          <FilterMenu.List>
                            <FilterMenu.Item>Documents</FilterMenu.Item>
                          </FilterMenu.List>
                        </FilterMenu.Popup>
                      </FilterMenu.Positioner>
                    </FilterMenu.Portal>
                  </FilterMenu.SubmenuRoot>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
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
        <FilterMenu.Root defaultOpen>
          <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter actions" />
                <FilterMenu.List>
                  <FilterMenu.Item>Rename</FilterMenu.Item>
                  <FilterMenu.SubmenuRoot>
                    <FilterMenu.SubmenuTrigger delay={0}>Move to folder</FilterMenu.SubmenuTrigger>
                    <FilterMenu.Portal>
                      <FilterMenu.Positioner>
                        <FilterMenu.Popup>
                          <FilterMenu.Input aria-label="Filter folders" />
                          <FilterMenu.List>
                            <FilterMenu.Item>Documents</FilterMenu.Item>
                          </FilterMenu.List>
                        </FilterMenu.Popup>
                      </FilterMenu.Positioner>
                    </FilterMenu.Portal>
                  </FilterMenu.SubmenuRoot>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
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
        <FilterMenu.Root defaultOpen>
          <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter actions" />
                <FilterMenu.List>
                  <FilterMenu.Item>Rename</FilterMenu.Item>
                  <FilterMenu.Group>
                    <FilterMenu.SubmenuRoot
                      open
                      onOpenChange={(open, details) => {
                        if (!open) {
                          details.cancel();
                        }
                      }}
                    >
                      <FilterMenu.SubmenuTrigger delay={0}>
                        Move to folder
                      </FilterMenu.SubmenuTrigger>
                      <FilterMenu.Portal>
                        <FilterMenu.Positioner>
                          <FilterMenu.Popup>
                            <FilterMenu.Input aria-label="Filter folders" />
                            <FilterMenu.List>
                              <FilterMenu.Item>Documents</FilterMenu.Item>
                            </FilterMenu.List>
                          </FilterMenu.Popup>
                        </FilterMenu.Positioner>
                      </FilterMenu.Portal>
                    </FilterMenu.SubmenuRoot>
                  </FilterMenu.Group>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
      );

      const parentInput = screen.getByRole('searchbox', { name: 'Filter actions' });
      await screen.findByRole('searchbox', { name: 'Filter folders' });

      await user.type(parentInput, 'rename');

      expect(screen.getByRole('menuitem', { name: 'Move to folder' })).toBeVisible();
      expect(screen.getByRole('searchbox', { name: 'Filter folders' })).toBeVisible();
    });

    it('filters each menu item variant without changing its role', async () => {
      const { user } = await render(
        <FilterMenu.Root open defaultInputValue="banana">
          <FilterMenu.Trigger>Fruit</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter fruit" />
                <FilterMenu.List>
                  <FilterMenu.Item>Apple</FilterMenu.Item>
                  <FilterMenu.CheckboxItem>Banana</FilterMenu.CheckboxItem>
                  <FilterMenu.RadioGroup>
                    <FilterMenu.RadioItem value="cherry">Cherry</FilterMenu.RadioItem>
                  </FilterMenu.RadioGroup>
                  <FilterMenu.LinkItem href="#date">Date</FilterMenu.LinkItem>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
      );

      const input = screen.getByRole('searchbox', { name: 'Filter fruit' });
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
  });

  describe('keyboard navigation', () => {
    function KeyboardNavigationMenu() {
      return (
        <FilterMenu.Root>
          <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter actions" />
                <FilterMenu.List>
                  <FilterMenu.Item>Rename</FilterMenu.Item>
                  <FilterMenu.Item>Duplicate</FilterMenu.Item>
                  <FilterMenu.Item>Delete</FilterMenu.Item>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>
      );
    }

    async function openWithKeyboard(user: ReturnType<typeof userEvent.setup>) {
      const trigger = screen.getByRole('button', { name: 'Actions' });
      await act(async () => {
        trigger.focus();
      });
      await user.keyboard('[Enter]');
      return screen.findByRole('searchbox', { name: 'Filter actions' });
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

  it('keeps component-rendered item text after the item is filtered out', async () => {
    function Label(props: { text: string }) {
      return <span>{props.text}</span>;
    }

    function App() {
      const [query, setQuery] = React.useState('');

      return (
        <FilterMenu.Root
          defaultOpen
          inputValue={query}
          onInputValueChange={(nextQuery) => setQuery(nextQuery)}
        >
          <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter actions" />
                <FilterMenu.List>
                  <FilterMenu.Item>
                    <Label text="Rename" />
                  </FilterMenu.Item>
                  <FilterMenu.Item>Delete</FilterMenu.Item>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>
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

  it('allows pointer interaction with list content while preserving background focus', async () => {
    await render(
      <FilterMenu.Root defaultOpen>
        <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
        <FilterMenu.Portal>
          <FilterMenu.Positioner>
            <FilterMenu.Popup>
              <FilterMenu.Input aria-label="Filter actions" />
              <FilterMenu.List>
                <FilterMenu.Item>Rename</FilterMenu.Item>
              </FilterMenu.List>
            </FilterMenu.Popup>
          </FilterMenu.Positioner>
        </FilterMenu.Portal>
      </FilterMenu.Root>,
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

    expect(itemMouseDown.defaultPrevented).toBe(false);
    expect(backgroundMouseDown.defaultPrevented).toBe(true);
    expect(scrollbarMouseDown.defaultPrevented).toBe(false);
  });

  it('returns focus to the input with the RTL submenu close key', async () => {
    await render(
      <DirectionProvider direction="rtl">
        <FilterMenu.Root defaultOpen>
          <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter actions" />
                <button type="button">Auxiliary action</button>
                <FilterMenu.List>
                  <FilterMenu.Item>Rename</FilterMenu.Item>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>
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
      <FilterMenu.Root defaultOpen>
        <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
        <FilterMenu.Portal>
          <FilterMenu.Positioner>
            <FilterMenu.Popup>
              <FilterMenu.Input aria-label="Filter actions" />
              <FilterMenu.Clear aria-label="Clear filter" />
              <FilterMenu.List>
                <FilterMenu.Item onClick={onClick}>Apple</FilterMenu.Item>
                <FilterMenu.Item>Banana</FilterMenu.Item>
              </FilterMenu.List>
            </FilterMenu.Popup>
          </FilterMenu.Positioner>
        </FilterMenu.Portal>
      </FilterMenu.Root>,
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
          <FilterMenu.Root
            open={open}
            onOpenChange={setOpen}
            inputValue={inputValue}
            onInputValueChange={(value, details) => {
              if (details.reason === 'popup-close') {
                details.cancel();
                return;
              }
              setInputValue(value);
            }}
          >
            <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
            <FilterMenu.Portal>
              <FilterMenu.Positioner>
                <FilterMenu.Popup>
                  <FilterMenu.Input aria-label="Filter actions" />
                  <FilterMenu.List>
                    <FilterMenu.Item>Rename</FilterMenu.Item>
                    <FilterMenu.Item>Delete</FilterMenu.Item>
                  </FilterMenu.List>
                </FilterMenu.Popup>
              </FilterMenu.Positioner>
            </FilterMenu.Portal>
          </FilterMenu.Root>
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
      <FilterMenu.Root defaultOpen>
        <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
        <FilterMenu.Portal>
          <FilterMenu.Positioner>
            <FilterMenu.Popup>
              <FilterMenu.Input aria-label="Filter actions" />
              <FilterMenu.Empty>No actions found</FilterMenu.Empty>
              <FilterMenu.List />
            </FilterMenu.Popup>
          </FilterMenu.Positioner>
        </FilterMenu.Portal>
      </FilterMenu.Root>,
    );

    await waitFor(() => {
      expect(screen.queryAllByText('No actions found').length).toBeGreaterThan(0);
    });
  });

  it('keeps a group with no registered items visible while filtering', async () => {
    const { user } = await render(
      <FilterMenu.Root defaultOpen>
        <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
        <FilterMenu.Portal>
          <FilterMenu.Positioner>
            <FilterMenu.Popup>
              <FilterMenu.Input aria-label="Filter actions" />
              <FilterMenu.List>
                <FilterMenu.Group>
                  <FilterMenu.GroupLabel>Empty section</FilterMenu.GroupLabel>
                </FilterMenu.Group>
                <FilterMenu.Item>Rename</FilterMenu.Item>
              </FilterMenu.List>
            </FilterMenu.Popup>
          </FilterMenu.Positioner>
        </FilterMenu.Portal>
      </FilterMenu.Root>,
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
        <FilterMenu.Root defaultOpen>
          <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter actions" />
                {/* Inside the popup so pressing it does not dismiss the menu. */}
                <button type="button" onClick={() => setLabel('Rename')}>
                  rename
                </button>
                <FilterMenu.List>
                  <FilterMenu.Item>{label}</FilterMenu.Item>
                  <FilterMenu.Item>Delete</FilterMenu.Item>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>
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

  it('activates a link item with Enter when the list owns focus', async () => {
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault());
    const { user } = await render(
      <FilterMenu.Root defaultOpen>
        <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
        <FilterMenu.Portal>
          <FilterMenu.Positioner>
            <FilterMenu.Popup>
              <FilterMenu.List>
                <FilterMenu.LinkItem href="#docs" onClick={onClick}>
                  Docs
                </FilterMenu.LinkItem>
              </FilterMenu.List>
            </FilterMenu.Popup>
          </FilterMenu.Positioner>
        </FilterMenu.Portal>
      </FilterMenu.Root>,
    );

    const list = screen.getByRole('menu');
    await act(async () => {
      list.focus();
    });
    // The list seeds the first item on open, so it is already the active descendant.
    expect(list).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('menuitem', { name: 'Docs' }).id,
    );

    await user.keyboard('[Enter]');

    // A replayed keydown would never run native anchor activation.
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('activates a link item with Space when the list owns focus', async () => {
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault());
    const { user } = await render(
      <FilterMenu.Root defaultOpen>
        <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
        <FilterMenu.Portal>
          <FilterMenu.Positioner>
            <FilterMenu.Popup>
              <FilterMenu.List>
                <FilterMenu.LinkItem href="#docs" onClick={onClick}>
                  Docs
                </FilterMenu.LinkItem>
              </FilterMenu.List>
            </FilterMenu.Popup>
          </FilterMenu.Positioner>
        </FilterMenu.Portal>
      </FilterMenu.Root>,
    );

    const list = screen.getByRole('menu');
    await act(async () => {
      list.focus();
    });
    await user.keyboard('[Space]');

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('navigates a horizontal menu once per key and exposes its orientation', async () => {
    const { user } = await render(
      <FilterMenu.Root defaultOpen orientation="horizontal">
        <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
        <FilterMenu.Portal>
          <FilterMenu.Positioner>
            <FilterMenu.Popup>
              <FilterMenu.Input aria-label="Filter actions" />
              <FilterMenu.List>
                <FilterMenu.Item>Rename</FilterMenu.Item>
                <FilterMenu.Item>Delete</FilterMenu.Item>
              </FilterMenu.List>
            </FilterMenu.Popup>
          </FilterMenu.Positioner>
        </FilterMenu.Portal>
      </FilterMenu.Root>,
    );

    const input = screen.getByRole('searchbox', { name: 'Filter actions' });
    const list = screen.getByRole('menu');
    const firstItem = screen.getByRole('menuitem', { name: 'Rename' });
    expect(list).toHaveAttribute('aria-orientation', 'horizontal');
    await waitFor(() => {
      expect(input).toHaveFocus();
    });

    await user.keyboard('[ArrowRight]');

    expect(input).toHaveAttribute('aria-activedescendant', firstItem.id);
  });

  it('preserves modifiers when the input activates a link item', async () => {
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault());
    const { user } = await render(
      <FilterMenu.Root defaultOpen>
        <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
        <FilterMenu.Portal>
          <FilterMenu.Positioner>
            <FilterMenu.Popup>
              <FilterMenu.Input aria-label="Filter actions" />
              <FilterMenu.List>
                <FilterMenu.LinkItem href="#docs" onClick={onClick}>
                  Docs
                </FilterMenu.LinkItem>
              </FilterMenu.List>
            </FilterMenu.Popup>
          </FilterMenu.Positioner>
        </FilterMenu.Portal>
      </FilterMenu.Root>,
    );

    const input = screen.getByRole('searchbox', { name: 'Filter actions' });
    await waitFor(() => {
      expect(input).toHaveFocus();
    });
    await user.keyboard('[ArrowDown]{Control>}[Enter]{/Control}');

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick.mock.calls[0][0]).toHaveProperty('ctrlKey', true);
  });
});
