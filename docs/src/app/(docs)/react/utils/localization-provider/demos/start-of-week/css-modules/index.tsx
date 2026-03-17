'use client';
import * as React from 'react';
import { format } from 'date-fns/format';
import { enUS } from 'date-fns/locale/en-US';
import type { Day } from 'date-fns';
import { LocalizationProvider } from '@base-ui/react/localization-provider';
import { Calendar } from '@base-ui/react/calendar';
import { Select } from '@base-ui/react/select';
import { Check, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react';
import styles from '../../../calendar.module.css';
import indexStyles from './index.module.css';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function StartOfWeekCalendar() {
  const [weekStartsOn, setWeekStartsOn] = React.useState<Day>(1);
  const locale = React.useMemo(
    () => ({ ...enUS, options: { ...enUS.options, weekStartsOn } }),
    [weekStartsOn],
  );

  return (
    <div className={indexStyles.Wrapper}>
      <div>
        <Select.Root value={weekStartsOn} onValueChange={(value) => setWeekStartsOn(value as Day)}>
          <Select.Label className={indexStyles.Label}>First day of the week</Select.Label>
          <Select.Trigger className={indexStyles.Select}>
            <Select.Value className={indexStyles.Value}>
              {(value: Day) => dayNames[value]}
            </Select.Value>
            <Select.Icon className={indexStyles.SelectIcon}>
              <ChevronsUpDown />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner className={indexStyles.Positioner} sideOffset={8}>
              <Select.Popup className={indexStyles.Popup}>
                <Select.ScrollUpArrow className={indexStyles.ScrollArrow} />
                <Select.List className={indexStyles.List}>
                  {dayNames.map((day, index) => (
                    <Select.Item key={day} value={index} className={indexStyles.Item}>
                      <Select.ItemIndicator className={indexStyles.ItemIndicator}>
                        <Check className={indexStyles.ItemIndicatorIcon} />
                      </Select.ItemIndicator>
                      <Select.ItemText className={indexStyles.ItemText}>{day}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.List>
                <Select.ScrollDownArrow className={indexStyles.ScrollArrow} />
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </div>
      <LocalizationProvider temporalLocale={locale}>
        <Calendar.Root className={styles.Root}>
          {({ visibleDate }) => (
            <React.Fragment>
              <header className={styles.Header}>
                <Calendar.DecrementMonth className={styles.DecrementMonth}>
                  <ChevronLeft />
                </Calendar.DecrementMonth>
                <span className={styles.HeaderLabel}>{format(visibleDate, 'MMMM yyyy')}</span>
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
                        key={day.getTime()}
                        className={styles.DayGridHeaderCell}
                      />
                    )}
                  </Calendar.DayGridHeaderRow>
                </Calendar.DayGridHeader>
                <Calendar.DayGridBody className={styles.DayGridBody}>
                  {(week) => (
                    <Calendar.DayGridRow
                      value={week}
                      key={week.getTime()}
                      className={styles.DayGridRow}
                    >
                      {(day) => (
                        <Calendar.DayGridCell
                          value={day}
                          key={day.getTime()}
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
      </LocalizationProvider>
    </div>
  );
}
