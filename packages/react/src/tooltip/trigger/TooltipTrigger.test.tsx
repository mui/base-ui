import * as React from 'react';
import { Tooltip } from '@base-ui/react/tooltip';
import { screen, waitFor } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Tooltip.Trigger />', () => {
  const { render } = createRenderer();

  describeConformance(<Tooltip.Trigger />, () => ({
    refInstanceof: window.HTMLButtonElement,
    render(node) {
      return render(<Tooltip.Root>{node}</Tooltip.Root>);
    },
  }));

  it('removes `data-popup-open` as soon as `open` becomes false', async () => {
    function TooltipWithPreventedUnmount() {
      const [open, setOpen] = React.useState(false);

      return (
        <Tooltip.Root
          open={open}
          onOpenChange={(nextOpen, eventDetails) => {
            if (!nextOpen) {
              eventDetails.preventUnmountOnClose();
            }
            setOpen(nextOpen);
          }}
        >
          <Tooltip.Trigger data-testid="trigger" delay={0} closeDelay={0}>
            Trigger
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      );
    }

    const { user } = await render(<TooltipWithPreventedUnmount />);
    const trigger = screen.getByTestId('trigger');

    await user.hover(trigger);
    await waitFor(() => {
      expect(trigger).to.have.attribute('data-popup-open');
    });

    await user.unhover(trigger);
    await waitFor(() => {
      expect(trigger).not.to.have.attribute('data-popup-open');
    });

    expect(screen.getByText('Content')).not.to.equal(null);
  });
});
