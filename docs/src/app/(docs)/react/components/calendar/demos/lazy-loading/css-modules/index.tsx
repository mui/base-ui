'use client';
import * as React from 'react';
import clsx from 'clsx';
import { format } from 'date-fns/format';
import { Calendar } from '@base-ui/react/calendar';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from '../../calendar.module.css';
import indexStyles from './index.module.css';

function DayPrice({
  loading,
  price,
  isDeal,
  loadingDelay,
  revealDelay,
}: {
  loading: boolean;
  price: number | null | undefined;
  isDeal: boolean;
  loadingDelay: string;
  revealDelay: string;
}) {
  if (loading) {
    return (
      <span
        className={indexStyles.Skeleton}
        style={{ animationDelay: loadingDelay }}
        aria-hidden="true"
      />
    );
  }
  if (price != null) {
    return (
      <span
        className={clsx(indexStyles.Price, isDeal && indexStyles.PriceDeal)}
        style={{ animationDelay: revealDelay }}
      >
        ${price}
      </span>
    );
  }
  return (
    <span className={indexStyles.PriceSoldOut} style={{ animationDelay: revealDelay }}>
      —
    </span>
  );
}

function CalendarContent() {
  const { visibleDate } = Calendar.useContext();
  const [prices, setPrices] = React.useState<Record<string, number | null>>({});
  const [loading, setLoading] = React.useState(true);
  const timeout = useTimeout();

  const monthKey = format(visibleDate, 'yyyy-MM');

  React.useEffect(() => {
    const year = parseInt(monthKey.split('-')[0], 10);
    const month = parseInt(monthKey.split('-')[1], 10) - 1;
    setLoading(true);
    timeout.start(800, () => {
      setPrices((prev) => ({ ...prev, ...generateMonthPrices(year, month) }));
      setLoading(false);
    });
  }, [monthKey, timeout]);

  const minPrice = React.useMemo(() => {
    const monthPrices = Object.entries(prices)
      .filter(([key]) => key.startsWith(monthKey))
      .flatMap(([, p]) => (p != null ? [p] : []));
    return monthPrices.length > 0 ? Math.min(...monthPrices) : null;
  }, [prices, monthKey]);

  return (
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
      <Calendar.DayGrid className={clsx(styles.DayGrid, indexStyles.DayGrid)}>
        <Calendar.DayGridHeader className={styles.DayGridHeader}>
          <Calendar.DayGridHeaderRow className={styles.DayGridHeaderRow}>
            {(day) => (
              <Calendar.DayGridHeaderCell
                value={day}
                key={day.toString()}
                className={clsx(styles.DayGridHeaderCell, indexStyles.DayGridHeaderCell)}
              />
            )}
          </Calendar.DayGridHeaderRow>
        </Calendar.DayGridHeader>
        <Calendar.DayGridBody className={styles.DayGridBody}>
          {(week) => (
            <Calendar.DayGridRow value={week} key={week.toString()} className={styles.DayGridRow}>
              {(day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const inCurrentMonth = dateKey.startsWith(monthKey);
                const price = prices[dateKey];
                const isDeal = inCurrentMonth && price != null && price === minPrice;
                const daySeed =
                  day.getFullYear() * 10000 + (day.getMonth() + 1) * 100 + day.getDate();
                const loadingDelay = `${(seededRandom(daySeed + 50) * 0.4).toFixed(3)}s`;
                const revealDelay = `${(seededRandom(daySeed + 60) * 0.5).toFixed(3)}s`;
                return (
                  <Calendar.DayGridCell
                    value={day}
                    key={day.toString()}
                    className={styles.DayGridCell}
                  >
                    <Calendar.DayButton className={clsx(styles.DayButton, indexStyles.DayButton)}>
                      <span className={indexStyles.DayNumber}>{format(day, 'd')}</span>
                      {inCurrentMonth && (
                        <DayPrice
                          loading={loading}
                          price={price}
                          isDeal={isDeal}
                          loadingDelay={loadingDelay}
                          revealDelay={revealDelay}
                        />
                      )}
                    </Calendar.DayButton>
                  </Calendar.DayGridCell>
                );
              }}
            </Calendar.DayGridRow>
          )}
        </Calendar.DayGridBody>
      </Calendar.DayGrid>
    </React.Fragment>
  );
}

export default function FlightPriceCalendar() {
  return (
    <Calendar.Root
      className={clsx(styles.Root, indexStyles.Root)}
      aria-label="Flight departure date"
    >
      <CalendarContent />
    </Calendar.Root>
  );
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateMonthPrices(year: number, month: number): Record<string, number | null> {
  const prices: Record<string, number | null> = {};
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d += 1) {
    const date = new Date(year, month, d);
    const dateKey = format(date, 'yyyy-MM-dd');
    const seed = year * 10000 + (month + 1) * 100 + d;
    const rand = seededRandom(seed);
    prices[dateKey] = rand < 0.15 ? null : Math.floor(79 + seededRandom(seed + 1) * 320);
  }
  return prices;
}
