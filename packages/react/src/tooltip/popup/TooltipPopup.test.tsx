import * as React from 'react';
import { Tooltip } from '@base-ui-components/react/tooltip';
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
          <Tooltip.Portal>
            <Tooltip.Positioner>{node}</Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>,
      );
    },
  }));

  it('should render the children', async () => {
    await render(
      <Tooltip.Root open>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup>Content</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>,
    );

    expect(screen.getByText('Content')).not.to.equal(null);
  });

  it('describes the trigger element with its generated id', async () => {
    const { getByRole } = await render(
      <Tooltip.Root open>
        <Tooltip.Trigger>Open</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup>Content</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>,
    );

    const trigger = getByRole('button', { name: 'Open' });
    const popup = getByRole('tooltip');
    expect(trigger).to.have.attribute('aria-describedby', popup.id);
  });

  it('describes the trigger element with its provided id', async () => {
    const id = 'custom-tooltip-id';
    const { getByRole } = await render(
      <Tooltip.Root open>
        <Tooltip.Trigger>Open</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup id={id}>Content</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>,
    );

    const trigger = getByRole('button', { name: 'Open' });
    expect(trigger).to.have.attribute('aria-describedby', id);
  });
});
