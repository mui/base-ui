import * as React from 'react';
import { screen, fireEvent } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { spy } from 'sinon';
import { Calendar } from '@base-ui/react/calendar';
import { LocalizationProvider } from '@base-ui/react/localization-provider';
import { createRenderer, createTemporalRenderer, describeConformance } from '#test-utils';

describe('<Calendar.DecrementMonth />', () => {
  const { render, adapter } = createTemporalRenderer();

  describeConformance(<Calendar.DecrementMonth />, () => ({
    refInstanceof: window.HTMLButtonElement,
    button: true,
    render(node) {
      return render(<Calendar.Root>{node}</Calendar.Root>);
    },
  }));

  describe('visible date update', () => {
    it('should keep the day and time of the previous visible date when clicked', async () => {
      const onVisibleDateChange = spy();

      const { user } = render(
        <Calendar.Root
          onVisibleDateChange={onVisibleDateChange}
          visibleDate={adapter.date('2025-02-05T12:01:02.003Z', 'default')}
        >
          <Calendar.DecrementMonth />
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');

      await user.click(button);
      expect(onVisibleDateChange.callCount).to.equal(1);
      expect(onVisibleDateChange.firstCall.args[0]).toEqualDateTime('2025-01-05T12:01:02.003Z');
    });

    it("should call onVisibleDateChange with reason 'month-change' when clicked", async () => {
      const onVisibleDateChange = spy();

      const { user } = render(
        <Calendar.Root
          onVisibleDateChange={onVisibleDateChange}
          visibleDate={adapter.date('2025-02-05', 'default')}
        >
          <Calendar.DecrementMonth />
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');

      await user.click(button);
      expect(onVisibleDateChange.callCount).to.equal(1);
      expect(onVisibleDateChange.firstCall.args[1].reason).to.equal('month-change');
    });
  });

  describe('disabled state', () => {
    it('should be disabled when props.disabled is true', () => {
      render(
        <Calendar.Root>
          <Calendar.DecrementMonth disabled />
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button).not.to.have.attribute('disabled');
      expect(button).to.have.attribute('data-disabled');
      expect(button).to.have.attribute('aria-disabled', 'true');
    });

    it('should be disabled when the calendar is disabled', () => {
      render(
        <Calendar.Root disabled>
          <Calendar.DecrementMonth />
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button).not.to.have.attribute('disabled');
      expect(button).to.have.attribute('data-disabled');
      expect(button).to.have.attribute('aria-disabled', 'true');
    });

    it('should be disabled when the target month is before the minDate month', () => {
      render(
        <Calendar.Root
          minDate={adapter.date('2025-01-10', 'default')}
          visibleDate={adapter.date('2025-01-01', 'default')}
        >
          <Calendar.DecrementMonth />
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button).not.to.have.attribute('disabled');
      expect(button).to.have.attribute('data-disabled');
      expect(button).to.have.attribute('aria-disabled', 'true');
    });

    it('should not be disabled when the target month is equal to the minDate month', () => {
      render(
        <Calendar.Root
          minDate={adapter.date('2025-01-10', 'default')}
          visibleDate={adapter.date('2025-02-01', 'default')}
        >
          <Calendar.DecrementMonth />
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button).not.to.have.attribute('disabled');
      expect(button).not.to.have.attribute('data-disabled');
    });

    it('should not be disabled when disabled is false and the target month is before the minDate month', () => {
      render(
        <Calendar.Root
          minDate={adapter.date('2025-01-10', 'default')}
          visibleDate={adapter.date('2025-01-01', 'default')}
        >
          <Calendar.DecrementMonth disabled={false} />
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button).not.to.have.attribute('disabled');
      expect(button).to.have.attribute('aria-disabled', 'false');
    });

    it('should navigate to the previous month when disabled is false even if the target month is before the minDate month', async () => {
      const onVisibleDateChange = spy();

      const { user } = render(
        <Calendar.Root
          minDate={adapter.date('2025-01-10', 'default')}
          visibleDate={adapter.date('2025-01-01', 'default')}
          onVisibleDateChange={onVisibleDateChange}
        >
          <Calendar.DecrementMonth disabled={false} />
        </Calendar.Root>,
      );

      await user.click(screen.getByRole('button'));
      expect(onVisibleDateChange.callCount).to.equal(1);
    });

    describe('focusableWhenDisabled', () => {
      it('should not have disabled attribute and have aria-disabled when focusableWhenDisabled is true', () => {
        render(
          <Calendar.Root>
            <Calendar.DecrementMonth disabled />
          </Calendar.Root>,
        );

        const button = screen.getByRole('button');
        expect(button).not.to.have.attribute('disabled');
        expect(button).to.have.attribute('aria-disabled', 'true');
      });

      it('should not have disabled attribute or aria-disabled="true" when disabled is false even at the minDate boundary', () => {
        render(
          <Calendar.Root
            minDate={adapter.date('2025-01-10', 'default')}
            visibleDate={adapter.date('2025-01-01', 'default')}
          >
            <Calendar.DecrementMonth disabled={false} />
          </Calendar.Root>,
        );

        const button = screen.getByRole('button');
        expect(button).not.to.have.attribute('data-disabled');
        expect(button).to.have.attribute('aria-disabled', 'false');
      });
    });
  });

  describe('press and hold', () => {
    const { render: renderWithClock, clock } = createRenderer();
    clock.withFakeTimers();

    function renderCalendar(
      props: Record<string, any> = {},
      buttonProps: Record<string, any> = {},
    ) {
      return renderWithClock(
        <LocalizationProvider>
          <Calendar.Root defaultVisibleDate={adapter.date('2025-06-15', 'default')} {...props}>
            <Calendar.DecrementMonth data-testid="decrement" {...buttonProps} />
          </Calendar.Root>
        </LocalizationProvider>,
      );
    }

    it('should navigate continuously when holding pointerdown', async () => {
      const onVisibleDateChange = spy();
      await renderCalendar({ onVisibleDateChange });

      const button = screen.getByTestId('decrement');

      fireEvent.pointerDown(button);

      // First tick fires immediately
      expect(onVisibleDateChange.callCount).to.equal(1);

      // Wait for initial delay (400ms)
      clock.tick(400);

      // Continuous ticks at 100ms intervals
      clock.tick(100);
      expect(onVisibleDateChange.callCount).to.equal(2);

      clock.tick(100);
      expect(onVisibleDateChange.callCount).to.equal(3);

      clock.tick(100);
      expect(onVisibleDateChange.callCount).to.equal(4);

      fireEvent.pointerUp(button);

      // Should stop after pointer up
      clock.tick(100);
      expect(onVisibleDateChange.callCount).to.equal(4);
    });

    it("should call onVisibleDateChange with reason 'month-change' when holding pointerdown", async () => {
      const onVisibleDateChange = spy();
      await renderCalendar({ onVisibleDateChange });

      const button = screen.getByTestId('decrement');

      fireEvent.pointerDown(button);

      expect(onVisibleDateChange.callCount).to.equal(1);
      expect(onVisibleDateChange.firstCall.args[1].reason).to.equal('month-change');

      fireEvent.pointerUp(button);
    });

    it('should stop at minDate boundary', async () => {
      const onVisibleDateChange = spy();
      await renderCalendar({
        defaultVisibleDate: adapter.date('2025-03-15', 'default'),
        minDate: adapter.date('2025-01-01', 'default'),
        onVisibleDateChange,
      });

      const button = screen.getByTestId('decrement');

      fireEvent.pointerDown(button);

      // First tick: Mar -> Feb
      expect(onVisibleDateChange.callCount).to.equal(1);

      clock.tick(400);

      // Second tick: Feb -> Jan
      clock.tick(100);
      expect(onVisibleDateChange.callCount).to.equal(2);

      // Third tick would go to Dec 2024 which is before minDate, should stop
      clock.tick(100);
      expect(onVisibleDateChange.callCount).to.equal(2);

      fireEvent.pointerUp(button);
    });

    it('should continue navigating past the minDate boundary when disabled is false', async () => {
      const onVisibleDateChange = spy();
      await renderCalendar(
        {
          defaultVisibleDate: adapter.date('2025-03-15', 'default'),
          minDate: adapter.date('2025-01-01', 'default'),
          onVisibleDateChange,
        },
        { disabled: false },
      );

      const button = screen.getByRole('button', { name: /previous month/i });

      fireEvent.pointerDown(button);

      // First tick: Mar → Feb
      expect(onVisibleDateChange.callCount).to.equal(1);

      clock.tick(400);

      // Second tick: Feb → Jan
      clock.tick(100);
      expect(onVisibleDateChange.callCount).to.equal(2);

      // Third tick: Jan → Dec 2024 — would stop at boundary without the fix
      clock.tick(100);
      expect(onVisibleDateChange.callCount).to.equal(3);

      fireEvent.pointerUp(button);
    });

    it('should use the controlled visibleDate for each tick', async () => {
      const onVisibleDateChange = spy();

      function ControlledCalendar() {
        const [visibleDate, setVisibleDate] = React.useState(() =>
          adapter.date('2025-06-15', 'default'),
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
              <Calendar.DecrementMonth data-testid="decrement" />
            </Calendar.Root>
          </LocalizationProvider>
        );
      }

      await renderWithClock(<ControlledCalendar />);
      const button = screen.getByTestId('decrement');

      fireEvent.pointerDown(button);

      // First tick fires immediately: Jun -> May
      expect(onVisibleDateChange.callCount).to.equal(1);
      expect(onVisibleDateChange.getCall(0).args[0]).toEqualDateTime('2025-05-15');

      clock.tick(400);

      // Second tick: May -> Apr
      clock.tick(100);
      expect(onVisibleDateChange.callCount).to.equal(2);
      expect(onVisibleDateChange.getCall(1).args[0]).toEqualDateTime('2025-04-15');

      // Third tick: Apr -> Mar
      clock.tick(100);
      expect(onVisibleDateChange.callCount).to.equal(3);
      expect(onVisibleDateChange.getCall(2).args[0]).toEqualDateTime('2025-03-15');

      fireEvent.pointerUp(button);
    });

    describe('touch (Android)', () => {
      it('should navigate once on a quick touch tap', async () => {
        const onVisibleDateChange = spy();
        await renderCalendar({ onVisibleDateChange });

        const button = screen.getByTestId('decrement');

        // Simulate a quick touch tap: pointerdown then immediate pointerup
        fireEvent.pointerDown(button, { pointerType: 'touch' });
        fireEvent.pointerUp(button, { pointerType: 'touch' });

        // Quick tap: auto-change should not have started (released before 50ms)
        expect(onVisibleDateChange.callCount).to.equal(0);

        // The browser fires a synthesized click after touch up; this should trigger navigation
        fireEvent.click(button, { detail: 1 });
        expect(onVisibleDateChange.callCount).to.equal(1);
      });

      it('should navigate continuously on touch hold and ignore the synthesized click after release', async () => {
        const onVisibleDateChange = spy();
        await renderCalendar({ onVisibleDateChange });

        const button = screen.getByTestId('decrement');

        fireEvent.pointerDown(button, { pointerType: 'touch' });

        // Wait past the TOUCH_TIMEOUT (50ms) to confirm it's an intentional hold
        clock.tick(50);

        // First tick fires immediately after intent confirmed
        expect(onVisibleDateChange.callCount).to.equal(1);

        // Wait for initial delay (400ms) and one tick
        clock.tick(400);
        clock.tick(100);
        expect(onVisibleDateChange.callCount).to.equal(2);

        fireEvent.pointerUp(button, { pointerType: 'touch' });

        // The browser fires a synthesized click after touch hold; it must be suppressed
        fireEvent.click(button, { detail: 1 });
        expect(onVisibleDateChange.callCount).to.equal(2);
      });

      it('should not start auto-change when the touch moves more than 8px (scroll gesture)', async () => {
        const onVisibleDateChange = spy();
        await renderCalendar({ onVisibleDateChange });

        const button = screen.getByTestId('decrement');

        fireEvent.pointerDown(button, { pointerType: 'touch', clientX: 0, clientY: 0 });

        // Move pointer by 9px — exceeds the 8px scroll threshold
        fireEvent.pointerMove(button, { pointerType: 'touch', clientX: 9, clientY: 0 });

        clock.tick(50);

        // Auto-change should not have started due to scroll detection
        expect(onVisibleDateChange.callCount).to.equal(0);

        fireEvent.pointerUp(button, { pointerType: 'touch' });
      });
    });
  });
});
