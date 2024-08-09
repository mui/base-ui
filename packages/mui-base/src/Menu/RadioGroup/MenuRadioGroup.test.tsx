import * as React from 'react';
import { expect } from 'chai';
import * as Menu from '@base_ui/react/Menu';
import { createRenderer, describeConformance } from '../../../test';

describe('<Menu.RadioGroup />', () => {
  const { render } = createRenderer();

  describeConformance(<Menu.RadioGroup />, () => ({
    render,
    refInstanceof: window.HTMLDivElement,
  }));

  it('renders a div with the `group` role', async () => {
    const { getByRole } = await render(<Menu.RadioGroup />);
    expect(getByRole('group')).toBeVisible();
  });
});
