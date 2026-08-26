'use client';
import * as React from 'react';
import { FilterMenu } from '@base-ui/react/filter-menu';
import { useVirtualizer } from '@tanstack/react-virtual';
import styles from './index.module.css';

export default function ExampleVirtualizedFilterMenu() {
  const [searchValue, setSearchValue] = React.useState('');

  const virtualizerRef = React.useRef<Virtualizer | null>(null);

  const query = searchValue.trim().toLowerCase();
  const filteredItems = React.useMemo(() => {
    if (query === '') {
      return virtualizedItems;
    }
    return virtualizedItems.filter((item) => item.name.toLowerCase().includes(query));
  }, [query]);

  return (
    <FilterMenu.Root
      virtualized
      filter={null}
      inputValue={searchValue}
      onInputValueChange={(value, details) => {
        if (details.reason !== 'popup-close') {
          setSearchValue(value);
        }
      }}
      onOpenChangeComplete={(open) => {
        if (!open) {
          setSearchValue('');
        }
      }}
      onItemHighlighted={(index, { reason }) => {
        const virtualizer = virtualizerRef.current;

        if (index === null || !virtualizer) {
          return;
        }

        const isStart = index === 0;
        const isEnd = index === virtualizer.options.count - 1;
        const shouldScroll = reason === 'none' || (reason === 'keyboard' && (isStart || isEnd));

        if (shouldScroll) {
          queueMicrotask(() => {
            virtualizer.scrollToIndex(index, { align: isEnd ? 'start' : 'end' });
          });
        }
      }}
    >
      <FilterMenu.Trigger className={styles.Trigger}>Search 10,000 actions</FilterMenu.Trigger>
      <FilterMenu.Portal>
        <FilterMenu.Positioner className={styles.Positioner} sideOffset={8} align="start">
          <FilterMenu.Popup className={styles.Popup}>
            <div className={styles.InputContainer}>
              <FilterMenu.Input
                className={styles.Input}
                aria-label="Search actions"
                placeholder="e.g. Action 0042"
              />
            </div>
            <FilterMenu.Empty className={styles.Empty}>No actions found.</FilterMenu.Empty>
            <FilterMenu.List className={styles.List}>
              <VirtualizedList items={filteredItems} virtualizerRef={virtualizerRef} />
            </FilterMenu.List>
          </FilterMenu.Popup>
        </FilterMenu.Positioner>
      </FilterMenu.Portal>
    </FilterMenu.Root>
  );
}

function VirtualizedList({
  items,
  virtualizerRef,
}: {
  items: VirtualizedItem[];
  virtualizerRef: React.RefObject<Virtualizer | null>;
}) {
  const scrollElementRef = React.useRef<HTMLDivElement | null>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => 32,
    overscan: 20,
    paddingStart: 4,
    paddingEnd: 4,
    scrollPaddingEnd: 4,
    scrollPaddingStart: 4,
  });

  React.useImperativeHandle(virtualizerRef, () => virtualizer);

  const handleScrollElementRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      scrollElementRef.current = element;
      if (element) {
        virtualizer.measure();
      }
    },
    [virtualizer],
  );

  const totalSize = virtualizer.getTotalSize();

  if (!items.length) {
    return null;
  }

  return (
    <div
      role="presentation"
      ref={handleScrollElementRef}
      className={styles.Scroller}
      style={{ '--total-size': `${totalSize}px` } as React.CSSProperties}
    >
      <div
        role="presentation"
        className={styles.VirtualizedPlaceholder}
        style={{ height: totalSize }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = items[virtualItem.index];
          if (!item) {
            return null;
          }

          return (
            <FilterMenu.Item
              key={virtualItem.key}
              index={virtualItem.index}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              className={styles.Item}
              aria-setsize={items.length}
              aria-posinset={virtualItem.index + 1}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: virtualItem.size,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {item.name}
            </FilterMenu.Item>
          );
        })}
      </div>
    </div>
  );
}

interface VirtualizedItem {
  id: string;
  name: string;
}

const virtualizedItems: VirtualizedItem[] = Array.from({ length: 10000 }, (_, index) => {
  const id = String(index + 1);
  const indexLabel = id.padStart(4, '0');
  return { id, name: `Action ${indexLabel}` };
});

type Virtualizer = ReturnType<typeof useVirtualizer<HTMLDivElement, Element>>;
