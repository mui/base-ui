import * as React from 'react';
import { Popover } from '@base-ui-components/react/Popover';
import { screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Popover.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(<Popover.Popup />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Popover.Root open animated={false}>
          <Popover.Positioner>{node}</Popover.Positioner>
        </Popover.Root>,
      );
    },
  }));

  it('should render the children', async () => {
    await render(
      <Popover.Root open animated={false}>
        <Popover.Positioner>
          <Popover.Popup>Content</Popover.Popup>
        </Popover.Positioner>
      </Popover.Root>,
    );

    expect(screen.getByText('Content')).not.to.equal(null);
  });
});
