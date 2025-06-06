'use client';
import * as React from 'react';
import { TemporalAdapterProvider } from '@base-ui-components/react/temporal-adapter-provider';
import { TemporalAdapterLuxon } from '@base-ui-components/react/temporal-adapter-luxon';
import { Calendar } from '@base-ui-components/react/calendar';
import styles from './index.module.css';

const adapter = new TemporalAdapterLuxon();

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
            <span className={styles.HeaderLabel}>
              {visibleDate.toFormat('MMMM yyyy')}
            </span>
            <Calendar.SetNextMonth className={styles.SetNextMonth}>
              ▶
            </Calendar.SetNextMonth>
          </header>
          <Calendar.DayGrid className={styles.DayGrid}>
            <Calendar.DayGridHeader className={styles.DayGridHeader}>
              {(day) => (
                <Calendar.DayGridHeaderCell
                  value={day}
                  key={day.toString()}
                  className={styles.DayGridHeaderCell}
                />
              )}
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
