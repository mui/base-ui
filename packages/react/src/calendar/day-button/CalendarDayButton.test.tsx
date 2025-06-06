import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { Calendar } from '@base-ui-components/react/calendar';
import { createTemporalRenderer, describeConformance } from '#test-utils';

describe('<Calendar.DayButton />', () => {
  const { render, adapter } = createTemporalRenderer();

  describeConformance(<Calendar.DayButton />, () => ({
    refInstanceof: window.HTMLButtonElement,
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

      const button = document.querySelector('button')!;

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

      const button = document.querySelector('button')!;

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

      const button = document.querySelector('button')!;

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

      const button = document.querySelector('button')!;

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

      const button = document.querySelector('button')!;
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

      const button = document.querySelector('button')!;
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

      const button = document.querySelector('button')!;
      expect(button).not.to.have.attribute('aria-selected', 'true');
      expect(button).not.to.have.attribute('data-selected');
    });
  });

  describe('disabled state', () => {
    it('should be disabled when props.disabled is true', () => {
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

      const button = document.querySelector('button');
      expect(button).to.have.attribute('data-disabled');
    });

    it('should be disabled when the date is before the minDate', () => {
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

      const button = document.querySelector('button');
      expect(button).to.have.attribute('data-disabled');
    });

    it('should be disabled when the date is after the maxDate', () => {
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

      const button = document.querySelector('button');
      expect(button).to.have.attribute('data-disabled');
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

      const button = document.querySelector('button')!;
      expect(button).to.have.attribute('aria-current', 'date');
      expect(button).to.have.attribute('data-current');
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

    it('should have data-outside-month attribute when the date is outside the current month', () => {
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

      const button = document.querySelector('button');
      expect(button).to.have.attribute('data-outside-month');
    });
  });

  describe('unavailable state', () => {
    it('should not have data-unavailable attribute when the date is available', () => {
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

      const button = document.querySelector('button')!;
      expect(button).not.to.have.attribute('data-unavailable');
    });

    it('should have data-unavailable attribute when the date is unavailable', () => {
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

      const button = document.querySelector('button')!;
      expect(button).to.have.attribute('data-unavailable');
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

      const button = document.querySelector('button')!;
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

      const button = document.querySelector('button')!;
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

      const button = document.querySelector('button')!;
      expect(button).toHaveAccessibleName('Tuesday, February 4, 2025');
    });
  });
});
