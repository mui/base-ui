'use client';
import * as React from 'react';
import { format } from 'date-fns/format';
import { Locale, fr, zhCN } from 'date-fns/locale';
import { UnstableTemporalLocaleProvider as TemporalLocaleProvider } from '@base-ui-components/react/temporal-locale-provider';
import { Calendar } from '@base-ui-components/react/calendar';
import styles from './index.module.css';

export default function NestedLocalizedCalendars() {
  return (
    <div className={styles.Wrapper}>
      <TemporalLocaleProvider locale={fr}>
        <LocalizedCalendar locale={fr} />
        <TemporalLocaleProvider locale={zhCN}>
          <LocalizedCalendar locale={zhCN} />
        </TemporalLocaleProvider>
      </TemporalLocaleProvider>
    </div>
  );
}

function LocalizedCalendar({ locale }: { locale: Locale }) {
  return (
    <Calendar.Root className={styles.Root}>
      {({ visibleDate }) => (
        <React.Fragment>
          <header className={styles.Header}>
            <Calendar.SetPreviousMonth className={styles.SetPreviousMonth}>
              ◀
            </Calendar.SetPreviousMonth>
            <span className={styles.HeaderLabel}>
              {format(visibleDate, 'MMMM yyyy', { locale })}
            </span>
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
