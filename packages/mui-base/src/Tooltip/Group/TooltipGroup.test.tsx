import * as React from 'react';
import * as Tooltip from '@base_ui/react/Tooltip';
import { createRenderer, act } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { fireEvent, screen } from '@testing-library/react';

const waitForPosition = async () => act(async () => {});

describe('<Tooltip.Group />', () => {
  const { render, clock } = createRenderer();

  describe('prop: delay', () => {
    clock.withFakeTimers();

    it('waits for the delay before showing the tooltip', async () => {
      render(
        <Tooltip.Group delay={10_000}>
          <Tooltip.Root animated={false}>
            <Tooltip.Trigger />
            <Tooltip.Popup>Content</Tooltip.Popup>
          </Tooltip.Root>
        </Tooltip.Group>,
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
        <Tooltip.Group closeDelay={400}>
          <Tooltip.Root animated={false}>
            <Tooltip.Trigger />
            <Tooltip.Popup>Content</Tooltip.Popup>
          </Tooltip.Root>
        </Tooltip.Group>,
      );

      const trigger = document.querySelector('button')!;

      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      clock.tick(200);

      await waitForPosition();

      expect(screen.queryByText('Content')).not.to.equal(null);

      fireEvent.mouseLeave(trigger);

      clock.tick(200);

      expect(screen.queryByText('Content')).not.to.equal(null);

      clock.tick(200);

      expect(screen.queryByText('Content')).to.equal(null);
    });
  });
});
