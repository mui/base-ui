'use client';
import * as React from 'react';
import { DateTime } from 'luxon';
import { TemporalAdapterProvider } from '@base-ui-components/react/temporal-adapter-provider';
import { TemporalAdapterLuxon } from '@base-ui-components/react/temporal-adapter-luxon';
import { Calendar } from '@base-ui-components/react/calendar';
import styles from './calendar.module.css';

const adapter = new TemporalAdapterLuxon();

function isDateUnavailable(date: DateTime) {
  return date.weekday === 6 || date.weekday === 7; // Unavailable on weekends
}

export default function CalendarUnavailableDates() {
  const minDate = React.useMemo(() => DateTime.now().plus({ days: -8 }), []);

  return (
    <TemporalAdapterProvider adapter={adapter}>
      <Calendar.Root
        className={styles.Root}
        minDate={minDate}
        isDateUnavailable={isDateUnavailable}
      >
        {({ visibleDate }) => (
          <React.Fragment>
            <header className={styles.Header}>
              <Calendar.SetVisibleMonth
                target="previous"
                className={styles.SetVisibleMonth}
              >
                ◀
              </Calendar.SetVisibleMonth>
              <span className={styles.HeaderLabel}>
                {visibleDate.toFormat('MMMM yyyy')}
              </span>
              <Calendar.SetVisibleMonth
                target="next"
                className={styles.SetVisibleMonth}
              >
                ▶
              </Calendar.SetVisibleMonth>
            </header>
            <Calendar.DayGrid className={styles.DayGrid}>
              <Calendar.DayGridHeader className={styles.DayGridHeader}>
                {({ days }) =>
                  days.map((day) => (
                    <Calendar.DayGridHeaderCell
                      value={day}
                      key={day.toString()}
                      className={styles.DayGridHeaderCell}
                    />
                  ))
                }
              </Calendar.DayGridHeader>
              <Calendar.DayGridBody className={styles.DayGridBody}>
                {({ weeks }) =>
                  weeks.map((week) => (
                    <Calendar.DayGridRow
                      value={week}
                      key={week.toString()}
                      className={styles.DayGridRow}
                    >
                      {({ days }) =>
                        days.map((day) => (
                          <Calendar.DayGridCell
                            value={day}
                            key={day.toString()}
                            className={styles.DayGridCell}
                          >
                            <Calendar.DayButton className={styles.DayButton} />
                          </Calendar.DayGridCell>
                        ))
                      }
                    </Calendar.DayGridRow>
                  ))
                }
              </Calendar.DayGridBody>
            </Calendar.DayGrid>
          </React.Fragment>
        )}
      </Calendar.Root>
    </TemporalAdapterProvider>
  );
}
