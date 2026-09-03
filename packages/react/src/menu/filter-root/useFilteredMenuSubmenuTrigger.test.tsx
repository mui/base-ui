import { expect, describe, beforeEach, it } from 'vitest';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, resetBrowserPointer } from '#test-utils';
import { Menu } from '@base-ui/react/menu';

describe('<Menu.SubmenuTrigger />', () => {
  beforeEach(resetBrowserPointer);

  const { render } = createRenderer();

  it('keeps real focus on the parent input until the submenu opens', async () => {
    const { user } = await render(
      <Menu.FilterRoot open>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.FilterInput aria-label="Filter actions" />
              <Menu.FilterList>
                <Menu.Item>Rename</Menu.Item>
                <Menu.FilterSubmenuRoot>
                  <Menu.SubmenuTrigger delay={0}>Move to folder</Menu.SubmenuTrigger>
                  <Menu.Portal>
                    <Menu.Positioner>
                      <Menu.Popup>
                        <Menu.FilterInput aria-label="Filter folders" />
                        <Menu.FilterList>
                          <Menu.Item>Documents</Menu.Item>
                        </Menu.FilterList>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.FilterSubmenuRoot>
              </Menu.FilterList>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.FilterRoot>,
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
        <Menu.FilterRoot defaultOpen>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.FilterInput aria-label="Filter actions" />
                <Menu.FilterList>
                  <Menu.SubmenuRoot>
                    <Menu.SubmenuTrigger>Sort by</Menu.SubmenuTrigger>
                    <Menu.Portal>
                      <Menu.Positioner>
                        <Menu.Popup>
                          <Menu.Item>Name</Menu.Item>
                        </Menu.Popup>
                      </Menu.Positioner>
                    </Menu.Portal>
                  </Menu.SubmenuRoot>
                </Menu.FilterList>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.FilterRoot>,
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
        <Menu.FilterRoot defaultOpen>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.FilterInput aria-label="Filter actions" />
                <Menu.FilterList>
                  <Menu.FilterSubmenuRoot>
                    <Menu.SubmenuTrigger aria-haspopup="menu">Move to</Menu.SubmenuTrigger>
                    <Menu.Portal>
                      <Menu.Positioner>
                        <Menu.Popup>
                          <Menu.FilterList>
                            <Menu.Item>Projects</Menu.Item>
                          </Menu.FilterList>
                        </Menu.Popup>
                      </Menu.Positioner>
                    </Menu.Portal>
                  </Menu.FilterSubmenuRoot>
                </Menu.FilterList>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.FilterRoot>,
      );

      expect(screen.getByRole('menuitem', { name: 'Move to' })).toHaveAttribute(
        'aria-haspopup',
        'menu',
      );
    });

    it('lets a consumer override aria-haspopup on the root trigger', async () => {
      await render(
        <Menu.FilterRoot>
          <Menu.Trigger aria-haspopup="menu">Actions</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.FilterList>
                  <Menu.Item>Rename</Menu.Item>
                </Menu.FilterList>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.FilterRoot>,
      );

      expect(screen.getByRole('button', { name: 'Actions' })).toHaveAttribute(
        'aria-haspopup',
        'menu',
      );
    });
  });
});
