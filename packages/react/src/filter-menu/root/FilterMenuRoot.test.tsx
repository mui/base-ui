import { expect, vi } from 'vitest';
import * as React from 'react';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { Menu } from '@base-ui/react/menu';
import { FilterMenu } from '@base-ui/react/filter-menu';
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
                            <FilterMenu.List data-testid="sharing-list">
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

      const submenuList = screen.getByTestId('sharing-list');
      await waitFor(() => {
        expect(submenuList).toHaveFocus();
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
                            <FilterMenu.List data-testid="sharing-list">
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

      const submenuList = screen.getByTestId('sharing-list');
      await waitFor(() => {
        expect(submenuList).toHaveFocus();
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

    it('uses dialog semantics for a filterable submenu', async () => {
      const { user } = await render(<FilterableSubmenu />);
      const submenuTrigger = screen.getByRole('menuitem', { name: 'Move to folder' });

      expect(submenuTrigger).toHaveAttribute('aria-haspopup', 'dialog');

      await user.hover(submenuTrigger);

      const popup = await screen.findByRole('dialog');
      expect(submenuTrigger).toHaveAttribute('aria-controls', popup.id);
      expect(popup).toHaveAttribute('aria-labelledby', submenuTrigger.id);
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
      await user.keyboard('[ArrowDown]');

      expect(input).toHaveValue('app');
      expect(screen.getByRole('menuitem', { name: 'Apple' })).toBeVisible();
      expect(screen.queryByRole('menuitem', { name: 'Banana' })).toBe(null);

      // Typing is rejected.
      await user.type(input, 'x');

      expect(input).toHaveValue('app');
      expect(screen.getByRole('menuitem', { name: 'Apple' })).toBeVisible();
      expect(screen.queryByRole('menuitem', { name: 'Banana' })).toBe(null);

      // Clearing is rejected.
      await user.click(screen.getByRole('button', { name: 'Clear filter' }));

      expect(input).toHaveValue('app');
      expect(screen.getByRole('menuitem', { name: 'Apple' })).toBeVisible();
      expect(screen.queryByRole('menuitem', { name: 'Banana' })).toBe(null);
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

        const item = screen.getByText('Documents');
        await user.hover(item);
        expect(input).not.toHaveAttribute('data-focus-visible');

        await user.hover(input);
        expect(input).not.toHaveAttribute('data-focus-visible');

        await user.keyboard('[ArrowDown]');
        expect(input).not.toHaveAttribute('data-focus-visible');

        await user.keyboard('[ArrowUp]');
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

      await user.keyboard('[ArrowLeft]');

      await waitFor(() => {
        expect(parentInput).toHaveFocus();
      });
      expect(parentInput).toHaveAttribute('aria-activedescendant', submenuTrigger.id);

      await user.keyboard('[ArrowDown]');

      const nextItem = screen.getByRole('menuitem', { name: 'Delete' });
      expect(parentInput).toHaveAttribute('aria-activedescendant', nextItem.id);
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

    it.each(['[Enter]', '[Space]'])(
      '%s opens a virtually focused submenu from the list',
      async (key) => {
        const onListKeyDown = vi.fn();
        const { user } = await render(
          <FilterMenu.Root defaultOpen>
            <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
            <FilterMenu.Portal>
              <FilterMenu.Positioner>
                <FilterMenu.Popup>
                  <FilterMenu.Input aria-label="Filter actions" />
                  <FilterMenu.List onKeyDown={onListKeyDown}>
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

        const submenuTrigger = screen.getByRole('menuitem', { name: 'Share' });
        const list = submenuTrigger.parentElement!;
        expect(list).not.toHaveAttribute('aria-activedescendant');

        await user.tab();
        await waitFor(() => {
          expect(list).toHaveAttribute('aria-activedescendant', submenuTrigger.id);
        });

        await user.keyboard('{Shift>}{Tab}{/Shift}');
        await waitFor(() => {
          expect(screen.getByRole('searchbox', { name: 'Filter actions' })).toHaveFocus();
        });
        expect(list).not.toHaveAttribute('aria-activedescendant');

        await act(async () => {
          list.focus();
        });
        await waitFor(() => {
          expect(list).toHaveAttribute('aria-activedescendant', submenuTrigger.id);
        });

        await user.keyboard(key);

        if (key === '[Space]') {
          expect(onListKeyDown.mock.lastCall?.[0]).toHaveProperty('defaultPrevented', true);
        }

        const submenuInput = screen.getByRole('searchbox', { name: 'Filter sharing options' });
        await waitFor(() => {
          expect(submenuInput).toHaveFocus();
        });
        await waitFor(() => {
          expect(list).not.toHaveAttribute('aria-activedescendant');
        });

        await user.keyboard('[ArrowLeft]');

        // Exiting the submenu returns focus to where it was entered from: the list.
        await waitFor(() => {
          expect(list).toHaveFocus();
        });
        await waitFor(() => {
          expect(list).toHaveAttribute('aria-activedescendant', submenuTrigger.id);
        });

        await user.keyboard('[ArrowDown]');

        const nextItem = screen.getByRole('menuitem', { name: 'Delete' });
        expect(list).toHaveAttribute('aria-activedescendant', nextItem.id);
      },
    );

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
      },
    );

    it.skipIf(isJSDOM)(
      'closes a hover-opened submenu from a virtually focused parent',
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

        await screen.findByRole('searchbox', { name: 'Filter folders' });
        expect(parentInput).toHaveFocus();
        expect(parentInput).toHaveAttribute('aria-activedescendant', submenuTrigger.id);

        await user.keyboard('[ArrowLeft]');

        await waitFor(() => {
          expect(screen.queryByRole('searchbox', { name: 'Filter folders' })).toBe(null);
        });
        expect(parentInput).toHaveFocus();
        expect(parentInput).toHaveAttribute('aria-activedescendant', submenuTrigger.id);
      },
    );

    it.skipIf(isJSDOM)(
      'focuses the first item when entering a hover-opened submenu from a filterable menu',
      async () => {
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
      },
    );

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
        expect(screen.getByText('Apple')).not.toHaveAttribute('tabindex');
      });
      await waitFor(() => {
        expect(screen.getByText('Banana')).not.toHaveAttribute('tabindex');
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
      expect(activeItem).not.toHaveAttribute('tabindex');
      expect(input).toHaveAttribute('aria-activedescendant', activeItem.id);
      expect(popup).not.toHaveAttribute('aria-activedescendant');

      await user.keyboard('{Enter}');

      expect(onClick).toHaveBeenCalledTimes(1);
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

      expect(screen.getByRole('menuitemcheckbox', { name: 'Banana' })).toBeVisible();
      expect(screen.queryByRole('menuitem', { name: 'Apple' })).toBe(null);

      await user.clear(input);
      await user.type(input, 'cherry');
      await user.keyboard('[ArrowDown]');

      expect(screen.getByRole('menuitemradio', { name: 'Cherry' })).toBeVisible();
      expect(screen.queryByRole('menuitemcheckbox', { name: 'Banana' })).toBe(null);

      await user.clear(input);
      await user.type(input, 'date');
      await user.keyboard('[ArrowDown]');

      expect(screen.getByRole('menuitem', { name: 'Date' })).toBeVisible();
      expect(screen.queryByRole('menuitemradio', { name: 'Cherry' })).toBe(null);
    });
  });
});
