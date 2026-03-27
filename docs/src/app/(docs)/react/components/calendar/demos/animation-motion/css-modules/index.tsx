'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { format } from 'date-fns/format';
import { Calendar } from '@base-ui/react/calendar';
import { motion, AnimatePresence } from 'motion/react';
import styles from '../../calendar.module.css';

export default function AnimatedCalendarWithMotion() {
  const calendarRef = React.useRef<HTMLDivElement>(null);
  const shouldRestoreFocusRef = React.useRef(false);

  return (
    <Calendar.Root
      ref={calendarRef}
      className={styles.Root}
      onVisibleDateChange={(_, eventDetails) => {
        shouldRestoreFocusRef.current = eventDetails.reason === 'keyboard';
      }}
    >
      {({ visibleDate }) => (
        <AnimatedCalendarContent
          calendarRef={calendarRef}
          visibleDate={visibleDate}
          shouldRestoreFocusRef={shouldRestoreFocusRef}
        />
      )}
    </Calendar.Root>
  );
}

function AnimatedCalendarContent({
  calendarRef,
  visibleDate,
  shouldRestoreFocusRef,
}: {
  calendarRef: React.RefObject<HTMLDivElement | null>;
  visibleDate: Date;
  shouldRestoreFocusRef: React.RefObject<boolean>;
}) {
  const visibleMonthKey = format(visibleDate, 'yyyy-MM');

  useIsoLayoutEffect(() => {
    if (!shouldRestoreFocusRef.current) {
      return;
    }

    calendarRef.current
      ?.querySelector<HTMLButtonElement>(
        `tbody[data-visible-month="${visibleMonthKey}"] button[tabindex="0"]`,
      )
      ?.focus();

    shouldRestoreFocusRef.current = false;
  }, [calendarRef, shouldRestoreFocusRef, visibleMonthKey]);

  return (
    <React.Fragment>
      <header className={styles.Header}>
        <Calendar.DecrementMonth className={styles.DecrementMonth}>
          <ChevronLeftIcon />
        </Calendar.DecrementMonth>
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span layout className={styles.HeaderLabel}>
            {format(visibleDate, 'MMMM yyyy')}
          </motion.span>
        </AnimatePresence>
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
        <AnimatePresence initial={false} mode="popLayout">
          <Calendar.DayGridBody
            key={visibleMonthKey}
            className={styles.DayGridBody}
            render={
              <motion.tbody
                data-visible-month={visibleMonthKey}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
              />
            }
          >
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
        </AnimatePresence>
      </Calendar.DayGrid>
    </React.Fragment>
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
