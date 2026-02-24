import * as React from 'react';
import { screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { spy } from 'sinon';
import { Calendar } from '@base-ui/react/calendar';
import { createTemporalRenderer, describeConformance } from '#test-utils';

describe('<Calendar.SetMonth />', () => {
  const { render, adapter } = createTemporalRenderer();

  describeConformance(<Calendar.SetMonth target={adapter.now('default')} />, () => ({
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
          <Calendar.SetMonth target={adapter.date('2025-01-01', 'default')} />
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
          <Calendar.SetMonth target={adapter.date('2025-01-01', 'default')} />
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
          <Calendar.SetMonth target={adapter.date('2025-01-01', 'default')} disabled />
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button).to.have.attribute('disabled');
      expect(button).to.have.attribute('data-disabled');
    });

    it('should be disabled when the calendar is disabled', () => {
      render(
        <Calendar.Root disabled>
          <Calendar.SetMonth target={adapter.date('2025-01-01', 'default')} />
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button).to.have.attribute('disabled');
      expect(button).to.have.attribute('data-disabled');
    });

    it('should be disabled when the target month is before the minDate month', () => {
      render(
        <Calendar.Root minDate={adapter.date('2025-01-10', 'default')}>
          <Calendar.SetMonth target={adapter.date('2024-12-01', 'default')} />
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button).to.have.attribute('disabled');
      expect(button).to.have.attribute('data-disabled');
    });

    it('should be not disabled when the target month is equal to the minDate month', () => {
      render(
        <Calendar.Root minDate={adapter.date('2025-01-10', 'default')}>
          <Calendar.SetMonth target={adapter.date('2025-01-01', 'default')} />
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button).not.to.have.attribute('disabled');
      expect(button).not.to.have.attribute('data-disabled');
    });

    it('should be disabled when the target month is after the maxDate month', () => {
      render(
        <Calendar.Root maxDate={adapter.date('2025-01-10', 'default')}>
          <Calendar.SetMonth target={adapter.date('2025-02-01', 'default')} />
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button).to.have.attribute('disabled');
      expect(button).to.have.attribute('data-disabled');
    });

    it('should not be disabled when the target month is equal to the maxDate month', () => {
      render(
        <Calendar.Root maxDate={adapter.date('2025-01-10', 'default')}>
          <Calendar.SetMonth target={adapter.date('2025-01-25', 'default')} />
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button).not.to.have.attribute('disabled');
      expect(button).not.to.have.attribute('data-disabled');
    });
  });
});
