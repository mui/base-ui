import * as React from 'react';
import * as Popover from '@base_ui/react/Popover';
import { fireEvent, flushMicrotasks, screen, act } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { spy } from 'sinon';
import { createRenderer } from '../../../test';
import { OPEN_DELAY } from '../utils/constants';

function Root(props: Popover.RootProps) {
  return <Popover.Root {...props} animated={false} />;
}

describe('<Popover.Root />', () => {
  const { render, clock } = createRenderer();

  it('should render the children', async () => {
    await render(
      <Root>
        <Popover.Trigger>Content</Popover.Trigger>
      </Root>,
    );

    expect(screen.getByText('Content')).not.to.equal(null);
  });

  describe('uncontrolled open', () => {
    it('should open when the anchor is clicked', async () => {
      await render(
        <Root>
          <Popover.Trigger />
          <Popover.Positioner>
            <Popover.Popup>Content</Popover.Popup>
          </Popover.Positioner>
        </Root>,
      );

      const anchor = screen.getByRole('button');

      fireEvent.click(anchor);

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should close when the anchor is clicked twice', async () => {
      await render(
        <Root>
          <Popover.Trigger />
          <Popover.Positioner>
            <Popover.Popup>Content</Popover.Popup>
          </Popover.Positioner>
        </Root>,
      );

      const anchor = screen.getByRole('button');

      fireEvent.click(anchor);

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);

      fireEvent.click(anchor);

      expect(screen.queryByText('Content')).to.equal(null);
    });
  });

  describe('controlled open', () => {
    it('should open when controlled open is true', async () => {
      await render(
        <Root open>
          <Popover.Positioner>
            <Popover.Popup>Content</Popover.Popup>
          </Popover.Positioner>
        </Root>,
      );

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should close when controlled open is false', async () => {
      await render(
        <Root open={false}>
          <Popover.Positioner>
            <Popover.Popup>Content</Popover.Popup>
          </Popover.Positioner>
        </Root>,
      );

      expect(screen.queryByText('Content')).to.equal(null);
    });

    it('should call onChange when the open state changes', async () => {
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
            <Popover.Trigger />
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Root>
        );
      }

      await render(<App />);

      expect(screen.queryByText('Content')).to.equal(null);

      const anchor = screen.getByRole('button');

      fireEvent.click(anchor);

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);

      fireEvent.click(anchor);

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
            <Popover.Trigger />
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Root>
        );
      }

      await render(<App />);

      expect(screen.queryByText('Content')).to.equal(null);

      const anchor = screen.getByRole('button');

      fireEvent.click(anchor);

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);
      expect(handleChange.callCount).to.equal(1);
      expect(handleChange.firstCall.args[0]).to.equal(false);
    });
  });

  describe('prop: defaultOpen', () => {
    it('should open when the component is rendered', async () => {
      await render(
        <Root defaultOpen>
          <Popover.Trigger />
          <Popover.Positioner>
            <Popover.Popup>Content</Popover.Popup>
          </Popover.Positioner>
        </Root>,
      );

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should not open when the component is rendered and open is controlled', async () => {
      await render(
        <Root defaultOpen open={false}>
          <Popover.Trigger />
          <Popover.Positioner>
            <Popover.Popup>Content</Popover.Popup>
          </Popover.Positioner>
        </Root>,
      );

      expect(screen.queryByText('Content')).to.equal(null);
    });

    it('should not close when the component is rendered and open is controlled', async () => {
      await render(
        <Root defaultOpen open>
          <Popover.Trigger />
          <Popover.Positioner>
            <Popover.Popup>Content</Popover.Popup>
          </Popover.Positioner>
        </Root>,
      );

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should remain uncontrolled', async () => {
      await render(
        <Root defaultOpen>
          <Popover.Trigger data-testid="trigger" />
          <Popover.Positioner>
            <Popover.Popup>Content</Popover.Popup>
          </Popover.Positioner>
        </Root>,
      );

      expect(screen.getByText('Content')).not.to.equal(null);

      const anchor = screen.getByTestId('trigger');

      fireEvent.click(anchor);

      expect(screen.queryByText('Content')).to.equal(null);
    });
  });

  describe('prop: delay', () => {
    clock.withFakeTimers();

    it('should open after delay with rest type by default', async () => {
      await render(
        <Root openOnHover delay={100}>
          <Popover.Trigger />
          <Popover.Positioner>
            <Popover.Popup>Content</Popover.Popup>
          </Popover.Positioner>
        </Root>,
      );

      const anchor = screen.getByRole('button');

      fireEvent.mouseEnter(anchor);
      fireEvent.mouseMove(anchor);

      await flushMicrotasks();

      expect(screen.queryByText('Content')).to.equal(null);

      clock.tick(100);

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should open after delay with hover type', async () => {
      await render(
        <Root openOnHover delayType="hover">
          <Popover.Trigger />
          <Popover.Positioner>
            <Popover.Popup>Content</Popover.Popup>
          </Popover.Positioner>
        </Root>,
      );

      const anchor = screen.getByRole('button');

      fireEvent.mouseEnter(anchor);
      clock.tick(OPEN_DELAY / 2);

      await flushMicrotasks();

      expect(screen.queryByText('Content')).to.equal(null);

      clock.tick(OPEN_DELAY / 2);

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);
    });
  });

  describe('prop: closeDelay', () => {
    clock.withFakeTimers();

    it('should close after delay', async () => {
      await render(
        <Root openOnHover closeDelay={100}>
          <Popover.Trigger />
          <Popover.Positioner>
            <Popover.Popup>Content</Popover.Popup>
          </Popover.Positioner>
        </Root>,
      );

      const anchor = screen.getByRole('button');

      fireEvent.mouseEnter(anchor);
      fireEvent.mouseMove(anchor);

      clock.tick(OPEN_DELAY);

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);

      fireEvent.mouseLeave(anchor);

      clock.tick(50);

      expect(screen.getByText('Content')).not.to.equal(null);

      clock.tick(50);

      expect(screen.queryByText('Content')).to.equal(null);
    });
  });

  it('focuses the trigger after the popover is closed but not unmounted', async () => {
    await render(
      <div>
        <input type="text" />
        <Popover.Root animated={false}>
          <Popover.Trigger>Toggle</Popover.Trigger>
          <Popover.Positioner keepMounted>
            <Popover.Popup>
              <Popover.Close>Close</Popover.Close>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Root>
        <input type="text" />
      </div>,
    );

    const toggle = screen.getByRole('button', { name: 'Toggle' });

    act(() => {
      toggle.focus();
    });

    fireEvent.click(toggle);

    await flushMicrotasks();

    const close = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(close);

    expect(toggle).toHaveFocus();
  });
});
