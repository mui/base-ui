import * as React from 'react';
import { expect } from 'vitest';
import { Menu } from '@base-ui-components/react/menu';
import { createRenderer, describeConformance } from '#test-utils';

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
