import * as React from 'react';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { act, fireEvent, flushMicrotasks, screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { spy } from 'sinon';
import { createRenderer, isJSDOM } from '#test-utils';
import { OPEN_DELAY } from '../utils/constants';

function Root(props: Tooltip.Root.Props) {
  return <Tooltip.Root {...props} />;
}

describe('<Tooltip.Root />', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render, clock } = createRenderer();

  describe('uncontrolled open', () => {
    clock.withFakeTimers();

    it('should open when the trigger is hovered', async () => {
      await render(
        <Root>
          <Tooltip.Trigger />
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Root>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.pointerDown(trigger, { pointerType: 'mouse' });
      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      clock.tick(OPEN_DELAY);

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should close when the trigger is unhovered', async () => {
      await render(
        <Root>
          <Tooltip.Trigger />
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Root>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.pointerDown(trigger, { pointerType: 'mouse' });
      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      clock.tick(OPEN_DELAY);

      await flushMicrotasks();

      fireEvent.mouseLeave(trigger);

      expect(screen.queryByText('Content')).to.equal(null);
    });

    it('should open when the trigger is focused', async ({ skip }) => {
      if (isJSDOM) {
        skip();
      }

      await render(
        <Root>
          <Tooltip.Trigger />
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Root>,
      );

      const trigger = screen.getByRole('button');

      await act(async () => trigger.focus());

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should close when the trigger is blurred', async () => {
      await render(
        <Root>
          <Tooltip.Trigger />
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Root>,
      );

      const trigger = screen.getByRole('button');

      await act(async () => {
        trigger.focus();
      });

      clock.tick(OPEN_DELAY);
      await flushMicrotasks();

      await act(async () => {
        trigger.blur();
      });

      clock.tick(OPEN_DELAY);

      expect(screen.queryByText('Content')).to.equal(null);
    });
  });

  describe('controlled open', () => {
    clock.withFakeTimers();

    it('should open when controlled open is true', async () => {
      await render(
        <Root open>
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Root>,
      );

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should close when controlled open is false', async () => {
      await render(
        <Root open={false}>
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
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
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup>Content</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Root>
        );
      }

      await render(<App />);

      expect(screen.queryByText('Content')).to.equal(null);

      const trigger = screen.getByRole('button');

      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      clock.tick(OPEN_DELAY);

      await flushMicrotasks();

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
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup>Content</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Root>
        );
      }

      await render(<App />);

      expect(screen.queryByText('Content')).to.equal(null);

      const trigger = screen.getByRole('button');

      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      clock.tick(OPEN_DELAY);

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
          <Tooltip.Trigger />
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Root>,
      );

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should not open when the component is rendered and open is controlled', async () => {
      await render(
        <Root defaultOpen open={false}>
          <Tooltip.Trigger />
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Root>,
      );

      await flushMicrotasks();

      expect(screen.queryByText('Content')).to.equal(null);
    });

    it('should not close when the component is rendered and open is controlled', async () => {
      await render(
        <Root defaultOpen open>
          <Tooltip.Trigger />
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Root>,
      );

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should remain uncontrolled', async () => {
      await render(
        <Root defaultOpen>
          <Tooltip.Trigger />
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Root>,
      );

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);

      const trigger = screen.getByRole('button');

      fireEvent.mouseLeave(trigger);

      await flushMicrotasks();

      expect(screen.queryByText('Content')).to.equal(null);
    });
  });

  describe('prop: delay', () => {
    clock.withFakeTimers();

    it('should open after delay with rest type by default', async () => {
      await render(
        <Root delay={100}>
          <Tooltip.Trigger />
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Root>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      await flushMicrotasks();

      expect(screen.queryByText('Content')).to.equal(null);

      clock.tick(100);

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);
    });
  });

  describe('prop: closeDelay', () => {
    clock.withFakeTimers();

    it('should close after delay', async () => {
      await render(
        <Root closeDelay={100}>
          <Tooltip.Trigger />
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Root>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      clock.tick(OPEN_DELAY);

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);

      fireEvent.mouseLeave(trigger);

      expect(screen.getByText('Content')).not.to.equal(null);

      clock.tick(100);

      expect(screen.queryByText('Content')).to.equal(null);
    });
  });
});
