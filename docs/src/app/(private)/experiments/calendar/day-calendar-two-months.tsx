'use client';
import * as React from 'react';
import clsx from 'clsx';
import { TemporalAdapterProvider } from '@base-ui-components/react/temporal-adapter-provider';
import { TemporalAdapterLuxon } from '@base-ui-components/react/temporal-adapter-luxon';
import { Calendar } from '@base-ui-components/react/calendar';
import { useCalendarContext } from '@base-ui-components/react/use-calendar-context';
import { Separator } from '@base-ui-components/react/separator';
import styles from './calendar.module.css';

const adapter = new TemporalAdapterLuxon();

function Header() {
  const { visibleDate } = useCalendarContext();

  return (
    <header className={styles.Header}>
      <div className={styles.HeaderPanel}>
        <Calendar.SetVisibleMonth
          target="previous"
          className={clsx(styles.SetVisibleMonth)}
        >
          ◀
        </Calendar.SetVisibleMonth>
        <span>{visibleDate.toFormat('MMMM yyyy')}</span>
        <span />
      </div>
      <div className={styles.HeaderPanel}>
        <span />
        <span>{visibleDate.plus({ month: 1 }).toFormat('MMMM yyyy')}</span>
        <Calendar.SetVisibleMonth
          target="next"
          className={clsx(styles.SetVisibleMonth)}
        >
          ▶
        </Calendar.SetVisibleMonth>
      </div>
    </header>
  );
}

function DayGrid(props: { offset: 0 | 1 }) {
  const { offset } = props;

  return (
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
      <Calendar.DayGridBody className={styles.DayGridBody} offset={offset}>
        {({ weeks }) =>
          weeks.map((week) => (
            <Calendar.DayGridRow
              value={week}
              key={week.toString()}
              className={styles.DayGridRow}
            >
              {({ days }) =>
                days.map((day) => (
                  <Calendar.DayCell
                    value={day}
                    key={day.toString()}
                    className={styles.DayCell}
                  />
                ))
              }
            </Calendar.DayGridRow>
          ))
        }
      </Calendar.DayGridBody>
    </Calendar.DayGrid>
  );
}

export default function DayCalendarWithTwoMonthsDemo() {
  return (
    <TemporalAdapterProvider adapter={adapter}>
      <Calendar.Root
        monthPageSize={2}
        className={clsx(styles.Root, styles.RootWithTwoPanels)}
      >
        <Header />
        <div className={styles.RootWithTwoPanelsContent}>
          <DayGrid offset={0} />
          <Separator className={styles.DayGridSeparator} />
          <DayGrid offset={1} />
        </div>
      </Calendar.Root>
    </TemporalAdapterProvider>
  );
}
