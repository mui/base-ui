import * as React from 'react';
import { Tooltip } from '@base_ui/react/Tooltip';
import { screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Tooltip.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(<Tooltip.Popup />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Tooltip.Root open>
          <Tooltip.Positioner>{node}</Tooltip.Positioner>
        </Tooltip.Root>,
      );
    },
  }));

  it('should render the children', async () => {
    await render(
      <Tooltip.Root open>
        <Tooltip.Positioner>
          <Tooltip.Popup>Content</Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Root>,
    );

    expect(screen.getByText('Content')).not.to.equal(null);
  });
});
