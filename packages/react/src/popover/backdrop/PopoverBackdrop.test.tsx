import * as React from 'react';
import { Popover } from '@base-ui-components/react/popover';
import { createRenderer, describeConformance } from '#test-utils';
import { fireEvent, screen } from '@mui/internal-test-utils';

describe('<Popover.Backdrop />', () => {
  const { render } = createRenderer();

  describeConformance(<Popover.Backdrop />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Popover.Root open>{node}</Popover.Root>);
    },
  }));

  it.only('sets `pointer-events: none` style on backdrop if opened by hover', async () => {
    const { user } = await render(
      <Popover.Root delay={0} closeDelay={0} openOnHover>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Portal>
          <Popover.Backdrop data-testid="backdrop" />
          <Popover.Positioner>
            <Popover.Popup />
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>,
    );

    fireEvent.click(screen.getByText('Open'));

    expect(screen.getByTestId('backdrop').style.pointerEvents).not.to.equal('none');

    fireEvent.click(screen.getByText('Open'));
    await user.hover(screen.getByText('Open'));

    expect(screen.getByTestId('backdrop').style.pointerEvents).to.equal('none');
  });
});
