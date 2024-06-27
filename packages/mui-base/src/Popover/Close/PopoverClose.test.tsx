import * as React from 'react';
import * as Popover from '@base_ui/react/Popover';
import { fireEvent, screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { createRenderer } from '../../../test';
import { describeConformance } from '../../../test/describeConformance';

describe('<Popover.Close />', () => {
  const { render } = createRenderer();

  describeConformance(<Popover.Close />, () => ({
    inheritComponent: 'button',
    refInstanceof: window.HTMLButtonElement,
    render(node) {
      return render(
        <Popover.Root open animated={false}>
          <Popover.Positioner>
            <Popover.Popup>{node}</Popover.Popup>
          </Popover.Positioner>
        </Popover.Root>,
      );
    },
    skip: ['reactTestRenderer'],
  }));

  it('should close popover when clicked', async () => {
    await render(
      <Popover.Root defaultOpen animated={false}>
        <Popover.Positioner>
          <Popover.Popup>
            Content
            <Popover.Close data-testid="close" />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Root>,
    );

    expect(screen.queryByText('Content')).not.to.equal(null);

    fireEvent.click(screen.getByTestId('close'));

    expect(screen.queryByText('Content')).to.equal(null);
  });
});
