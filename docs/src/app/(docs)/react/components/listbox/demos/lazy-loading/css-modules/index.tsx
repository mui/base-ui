'use client';
import * as React from 'react';
import { Listbox } from '@base-ui/react/listbox';
import styles from './index.module.css';

const PAGE_SIZE = 10;

function generateItems(start: number, count: number) {
  return Array.from({ length: count }, (_, i) => ({
    label: `Item ${start + i + 1}`,
    value: `item-${start + i + 1}`,
  }));
}

export default function ExampleListboxLazyLoading() {
  const [items, setItems] = React.useState(() => generateItems(0, PAGE_SIZE));
  const [loading, setLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);

  const handleLoadMore = React.useCallback(() => {
    if (loading || !hasMore) {
      return;
    }

    setLoading(true);

    // Simulate an async fetch
    setTimeout(() => {
      setItems((prev) => {
        const newItems = generateItems(prev.length, PAGE_SIZE);
        const next = [...prev, ...newItems];
        if (next.length >= 50) {
          setHasMore(false);
        }
        return next;
      });
      setLoading(false);
    }, 800);
  }, [loading, hasMore]);

  return (
    <div className={styles.Field}>
      <Listbox.Root loading={loading} onLoadMore={hasMore ? handleLoadMore : undefined}>
        <Listbox.Label className={styles.Label}>Items</Listbox.Label>
        <Listbox.List className={styles.List}>
          {items.map(({ label, value }) => (
            <Listbox.Item key={value} value={value} className={styles.Item}>
              <Listbox.ItemIndicator className={styles.ItemIndicator}>
                <CheckIcon className={styles.ItemIndicatorIcon} />
              </Listbox.ItemIndicator>
              <Listbox.ItemText className={styles.ItemText}>{label}</Listbox.ItemText>
            </Listbox.Item>
          ))}
          {hasMore && (
            <Listbox.LoadingTrigger className={styles.Loading}>
              {loading ? 'Loading...' : 'Scroll for more'}
            </Listbox.LoadingTrigger>
          )}
        </Listbox.List>
      </Listbox.Root>
    </div>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}
