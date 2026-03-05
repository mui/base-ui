'use client';
import * as React from 'react';
import { format } from 'date-fns/format';
import { startOfWeek } from 'date-fns/startOfWeek';
import { startOfMonth } from 'date-fns/startOfMonth';
import { getWeek } from 'date-fns/getWeek';
import { Calendar } from '@base-ui/react/calendar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
              <ChevronLeft />
            </Calendar.DecrementMonth>
            <span className={styles.HeaderLabel}>{format(visibleDate, 'MMMM yyyy')}</span>
            <Calendar.IncrementMonth className={styles.IncrementMonth}>
              <ChevronRight />
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
