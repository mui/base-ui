import { expect, vi } from 'vitest';
import * as React from 'react';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { Menu } from '@base-ui/react/menu';
import { FilterMenu } from '@base-ui/react/filter-menu';
import { createRenderer, isJSDOM, resetBrowserPointer } from '#test-utils';

// The submenu trigger's VoiceOver branch is covered separately; keep the mainline deterministic.
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

describe('<FilterMenu.SubmenuRoot />', () => {
  beforeEach(resetBrowserPointer);

  const { render } = createRenderer();

  /** A filterable submenu whose parent is a plain, roving-focus `Menu.Root`. */
  function PlainParentMenu(props: {
    submenuProps?: Partial<React.ComponentProps<typeof FilterMenu.SubmenuRoot>>;
  }) {
    return (
      <Menu.Root open>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Item>Rename</Menu.Item>
              <FilterMenu.SubmenuRoot {...props.submenuProps}>
                <FilterMenu.SubmenuTrigger data-testid="submenu-trigger">
                  Move to
                </FilterMenu.SubmenuTrigger>
                <FilterMenu.Portal>
                  <FilterMenu.Positioner>
                    <FilterMenu.Popup>
                      <FilterMenu.Input aria-label="Filter folders" />
                      <FilterMenu.List data-testid="submenu-list">
                        <FilterMenu.Item>Projects</FilterMenu.Item>
                        <FilterMenu.Item>Archive</FilterMenu.Item>
                      </FilterMenu.List>
                    </FilterMenu.Popup>
                  </FilterMenu.Positioner>
                </FilterMenu.Portal>
              </FilterMenu.SubmenuRoot>
              <Menu.Item>Delete</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    );
  }

  describe('prop: inputValue', () => {
    it('renders the controlled query and reports changes', async () => {
      const onInputValueChange = vi.fn();

      function ControlledSubmenu() {
        const [inputValue, setInputValue] = React.useState('pro');

        return (
          <FilterMenu.Root defaultOpen>
            <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
            <FilterMenu.Portal>
              <FilterMenu.Positioner>
                <FilterMenu.Popup>
                  <FilterMenu.List>
                    <FilterMenu.SubmenuRoot
                      defaultOpen
                      inputValue={inputValue}
                      onInputValueChange={(nextValue, eventDetails) => {
                        onInputValueChange(nextValue, eventDetails.reason);
                        setInputValue(nextValue);
                      }}
                    >
                      <FilterMenu.SubmenuTrigger>Move to</FilterMenu.SubmenuTrigger>
                      <FilterMenu.Portal>
                        <FilterMenu.Positioner>
                          <FilterMenu.Popup>
                            <FilterMenu.Input aria-label="Filter folders" />
                            <FilterMenu.List>
                              <FilterMenu.Item>Projects</FilterMenu.Item>
                              <FilterMenu.Item>Archive</FilterMenu.Item>
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
        );
      }

      const { user } = await render(<ControlledSubmenu />);

      const input = screen.getByRole('searchbox', { name: 'Filter folders' });
      expect(input).toHaveValue('pro');
      expect(screen.queryByRole('menuitem', { name: 'Archive' })).toBe(null);

      await user.clear(input);

      expect(onInputValueChange).toHaveBeenCalledWith('', 'input-clear');
      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'Archive' })).not.toBe(null);
      });
    });

    it('keeps the uncontrolled query when the change is canceled', async () => {
      function CancelingSubmenu() {
        return (
          <FilterMenu.Root defaultOpen>
            <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
            <FilterMenu.Portal>
              <FilterMenu.Positioner>
                <FilterMenu.Popup>
                  <FilterMenu.List>
                    <FilterMenu.SubmenuRoot
                      defaultOpen
                      defaultInputValue="pro"
                      onInputValueChange={(_, eventDetails) => eventDetails.cancel()}
                    >
                      <FilterMenu.SubmenuTrigger>Move to</FilterMenu.SubmenuTrigger>
                      <FilterMenu.Portal>
                        <FilterMenu.Positioner>
                          <FilterMenu.Popup>
                            <FilterMenu.Input aria-label="Filter folders" />
                            <FilterMenu.List>
                              <FilterMenu.Item>Projects</FilterMenu.Item>
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
        );
      }

      const { user } = await render(<CancelingSubmenu />);

      const input = screen.getByRole('searchbox', { name: 'Filter folders' });
      await user.type(input, 'x');

      expect(input).toHaveValue('pro');
    });
  });

  describe.skipIf(isJSDOM)('inside a plain parent menu', () => {
    it('opens with the cross-axis key and focuses the submenu input', async () => {
      const { user } = await render(<PlainParentMenu />);

      const trigger = screen.getByTestId('submenu-trigger');
      await act(async () => {
        trigger.focus();
      });
      await user.keyboard('{ArrowRight}');

      const input = await screen.findByRole('searchbox', { name: 'Filter folders' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
    });

    it('closes with the cross-axis close key and returns focus to the trigger', async () => {
      const { user } = await render(<PlainParentMenu />);

      const trigger = screen.getByTestId('submenu-trigger');
      await act(async () => {
        trigger.focus();
      });
      await user.keyboard('{ArrowRight}');

      const input = await screen.findByRole('searchbox', { name: 'Filter folders' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });

      await user.keyboard('{ArrowLeft}');

      await waitFor(() => {
        expect(screen.queryByTestId('submenu-list')).toBe(null);
      });
      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });
    });

    it('hands the cursor back to the submenu input when the open key repeats', async () => {
      const { user } = await render(<PlainParentMenu />);

      const trigger = screen.getByTestId('submenu-trigger');
      await act(async () => {
        trigger.focus();
      });
      await user.keyboard('{ArrowRight}');

      const input = await screen.findByRole('searchbox', { name: 'Filter folders' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });

      // Move real focus back onto the trigger, then press the open key again while the submenu
      // is still open: it must re-enter rather than reopen.
      await act(async () => {
        trigger.focus();
      });
      await user.keyboard('{ArrowRight}');

      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      expect(screen.getByTestId('submenu-list')).not.toBe(null);
    });

    it('moves along the parent list with the main-axis keys', async () => {
      const { user } = await render(<PlainParentMenu />);

      const trigger = screen.getByTestId('submenu-trigger');
      await act(async () => {
        trigger.focus();
      });

      await user.keyboard('{ArrowDown}');

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus();
      });
    });

    it('closes when the close key arrives while the trigger holds focus', async () => {
      const { user } = await render(<PlainParentMenu />);

      const trigger = screen.getByTestId('submenu-trigger');
      await act(async () => {
        trigger.focus();
      });
      await user.keyboard('{ArrowRight}');

      await screen.findByRole('searchbox', { name: 'Filter folders' });

      // Put real focus back on the trigger, then press the close key there rather than in the
      // submenu popup.
      await act(async () => {
        trigger.focus();
      });
      await user.keyboard('{ArrowLeft}');

      await waitFor(() => {
        expect(screen.queryByTestId('submenu-list')).toBe(null);
      });
    });

    it('leaves a key that is neither an axis nor an activation key to the parent', async () => {
      const { user } = await render(<PlainParentMenu />);

      const trigger = screen.getByTestId('submenu-trigger');
      await act(async () => {
        trigger.focus();
      });

      await user.keyboard('{Home}');

      // The submenu must not open, and the parent's own Home handling still runs.
      expect(screen.queryByTestId('submenu-list')).toBe(null);
      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'Rename' })).toHaveFocus();
      });
    });
  });
});
