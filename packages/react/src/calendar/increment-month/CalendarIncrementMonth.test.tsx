import * as React from 'react';
import { screen, fireEvent } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { spy } from 'sinon';
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
      const onVisibleDateChange = spy();

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
      expect(onVisibleDateChange.callCount).to.equal(1);
      expect(onVisibleDateChange.firstCall.args[0]).toEqualDateTime('2025-03-05T12:01:02.003Z');
    });

    it("should call onVisibleDateChange with reason 'month-change' when clicked", async () => {
      const onVisibleDateChange = spy();

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
      expect(onVisibleDateChange.callCount).to.equal(1);
      expect(onVisibleDateChange.firstCall.args[1].reason).to.equal('month-change');
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
      expect(button).to.have.attribute('disabled');
      expect(button).to.have.attribute('data-disabled');
    });

    it('should be disabled when the Calendar is disabled', () => {
      render(
        <Calendar.Root disabled>
          <Calendar.IncrementMonth />
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button).to.have.attribute('disabled');
      expect(button).to.have.attribute('data-disabled');
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
      expect(button).to.have.attribute('disabled');
      expect(button).to.have.attribute('data-disabled');
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
      expect(button).not.to.have.attribute('disabled');
      expect(button).not.to.have.attribute('data-disabled');
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
      const onVisibleDateChange = spy();
      await renderCalendar({ onVisibleDateChange });

      const button = screen.getByTestId('increment');

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

      const button = screen.getByTestId('increment');

      fireEvent.pointerDown(button);

      expect(onVisibleDateChange.callCount).to.equal(1);
      expect(onVisibleDateChange.firstCall.args[1].reason).to.equal('month-change');

      fireEvent.pointerUp(button);
    });

    it('should stop at maxDate boundary', async () => {
      const onVisibleDateChange = spy();
      await renderCalendar({
        defaultVisibleDate: adapter.date('2025-01-15', 'default'),
        maxDate: adapter.date('2025-03-31', 'default'),
        onVisibleDateChange,
      });

      const button = screen.getByTestId('increment');

      fireEvent.pointerDown(button);

      // First tick: Jan -> Feb
      expect(onVisibleDateChange.callCount).to.equal(1);

      clock.tick(400);

      // Second tick: Feb -> Mar
      clock.tick(100);
      expect(onVisibleDateChange.callCount).to.equal(2);

      // Third tick would go to Apr which is after maxDate, should stop
      clock.tick(100);
      expect(onVisibleDateChange.callCount).to.equal(2);

      fireEvent.pointerUp(button);
    });
  });
});
