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

  it('exposes the menu only while an item is virtually focused', async () => {
    const { user } = await render(
      <FilterMenu.Root open items={['Apple']}>
        <FilterMenu.Trigger>Fruit</FilterMenu.Trigger>
        <FilterMenu.Portal>
          <FilterMenu.Positioner>
            <FilterMenu.Popup>
              <FilterMenu.Input aria-label="Filter fruit" />
              <FilterMenu.List data-testid="list">
                {(item: string) => <FilterMenu.Item key={item}>{item}</FilterMenu.Item>}
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
