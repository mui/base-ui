'use client';
import * as React from 'react';
import { format } from 'date-fns/format';
import { enUS } from 'date-fns/locale/en-US';
import type { Day } from 'date-fns';
import { LocalizationProvider } from '@base-ui/react/localization-provider';
import { Calendar } from '@base-ui/react/calendar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from '../../../calendar.module.css';
import indexStyles from './index.module.css';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function StartOfWeekCalendar() {
  const [weekStartsOn, setWeekStartsOn] = React.useState<Day>(1);
  const locale = React.useMemo(
    () => ({ ...enUS, options: { ...enUS.options, weekStartsOn } }),
    [weekStartsOn],
  );

  return (
    <div className={indexStyles.Wrapper}>
      <label className={indexStyles.Label}>
        First day of the week
        <select
          className={indexStyles.Select}
          value={weekStartsOn}
          onChange={(event) => setWeekStartsOn(Number(event.target.value) as Day)}
        >
          {dayNames.map((day, index) => (
            <option key={day} value={index}>
              {day}
            </option>
          ))}
        </select>
      </label>
      <LocalizationProvider temporalLocale={locale}>
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
      </LocalizationProvider>
    </div>
  );
}
