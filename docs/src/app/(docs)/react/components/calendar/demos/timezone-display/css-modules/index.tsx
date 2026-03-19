'use client';
import * as React from 'react';
import { format } from 'date-fns/format';
import { Calendar } from '@base-ui/react/calendar';
import { Select } from '@base-ui/react/select';
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
                <ChevronLeftIcon />
              </Calendar.DecrementMonth>
              <span className={styles.HeaderLabel}>{format(visibleDate, 'MMMM yyyy')}</span>
              <Calendar.IncrementMonth className={styles.IncrementMonth}>
                <ChevronRightIcon />
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
          <ChevronUpDownIcon />
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
                    <CheckIcon className={indexStyles.ItemIndicatorIcon} />
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

function ChevronUpDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="8"
      height="12"
      viewBox="0 0 8 12"
      fill="none"
      stroke="currentcolor"
      strokeWidth="1.5"
      {...props}
    >
      <path d="M0.5 4.5L4 1.5L7.5 4.5" />
      <path d="M0.5 7.5L4 10.5L7.5 7.5" />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}

function ChevronLeftIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentcolor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentcolor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
