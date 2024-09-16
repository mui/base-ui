import * as React from 'react';
import { expect } from 'chai';
import * as Separator from '@base_ui/react/Separator';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Separator.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<Separator.Root />, () => ({
    render,
    refInstanceof: window.HTMLDivElement,
  }));

  it('renders a div with the `separator` role', async () => {
    const { getByRole } = await render(<Separator.Root />);
    expect(getByRole('separator')).toBeVisible();
  });
});
