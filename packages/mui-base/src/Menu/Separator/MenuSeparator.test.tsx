import * as React from 'react';
import { expect } from 'chai';
import * as Menu from '@base_ui/react/Menu';
import { createRenderer, describeConformance } from '../../../test';

describe('<Menu.Separator />', () => {
  const { render } = createRenderer();

  describeConformance(<Menu.Separator />, () => ({
    render,
    refInstanceof: window.HTMLDivElement,
  }));

  it('renders a div with the `separator` role', async () => {
    const { getByRole } = await render(<Menu.Separator />);
    expect(getByRole('separator')).toBeVisible();
  });
});
