import * as React from 'react';
import { screen, waitFor } from '@mui/internal-test-utils';
import { expect, vi } from 'vitest';
import { createRenderer } from '#test-utils';
import { FilterMenu } from '@base-ui/react/filter-menu';

// The list hiding and the focus transfer are WebKit-only compatibility behaviors, so this file
// mocks the engine deterministically on every host.
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

describe('<FilterMenu.List />', () => {
  const { render } = createRenderer();

  it('exposes the menu only while an item is virtually focused on WebKit', async () => {
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
    // WebKit only tracks aria-activedescendant from the focused list element.
    await waitFor(() => {
      expect(list).toHaveFocus();
    });
    expect(list).toHaveAttribute('aria-activedescendant');

    await user.keyboard('[ArrowUp]');

    await waitFor(() => {
      expect(input).toHaveFocus();
    });
    expect(list).not.toHaveAttribute('aria-activedescendant');
    expect(list).toHaveAttribute('aria-hidden', 'true');
  });

  it('returns focus to the input when typing while the list has focus', async () => {
    const { user } = await render(
      <FilterMenu.Root open>
        <FilterMenu.Trigger>Fruit</FilterMenu.Trigger>
        <FilterMenu.Portal>
          <FilterMenu.Positioner>
            <FilterMenu.Popup>
              <FilterMenu.Input aria-label="Filter fruit" />
              <FilterMenu.List data-testid="list">
                <FilterMenu.Item>Apple</FilterMenu.Item>
                <FilterMenu.Item>Banana</FilterMenu.Item>
              </FilterMenu.List>
            </FilterMenu.Popup>
          </FilterMenu.Positioner>
        </FilterMenu.Portal>
      </FilterMenu.Root>,
    );

    const input = screen.getByRole('searchbox', { name: 'Filter fruit' });
    const list = screen.getByTestId('list');
    const apple = screen.getByRole('menuitem', { name: 'Apple', hidden: true });

    await waitFor(() => {
      expect(input).toHaveFocus();
    });

    await user.keyboard('[ArrowDown]');
    await waitFor(() => {
      expect(list).toHaveFocus();
    });

    await user.keyboard('b');

    // The keystroke lands in the input natively; synthetic events can't reproduce the
    // insertion, so assert the focus contract and that further typing filters.
    await waitFor(() => {
      expect(input).toHaveFocus();
    });

    await user.keyboard('b');

    await waitFor(() => {
      expect(apple).not.toBeVisible();
    });
  });
});
