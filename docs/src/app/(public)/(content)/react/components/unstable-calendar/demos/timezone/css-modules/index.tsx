import * as React from 'react';
import { format } from 'date-fns/format';
import { TZDate } from '@date-fns/tz';
import { Calendar } from '@base-ui-components/react/calendar';
import styles from '../../calendar.module.css';
import indexStyles from './index.module.css';

export default function CalendarWithTimezone() {
  const [value, setValue] = React.useState<Date | null>(
    new TZDate(2025, 3, 17, 4, 45, 0, 0, 'Europe/Paris'),
  );
  return (
    <div className={indexStyles.Wrapper}>
      <p className={indexStyles.Text}>
        Calendar is displayed in <strong>America/New_York</strong> timezone.
      </p>
      <Calendar.Root
        className={styles.Root}
        timezone="America/New_York"
        value={value}
        onValueChange={setValue}
      >
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
      {value && <p className={indexStyles.Text}>Stored date: {value.toString()}</p>}
    </div>
  );
}
