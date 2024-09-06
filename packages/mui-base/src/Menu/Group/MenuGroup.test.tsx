import * as React from 'react';
import { expect } from 'chai';
import * as Menu from '@base_ui/react/Menu';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Menu.Group />', () => {
  const { render } = createRenderer();

  describeConformance(<Menu.Group />, () => ({
    render,
    refInstanceof: window.HTMLDivElement,
  }));

  it('renders a div with the `group` role', async () => {
    const { getByRole } = await render(<Menu.Group />);
    expect(getByRole('group')).toBeVisible();
  });
});
