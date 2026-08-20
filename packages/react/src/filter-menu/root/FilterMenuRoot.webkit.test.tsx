import * as React from 'react';
import { screen, waitFor } from '@mui/internal-test-utils';
import { vi, describe, it, expect } from 'vitest';
import { createRenderer, resetBrowserPointer } from '#test-utils';
import { FilterMenu } from '@base-ui/react/filter-menu';
import { Menu } from '@base-ui/react/menu';

// Kept in a separate file so the module mock doesn't leak into `FilterMenuRoot.test.tsx`.
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

function Test() {
  return (
    <FilterMenu.Root defaultOpen>
      <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
      <FilterMenu.Portal>
        <FilterMenu.Positioner>
          <FilterMenu.Popup>
            <FilterMenu.Input aria-label="Filter actions" />
            <FilterMenu.List>
              <FilterMenu.Item>Apple</FilterMenu.Item>
              <FilterMenu.Item>Banana</FilterMenu.Item>
            </FilterMenu.List>
          </FilterMenu.Popup>
        </FilterMenu.Positioner>
      </FilterMenu.Portal>
    </FilterMenu.Root>
  );
}

describe('<FilterMenu.Root /> (WebKit)', () => {
  beforeEach(resetBrowserPointer);

  const { render, renderToString } = createRenderer();

  it('marks the active descendant selected for the WebKit compatibility path', async () => {
    const { user } = await render(<Test />);

    const input = screen.getByRole('searchbox', { name: 'Filter actions' });
    await waitFor(() => {
      expect(input).toHaveFocus();
    });

    const apple = screen.getByRole('menuitem', { name: 'Apple' });
    const banana = screen.getByRole('menuitem', { name: 'Banana' });
    expect(apple).toHaveAttribute('aria-selected', 'false');

    await user.keyboard('[ArrowDown]');

    expect(apple).toHaveAttribute('aria-selected', 'true');
    expect(banana).toHaveAttribute('aria-selected', 'false');
    expect(input).toHaveAttribute('aria-activedescendant', apple.id);

    await user.keyboard('[ArrowDown]');

    expect(apple).toHaveAttribute('aria-selected', 'false');
    expect(banana).toHaveAttribute('aria-selected', 'true');
  });

  it('leaves plain menu items alone, which navigate with real focus', async () => {
    await render(
      <Menu.Root defaultOpen>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Item>Apple</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );

    expect(screen.getByRole('menuitem', { name: 'Apple' })).not.toHaveAttribute('aria-selected');
  });

  it('withholds aria-selected until hydration completes so it matches server markup', async () => {
    const { hydrate } = renderToString(
      <FilterMenu.Root inline open autoHighlight="always">
        <FilterMenu.Input aria-label="Filter fruit" />
        <FilterMenu.List>
          <FilterMenu.Item>Apple</FilterMenu.Item>
          <FilterMenu.Item>Banana</FilterMenu.Item>
        </FilterMenu.List>
      </FilterMenu.Root>,
    );

    // The server cannot sniff the engine, so it must not render the attribute.
    expect(screen.getByRole('menuitem', { name: 'Apple' })).not.toHaveAttribute('aria-selected');

    hydrate();

    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'Apple' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });
    expect(screen.getByRole('menuitem', { name: 'Banana' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });
});
