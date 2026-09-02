import { expect, describe, beforeEach, it } from 'vitest';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, resetBrowserPointer } from '#test-utils';
import { FilterMenu } from '@base-ui/react/filter-menu';
import { Menu } from '@base-ui/react/menu';

describe('<FilterMenu.SubmenuTrigger />', () => {
  beforeEach(resetBrowserPointer);

  const { render } = createRenderer();

  it('keeps real focus on the parent input until the submenu opens', async () => {
    const { user } = await render(
      <FilterMenu.Root open>
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

    const input = screen.getByRole('searchbox', { name: 'Filter actions' });
    await act(async () => {
      input.focus();
    });

    // Move virtual focus onto the submenu trigger; real focus stays on the input.
    await user.keyboard('[ArrowDown][ArrowDown]');

    const submenuTrigger = screen.getByRole('menuitem', { name: 'Move to folder' });
    expect(input).toHaveAttribute('aria-activedescendant', submenuTrigger.id);
    expect(submenuTrigger).toHaveAttribute('tabindex', '-1');
    expect(input).toHaveFocus();

    // Opening the submenu hands it ownership of focus.
    await user.click(submenuTrigger);

    const submenuInput = await screen.findByRole('searchbox', { name: 'Filter folders' });
    await waitFor(() => {
      expect(submenuInput).toHaveFocus();
    });
  });

  describe('accessible semantics of a plain submenu', () => {
    it('reports a menu popup on a trigger whose submenu has no filter', async () => {
      await render(
        <FilterMenu.Root defaultOpen>
          <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter actions" />
                <FilterMenu.List>
                  <Menu.SubmenuRoot>
                    <FilterMenu.SubmenuTrigger>Sort by</FilterMenu.SubmenuTrigger>
                    <Menu.Portal>
                      <Menu.Positioner>
                        <Menu.Popup>
                          <Menu.Item>Name</Menu.Item>
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

      // The documented plain-submenu recipe opens a `role="menu"` popup, so the trigger must not
      // claim `haspopup="dialog"`.
      expect(screen.getByRole('menuitem', { name: 'Sort by' })).toHaveAttribute(
        'aria-haspopup',
        'menu',
      );
    });

    it('lets a consumer override aria-haspopup', async () => {
      await render(
        <FilterMenu.Root defaultOpen>
          <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter actions" />
                <FilterMenu.List>
                  <FilterMenu.SubmenuRoot>
                    <FilterMenu.SubmenuTrigger aria-haspopup="menu">
                      Move to
                    </FilterMenu.SubmenuTrigger>
                    <FilterMenu.Portal>
                      <FilterMenu.Positioner>
                        <FilterMenu.Popup>
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
        </FilterMenu.Root>,
      );

      expect(screen.getByRole('menuitem', { name: 'Move to' })).toHaveAttribute(
        'aria-haspopup',
        'menu',
      );
    });

    it('lets a consumer override aria-haspopup on the root trigger', async () => {
      await render(
        <FilterMenu.Root>
          <FilterMenu.Trigger aria-haspopup="menu">Actions</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.List>
                  <FilterMenu.Item>Rename</FilterMenu.Item>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
      );

      expect(screen.getByRole('button', { name: 'Actions' })).toHaveAttribute(
        'aria-haspopup',
        'menu',
      );
    });
  });
});
