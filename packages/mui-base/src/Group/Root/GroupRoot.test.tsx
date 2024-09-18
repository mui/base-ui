import * as React from 'react';
import { expect } from 'chai';
import * as Group from '@base_ui/react/Group';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Group.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<Group.Root />, () => ({
    render,
    refInstanceof: window.HTMLDivElement,
  }));

  it('renders a div with the `group` role', async () => {
    const { getByRole } = await render(<Group.Root />);
    expect(getByRole('group')).toBeVisible();
  });
});
