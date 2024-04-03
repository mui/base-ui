import * as React from 'react';
import * as Tooltip from '@base_ui/react/Tooltip';
import { createRenderer, screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { describeConformance } from '../../test/describeConformance';

describe('<Tooltip.Content />', () => {
  const { render } = createRenderer();

  describeConformance(<Tooltip.Content />, () => ({
    inheritComponent: 'div',
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Tooltip.Root open>{node}</Tooltip.Root>);
    },
    skip: ['reactTestRenderer'],
  }));

  it('should render the children', () => {
    render(
      <Tooltip.Root open>
        <Tooltip.Content>Content</Tooltip.Content>
      </Tooltip.Root>,
    );

    expect(screen.getByText('Content')).not.to.equal(null);
  });
});
