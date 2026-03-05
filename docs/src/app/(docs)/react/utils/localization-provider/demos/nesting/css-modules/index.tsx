'use client';
import * as React from 'react';
import { format } from 'date-fns/format';
import { fr, zhCN } from 'date-fns/locale';
import { LocalizationProvider, useTemporalLocale } from '@base-ui/react/localization-provider';
import { Calendar } from '@base-ui/react/calendar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from '../../../calendar.module.css';
import indexStyles from './index.module.css';

export default function NestedLocalizedCalendars() {
  return (
    <div className={indexStyles.Wrapper}>
      <LocalizationProvider temporalLocale={fr}>
        <LocalizedCalendar />
        <LocalizationProvider temporalLocale={zhCN}>
          <LocalizedCalendar />
        </LocalizationProvider>
      </LocalizationProvider>
    </div>
  );
}

function LocalizedCalendar() {
  const locale = useTemporalLocale();
  return (
    <Calendar.Root className={styles.Root}>
      {({ visibleDate }) => (
        <React.Fragment>
          <header className={styles.Header}>
            <Calendar.DecrementMonth className={styles.DecrementMonth}>
              <ChevronLeft />
            </Calendar.DecrementMonth>
            <span className={styles.HeaderLabel}>
              {format(visibleDate, 'MMMM yyyy', { locale })}
            </span>
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
