'use client';
import * as React from 'react';
import { DateTime } from 'luxon';
import { UnstableTemporalAdapterProvider as TemporalAdapterProvider } from '@base-ui-components/react/temporal-adapter-provider';
import { UnstableTemporalAdapterLuxon as TemporalAdapterLuxon } from '@base-ui-components/react/temporal-adapter-luxon';
import { Calendar } from '@base-ui-components/react/calendar';
import styles from './calendar.module.css';

const adapter = new TemporalAdapterLuxon();

export default function CalendarMinDate() {
  const today = React.useMemo(() => DateTime.now().endOf('month'), []);

  return (
    <TemporalAdapterProvider adapter={adapter}>
      <Calendar.Root className={styles.Root} maxDate={today}>
        {({ visibleDate }) => (
          <React.Fragment>
            <header className={styles.Header}>
              <Calendar.SetPreviousMonth className={styles.SetPreviousMonth}>
                ◀
              </Calendar.SetPreviousMonth>
              <span className={styles.HeaderLabel}>{visibleDate.toFormat('MMMM yyyy')}</span>
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
    </TemporalAdapterProvider>
  );
}
