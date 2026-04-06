'use client';
import * as React from 'react';
import { format } from 'date-fns/format';
import { Calendar } from '@base-ui/react/calendar';
import styles from '../../calendar.module.css';

const holidays: Array<[number, number]> = [
  [0, 1], // New Year's Day
  [6, 4], // Independence Day
  [10, 11], // Veterans Day
  [11, 25], // Christmas Day
];

function isDateUnavailable(date: Date) {
  const day = date.getDay();
  const month = date.getMonth();
  const dayOfMonth = date.getDate();

  // Weekends
  if (day === 0 || day === 6) {
    return true;
  }

  // US holidays
  if (holidays.some(([m, d]) => month === m && dayOfMonth === d)) {
    return true;
  }

  // First Monday of every month (maintenance day)
  if (day === 1 && dayOfMonth <= 7) {
    return true;
  }

  return false;
}

export default function UnavailableDatesCalendar() {
  return (
    <Calendar.Root
      className={styles.Root}
      isDateUnavailable={isDateUnavailable}
      aria-label="Appointment date"
    >
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
                {(day) => (
                  <Calendar.DayGridHeaderCell
                    value={day}
                    key={day.getTime()}
                    className={styles.DayGridHeaderCell}
                  />
                )}
              </Calendar.DayGridHeaderRow>
            </Calendar.DayGridHeader>
            <Calendar.DayGridBody className={styles.DayGridBody}>
              {(week) => (
                <Calendar.DayGridRow
                  value={week}
                  key={week.getTime()}
                  className={styles.DayGridRow}
                >
                  {(day) => (
                    <Calendar.DayGridCell
                      value={day}
                      key={day.getTime()}
                      className={styles.DayGridCell}
                    >
                      <Calendar.DayButton className={styles.DayButton} />
                    </Calendar.DayGridCell>
                  )}
                </Calendar.DayGridRow>
              )}
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
