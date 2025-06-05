'use client';
import * as React from 'react';
import clsx from 'clsx';
import { DateTime } from 'luxon';
import { TemporalAdapterProvider } from '@base-ui-components/react/temporal-adapter-provider';
import { TemporalAdapterLuxon } from '@base-ui-components/react/temporal-adapter-luxon';
import { Calendar } from '@base-ui-components/react/calendar';
import { useDayList } from '@base-ui-components/react/use-day-list';
import { useWeekList } from '@base-ui-components/react/use-week-list';
import styles from './calendar.module.css';

const adapter = new TemporalAdapterLuxon();

function MyCalendar() {
  const getWeekList = useWeekList();
  const getDayList = useDayList();

  return (
    <Calendar.Root className={clsx(styles.Root, styles.RootWithWeekNumber)}>
      {({ visibleDate }) => (
        <React.Fragment>
          <header className={styles.Header}>
            <Calendar.SetPreviousMonth className={styles.SetPreviousMonth}>
              ◀
            </Calendar.SetPreviousMonth>
            <span className={styles.HeaderLabel}>
              {visibleDate.toFormat('MMMM yyyy')}
            </span>
            <Calendar.SetNextMonth className={styles.SetNextMonth}>
              ▶
            </Calendar.SetNextMonth>
          </header>
          <Calendar.DayGrid className={styles.DayGrid}>
            <Calendar.DayGridHeader className={styles.DayGridHeader}>
              <span
                role="columnheader"
                aria-label="Week number"
                className={styles.DayGridHeaderCell}
              >
                #
              </span>
              {getDayList({ date: DateTime.now().startOf('week'), amount: 7 }).map(
                (day) => (
                  <Calendar.DayGridHeaderCell
                    value={day}
                    key={day.toString()}
                    className={styles.DayGridHeaderCell}
                  />
                ),
              )}
            </Calendar.DayGridHeader>
            <Calendar.DayGridBody className={styles.DayGridBody}>
              {getWeekList({
                date: visibleDate.startOf('month'),
                amount: 'end-of-month',
              }).map((week) => (
                <Calendar.DayGridRow
                  value={week}
                  key={week.toString()}
                  className={styles.DayGridRow}
                >
                  <div
                    className={styles.DayWeekNumber}
                    role="rowheader"
                    aria-label={`Week ${week.weekNumber}`}
                  >
                    {week.weekNumber}
                  </div>
                  {getDayList({ date: week, amount: 7 }).map((day) => (
                    <Calendar.DayGridCell
                      value={day}
                      key={day.toString()}
                      className={styles.DayGridCell}
                    >
                      <Calendar.DayButton className={styles.DayButton} />
                    </Calendar.DayGridCell>
                  ))}
                </Calendar.DayGridRow>
              ))}
            </Calendar.DayGridBody>
          </Calendar.DayGrid>
        </React.Fragment>
      )}
    </Calendar.Root>
  );
}

export default function CalendarWeekNumber() {
  return (
    <TemporalAdapterProvider adapter={adapter}>
      <MyCalendar />
    </TemporalAdapterProvider>
  );
}
