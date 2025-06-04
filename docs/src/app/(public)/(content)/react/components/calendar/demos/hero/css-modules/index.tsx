'use client';
import * as React from 'react';
import { TemporalAdapterProvider } from '@base-ui-components/react/temporal-adapter-provider';
import { TemporalAdapterLuxon } from '@base-ui-components/react/temporal-adapter-luxon';
import { Calendar } from '@base-ui-components/react/calendar';
import styles from './index.module.css';

const adapter = new TemporalAdapterLuxon();

export default function CalendarKeyboardNavigation() {
  return (
    <TemporalAdapterProvider adapter={adapter}>
      <Calendar.Root className={styles.Root}>
        {({ visibleDate }) => (
          <Calendar.KeyboardNavigation>
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
                            <Calendar.DayButton
                              render={<div />}
                              nativeButton={false}
                              className={styles.DayButton}
                            />
                          </Calendar.DayGridCell>
                        ))
                      }
                    </Calendar.DayGridRow>
                  ))
                }
              </Calendar.DayGridBody>
            </Calendar.DayGrid>
          </Calendar.KeyboardNavigation>
        )}
      </Calendar.Root>
    </TemporalAdapterProvider>
  );
}
