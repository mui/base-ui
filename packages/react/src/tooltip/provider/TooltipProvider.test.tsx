import { expect } from 'vitest';
import { Tooltip } from '@base-ui/react/tooltip';
import { act, screen, fireEvent, flushMicrotasks } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { OPEN_DELAY } from '../utils/constants';

describe('<Tooltip.Provider />', () => {
  const { render, clock } = createRenderer();

  async function tick(ms: number) {
    await flushMicrotasks();
    await act(async () => {
      await clock.tickAsync(ms);
    });
    await flushMicrotasks();
  }

  describe('prop: delay', () => {
    clock.withFakeTimers();

    it('waits for the delay before showing the tooltip', async () => {
      await render(
        <Tooltip.Provider delay={10_000}>
          <Tooltip.Root>
            <Tooltip.Trigger />
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup>Content</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      await flushMicrotasks();

      expect(screen.queryByText('Content')).toBe(null);

      await tick(1_000);

      expect(screen.queryByText('Content')).toBe(null);

      await tick(9_000);

      expect(screen.queryByText('Content')).not.toBe(null);
    });

    it('respects delay=0', async () => {
      await render(
        <Tooltip.Provider delay={0}>
          <Tooltip.Root>
            <Tooltip.Trigger />
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup>Content</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      await flushMicrotasks();

      await tick(0);

      expect(screen.queryByText('Content')).not.toBe(null);
    });

    it('respects trigger delay prop over provider delay prop', async () => {
      await render(
        <Tooltip.Provider delay={10}>
          <Tooltip.Root>
            <Tooltip.Trigger delay={100} />
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup>Content</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      await flushMicrotasks();

      expect(screen.queryByText('Content')).toBe(null);

      await tick(99);

      expect(screen.queryByText('Content')).toBe(null);

      await tick(1);

      expect(screen.queryByText('Content')).not.toBe(null);
    });
  });

  describe('prop: closeDelay', () => {
    clock.withFakeTimers();

    it('waits for the closeDelay before hiding the tooltip', async () => {
      await render(
        <Tooltip.Provider closeDelay={400}>
          <Tooltip.Root>
            <Tooltip.Trigger />
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup>Content</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      await flushMicrotasks();

      await tick(OPEN_DELAY);

      expect(screen.queryByText('Content')).not.toBe(null);

      fireEvent.mouseLeave(trigger);

      await flushMicrotasks();

      await tick(300);

      expect(screen.queryByText('Content')).not.toBe(null);

      await tick(300);

      expect(screen.queryByText('Content')).toBe(null);
    });

    it('uses the latest closeDelay after the prop updates', async () => {
      function Test({ closeDelay }: { closeDelay: number }) {
        return (
          <Tooltip.Provider closeDelay={closeDelay}>
            <Tooltip.Root>
              <Tooltip.Trigger />
              <Tooltip.Portal>
                <Tooltip.Positioner>
                  <Tooltip.Popup>Content</Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        );
      }

      const { rerender } = await render(<Test closeDelay={400} />);

      const trigger = screen.getByRole('button');

      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      await flushMicrotasks();

      await tick(OPEN_DELAY);

      expect(screen.queryByText('Content')).not.toBe(null);

      await rerender(<Test closeDelay={1000} />);

      fireEvent.mouseLeave(trigger);

      await flushMicrotasks();

      await tick(999);

      expect(screen.queryByText('Content')).not.toBe(null);

      await tick(1);

      expect(screen.queryByText('Content')).toBe(null);
    });
  });

  describe('prop: timeout', () => {
    clock.withFakeTimers();

    function TwoTooltips({ timeout }: { timeout: number }) {
      return (
        <Tooltip.Provider delay={100} timeout={timeout}>
          {['One', 'Two'].map((name) => (
            <Tooltip.Root key={name}>
              <Tooltip.Trigger>{name}</Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Positioner>
                  <Tooltip.Popup>{`Content ${name}`}</Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </Tooltip.Root>
          ))}
        </Tooltip.Provider>
      );
    }

    it('opens an adjacent tooltip instantly while the group is active', async () => {
      await render(<TwoTooltips timeout={400} />);

      const first = screen.getByRole('button', { name: 'One' });
      const second = screen.getByRole('button', { name: 'Two' });

      fireEvent.mouseEnter(first);
      fireEvent.mouseMove(first);
      await flushMicrotasks();
      await tick(100);

      expect(screen.queryByText('Content One')).not.toBe(null);

      fireEvent.mouseLeave(first);
      fireEvent.mouseEnter(second);
      fireEvent.mouseMove(second);
      await flushMicrotasks();
      await tick(0);

      expect(screen.queryByText('Content Two')).not.toBe(null);
      expect(screen.queryByText('Content One')).toBe(null);
    });

    it('requires the full delay again once the timeout elapses', async () => {
      await render(<TwoTooltips timeout={400} />);

      const first = screen.getByRole('button', { name: 'One' });
      const second = screen.getByRole('button', { name: 'Two' });

      fireEvent.mouseEnter(first);
      fireEvent.mouseMove(first);
      await flushMicrotasks();
      await tick(100);

      expect(screen.queryByText('Content One')).not.toBe(null);

      fireEvent.mouseLeave(first);
      await flushMicrotasks();
      await tick(400);

      fireEvent.mouseEnter(second);
      fireEvent.mouseMove(second);
      await flushMicrotasks();

      expect(screen.queryByText('Content Two')).toBe(null);

      await tick(100);

      expect(screen.queryByText('Content Two')).not.toBe(null);
    });
  });
});
