import * as React from 'react';
import { screen, waitFor } from '@mui/internal-test-utils';
import { expect } from 'vitest';
import { createRenderer } from '#test-utils';
import { FilterMenu } from '@base-ui/react/filter-menu';

describe('<FilterMenu.List />', () => {
  const { render } = createRenderer();

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
    const apple = screen.getByRole('menuitem', { name: 'Apple' });

    await waitFor(() => {
      expect(input).toHaveFocus();
    });
    expect(list).not.toHaveAttribute('aria-hidden');

    await user.tab();
    await waitFor(() => {
      expect(list).toHaveFocus();
    });
    expect(list).toHaveAttribute('aria-activedescendant', apple.id);

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
