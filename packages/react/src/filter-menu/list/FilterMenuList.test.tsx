import * as React from 'react';
import { screen, waitFor } from '@mui/internal-test-utils';
import { expect } from 'vitest';
import { createRenderer } from '#test-utils';
import { FilterMenu } from '@base-ui/react/filter-menu';

describe('<FilterMenu.List />', () => {
  const { render } = createRenderer();

  it('supports navigation when rendered inline without popup parts', async () => {
    const { user } = await render(
      <FilterMenu.Root inline open>
        <FilterMenu.Input aria-label="Filter fruit" />
        <FilterMenu.List data-testid="list">
          <FilterMenu.Item>Apple</FilterMenu.Item>
          <FilterMenu.Item>Banana</FilterMenu.Item>
        </FilterMenu.List>
      </FilterMenu.Root>,
    );

    const input = screen.getByRole('searchbox', { name: 'Filter fruit' });
    const list = screen.getByTestId('list');
    const apple = screen.getByRole('menuitem', { name: 'Apple' });
    const banana = screen.getByRole('menuitem', { name: 'Banana' });

    await user.click(input);
    await user.keyboard('[ArrowDown]');

    await waitFor(() => {
      expect(input).toHaveAttribute('aria-activedescendant', apple.id);
    });
    expect(input).toHaveAttribute('aria-controls', list.id);
    expect(apple).toHaveAttribute('data-highlighted', '');

    await user.hover(banana);

    await waitFor(() => {
      expect(banana).toHaveAttribute('data-highlighted', '');
    });
  });

  it('keeps virtual focus on the input without making the list tabbable', async () => {
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
    expect(list).toHaveAttribute('tabindex', '-1');
    expect(apple).toHaveAttribute('tabindex', '-1');
    expect(apple).not.toHaveAttribute('aria-expanded');

    await user.keyboard('[ArrowDown]');
    await waitFor(() => {
      expect(input).toHaveAttribute('aria-activedescendant', apple.id);
    });
    expect(input).toHaveFocus();
  });
});
