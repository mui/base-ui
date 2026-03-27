import * as React from 'react';
import { Calendar } from '@base-ui/react/calendar';
import styles from './AnimatedViewport.module.css';

export default function CalendarAnimatedViewport() {
  return (
    <Calendar.Root className={styles.Root} defaultVisibleDate={new Date(2026, 2, 15)}>
      {({ visibleDate }) => (
        <React.Fragment>
          <header className={styles.Header}>
            <Calendar.DecrementMonth data-testid="previous-month">Previous</Calendar.DecrementMonth>
            <div className={styles.HeaderLabelWrapper}>
              <Calendar.Viewport>
                <span className={styles.HeaderLabel}>
                  {visibleDate.toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </Calendar.Viewport>
            </div>
            <Calendar.IncrementMonth data-testid="next-month">Next</Calendar.IncrementMonth>
          </header>
          <Calendar.DayGrid className={styles.DayGrid}>
            <Calendar.DayGridHeader>
              <Calendar.DayGridHeaderRow className={styles.DayGridHeaderRow}>
                {(day) => (
                  <Calendar.DayGridHeaderCell
                    className={styles.DayGridHeaderCell}
                    key={day.getTime()}
                    value={day}
                  />
                )}
              </Calendar.DayGridHeaderRow>
            </Calendar.DayGridHeader>
            <Calendar.Viewport>
              <Calendar.DayGridBody className={styles.DayGridBody}>
                {(week) => (
                  <Calendar.DayGridRow
                    className={styles.DayGridRow}
                    key={week.getTime()}
                    value={week}
                  >
                    {(day) => (
                      <Calendar.DayGridCell
                        className={styles.DayGridCell}
                        key={day.getTime()}
                        value={day}
                      >
                        <Calendar.DayButton className={styles.DayButton} />
                      </Calendar.DayGridCell>
                    )}
                  </Calendar.DayGridRow>
                )}
              </Calendar.DayGridBody>
            </Calendar.Viewport>
          </Calendar.DayGrid>
        </React.Fragment>
      )}
    </Calendar.Root>
  );
}
