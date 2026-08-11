import * as React from 'react';
import { screen, waitFor } from '@mui/internal-test-utils';
import { expect, vi } from 'vitest';
import { createRenderer } from '#test-utils';
import { FilterMenu } from '@base-ui/react/filter-menu';

// Kept in a separate file so the module mock doesn't leak into `MenuRoot.test.tsx`.
vi.mock('@base-ui/utils/platform', async () => {
  const actual =
    await vi.importActual<typeof import('@base-ui/utils/platform')>('@base-ui/utils/platform');

  return {
    platform: {
      ...actual.platform,
      screenReader: { ...actual.platform.screenReader, voiceOver: true },
    },
  };
});

describe('<FilterMenu.List /> with VoiceOver', () => {
  const { render } = createRenderer();

  it('closes a nested filterable submenu and moves focus forward when tabbing', async () => {
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
                    <FilterMenu.SubmenuTrigger delay={0}>Share</FilterMenu.SubmenuTrigger>
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
      expect(
        document.activeElement?.getAttribute('data-testid') ?? document.activeElement?.tagName,
      ).toBe('after');
    });
  });

  it('exposes the menu only while an item is virtually focused', async () => {
    const { user } = await render(
      <FilterMenu.Root open>
        <FilterMenu.Trigger>Fruit</FilterMenu.Trigger>
        <FilterMenu.Portal>
          <FilterMenu.Positioner>
            <FilterMenu.Popup>
              <FilterMenu.Input aria-label="Filter fruit" />
              <FilterMenu.List data-testid="list">
                <FilterMenu.Item>Apple</FilterMenu.Item>
              </FilterMenu.List>
            </FilterMenu.Popup>
          </FilterMenu.Positioner>
        </FilterMenu.Portal>
      </FilterMenu.Root>,
    );

    const input = screen.getByRole('searchbox', { name: 'Filter fruit' });
    const list = screen.getByTestId('list');

    await waitFor(() => {
      expect(input).toHaveFocus();
    });

    expect(list).toHaveAttribute('role', 'menu');
    expect(list).toHaveAttribute('aria-hidden', 'true');
    expect(input).not.toHaveAttribute('aria-activedescendant');

    await user.keyboard('[ArrowDown]');

    expect(screen.getByTestId('list')).toBe(list);
    expect(list).toHaveAttribute('role', 'menu');
    expect(list).not.toHaveAttribute('aria-hidden');
    expect(input).toHaveAttribute('aria-activedescendant');

    await user.keyboard('[ArrowUp]');

    expect(input).not.toHaveAttribute('aria-activedescendant');
    expect(list).toHaveAttribute('aria-hidden', 'true');
  });
});
