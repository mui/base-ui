'use client';
import * as React from 'react';
import clsx from 'clsx';
import { format } from 'date-fns/format';
import { Calendar } from '@base-ui/react/calendar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from '../../calendar.module.css';
import indexStyles from './index.module.css';

export default function AnimatedCalendar() {
  return (
    <Calendar.Root className={clsx(styles.Root, indexStyles.Root)}>
      {({ visibleDate }) => (
        <React.Fragment>
          <header className={styles.Header}>
            <Calendar.DecrementMonth className={styles.DecrementMonth}>
              <ChevronLeft />
            </Calendar.DecrementMonth>
            <div className={indexStyles.HeaderLabelWrapper}>
              <Calendar.Viewport>
                <span className={clsx(styles.HeaderLabel, indexStyles.HeaderLabel)}>
                  {format(visibleDate, 'MMMM yyyy')}
                </span>
              </Calendar.Viewport>
            </div>
            <Calendar.IncrementMonth className={styles.IncrementMonth}>
              <ChevronRight />
            </Calendar.IncrementMonth>
          </header>
          <Calendar.DayGrid className={clsx(styles.DayGrid, indexStyles.DayGrid)}>
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
            <Calendar.Viewport>
              <Calendar.DayGridBody className={clsx(styles.DayGridBody, indexStyles.DayGridBody)}>
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
            </Calendar.Viewport>
          </Calendar.DayGrid>
        </React.Fragment>
      )}
    </Calendar.Root>
  );
}
