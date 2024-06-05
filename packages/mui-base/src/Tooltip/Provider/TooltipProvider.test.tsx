import * as React from 'react';
import * as Tooltip from '@base_ui/react/Tooltip';
import { createRenderer, act, screen, fireEvent } from '@mui/internal-test-utils';
import { expect } from 'chai';

const waitForPosition = async () => act(async () => {});

describe('<Tooltip.Provider />', () => {
  const { render, clock } = createRenderer();

  describe('prop: delay', () => {
    clock.withFakeTimers();

    it('waits for the delay before showing the tooltip', async () => {
      render(
        <Tooltip.Provider delay={10_000}>
          <Tooltip.Root animated={false}>
            <Tooltip.Trigger />
            <Tooltip.Positioner>
              <Tooltip.Popup>Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Root>
        </Tooltip.Provider>,
      );

      const trigger = document.querySelector('button')!;

      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      expect(screen.queryByText('Content')).to.equal(null);

      clock.tick(1_000);

      expect(screen.queryByText('Content')).to.equal(null);

      clock.tick(9_000);

      await waitForPosition();

      expect(screen.queryByText('Content')).not.to.equal(null);
    });
  });

  describe('prop: closeDelay', () => {
    clock.withFakeTimers();

    it('waits for the closeDelay before hiding the tooltip', async () => {
      render(
        <Tooltip.Provider closeDelay={400}>
          <Tooltip.Root animated={false}>
            <Tooltip.Trigger />
            <Tooltip.Positioner>
              <Tooltip.Popup>Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Root>
        </Tooltip.Provider>,
      );

      const trigger = document.querySelector('button')!;

      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      clock.tick(300);

      await waitForPosition();

      expect(screen.queryByText('Content')).not.to.equal(null);

      fireEvent.mouseLeave(trigger);

      clock.tick(300);

      expect(screen.queryByText('Content')).not.to.equal(null);

      clock.tick(300);

      expect(screen.queryByText('Content')).to.equal(null);
    });
  });
});
