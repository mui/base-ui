import * as React from 'react';
import * as HoverCard from '@base_ui/react/HoverCard';
import { screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { describeConformance } from '../../../test/describeConformance';
import { createRenderer } from '../../../test';

describe('<Popover.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(<HoverCard.Popup />, () => ({
    inheritComponent: 'div',
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <HoverCard.Root open animated={false}>
          <HoverCard.Positioner>{node}</HoverCard.Positioner>
        </HoverCard.Root>,
      );
    },
    skip: ['reactTestRenderer'],
  }));

  it('should render the children', async () => {
    await render(
      <HoverCard.Root open animated={false}>
        <HoverCard.Positioner>
          <HoverCard.Popup>Content</HoverCard.Popup>
        </HoverCard.Positioner>
      </HoverCard.Root>,
    );

    expect(screen.getByText('Content')).not.to.equal(null);
  });
});
