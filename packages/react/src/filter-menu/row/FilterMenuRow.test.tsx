import { expect } from 'vitest';
import * as React from 'react';
import { screen } from '@mui/internal-test-utils';
import { FilterMenu } from '@base-ui/react/filter-menu';
import { createRenderer, describeConformance } from '#test-utils';

describe('<FilterMenu.Row />', () => {
  const { render } = createRenderer();

  describeConformance(<FilterMenu.Row />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <FilterMenu.Root grid inline open>
          <FilterMenu.List>{node}</FilterMenu.List>
        </FilterMenu.Root>,
      );
    },
  }));

  it('renders a row in a grid filter menu', async () => {
    await render(
      <FilterMenu.Root grid inline open>
        <FilterMenu.List>
          <FilterMenu.Row />
        </FilterMenu.List>
      </FilterMenu.Root>,
    );

    expect(screen.getByRole('row')).toBeVisible();
  });

  it('supports a concise accessible name instead of announcing every cell', async () => {
    await render(
      <FilterMenu.Root grid inline open>
        <FilterMenu.List>
          <FilterMenu.Row aria-label="Smileys & Emotion, row 1">
            <FilterMenu.Item>Grinning face</FilterMenu.Item>
            <FilterMenu.Item>Smiling face</FilterMenu.Item>
          </FilterMenu.Row>
        </FilterMenu.List>
      </FilterMenu.Root>,
    );

    expect(screen.getByRole('row', { name: 'Smileys & Emotion, row 1' })).toBeVisible();
  });

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

    expect(screen.getByRole('rowgroup', { name: 'Actions' })).toBeVisible();
  });
});
