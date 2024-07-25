import * as React from 'react';
import * as PreviewCard from '@base_ui/react/PreviewCard';
import { act, createRenderer, fireEvent, screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { spy } from 'sinon';
import { CLOSE_DELAY, OPEN_DELAY } from '../utils/constants';

const waitForPosition = async () => act(async () => {});

function Root(props: PreviewCard.RootProps) {
  return <PreviewCard.Root animated={false} {...props} />;
}

function Trigger(props: PreviewCard.TriggerProps) {
  return <PreviewCard.Trigger href="#" {...props} />;
}

describe('<PreviewCard.Root />', () => {
  const { render, clock } = createRenderer();

  describe('uncontrolled open', () => {
    clock.withFakeTimers();

    it('should open when the trigger is hovered', async () => {
      render(
        <Root>
          <Trigger />
          <PreviewCard.Positioner>
            <PreviewCard.Popup>Content</PreviewCard.Popup>
          </PreviewCard.Positioner>
        </Root>,
      );

      const trigger = screen.getByRole('link');

      fireEvent.pointerDown(trigger, { pointerType: 'mouse' });
      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      clock.tick(OPEN_DELAY);

      await waitForPosition();

      expect(screen.getByText('Content')).not.to.equal(null);
    });
  });
});
