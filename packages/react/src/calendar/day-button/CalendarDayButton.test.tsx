import * as React from 'react';
import { screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { spy } from 'sinon';
import { Calendar } from '@base-ui/react/calendar';
import { createTemporalRenderer, describeConformance } from '#test-utils';

describe('<Calendar.DayButton />', () => {
  const { render, adapter } = createTemporalRenderer();

  describeConformance(<Calendar.DayButton />, () => ({
    refInstanceof: window.HTMLButtonElement,
    button: true,
    render(node) {
      const date = adapter.now('default');

      return render(
        <Calendar.Root visibleDate={adapter.startOfMonth(date)}>
          <Calendar.DayGrid>
            <Calendar.DayGridBody>
              <Calendar.DayGridRow value={adapter.startOfWeek(date)}>
                <Calendar.DayGridCell value={date}>{node}</Calendar.DayGridCell>
              </Calendar.DayGridRow>
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );
    },
  }));

  describe('value update', () => {
    it('should update the value when clicked', async () => {
      const onValueChange = spy();
      const date = adapter.date('2025-02-04', 'default');

      const { user } = render(
        <Calendar.Root visibleDate={adapter.startOfMonth(date)} onValueChange={onValueChange}>
          <Calendar.DayGrid>
            <Calendar.DayGridBody>
              <Calendar.DayGridRow value={adapter.startOfWeek(date)}>
                <Calendar.DayGridCell value={date}>
                  <Calendar.DayButton />
                </Calendar.DayGridCell>
              </Calendar.DayGridRow>
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');

      await user.click(button);
      expect(onValueChange.callCount).to.equal(1);
      expect(onValueChange.firstCall.args[0]).toEqualDateTime('2025-02-04T00:00:00.000Z');
    });

    it('should keep the time of the previous value when clicked', async () => {
      const onValueChange = spy();
      const date = adapter.date('2025-02-04', 'default');

      const { user } = render(
        <Calendar.Root
          visibleDate={adapter.startOfMonth(date)}
          onValueChange={onValueChange}
          value={adapter.date('2025-02-01T12:01:02.003Z', 'default')}
        >
          <Calendar.DayGrid>
            <Calendar.DayGridBody>
              <Calendar.DayGridRow value={adapter.startOfWeek(date)}>
                <Calendar.DayGridCell value={date}>
                  <Calendar.DayButton />
                </Calendar.DayGridCell>
              </Calendar.DayGridRow>
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');

      await user.click(button);
      expect(onValueChange.callCount).to.equal(1);
      expect(onValueChange.firstCall.args[0]).toEqualDateTime('2025-02-04T12:01:02.003Z');
    });

    it('should keep the time of the default value when clicked', async () => {
      const onValueChange = spy();
      const date = adapter.date('2025-02-04', 'default');

      const { user } = render(
        <Calendar.Root
          visibleDate={adapter.startOfMonth(date)}
          onValueChange={onValueChange}
          defaultValue={adapter.date('2025-02-01T12:01:02.003Z', 'default')}
        >
          <Calendar.DayGrid>
            <Calendar.DayGridBody>
              <Calendar.DayGridRow value={adapter.startOfWeek(date)}>
                <Calendar.DayGridCell value={date}>
                  <Calendar.DayButton />
                </Calendar.DayGridCell>
              </Calendar.DayGridRow>
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');

      await user.click(button);
      expect(onValueChange.callCount).to.equal(1);
      expect(onValueChange.firstCall.args[0]).toEqualDateTime('2025-02-04T12:01:02.003Z');
    });

    it('should keep the time of the reference date when clicked', async () => {
      const onValueChange = spy();
      const date = adapter.date('2025-02-04', 'default');

      const { user } = render(
        <Calendar.Root
          visibleDate={adapter.startOfMonth(date)}
          onValueChange={onValueChange}
          referenceDate={adapter.date('2025-02-01T12:01:02.003Z', 'default')}
        >
          <Calendar.DayGrid>
            <Calendar.DayGridBody>
              <Calendar.DayGridRow value={adapter.startOfWeek(date)}>
                <Calendar.DayGridCell value={date}>
                  <Calendar.DayButton />
                </Calendar.DayGridCell>
              </Calendar.DayGridRow>
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');

      await user.click(button);
      expect(onValueChange.callCount).to.equal(1);
      expect(onValueChange.firstCall.args[0]).toEqualDateTime('2025-02-04T12:01:02.003Z');
    });
  });

  describe('selected state', () => {
    it('should be selected when the date is in the same day as the value', () => {
      const date = adapter.date('2025-02-04', 'default');

      render(
        <Calendar.Root
          visibleDate={adapter.startOfMonth(date)}
          value={adapter.date('2025-02-04T12:01:02.003Z', 'default')}
        >
          <Calendar.DayGrid>
            <Calendar.DayGridBody>
              <Calendar.DayGridRow value={adapter.startOfWeek(date)}>
                <Calendar.DayGridCell value={date}>
                  <Calendar.DayButton />
                </Calendar.DayGridCell>
              </Calendar.DayGridRow>
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button).to.have.attribute('aria-selected', 'true');
      expect(button).to.have.attribute('data-selected');
    });

    it('should be selected when the date is in the same day as the default value', () => {
      const date = adapter.date('2025-02-04', 'default');

      render(
        <Calendar.Root
          visibleDate={adapter.startOfMonth(date)}
          defaultValue={adapter.date('2025-02-04T12:01:02.003Z', 'default')}
        >
          <Calendar.DayGrid>
            <Calendar.DayGridBody>
              <Calendar.DayGridRow value={adapter.startOfWeek(date)}>
                <Calendar.DayGridCell value={date}>
                  <Calendar.DayButton />
                </Calendar.DayGridCell>
              </Calendar.DayGridRow>
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button).to.have.attribute('aria-selected', 'true');
      expect(button).to.have.attribute('data-selected');
    });

    it('should not be selected when the date is in the same day as the reference date', () => {
      const date = adapter.date('2025-02-04', 'default');

      render(
        <Calendar.Root
          visibleDate={adapter.startOfMonth(date)}
          referenceDate={adapter.date('2025-02-04T12:01:02.003Z', 'default')}
        >
          <Calendar.DayGrid>
            <Calendar.DayGridBody>
              <Calendar.DayGridRow value={adapter.startOfWeek(date)}>
                <Calendar.DayGridCell value={date}>
                  <Calendar.DayButton />
                </Calendar.DayGridCell>
              </Calendar.DayGridRow>
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button).not.to.have.attribute('aria-selected', 'true');
      expect(button).not.to.have.attribute('data-selected');
    });
  });

  describe('disabled state', () => {
    it('should have aria-disabled="true" and data-disabled when props.disabled is true', () => {
      const date = adapter.date('2025-02-04', 'default');

      render(
        <Calendar.Root visibleDate={adapter.startOfMonth(date)}>
          <Calendar.DayGrid>
            <Calendar.DayGridBody>
              <Calendar.DayGridRow value={adapter.startOfWeek(date)}>
                <Calendar.DayGridCell value={date}>
                  <Calendar.DayButton disabled />
                </Calendar.DayGridCell>
              </Calendar.DayGridRow>
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button).to.have.attribute('aria-disabled', 'true');
      expect(button).to.have.attribute('data-disabled');
    });

    it('should have aria-disabled="true" and data-disabled when the date is before the minDate', () => {
      const date = adapter.date('2025-02-04', 'default');

      render(
        <Calendar.Root
          visibleDate={adapter.startOfMonth(date)}
          minDate={adapter.date('2025-02-10', 'default')}
        >
          <Calendar.DayGrid>
            <Calendar.DayGridBody>
              <Calendar.DayGridRow value={adapter.startOfWeek(date)}>
                <Calendar.DayGridCell value={date}>
                  <Calendar.DayButton />
                </Calendar.DayGridCell>
              </Calendar.DayGridRow>
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button).to.have.attribute('aria-disabled', 'true');
      expect(button).to.have.attribute('data-disabled');
    });

    it('should have aria-disabled="true" and data-disabled when the date is after the maxDate', () => {
      const date = adapter.date('2025-02-04', 'default');

      render(
        <Calendar.Root
          visibleDate={adapter.startOfMonth(date)}
          maxDate={adapter.date('2025-02-02', 'default')}
        >
          <Calendar.DayGrid>
            <Calendar.DayGridBody>
              <Calendar.DayGridRow value={adapter.startOfWeek(date)}>
                <Calendar.DayGridCell value={date}>
                  <Calendar.DayButton />
                </Calendar.DayGridCell>
              </Calendar.DayGridRow>
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button).to.have.attribute('aria-disabled', 'true');
      expect(button).to.have.attribute('data-disabled');
    });

    it('should not have aria-disabled or data-disabled when the date is not disabled', () => {
      const date = adapter.date('2025-02-04', 'default');

      render(
        <Calendar.Root visibleDate={adapter.startOfMonth(date)}>
          <Calendar.DayGrid>
            <Calendar.DayGridBody>
              <Calendar.DayGridRow value={adapter.startOfWeek(date)}>
                <Calendar.DayGridCell value={date}>
                  <Calendar.DayButton />
                </Calendar.DayGridCell>
              </Calendar.DayGridRow>
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button).not.to.have.attribute('aria-disabled');
      expect(button).not.to.have.attribute('data-disabled');
    });
  });

  describe('current state', () => {
    it('should have aria-current="date" and data-current when the date is today', () => {
      const date = adapter.now('default');

      render(
        <Calendar.Root visibleDate={adapter.startOfMonth(date)}>
          <Calendar.DayGrid>
            <Calendar.DayGridBody>
              <Calendar.DayGridRow value={adapter.startOfWeek(date)}>
                <Calendar.DayGridCell value={date}>
                  <Calendar.DayButton />
                </Calendar.DayGridCell>
              </Calendar.DayGridRow>
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button).to.have.attribute('aria-current', 'date');
      expect(button).to.have.attribute('data-current');
    });

    it('should not have aria-current or data-current when the date is not today', () => {
      const date = adapter.date('2025-02-04', 'default');

      render(
        <Calendar.Root visibleDate={adapter.startOfMonth(date)}>
          <Calendar.DayGrid>
            <Calendar.DayGridBody>
              <Calendar.DayGridRow value={adapter.startOfWeek(date)}>
                <Calendar.DayGridCell value={date}>
                  <Calendar.DayButton />
                </Calendar.DayGridCell>
              </Calendar.DayGridRow>
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button).not.to.have.attribute('aria-current');
      expect(button).not.to.have.attribute('data-current');
    });
  });

  describe('outside month state', () => {
    it('should not have data-outside-month attribute when the date is inside the current month', () => {
      const date = adapter.date('2025-01-31', 'default');

      render(
        <Calendar.Root visibleDate={adapter.startOfMonth(date)}>
          <Calendar.DayGrid>
            <Calendar.DayGridBody>
              <Calendar.DayGridRow value={adapter.startOfWeek(date)}>
                <Calendar.DayGridCell value={date}>
                  <Calendar.DayButton />
                </Calendar.DayGridCell>
              </Calendar.DayGridRow>
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const button = document.querySelector('button');
      expect(button).not.to.have.attribute('data-outside-month');
    });

    it('should have data-outside-month attribute and aria-disabled when the date is outside the current month', () => {
      const date = adapter.date('2025-01-31', 'default');

      render(
        <Calendar.Root visibleDate={adapter.addMonths(adapter.startOfMonth(date), 1)}>
          <Calendar.DayGrid>
            <Calendar.DayGridBody>
              <Calendar.DayGridRow value={adapter.startOfWeek(date)}>
                <Calendar.DayGridCell value={date}>
                  <Calendar.DayButton />
                </Calendar.DayGridCell>
              </Calendar.DayGridRow>
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button).to.have.attribute('data-outside-month');
      expect(button).to.have.attribute('aria-disabled', 'true');
    });
  });

  describe('unavailable state', () => {
    it('should not have data-unavailable or aria-disabled when the date is available', () => {
      const date = adapter.date('2025-02-04', 'default');

      render(
        <Calendar.Root visibleDate={adapter.startOfMonth(date)} isDateUnavailable={() => false}>
          <Calendar.DayGrid>
            <Calendar.DayGridBody>
              <Calendar.DayGridRow value={adapter.startOfWeek(date)}>
                <Calendar.DayGridCell value={date}>
                  <Calendar.DayButton />
                </Calendar.DayGridCell>
              </Calendar.DayGridRow>
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button).not.to.have.attribute('data-unavailable');
      expect(button).not.to.have.attribute('aria-disabled');
    });

    it('should have data-unavailable and aria-disabled when the date is unavailable', () => {
      const date = adapter.date('2025-02-04', 'default');

      render(
        <Calendar.Root visibleDate={adapter.startOfMonth(date)} isDateUnavailable={() => true}>
          <Calendar.DayGrid>
            <Calendar.DayGridBody>
              <Calendar.DayGridRow value={adapter.startOfWeek(date)}>
                <Calendar.DayGridCell value={date}>
                  <Calendar.DayButton />
                </Calendar.DayGridCell>
              </Calendar.DayGridRow>
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button).to.have.attribute('data-unavailable');
      expect(button).to.have.attribute('aria-disabled', 'true');
    });
  });

  describe('format prop', () => {
    it('should use the non-padded day of month format by default', () => {
      const date = adapter.date('2025-02-04', 'default');

      render(
        <Calendar.Root visibleDate={adapter.startOfMonth(date)}>
          <Calendar.DayGrid>
            <Calendar.DayGridBody>
              <Calendar.DayGridRow value={adapter.startOfWeek(date)}>
                <Calendar.DayGridCell value={date}>
                  <Calendar.DayButton />
                </Calendar.DayGridCell>
              </Calendar.DayGridRow>
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button.textContent).to.equal('4');
    });

    it('should use the provided format', () => {
      const date = adapter.date('2025-02-04', 'default');

      render(
        <Calendar.Root visibleDate={adapter.startOfMonth(date)}>
          <Calendar.DayGrid>
            <Calendar.DayGridBody>
              <Calendar.DayGridRow value={adapter.startOfWeek(date)}>
                <Calendar.DayGridCell value={date}>
                  <Calendar.DayButton format={adapter.formats.dayOfMonthPadded} />
                </Calendar.DayGridCell>
              </Calendar.DayGridRow>
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button.textContent).to.equal('04');
    });
  });

  describe('accessibility attributes', () => {
    it('should have the full date format as aria-label', () => {
      const date = adapter.date('2025-02-04', 'default');

      render(
        <Calendar.Root visibleDate={adapter.startOfMonth(date)}>
          <Calendar.DayGrid>
            <Calendar.DayGridBody>
              <Calendar.DayGridRow value={adapter.startOfWeek(date)}>
                <Calendar.DayGridCell value={date}>
                  <Calendar.DayButton format={adapter.formats.dayOfMonthPadded} />
                </Calendar.DayGridCell>
              </Calendar.DayGridRow>
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAccessibleName(
        adapter.format(date, 'localizedDateWithFullMonthAndWeekDay'),
      );
    });
  });

  describe('tabIndex', () => {
    it('should have tabIndex={0} when the date is the first day of the month that contains no selected date or reference date', () => {
      const date = adapter.date('2025-02-01', 'default');

      render(
        <Calendar.Root visibleDate={adapter.startOfMonth(date)}>
          <Calendar.DayGrid>
            <Calendar.DayGridBody>
              <Calendar.DayGridRow value={adapter.startOfWeek(date)}>
                <Calendar.DayGridCell value={date}>
                  <Calendar.DayButton />
                </Calendar.DayGridCell>
              </Calendar.DayGridRow>
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button).to.have.attribute('tabindex', '0');
    });

    it('should have tabIndex={-1} when the date is not the first day of the month that contains no selected date or reference date', () => {
      const date = adapter.date('2025-02-04', 'default');

      render(
        <Calendar.Root visibleDate={adapter.startOfMonth(date)}>
          <Calendar.DayGrid>
            <Calendar.DayGridBody>
              <Calendar.DayGridRow value={adapter.startOfWeek(date)}>
                <Calendar.DayGridCell value={date}>
                  <Calendar.DayButton />
                </Calendar.DayGridCell>
              </Calendar.DayGridRow>
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button).to.have.attribute('tabindex', '-1');
    });

    it('should have tabIndex={0} when the date is selected', () => {
      const date = adapter.date('2025-02-04', 'default');

      render(
        <Calendar.Root visibleDate={adapter.startOfMonth(date)} value={date}>
          <Calendar.DayGrid>
            <Calendar.DayGridBody>
              <Calendar.DayGridRow value={adapter.startOfWeek(date)}>
                <Calendar.DayGridCell value={date}>
                  <Calendar.DayButton />
                </Calendar.DayGridCell>
              </Calendar.DayGridRow>
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button).to.have.attribute('tabindex', '0');
    });

    it('should have tabIndex={0} when the date is the reference date and no date is selected', () => {
      const date = adapter.date('2025-02-04', 'default');

      render(
        <Calendar.Root visibleDate={adapter.startOfMonth(date)} referenceDate={date}>
          <Calendar.DayGrid>
            <Calendar.DayGridBody>
              <Calendar.DayGridRow value={adapter.startOfWeek(date)}>
                <Calendar.DayGridCell value={date}>
                  <Calendar.DayButton />
                </Calendar.DayGridCell>
              </Calendar.DayGridRow>
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button).to.have.attribute('tabindex', '0');
    });

    it('should have tabIndex={-1} when the date is the reference date but a date is selected in the same month', () => {
      const date = adapter.date('2025-02-04', 'default');
      const selectedDate = adapter.date('2025-02-10', 'default');

      render(
        <Calendar.Root
          visibleDate={adapter.startOfMonth(date)}
          referenceDate={date}
          value={selectedDate}
        >
          <Calendar.DayGrid>
            <Calendar.DayGridBody>
              <Calendar.DayGridRow value={adapter.startOfWeek(date)}>
                <Calendar.DayGridCell value={date}>
                  <Calendar.DayButton />
                </Calendar.DayGridCell>
              </Calendar.DayGridRow>
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button).to.have.attribute('tabindex', '-1');
    });

    it('should have tabIndex={-1} when the date is outside the current month event if its the first day of the month', () => {
      const date = adapter.date('2025-01-01', 'default');

      render(
        <Calendar.Root visibleDate={adapter.addMonths(adapter.startOfMonth(date), -1)}>
          <Calendar.DayGrid>
            <Calendar.DayGridBody>
              <Calendar.DayGridRow value={adapter.startOfWeek(date)}>
                <Calendar.DayGridCell value={date}>
                  <Calendar.DayButton />
                </Calendar.DayGridCell>
              </Calendar.DayGridRow>
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button).to.have.attribute('tabindex', '-1');
    });

    it('should have tabIndex={-1} when the date is outside the current month even if it is the selected value', () => {
      const date = adapter.date('2025-01-31', 'default');

      render(
        <Calendar.Root visibleDate={adapter.addMonths(adapter.startOfMonth(date), 1)} value={date}>
          <Calendar.DayGrid>
            <Calendar.DayGridBody>
              <Calendar.DayGridRow value={adapter.startOfWeek(date)}>
                <Calendar.DayGridCell value={date}>
                  <Calendar.DayButton />
                </Calendar.DayGridCell>
              </Calendar.DayGridRow>
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const button = screen.getByRole('button');
      expect(button).to.have.attribute('tabindex', '-1');
    });
  });
});
