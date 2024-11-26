import * as React from 'react';
import { Select } from '@base-ui-components/react/select';
import { createRenderer, describeConformance } from '#test-utils';
import { screen } from '@mui/internal-test-utils';
import { expect } from 'chai';

describe('<Select.Group />', () => {
  const { render } = createRenderer();

  describeConformance(<Select.Group />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Select.Root open animated={false}>
          {node}
        </Select.Root>,
      );
    },
  }));

  it('should render option group with label', async () => {
    await render(
      <Select.Root open animated={false}>
        <Select.Positioner>
          <Select.Group>
            <Select.GroupLabel>Fruits</Select.GroupLabel>
            <Select.Option value="apple">Apple</Select.Option>
            <Select.Option value="banana">Banana</Select.Option>
          </Select.Group>
        </Select.Positioner>
      </Select.Root>,
    );

    expect(screen.getByRole('group')).to.have.attribute('aria-labelledby');
    expect(screen.getByText('Fruits')).toBeVisible();
  });

  it('should associate label with option group', async () => {
    await render(
      <Select.Root open animated={false}>
        <Select.Positioner>
          <Select.Group>
            <Select.GroupLabel>Vegetables</Select.GroupLabel>
            <Select.Option value="carrot">Carrot</Select.Option>
            <Select.Option value="lettuce">Lettuce</Select.Option>
          </Select.Group>
        </Select.Positioner>
      </Select.Root>,
    );

    const Group = screen.getByRole('group');
    const label = screen.getByText('Vegetables');
    expect(Group).to.have.attribute('aria-labelledby', label.id);
  });
});
