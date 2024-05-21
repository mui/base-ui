import * as React from 'react';
import * as Tooltip from '@base_ui/react/Tooltip';
import { act, createRenderer, fireEvent, screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { spy } from 'sinon';

const waitForPosition = async () => act(async () => {});

describe('<Tooltip.Root />', () => {
  const { render, clock } = createRenderer();

  describe('uncontrolled open', () => {
    clock.withFakeTimers();

    it('should open when the anchor is hovered', async () => {
      render(
        <Tooltip.Root>
          <Tooltip.Trigger />
          <Tooltip.Popup>Content</Tooltip.Popup>
        </Tooltip.Root>,
      );

      const anchor = screen.getByRole('button');

      fireEvent.pointerDown(anchor, { pointerType: 'mouse' });
      fireEvent.mouseEnter(anchor);
      fireEvent.mouseMove(anchor);

      clock.tick(200);

      await waitForPosition();

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should close when the anchor is unhovered', async () => {
      render(
        <Tooltip.Root>
          <Tooltip.Trigger />
          <Tooltip.Popup>Content</Tooltip.Popup>
        </Tooltip.Root>,
      );

      const anchor = screen.getByRole('button');

      fireEvent.pointerDown(anchor, { pointerType: 'mouse' });
      fireEvent.mouseEnter(anchor);
      fireEvent.mouseMove(anchor);

      clock.tick(200);

      await waitForPosition();

      fireEvent.mouseLeave(anchor);

      expect(screen.queryByText('Content')).to.equal(null);
    });

    it('should open when the anchor is focused', async () => {
      if (!/jsdom/.test(window.navigator.userAgent)) {
        // Ignore due to `:focus-visible` being required in the browser.
        return;
      }

      render(
        <Tooltip.Root>
          <Tooltip.Trigger />
          <Tooltip.Popup>Content</Tooltip.Popup>
        </Tooltip.Root>,
      );

      const anchor = screen.getByRole('button');

      act(() => anchor.focus());

      await waitForPosition();

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should close when the anchor is blurred', async () => {
      render(
        <Tooltip.Root>
          <Tooltip.Trigger />
          <Tooltip.Popup>Content</Tooltip.Popup>
        </Tooltip.Root>,
      );

      const anchor = screen.getByRole('button');

      act(() => anchor.focus());

      clock.tick(200);

      await waitForPosition();

      act(() => anchor.blur());

      clock.tick(200);

      expect(screen.queryByText('Content')).to.equal(null);
    });
  });

  describe('controlled open', () => {
    clock.withFakeTimers();

    it('should open when controlled open is true', async () => {
      render(
        <Tooltip.Root open>
          <Tooltip.Popup>Content</Tooltip.Popup>
        </Tooltip.Root>,
      );

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should close when controlled open is false', async () => {
      render(
        <Tooltip.Root open={false}>
          <Tooltip.Popup>Content</Tooltip.Popup>
        </Tooltip.Root>,
      );

      expect(screen.queryByText('Content')).to.equal(null);
    });

    it('should call onChange when the open state changes', async () => {
      const handleChange = spy();

      function App() {
        const [open, setOpen] = React.useState(false);

        return (
          <Tooltip.Root
            open={open}
            onOpenChange={(nextOpen) => {
              handleChange(open);
              setOpen(nextOpen);
            }}
          >
            <Tooltip.Trigger />
            <Tooltip.Popup data-testid="content">Content</Tooltip.Popup>
          </Tooltip.Root>
        );
      }

      render(<App />);

      expect(screen.queryByText('Content')).to.equal(null);

      const anchor = screen.getByRole('button');

      fireEvent.mouseEnter(anchor);
      fireEvent.mouseMove(anchor);

      clock.tick(200);

      await waitForPosition();

      expect(screen.getByText('Content')).not.to.equal(null);

      fireEvent.mouseLeave(anchor);

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
          <Tooltip.Root
            open={open}
            onOpenChange={(nextOpen) => {
              handleChange(open);
              setOpen(nextOpen);
            }}
          >
            <Tooltip.Trigger />
            <Tooltip.Popup data-testid="content">Content</Tooltip.Popup>
          </Tooltip.Root>
        );
      }

      render(<App />);

      expect(screen.queryByText('Content')).to.equal(null);

      const anchor = screen.getByRole('button');

      fireEvent.mouseEnter(anchor);
      fireEvent.mouseMove(anchor);

      clock.tick(200);

      await waitForPosition();

      expect(screen.getByText('Content')).not.to.equal(null);
      expect(handleChange.callCount).to.equal(1);
      expect(handleChange.firstCall.args[0]).to.equal(false);
    });
  });

  describe('prop: defaultOpen', () => {
    it('should open when the component is rendered', async () => {
      render(
        <Tooltip.Root defaultOpen>
          <Tooltip.Trigger />
          <Tooltip.Popup>Content</Tooltip.Popup>
        </Tooltip.Root>,
      );

      await waitForPosition();

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should not open when the component is rendered and open is controlled', async () => {
      render(
        <Tooltip.Root defaultOpen open={false}>
          <Tooltip.Trigger />
          <Tooltip.Popup>Content</Tooltip.Popup>
        </Tooltip.Root>,
      );

      await waitForPosition();

      expect(screen.queryByText('Content')).to.equal(null);
    });

    it('should not close when the component is rendered and open is controlled', async () => {
      render(
        <Tooltip.Root defaultOpen open>
          <Tooltip.Trigger />
          <Tooltip.Popup>Content</Tooltip.Popup>
        </Tooltip.Root>,
      );

      await waitForPosition();

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should remain uncontrolled', async () => {
      render(
        <Tooltip.Root defaultOpen>
          <Tooltip.Trigger />
          <Tooltip.Popup>Content</Tooltip.Popup>
        </Tooltip.Root>,
      );

      await waitForPosition();

      expect(screen.getByText('Content')).not.to.equal(null);

      const anchor = screen.getByRole('button');

      fireEvent.mouseLeave(anchor);

      await waitForPosition();

      expect(screen.queryByText('Content')).to.equal(null);
    });
  });

  describe('prop: delay', () => {
    clock.withFakeTimers();

    it('should open after delay with rest type by default', async () => {
      render(
        <Tooltip.Root delay={100}>
          <Tooltip.Trigger />
          <Tooltip.Popup>Content</Tooltip.Popup>
        </Tooltip.Root>,
      );

      const anchor = screen.getByRole('button');

      fireEvent.mouseEnter(anchor);
      fireEvent.mouseMove(anchor);

      await waitForPosition();

      expect(screen.queryByText('Content')).to.equal(null);

      clock.tick(100);

      await waitForPosition();

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should open after delay with hover type', async () => {
      render(
        <Tooltip.Root delayType="hover">
          <Tooltip.Trigger />
          <Tooltip.Popup>Content</Tooltip.Popup>
        </Tooltip.Root>,
      );

      const anchor = screen.getByRole('button');

      fireEvent.mouseEnter(anchor);
      clock.tick(100);

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
        <Tooltip.Root closeDelay={100}>
          <Tooltip.Trigger />
          <Tooltip.Popup>Content</Tooltip.Popup>
        </Tooltip.Root>,
      );

      const anchor = screen.getByRole('button');

      fireEvent.mouseEnter(anchor);
      fireEvent.mouseMove(anchor);

      clock.tick(200);

      await waitForPosition();

      expect(screen.getByText('Content')).not.to.equal(null);

      fireEvent.mouseLeave(anchor);

      expect(screen.getByText('Content')).not.to.equal(null);

      clock.tick(100);

      expect(screen.queryByText('Content')).to.equal(null);
    });
  });
});
