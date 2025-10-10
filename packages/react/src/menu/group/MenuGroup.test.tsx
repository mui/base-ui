import * as React from 'react';
import { screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { Menu } from '@base-ui-components/react/menu';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Menu.Group />', () => {
  const { render } = createRenderer();

  describeConformance(<Menu.Group />, () => ({
    render,
    refInstanceof: window.HTMLDivElement,
  }));

  it('renders a div with the `group` role', async () => {
    await render(<Menu.Group />);
    expect(screen.getByRole('group')).toBeVisible();
  });
});
