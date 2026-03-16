import * as React from 'react';
import { screen, fireEvent } from '@mui/internal-test-utils';
import { expect, vi } from 'vitest';
import { Calendar } from '@base-ui/react/calendar';
import { LocalizationProvider } from '@base-ui/react/localization-provider';
import { createRenderer, createTemporalRenderer, describeConformance } from '#test-utils';

describe('<Calendar.IncrementMonth />', () => {
  const { render, adapter } = createTemporalRenderer();

  describeConformance(<Calendar.IncrementMonth />, () => ({
    refInstanceof: window.HTMLButtonElement,
    button: true,
    render(node) {
      return render(<Calendar.Root>{node}</Calendar.Root>);
    },
  }));

  describe('visible date update', () => {
    it('should keep the day and time of the previous visible date when clicked', async () => {
      const onVisibleDateChange = vi.fn();

      const { user } = render(
        <Calendar.Root
          onVisibleDateChange={onVisibleDateChange}
          visibleDate={adapter.date('2025-02-05T12:01:02.003Z', 'default')}
        >
          <Calendar.IncrementMonth />
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');

      await user.click(button);
      expect(onVisibleDateChange.mock.calls.length).toBe(1);
      expect(onVisibleDateChange.mock.calls[0][0]).toEqualDateTime('2025-03-05T12:01:02.003Z');
    });

    it("should call onVisibleDateChange with reason 'month-change' when clicked", async () => {
      const onVisibleDateChange = vi.fn();

      const { user } = render(
        <Calendar.Root
          onVisibleDateChange={onVisibleDateChange}
          visibleDate={adapter.date('2025-02-05', 'default')}
        >
          <Calendar.IncrementMonth />
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');

      await user.click(button);
      expect(onVisibleDateChange.mock.calls.length).toBe(1);
      expect(onVisibleDateChange.mock.calls[0][1].reason).toBe('month-change');
    });
  });

  describe('disabled state', () => {
    it('should be disabled when props.disabled is true', () => {
      render(
        <Calendar.Root>
          <Calendar.IncrementMonth disabled />
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button).not.toHaveAttribute('disabled');
      expect(button).toHaveAttribute('data-disabled');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should be disabled when the Calendar is disabled', () => {
      render(
        <Calendar.Root disabled>
          <Calendar.IncrementMonth />
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button).not.toHaveAttribute('disabled');
      expect(button).toHaveAttribute('data-disabled');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should be disabled when the target month is after the maxDate month', () => {
      render(
        <Calendar.Root
          maxDate={adapter.date('2025-01-10', 'default')}
          visibleDate={adapter.date('2025-01-01', 'default')}
        >
          <Calendar.IncrementMonth />
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button).not.toHaveAttribute('disabled');
      expect(button).toHaveAttribute('data-disabled');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should not be disabled when the target month is equal to the maxDate month', () => {
      render(
        <Calendar.Root
          maxDate={adapter.date('2025-01-10', 'default')}
          visibleDate={adapter.date('2024-12-01', 'default')}
        >
          <Calendar.IncrementMonth />
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button).not.toHaveAttribute('disabled');
      expect(button).not.toHaveAttribute('data-disabled');
    });

    it('should not be disabled when disabled is false and the target month is after the maxDate month', () => {
      render(
        <Calendar.Root
          maxDate={adapter.date('2025-01-10', 'default')}
          visibleDate={adapter.date('2025-01-01', 'default')}
        >
          <Calendar.IncrementMonth disabled={false} />
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button).not.toHaveAttribute('disabled');
      expect(button).not.toHaveAttribute('data-disabled');
    });

    it('should navigate to the next month when disabled is false even if the target month is after the maxDate month', async () => {
      const onVisibleDateChange = vi.fn();

      const { user } = render(
        <Calendar.Root
          maxDate={adapter.date('2025-01-10', 'default')}
          visibleDate={adapter.date('2025-01-01', 'default')}
          onVisibleDateChange={onVisibleDateChange}
        >
          <Calendar.IncrementMonth disabled={false} />
        </Calendar.Root>,
      );

      await user.click(screen.getByRole('button'));
      expect(onVisibleDateChange.mock.calls.length).toBe(1);
    });
  });

  describe('press and hold', () => {
    const { render: renderWithClock, clock } = createRenderer();
    clock.withFakeTimers();

    function renderCalendar(props: Record<string, any> = {}) {
      return renderWithClock(
        <LocalizationProvider>
          <Calendar.Root defaultVisibleDate={adapter.date('2025-01-15', 'default')} {...props}>
            <Calendar.IncrementMonth data-testid="increment" />
          </Calendar.Root>
        </LocalizationProvider>,
      );
    }

    it('should navigate continuously when holding pointerdown', async () => {
      const onVisibleDateChange = vi.fn();
      await renderCalendar({ onVisibleDateChange });

      const button = screen.getByTestId('increment');

      fireEvent.pointerDown(button);

      // First tick fires immediately
      expect(onVisibleDateChange.mock.calls.length).toBe(1);

      // Wait for initial delay (400ms)
      clock.tick(400);

      // Continuous ticks at 100ms intervals
      clock.tick(100);
      expect(onVisibleDateChange.mock.calls.length).toBe(2);

      clock.tick(100);
      expect(onVisibleDateChange.mock.calls.length).toBe(3);

      clock.tick(100);
      expect(onVisibleDateChange.mock.calls.length).toBe(4);

      fireEvent.pointerUp(button);

      // Should stop after pointer up
      clock.tick(100);
      expect(onVisibleDateChange.mock.calls.length).toBe(4);
    });

    it("should call onVisibleDateChange with reason 'month-change' when holding pointerdown", async () => {
      const onVisibleDateChange = vi.fn();
      await renderCalendar({ onVisibleDateChange });

      const button = screen.getByTestId('increment');

      fireEvent.pointerDown(button);

      expect(onVisibleDateChange.mock.calls.length).toBe(1);
      expect(onVisibleDateChange.mock.calls[0][1].reason).toBe('month-change');

      fireEvent.pointerUp(button);
    });

    it('should stop at maxDate boundary', async () => {
      const onVisibleDateChange = vi.fn();
      await renderCalendar({
        defaultVisibleDate: adapter.date('2025-01-15', 'default'),
        maxDate: adapter.date('2025-03-31', 'default'),
        onVisibleDateChange,
      });

      const button = screen.getByTestId('increment');

      fireEvent.pointerDown(button);

      // First tick: Jan -> Feb
      expect(onVisibleDateChange.mock.calls.length).toBe(1);

      clock.tick(400);

      // Second tick: Feb -> Mar
      clock.tick(100);
      expect(onVisibleDateChange.mock.calls.length).toBe(2);

      // Third tick would go to Apr which is after maxDate, should stop
      clock.tick(100);
      expect(onVisibleDateChange.mock.calls.length).toBe(2);

      fireEvent.pointerUp(button);
    });

    it('should continue navigating past the maxDate boundary when disabled is false', async () => {
      const onVisibleDateChange = vi.fn();
      await renderWithClock(
        <LocalizationProvider>
          <Calendar.Root
            defaultVisibleDate={adapter.date('2025-01-15', 'default')}
            maxDate={adapter.date('2025-03-31', 'default')}
            onVisibleDateChange={onVisibleDateChange}
          >
            <Calendar.IncrementMonth data-testid="increment" disabled={false} />
          </Calendar.Root>
        </LocalizationProvider>,
      );

      const button = screen.getByTestId('increment');

      fireEvent.pointerDown(button);

      // First tick: Jan → Feb
      expect(onVisibleDateChange.mock.calls.length).toBe(1);

      clock.tick(400);

      // Second tick: Feb → Mar
      clock.tick(100);
      expect(onVisibleDateChange.mock.calls.length).toBe(2);

      // Third tick: Mar → Apr — would stop at boundary without the fix
      clock.tick(100);
      expect(onVisibleDateChange.mock.calls.length).toBe(3);

      fireEvent.pointerUp(button);
    });

    it('should use the controlled visibleDate for each tick', async () => {
      const onVisibleDateChange = vi.fn();

      function ControlledCalendar() {
        const [visibleDate, setVisibleDate] = React.useState(() =>
          adapter.date('2025-01-15', 'default'),
        );
        return (
          <LocalizationProvider>
            <Calendar.Root
              visibleDate={visibleDate}
              onVisibleDateChange={(date, details) => {
                setVisibleDate(date);
                onVisibleDateChange(date, details);
              }}
            >
              <Calendar.IncrementMonth data-testid="increment" />
            </Calendar.Root>
          </LocalizationProvider>
        );
      }

      await renderWithClock(<ControlledCalendar />);
      const button = screen.getByTestId('increment');

      fireEvent.pointerDown(button);

      // First tick fires immediately: Jan -> Feb
      expect(onVisibleDateChange.mock.calls.length).toBe(1);
      expect(onVisibleDateChange.mock.calls[0][0]).toEqualDateTime('2025-02-15');

      clock.tick(400);

      // Second tick: Feb -> Mar
      clock.tick(100);
      expect(onVisibleDateChange.mock.calls.length).toBe(2);
      expect(onVisibleDateChange.mock.calls[1][0]).toEqualDateTime('2025-03-15');

      // Third tick: Mar -> Apr
      clock.tick(100);
      expect(onVisibleDateChange.mock.calls.length).toBe(3);
      expect(onVisibleDateChange.mock.calls[2][0]).toEqualDateTime('2025-04-15');

      fireEvent.pointerUp(button);
    });

    describe('touch (Android)', () => {
      it('should navigate once on a quick touch tap', async () => {
        const onVisibleDateChange = vi.fn();
        await renderCalendar({ onVisibleDateChange });

        const button = screen.getByTestId('increment');

        // Simulate a quick touch tap: pointerdown then immediate pointerup
        fireEvent.pointerDown(button, { pointerType: 'touch' });
        fireEvent.pointerUp(button, { pointerType: 'touch' });

        // Quick tap: auto-change should not have started (released before 50ms)
        expect(onVisibleDateChange.mock.calls.length).toBe(0);

        // The browser fires a synthesized click after touch up; this should trigger navigation
        fireEvent.click(button, { detail: 1 });
        expect(onVisibleDateChange.mock.calls.length).toBe(1);
      });

      it('should navigate continuously on touch hold and ignore the synthesized click after release', async () => {
        const onVisibleDateChange = vi.fn();
        await renderCalendar({ onVisibleDateChange });

        const button = screen.getByTestId('increment');

        fireEvent.pointerDown(button, { pointerType: 'touch' });

        // Wait past the TOUCH_TIMEOUT (50ms) to confirm it's an intentional hold
        clock.tick(50);

        // First tick fires immediately after intent confirmed
        expect(onVisibleDateChange.mock.calls.length).toBe(1);

        // Wait for initial delay (400ms) and one tick
        clock.tick(400);
        clock.tick(100);
        expect(onVisibleDateChange.mock.calls.length).toBe(2);

        fireEvent.pointerUp(button, { pointerType: 'touch' });

        // The browser fires a synthesized click after touch hold; it must be suppressed
        fireEvent.click(button, { detail: 1 });
        expect(onVisibleDateChange.mock.calls.length).toBe(2);
      });

      it('should not start auto-change when the touch moves more than 8px (scroll gesture)', async () => {
        const onVisibleDateChange = vi.fn();
        await renderCalendar({ onVisibleDateChange });

        const button = screen.getByTestId('increment');

        fireEvent.pointerDown(button, { pointerType: 'touch', clientX: 0, clientY: 0 });

        // Move pointer by 9px — exceeds the 8px scroll threshold
        fireEvent.pointerMove(button, { pointerType: 'touch', clientX: 9, clientY: 0 });

        clock.tick(50);

        // Auto-change should not have started due to scroll detection
        expect(onVisibleDateChange.mock.calls.length).toBe(0);

        fireEvent.pointerUp(button, { pointerType: 'touch' });
      });
    });
  });
});
