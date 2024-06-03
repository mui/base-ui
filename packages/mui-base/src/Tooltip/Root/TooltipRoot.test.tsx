import * as React from 'react';
import * as Tooltip from '@base_ui/react/Tooltip';
import { act, createRenderer, fireEvent, screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { spy } from 'sinon';

const waitForPosition = async () => act(async () => {});

function Root(props: Tooltip.RootProps) {
  return <Tooltip.Root animated={false} {...props} />;
}

describe('<Tooltip.Root />', () => {
  const { render, clock } = createRenderer();

  describe('uncontrolled open', () => {
    clock.withFakeTimers();

    it('should open when the trigger is hovered', async () => {
      render(
        <Root>
          <Tooltip.Trigger />
          <Tooltip.Positioner>
            <Tooltip.Popup>Content</Tooltip.Popup>
          </Tooltip.Positioner>
        </Root>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.pointerDown(trigger, { pointerType: 'mouse' });
      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      clock.tick(300);

      await waitForPosition();

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should close when the trigger is unhovered', async () => {
      render(
        <Root>
          <Tooltip.Trigger />
          <Tooltip.Positioner>
            <Tooltip.Popup>Content</Tooltip.Popup>
          </Tooltip.Positioner>
        </Root>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.pointerDown(trigger, { pointerType: 'mouse' });
      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      clock.tick(300);

      await waitForPosition();

      fireEvent.mouseLeave(trigger);

      expect(screen.queryByText('Content')).to.equal(null);
    });

    it('should open when the trigger is focused', async () => {
      if (!/jsdom/.test(window.navigator.userAgent)) {
        // Ignore due to `:focus-visible` being required in the browser.
        return;
      }

      render(
        <Root>
          <Tooltip.Trigger />
          <Tooltip.Positioner>
            <Tooltip.Popup>Content</Tooltip.Popup>
          </Tooltip.Positioner>
        </Root>,
      );

      const trigger = screen.getByRole('button');

      act(() => trigger.focus());

      await waitForPosition();

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should close when the trigger is blurred', async () => {
      render(
        <Root>
          <Tooltip.Trigger />
          <Tooltip.Positioner>
            <Tooltip.Popup>Content</Tooltip.Popup>
          </Tooltip.Positioner>
        </Root>,
      );

      const trigger = screen.getByRole('button');

      act(() => trigger.focus());

      clock.tick(300);

      await waitForPosition();

      act(() => trigger.blur());

      clock.tick(300);

      expect(screen.queryByText('Content')).to.equal(null);
    });
  });

  describe('controlled open', () => {
    clock.withFakeTimers();

    it('should open when controlled open is true', async () => {
      render(
        <Root open>
          <Tooltip.Positioner>
            <Tooltip.Popup>Content</Tooltip.Popup>
          </Tooltip.Positioner>
        </Root>,
      );

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should close when controlled open is false', async () => {
      render(
        <Root open={false}>
          <Tooltip.Positioner>
            <Tooltip.Popup>Content</Tooltip.Popup>
          </Tooltip.Positioner>
        </Root>,
      );

      expect(screen.queryByText('Content')).to.equal(null);
    });

    it('should call onOpenChange when the open state changes', async () => {
      const handleChange = spy();

      function App() {
        const [open, setOpen] = React.useState(false);

        return (
          <Root
            open={open}
            onOpenChange={(nextOpen) => {
              handleChange(open);
              setOpen(nextOpen);
            }}
          >
            <Tooltip.Trigger />
            <Tooltip.Positioner>
              <Tooltip.Popup>Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Root>
        );
      }

      render(<App />);

      expect(screen.queryByText('Content')).to.equal(null);

      const trigger = screen.getByRole('button');

      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      clock.tick(300);

      await waitForPosition();

      expect(screen.getByText('Content')).not.to.equal(null);

      fireEvent.mouseLeave(trigger);

      expect(screen.queryByText('Content')).to.equal(null);
      expect(handleChange.callCount).to.equal(2);
      expect(handleChange.firstCall.args[0]).to.equal(false);
      expect(handleChange.secondCall.args[0]).to.equal(true);
    });

    it('should not call onChange when the open state does not change', async () => {
      const handleChange = spy();

      function App() {
        const [open, setOpen] = React.useState(false);

        return (
          <Root
            open={open}
            onOpenChange={(nextOpen) => {
              handleChange(open);
              setOpen(nextOpen);
            }}
          >
            <Tooltip.Trigger />
            <Tooltip.Positioner>
              <Tooltip.Popup>Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Root>
        );
      }

      render(<App />);

      expect(screen.queryByText('Content')).to.equal(null);

      const trigger = screen.getByRole('button');

      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      clock.tick(300);

      await waitForPosition();

      expect(screen.getByText('Content')).not.to.equal(null);
      expect(handleChange.callCount).to.equal(1);
      expect(handleChange.firstCall.args[0]).to.equal(false);
    });
  });

  describe('prop: defaultOpen', () => {
    it('should open when the component is rendered', async () => {
      render(
        <Root defaultOpen>
          <Tooltip.Trigger />
          <Tooltip.Positioner>
            <Tooltip.Popup>Content</Tooltip.Popup>
          </Tooltip.Positioner>
        </Root>,
      );

      await waitForPosition();

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should not open when the component is rendered and open is controlled', async () => {
      render(
        <Root defaultOpen open={false}>
          <Tooltip.Trigger />
          <Tooltip.Positioner>
            <Tooltip.Popup>Content</Tooltip.Popup>
          </Tooltip.Positioner>
        </Root>,
      );

      await waitForPosition();

      expect(screen.queryByText('Content')).to.equal(null);
    });

    it('should not close when the component is rendered and open is controlled', async () => {
      render(
        <Root defaultOpen open>
          <Tooltip.Trigger />
          <Tooltip.Positioner>
            <Tooltip.Popup>Content</Tooltip.Popup>
          </Tooltip.Positioner>
        </Root>,
      );

      await waitForPosition();

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should remain uncontrolled', async () => {
      render(
        <Root defaultOpen>
          <Tooltip.Trigger />
          <Tooltip.Positioner>
            <Tooltip.Popup>Content</Tooltip.Popup>
          </Tooltip.Positioner>
        </Root>,
      );

      await waitForPosition();

      expect(screen.getByText('Content')).not.to.equal(null);

      const trigger = screen.getByRole('button');

      fireEvent.mouseLeave(trigger);

      await waitForPosition();

      expect(screen.queryByText('Content')).to.equal(null);
    });
  });

  describe('prop: delay', () => {
    clock.withFakeTimers();

    it('should open after delay with rest type by default', async () => {
      render(
        <Root delay={100}>
          <Tooltip.Trigger />
          <Tooltip.Positioner>
            <Tooltip.Popup>Content</Tooltip.Popup>
          </Tooltip.Positioner>
        </Root>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      await waitForPosition();

      expect(screen.queryByText('Content')).to.equal(null);

      clock.tick(100);

      await waitForPosition();

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should open after delay with hover type', async () => {
      render(
        <Root delayType="hover">
          <Tooltip.Trigger />
          <Tooltip.Positioner>
            <Tooltip.Popup>Content</Tooltip.Popup>
          </Tooltip.Positioner>
        </Root>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.mouseEnter(trigger);
      clock.tick(200);

      await waitForPosition();

      expect(screen.queryByText('Content')).to.equal(null);

      clock.tick(100);

      await waitForPosition();

      expect(screen.getByText('Content')).not.to.equal(null);
    });
  });

  describe('prop: closeDelay', () => {
    clock.withFakeTimers();

    it('should close after delay', async () => {
      render(
        <Root closeDelay={100}>
          <Tooltip.Trigger />
          <Tooltip.Positioner>
            <Tooltip.Popup>Content</Tooltip.Popup>
          </Tooltip.Positioner>
        </Root>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      clock.tick(300);

      await waitForPosition();

      expect(screen.getByText('Content')).not.to.equal(null);

      fireEvent.mouseLeave(trigger);

      expect(screen.getByText('Content')).not.to.equal(null);

      clock.tick(100);

      expect(screen.queryByText('Content')).to.equal(null);
    });
  });
});
