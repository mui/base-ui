import * as React from 'react';
import * as Select from '@base_ui/react/Select';
import { createRenderer, describeConformance } from '#test-utils';
import { screen } from '@mui/internal-test-utils';
import { expect } from 'chai';

describe('<Select.OptionGroup />', () => {
  const { render } = createRenderer();

  describeConformance(<Select.OptionGroup />, () => ({
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
          <Select.OptionGroup>
            <Select.OptionGroupLabel>Fruits</Select.OptionGroupLabel>
            <Select.Option value="apple">Apple</Select.Option>
            <Select.Option value="banana">Banana</Select.Option>
          </Select.OptionGroup>
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
          <Select.OptionGroup>
            <Select.OptionGroupLabel>Vegetables</Select.OptionGroupLabel>
            <Select.Option value="carrot">Carrot</Select.Option>
            <Select.Option value="lettuce">Lettuce</Select.Option>
          </Select.OptionGroup>
        </Select.Positioner>
      </Select.Root>,
    );

    const optionGroup = screen.getByRole('group');
    const label = screen.getByText('Vegetables');
    expect(optionGroup).to.have.attribute('aria-labelledby', label.id);
  });
});
