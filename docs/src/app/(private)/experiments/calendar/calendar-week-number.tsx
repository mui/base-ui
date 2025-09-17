'use client';
import * as React from 'react';
import clsx from 'clsx';
import { format, startOfWeek, startOfMonth, getWeek } from 'date-fns';
import { UnstableTemporalAdapterProvider as TemporalAdapterProvider } from '@base-ui-components/react/temporal-adapter-provider';
import { UnstableTemporalAdapterDateFns as TemporalAdapterDateFns } from '@base-ui-components/react/temporal-adapter-date-fns';
import { Calendar } from '@base-ui-components/react/calendar';
import { unstable_useDayList as useDayList } from '@base-ui-components/react/use-day-list';
import { unstable_useWeekList as useWeekList } from '@base-ui-components/react/use-week-list';
import styles from './calendar.module.css';

const adapter = new TemporalAdapterDateFns();

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
            <span className={styles.HeaderLabel}>{format(visibleDate, 'MMMM yyyy')}</span>
            <Calendar.SetNextMonth className={styles.SetNextMonth}>▶</Calendar.SetNextMonth>
          </header>
          <Calendar.DayGrid className={styles.DayGrid}>
            <Calendar.DayGridHeader className={styles.DayGridHeader}>
              <Calendar.DayGridHeaderRow className={styles.DayGridHeaderRow}>
                <th
                  role="columnheader"
                  aria-label="Week number"
                  className={styles.DayGridHeaderCell}
                >
                  #
                </th>
                {getDayList({ date: startOfWeek(new Date()), amount: 7 }).map((day) => (
                  <Calendar.DayGridHeaderCell
                    value={day}
                    key={day.toString()}
                    className={styles.DayGridHeaderCell}
                  />
                ))}
              </Calendar.DayGridHeaderRow>
            </Calendar.DayGridHeader>
            <Calendar.DayGridBody className={styles.DayGridBody}>
              {getWeekList({
                date: startOfMonth(visibleDate),
                amount: 'end-of-month',
              }).map((week) => (
                <Calendar.DayGridRow
                  value={week}
                  key={week.toString()}
                  className={styles.DayGridRow}
                >
                  <td
                    className={styles.DayWeekNumber}
                    role="rowheader"
                    aria-label={`Week ${getWeek(week)}`}
                  >
                    {getWeek(week)}
                  </td>
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
