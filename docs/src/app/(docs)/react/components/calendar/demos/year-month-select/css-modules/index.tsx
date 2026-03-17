'use client';
import * as React from 'react';
import { format } from 'date-fns/format';
import { getMonth } from 'date-fns/getMonth';
import { getYear } from 'date-fns/getYear';
import { Calendar } from '@base-ui/react/calendar';
import { Select } from '@base-ui/react/select';
import { Check, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react';
import styles from '../../calendar.module.css';
import indexStyles from './index.module.css';

const YEAR_PAST = 40;
const YEAR_FUTURE = 10;
const MONTHS = Array.from({ length: 12 }, (_, i) => format(new Date(2000, i, 1), 'MMMM'));

function CalendarContent() {
  const { visibleDate, setVisibleDate } = Calendar.useContext();
  const currentMonth = getMonth(visibleDate);
  const currentYear = getYear(visibleDate);
  const todayYear = getYear(new Date());
  const years = Array.from(
    { length: YEAR_PAST + YEAR_FUTURE + 1 },
    (_, i) => todayYear - YEAR_PAST + i,
  );

  return (
    <React.Fragment>
      <header className={styles.Header}>
        <Calendar.DecrementMonth className={styles.DecrementMonth}>
          <ChevronLeft />
        </Calendar.DecrementMonth>
        <div className={indexStyles.HeaderSelectWrapper}>
          <Select.Root
            value={currentMonth}
            onValueChange={(value, eventDetails) => {
              if (value != null) {
                setVisibleDate(
                  new Date(currentYear, value, 1),
                  eventDetails.event,
                  eventDetails.trigger as HTMLElement,
                  'month-change',
                );
              }
            }}
          >
            <Select.Trigger className={indexStyles.Select} data-month-select>
              <Select.Value className={indexStyles.Value}>
                {(value: number) => MONTHS[value]}
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
                    {MONTHS.map((name, index) => (
                      <Select.Item key={name} value={index} className={indexStyles.Item}>
                        <Select.ItemIndicator className={indexStyles.ItemIndicator}>
                          <Check className={indexStyles.ItemIndicatorIcon} />
                        </Select.ItemIndicator>
                        <Select.ItemText className={indexStyles.ItemText}>{name}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.List>
                  <Select.ScrollDownArrow className={indexStyles.ScrollArrow} />
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
          <Select.Root
            value={currentYear}
            onValueChange={(value, eventDetails) => {
              if (value != null) {
                setVisibleDate(
                  new Date(value, currentMonth, 1),
                  eventDetails.event,
                  eventDetails.trigger as HTMLElement,
                  'month-change',
                );
              }
            }}
          >
            <Select.Trigger className={indexStyles.Select}>
              <Select.Value className={indexStyles.Value} />
              <Select.Icon className={indexStyles.SelectIcon}>
                <ChevronsUpDown />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner className={indexStyles.Positioner} sideOffset={8}>
                <Select.Popup className={indexStyles.Popup}>
                  <Select.ScrollUpArrow className={indexStyles.ScrollArrow} />
                  <Select.List className={indexStyles.List}>
                    {years.map((year) => (
                      <Select.Item key={year} value={year} className={indexStyles.Item}>
                        <Select.ItemIndicator className={indexStyles.ItemIndicator}>
                          <Check className={indexStyles.ItemIndicatorIcon} />
                        </Select.ItemIndicator>
                        <Select.ItemText className={indexStyles.ItemText}>{year}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.List>
                  <Select.ScrollDownArrow className={indexStyles.ScrollArrow} />
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </div>
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
            <Calendar.DayGridRow value={week} key={week.getTime()} className={styles.DayGridRow}>
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
  );
}

export default function ExampleCalendarYearMonthSelect() {
  return (
    <Calendar.Root className={styles.Root}>
      <CalendarContent />
    </Calendar.Root>
  );
}
