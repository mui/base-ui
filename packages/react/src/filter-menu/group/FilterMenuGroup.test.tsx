import { expect, describe, it } from 'vitest';
import * as React from 'react';
import { screen, waitFor } from '@mui/internal-test-utils';
import { FilterMenu } from '@base-ui/react/filter-menu';
import { createRenderer } from '#test-utils';

describe('<FilterMenu.Group />', () => {
  const { render } = createRenderer();

  it('renders groups as rowgroups in a grid filter menu', async () => {
    await render(
      <FilterMenu.Root grid inline open>
        <FilterMenu.List>
          <FilterMenu.Group>
            <FilterMenu.GroupLabel>Actions</FilterMenu.GroupLabel>
            <FilterMenu.Row>
              <FilterMenu.Item>Rename</FilterMenu.Item>
            </FilterMenu.Row>
          </FilterMenu.Group>
        </FilterMenu.List>
      </FilterMenu.Root>,
    );

    const rowgroup = screen.getByRole('rowgroup', { name: 'Actions' });
    expect(rowgroup).toBeVisible();
    expect(rowgroup).toHaveAttribute('aria-labelledby');
  });

  it('keeps groups labelled outside grid mode', async () => {
    await render(
      <FilterMenu.Root inline open>
        <FilterMenu.List>
          <FilterMenu.Group>
            <FilterMenu.GroupLabel>Actions</FilterMenu.GroupLabel>
            <FilterMenu.Item>Rename</FilterMenu.Item>
          </FilterMenu.Group>
        </FilterMenu.List>
      </FilterMenu.Root>,
    );

    expect(screen.getByRole('group', { name: 'Actions' })).toBeVisible();
  });

  it('hides a radio group, label included, when the query filters out all of its items', async () => {
    const { user } = await render(
      <FilterMenu.Root defaultOpen>
        <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
        <FilterMenu.Portal>
          <FilterMenu.Positioner>
            <FilterMenu.Popup>
              <FilterMenu.Input aria-label="Filter actions" />
              <FilterMenu.List>
                <FilterMenu.Item>Rename</FilterMenu.Item>
                <FilterMenu.RadioGroup data-testid="sort-group" defaultValue="date">
                  <FilterMenu.GroupLabel>Sort by</FilterMenu.GroupLabel>
                  <FilterMenu.RadioItem value="date">Date modified</FilterMenu.RadioItem>
                  <FilterMenu.RadioItem value="size">Size</FilterMenu.RadioItem>
                </FilterMenu.RadioGroup>
              </FilterMenu.List>
            </FilterMenu.Popup>
          </FilterMenu.Positioner>
        </FilterMenu.Portal>
      </FilterMenu.Root>,
    );

    const group = screen.getByTestId('sort-group');
    expect(group).not.toHaveAttribute('hidden');

    await user.type(screen.getByRole('searchbox', { name: 'Filter actions' }), 'rena');

    await waitFor(() => {
      expect(group).toHaveAttribute('hidden');
    });
    expect(screen.queryByText('Sort by')).not.toBeVisible();
  });
});
