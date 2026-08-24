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
});
