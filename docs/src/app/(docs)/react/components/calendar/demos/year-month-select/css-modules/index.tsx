'use client';
import * as React from 'react';
import { format } from 'date-fns/format';
import { getMonth } from 'date-fns/getMonth';
import { getYear } from 'date-fns/getYear';
import { Calendar } from '@base-ui/react/calendar';
import styles from '../../calendar.module.css';
import indexStyles from './index.module.css';

const YEAR_PAST = 40;
const YEAR_FUTURE = 10;
const MONTHS = Array.from({ length: 12 }, (_, i) => format(new Date(2000, i, 1), 'MMMM'));

function CalendarContent() {
  const { visibleDate, setVisibleDate } = Calendar.useContext();
  const currentMonth = getMonth(visibleDate);
  const currentYear = getYear(visibleDate);
  const todayYear = getYear(new Date());
  const years = Array.from(
    { length: YEAR_PAST + YEAR_FUTURE + 1 },
    (_, i) => todayYear - YEAR_PAST + i,
  );

  return (
    <React.Fragment>
      <header className={styles.Header}>
        <Calendar.DecrementMonth className={styles.DecrementMonth}>
          <ChevronLeftIcon />
        </Calendar.DecrementMonth>
        <select
          className={indexStyles.Select}
          value={currentMonth}
          onChange={(event) =>
            setVisibleDate(
              new Date(currentYear, Number(event.target.value), 1),
              event.nativeEvent,
              event.target,
              'month-change',
            )
          }
        >
          {MONTHS.map((name, index) => (
            <option key={name} value={index}>
              {name}
            </option>
          ))}
        </select>
        <select
          className={indexStyles.Select}
          value={currentYear}
          onChange={(event) =>
            setVisibleDate(
              new Date(Number(event.target.value), currentMonth, 1),
              event.nativeEvent,
              event.target,
              'month-change',
            )
          }
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
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
            <Calendar.DayGridRow value={week} key={week.getTime()} className={styles.DayGridRow}>
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
  );
}

export default function ExampleCalendarYearMonthSelect() {
  return (
    <Calendar.Root className={styles.Root}>
      <CalendarContent />
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
