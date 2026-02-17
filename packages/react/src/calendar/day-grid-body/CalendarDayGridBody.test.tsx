import * as React from 'react';
import { screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { Calendar } from '@base-ui/react/calendar';
import { createTemporalRenderer, describeConformance } from '#test-utils';

describe('<Calendar.DayGridBody />', () => {
  const { render, adapter } = createTemporalRenderer();

  describeConformance(<Calendar.DayGridBody />, () => ({
    refInstanceof: window.HTMLTableSectionElement,
    testRenderPropWith: 'tbody',
    wrappingAllowed: false,
    render(node) {
      return render(
        <Calendar.Root>
          <Calendar.DayGrid>{node}</Calendar.DayGrid>
        </Calendar.Root>,
      );
    },
  }));

  describe('fixedWeekNumber prop', () => {
    it('should render the correct number of weeks without fixedWeekNumber for a month with 4 weeks', () => {
      // February 2026 starts on Sunday and ends on Saturday (4 weeks exactly for en-US locale)
      const date = adapter.date('2026-02-01', 'default');

      render(
        <Calendar.Root visibleDate={date}>
          <Calendar.DayGrid>
            <Calendar.DayGridBody>
              {(week) => (
                <Calendar.DayGridRow value={week} key={week.toString()} data-testid="week-row" />
              )}
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const rows = screen.getAllByTestId('week-row');
      expect(rows.length).to.equal(4);
    });

    it('should render the correct number of weeks without fixedWeekNumber for a month with 5 weeks', () => {
      // February 2025 has 5 weeks (starts on Saturday, ends on Friday in en-US locale)
      const date = adapter.date('2025-02-01', 'default');

      render(
        <Calendar.Root visibleDate={date}>
          <Calendar.DayGrid>
            <Calendar.DayGridBody>
              {(week) => (
                <Calendar.DayGridRow value={week} key={week.toString()} data-testid="week-row" />
              )}
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const rows = screen.getAllByTestId('week-row');
      expect(rows.length).to.equal(5);
    });

    it('should render the correct number of weeks without fixedWeekNumber for a month with 6 weeks', () => {
      // March 2025 has 6 weeks (starts on Saturday, ends on Monday in en-US locale)
      const date = adapter.date('2025-03-01', 'default');

      render(
        <Calendar.Root visibleDate={date}>
          <Calendar.DayGrid>
            <Calendar.DayGridBody>
              {(week) => (
                <Calendar.DayGridRow value={week} key={week.toString()} data-testid="week-row" />
              )}
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const rows = screen.getAllByTestId('week-row');
      expect(rows.length).to.equal(6);
    });

    it('should render exactly 6 weeks when fixedWeekNumber is 6 for a month with 4 weeks', () => {
      // February 2026 has 4 weeks but we force 6
      const date = adapter.date('2026-02-01', 'default');

      render(
        <Calendar.Root visibleDate={date}>
          <Calendar.DayGrid>
            <Calendar.DayGridBody fixedWeekNumber={6}>
              {(week) => (
                <Calendar.DayGridRow value={week} key={week.toString()} data-testid="week-row" />
              )}
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const rows = screen.getAllByTestId('week-row');
      expect(rows.length).to.equal(6);
    });

    it('should render exactly 6 weeks when fixedWeekNumber is 6 for a month with 5 weeks', () => {
      // February 2025 has 5 weeks but we force 6
      const date = adapter.date('2025-02-01', 'default');

      render(
        <Calendar.Root visibleDate={date}>
          <Calendar.DayGrid>
            <Calendar.DayGridBody fixedWeekNumber={6}>
              {(week) => (
                <Calendar.DayGridRow value={week} key={week.toString()} data-testid="week-row" />
              )}
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const rows = screen.getAllByTestId('week-row');
      expect(rows.length).to.equal(6);
    });

    it('should render exactly 6 weeks when fixedWeekNumber is 6 for a month with 6 weeks', () => {
      // March 2025 has 6 weeks
      const date = adapter.date('2025-03-01', 'default');

      render(
        <Calendar.Root visibleDate={date}>
          <Calendar.DayGrid>
            <Calendar.DayGridBody fixedWeekNumber={6}>
              {(week) => (
                <Calendar.DayGridRow value={week} key={week.toString()} data-testid="week-row" />
              )}
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const rows = screen.getAllByTestId('week-row');
      expect(rows.length).to.equal(6);
    });

    it('should render exactly 5 weeks when fixedWeekNumber is 5', () => {
      // Use a month that would normally have 4 or 6 weeks
      const date = adapter.date('2026-02-01', 'default');

      render(
        <Calendar.Root visibleDate={date}>
          <Calendar.DayGrid>
            <Calendar.DayGridBody fixedWeekNumber={5}>
              {(week) => (
                <Calendar.DayGridRow value={week} key={week.toString()} data-testid="week-row" />
              )}
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const rows = screen.getAllByTestId('week-row');
      expect(rows.length).to.equal(5);
    });
  });

  describe('offset prop', () => {
    it('should render the current month when offset is 0', () => {
      const date = adapter.date('2025-02-15', 'default');

      render(
        <Calendar.Root visibleDate={date}>
          <Calendar.DayGrid>
            <Calendar.DayGridBody offset={0}>
              {(week) => (
                <Calendar.DayGridRow value={week} key={week.toString()}>
                  {(day) => (
                    <Calendar.DayGridCell value={day} key={day.toString()}>
                      <Calendar.DayButton
                        data-testid={`month-${adapter.format(day, 'monthPadded')}`}
                      />
                    </Calendar.DayGridCell>
                  )}
                </Calendar.DayGridRow>
              )}
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      // Check that February (02) days are rendered - February 2025 has 28 days
      expect(screen.getAllByTestId('month-02').length).to.equal(28);
    });

    it('should render the next month when offset is 1', () => {
      const date = adapter.date('2025-02-15', 'default');

      render(
        <Calendar.Root visibleDate={date}>
          <Calendar.DayGrid>
            <Calendar.DayGridBody offset={1}>
              {(week) => (
                <Calendar.DayGridRow value={week} key={week.toString()}>
                  {(day) => (
                    <Calendar.DayGridCell value={day} key={day.toString()}>
                      <Calendar.DayButton
                        data-testid={`month-${adapter.format(day, 'monthPadded')}`}
                      />
                    </Calendar.DayGridCell>
                  )}
                </Calendar.DayGridRow>
              )}
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      // Check that March (03) days are rendered - March has 31 days
      expect(screen.getAllByTestId('month-03').length).to.equal(31);
    });

    it('should render the previous month when offset is -1', () => {
      const date = adapter.date('2025-02-15', 'default');

      render(
        <Calendar.Root visibleDate={date}>
          <Calendar.DayGrid>
            <Calendar.DayGridBody offset={-1}>
              {(week) => (
                <Calendar.DayGridRow value={week} key={week.toString()}>
                  {(day) => (
                    <Calendar.DayGridCell value={day} key={day.toString()}>
                      <Calendar.DayButton
                        data-testid={`month-${adapter.format(day, 'monthPadded')}`}
                      />
                    </Calendar.DayGridCell>
                  )}
                </Calendar.DayGridRow>
              )}
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      // Check that January (01) days are rendered - January has 31 days
      expect(screen.getAllByTestId('month-01').length).to.equal(31);
    });

    it('should render multiple months with different offsets', () => {
      const date = adapter.date('2025-02-15', 'default');

      render(
        <Calendar.Root visibleDate={date}>
          <Calendar.DayGrid>
            <Calendar.DayGridBody offset={0}>
              {(week) => (
                <Calendar.DayGridRow value={week} key={week.toString()}>
                  {(day) => (
                    <Calendar.DayGridCell value={day} key={day.toString()}>
                      <Calendar.DayButton
                        data-testid={`current-month-${adapter.format(day, 'monthPadded')}`}
                      />
                    </Calendar.DayGridCell>
                  )}
                </Calendar.DayGridRow>
              )}
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
          <Calendar.DayGrid>
            <Calendar.DayGridBody offset={1}>
              {(week) => (
                <Calendar.DayGridRow value={week} key={week.toString()}>
                  {(day) => (
                    <Calendar.DayGridCell value={day} key={day.toString()}>
                      <Calendar.DayButton
                        data-testid={`next-month-${adapter.format(day, 'monthPadded')}`}
                      />
                    </Calendar.DayGridCell>
                  )}
                </Calendar.DayGridRow>
              )}
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      // Current month (February - 02) has 28 days
      expect(screen.getAllByTestId('current-month-02').length).to.equal(28);

      // Next month (March - 03) has 31 days
      expect(screen.getAllByTestId('next-month-03').length).to.equal(31);
    });

    it('should default to offset 0 when not provided', () => {
      const date = adapter.date('2025-02-15', 'default');

      render(
        <Calendar.Root visibleDate={date}>
          <Calendar.DayGrid>
            <Calendar.DayGridBody>
              {(week) => (
                <Calendar.DayGridRow value={week} key={week.toString()}>
                  {(day) => (
                    <Calendar.DayGridCell value={day} key={day.toString()}>
                      <Calendar.DayButton
                        data-testid={`month-${adapter.format(day, 'monthPadded')}`}
                      />
                    </Calendar.DayGridCell>
                  )}
                </Calendar.DayGridRow>
              )}
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      // Check that February (02) days are rendered - February 2025 has 28 days
      expect(screen.getAllByTestId('month-02').length).to.equal(28);
    });
  });
});
