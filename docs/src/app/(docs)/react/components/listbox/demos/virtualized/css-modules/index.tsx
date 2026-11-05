'use client';
import * as React from 'react';
import { Listbox } from '@base-ui/react/listbox';
import { useVirtualizer } from '@tanstack/react-virtual';
import styles from './index.module.css';

const ITEM_HEIGHT = 32;

export default function ExampleListboxVirtualized() {
  const listRef = React.useRef<HTMLDivElement>(null);
  const [value, setValue] = React.useState<Item[]>([]);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => ITEM_HEIGHT,
    // The same 2px spacing as the other examples.
    gap: 2,
    overscan: 5,
  });

  return (
    <div className={styles.Field}>
      <Listbox.Root
        multiple="opt-in"
        items={items}
        value={value}
        onValueChange={(nextValue, eventDetails) => {
          // The listbox only knows which rendered items are disabled, so remove the rest from
          // ranges.
          if (eventDetails.range) {
            nextValue = nextValue.filter((item) => !item.disabled);
          }
          setValue(nextValue);
        }}
        onItemHighlighted={(_, eventDetails) => {
          // Scroll the highlighted item into view.
          if (eventDetails.reason !== 'pointer' && eventDetails.index !== -1) {
            virtualizer.scrollToIndex(eventDetails.index);
          }
        }}
      >
        <Listbox.Label className={styles.Label}>Items</Listbox.Label>
        <Listbox.List ref={listRef} className={styles.List}>
          <div className={styles.Content} style={{ height: virtualizer.getTotalSize() }}>
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const item = items[virtualItem.index];
              return (
                <Listbox.Item
                  key={virtualItem.key}
                  value={item}
                  disabled={item.disabled}
                  aria-setsize={items.length}
                  aria-posinset={virtualItem.index + 1}
                  className={styles.Item}
                  style={{ transform: `translateY(${virtualItem.start}px)` }}
                >
                  {item.label}
                </Listbox.Item>
              );
            })}
          </div>
        </Listbox.List>
      </Listbox.Root>
    </div>
  );
}

interface Item {
  value: string;
  label: string;
  disabled: boolean;
}

// Every tenth item is disabled.
const items: Item[] = Array.from({ length: 3000 }, (_, index) => {
  const value = String(index + 1);
  return { value, label: `Item ${value.padStart(4, '0')}`, disabled: (index + 1) % 10 === 0 };
});
