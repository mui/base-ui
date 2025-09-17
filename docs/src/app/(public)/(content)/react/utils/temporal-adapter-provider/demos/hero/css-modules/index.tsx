'use client';
import * as React from 'react';
import { format } from 'date-fns';
import { UnstableTemporalAdapterProvider as TemporalAdapterProvider } from '@base-ui-components/react/temporal-adapter-provider';
import { UnstableTemporalAdapterDateFns as TemporalAdapterDateFns } from '@base-ui-components/react/temporal-adapter-date-fns';
import { Calendar } from '@base-ui-components/react/calendar';
import styles from './index.module.css';

const adapter = new TemporalAdapterDateFns();

export default function ExampleCalendar() {
  return (
    <TemporalAdapterProvider adapter={adapter}>
      <MyCalendar />
    </TemporalAdapterProvider>
  );
}

function MyCalendar() {
  return (
    <Calendar.Root className={styles.Root}>
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
                {(day) => (
                  <Calendar.DayGridHeaderCell
                    value={day}
                    key={day.toString()}
                    className={styles.DayGridHeaderCell}
                  />
                )}
              </Calendar.DayGridHeaderRow>
            </Calendar.DayGridHeader>
            <Calendar.DayGridBody className={styles.DayGridBody}>
              {(week) => (
                <Calendar.DayGridRow
                  value={week}
                  key={week.toString()}
                  className={styles.DayGridRow}
                >
                  {(day) => (
                    <Calendar.DayGridCell
                      value={day}
                      key={day.toString()}
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
