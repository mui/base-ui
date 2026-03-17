'use client';
import * as React from 'react';
import { format } from 'date-fns/format';
import { Calendar } from '@base-ui/react/calendar';
import { Select } from '@base-ui/react/select';
import { Check, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react';
import styles from '../../calendar.module.css';
import indexStyles from './index.module.css';

export default function CalendarWithTimezoneDisplay() {
  const [timezone, setTimezone] = React.useState<Timezone | null>('Australia/Sydney');
  return (
    <div className={indexStyles.Wrapper}>
      <TimezoneSelect
        value={timezone}
        onValueChange={(value) => setTimezone(value as Timezone | null)}
      />
      <Calendar.Root className={styles.Root} timezone={timezone ?? undefined}>
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
    </div>
  );
}

function TimezoneSelect(props: Omit<Select.Root.Props<string, false>, 'children'>) {
  return (
    <Select.Root {...props}>
      <Select.Trigger className={indexStyles.Select}>
        <Select.Value placeholder="Select timezone" />
        <Select.Icon className={indexStyles.SelectIcon}>
          <ChevronsUpDown />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner className={indexStyles.Positioner} sideOffset={8}>
          <Select.Popup className={indexStyles.Popup}>
            <Select.ScrollUpArrow className={indexStyles.ScrollArrow} />
            <Select.List className={indexStyles.List}>
              {timezones.map((timezone) => (
                <Select.Item key={timezone} value={timezone} className={indexStyles.Item}>
                  <Select.ItemIndicator className={indexStyles.ItemIndicator}>
                    <Check className={indexStyles.ItemIndicatorIcon} />
                  </Select.ItemIndicator>
                  <Select.ItemText className={indexStyles.ItemText}>{timezone}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.List>
            <Select.ScrollDownArrow className={indexStyles.ScrollArrow} />
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

type Timezone = (typeof timezones)[number];

const timezones = [
  'America/Los_Angeles',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney',
] as const;
