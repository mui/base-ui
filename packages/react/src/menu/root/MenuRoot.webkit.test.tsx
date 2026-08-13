import * as React from 'react';
import { screen, waitFor } from '@mui/internal-test-utils';
import { expect, vi } from 'vitest';
import { createRenderer } from '#test-utils';
import { FilterMenu } from '@base-ui/react/filter-menu';

// WebKit only tracks aria-activedescendant when DOM focus is on the list element, so navigation
// transfers real focus there. These tests mock the engine deterministically on every host.
vi.mock('@base-ui/utils/platform', async () => {
  const actual =
    await vi.importActual<typeof import('@base-ui/utils/platform')>('@base-ui/utils/platform');

  return {
    platform: {
      ...actual.platform,
      engine: { ...actual.platform.engine, webkit: true },
    },
  };
});

describe('<FilterMenu.Root /> (WebKit)', () => {
  const { render } = createRenderer();

  function Submenu({ onListKeyDown }: { onListKeyDown?: (event: React.KeyboardEvent) => void }) {
    return (
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
      </FilterMenu.Root>
    );
  }

  it('moves DOM focus onto the list when navigating and back to the input at the boundary', async () => {
    const { user } = await render(<Submenu />);

    const input = screen.getByRole('searchbox', { name: 'Filter actions' });
    await waitFor(() => {
      expect(input).toHaveFocus();
    });

    const submenuTrigger = screen.getByRole('menuitem', { name: 'Share', hidden: true });
    const list = submenuTrigger.parentElement!;
    expect(list).not.toHaveAttribute('aria-activedescendant');

    await user.keyboard('[ArrowDown]');

    await waitFor(() => {
      expect(list).toHaveFocus();
    });
    expect(list).toHaveAttribute('aria-activedescendant', submenuTrigger.id);

    await user.keyboard('[ArrowDown]');

    const nextItem = screen.getByRole('menuitem', { name: 'Delete' });
    expect(list).toHaveAttribute('aria-activedescendant', nextItem.id);

    await user.keyboard('[ArrowDown]');

    // Navigation escapes the list boundary and returns focus to the input.
    await waitFor(() => {
      expect(input).toHaveFocus();
    });
    expect(list).not.toHaveAttribute('aria-activedescendant');
  });

  it.each(['[Enter]', '[Space]'])(
    '%s opens a virtually focused submenu from the list',
    async (key) => {
      const onListKeyDown = vi.fn();
      const { user } = await render(<Submenu onListKeyDown={onListKeyDown} />);

      const input = screen.getByRole('searchbox', { name: 'Filter actions' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });

      const submenuTrigger = screen.getByRole('menuitem', { name: 'Share', hidden: true });
      const list = submenuTrigger.parentElement!;

      await user.keyboard('[ArrowDown]');
      await waitFor(() => {
        expect(list).toHaveFocus();
      });
      expect(list).toHaveAttribute('aria-activedescendant', submenuTrigger.id);

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
});
