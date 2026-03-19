'use client';
import * as React from 'react';
import { format } from 'date-fns/format';
import { startOfWeek } from 'date-fns/startOfWeek';
import { startOfMonth } from 'date-fns/startOfMonth';
import { getWeek } from 'date-fns/getWeek';
import { Calendar } from '@base-ui/react/calendar';
import styles from '../../calendar.module.css';
import indexStyles from './index.module.css';

export default function CalendarWithWeekNumbers() {
  const getWeekList = Calendar.useWeekList();
  const getDayList = Calendar.useDayList();

  return (
    <Calendar.Root className={styles.Root}>
      {({ visibleDate }) => (
        <React.Fragment>
          <header className={styles.Header}>
            <Calendar.DecrementMonth className={styles.DecrementMonth}>
              <ChevronLeftIcon />
            </Calendar.DecrementMonth>
            <span className={styles.HeaderLabel}>{format(visibleDate, 'MMMM yyyy')}</span>
            <Calendar.IncrementMonth className={styles.IncrementMonth}>
              <ChevronRightIcon />
            </Calendar.IncrementMonth>
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
                    key={day.getTime()}
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
                  key={week.getTime()}
                  className={styles.DayGridRow}
                >
                  <th
                    className={indexStyles.DayWeekNumber}
                    scope="row"
                    aria-label={`Week ${getWeek(week)}`}
                  >
                    {getWeek(week)}
                  </th>
                  {getDayList({ date: week, amount: 7 }).map((day) => (
                    <Calendar.DayGridCell
                      value={day}
                      key={day.getTime()}
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

function ChevronLeftIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentcolor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentcolor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
