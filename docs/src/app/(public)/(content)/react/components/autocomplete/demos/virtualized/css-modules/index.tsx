'use client';
import * as React from 'react';
import { Autocomplete } from '@base-ui-components/react/autocomplete';
import { useVirtualizer } from '@tanstack/react-virtual';
import styles from './index.module.css';

export default function ExampleVirtualizedAutocomplete() {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');

  const scrollElementRef = React.useRef<HTMLDivElement | null>(null);

  const { contains } = Autocomplete.useFilter({ sensitivity: 'base' });

  const filteredItems = React.useMemo(() => {
    return virtualItems.filter((item) => contains(item, searchValue));
  }, [contains, searchValue]);

  const virtualizer = useVirtualizer({
    enabled: open,
    count: filteredItems.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => 32,
    overscan: 20,
    paddingStart: 8,
    paddingEnd: 8,
  });

  const handleScrollElementRef = React.useCallback(
    (element: HTMLDivElement) => {
      scrollElementRef.current = element;
      if (element) {
        virtualizer.measure();
      }
    },
    [virtualizer],
  );

  const totalSize = virtualizer.getTotalSize();
  const totalSizePx = `${totalSize}px`;

  return (
    <Autocomplete.Root
      virtualized
      items={virtualItems}
      open={open}
      onOpenChange={setOpen}
      value={searchValue}
      onValueChange={setSearchValue}
      openOnInputClick
      onItemHighlighted={(item, { type, index }) => {
        if (!item) {
          return;
        }

        const isStart = index === 0;
        const isEnd = index === filteredItems.length - 1;
        const shouldScroll = type === 'none' || (type === 'keyboard' && (isStart || isEnd));
        if (shouldScroll) {
          queueMicrotask(() => {
            virtualizer.scrollToIndex(index, { align: isEnd ? 'start' : 'end' });
          });
        }
      }}
    >
      <label className={styles.Label}>
        Search 10,000 items (virtualized)
        <Autocomplete.Input className={styles.Input} />
      </label>

      <Autocomplete.Portal>
        <Autocomplete.Positioner className={styles.Positioner} sideOffset={4}>
          <Autocomplete.Popup className={styles.Popup}>
            <Autocomplete.Empty className={styles.Empty}>No items found.</Autocomplete.Empty>
            <Autocomplete.List className={styles.List}>
              {filteredItems.length > 0 && (
                <div
                  role="presentation"
                  ref={handleScrollElementRef}
                  className={styles.Scroller}
                  style={{ '--total-size': totalSizePx } as React.CSSProperties}
                >
                  <div
                    role="presentation"
                    className={styles.VirtualizedPlaceholder}
                    style={{ height: totalSizePx }}
                  >
                    {virtualizer.getVirtualItems().map((virtualItem) => {
                      const item = filteredItems[virtualItem.index];
                      if (!item) {
                        return null;
                      }

                      return (
                        <Autocomplete.Item
                          key={virtualItem.key}
                          index={virtualItem.index}
                          value={item}
                          className={styles.Item}
                          aria-setsize={filteredItems.length}
                          aria-posinset={virtualItem.index + 1}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: `${virtualItem.size}px`,
                            transform: `translateY(${virtualItem.start}px)`,
                          }}
                        >
                          {item}
                        </Autocomplete.Item>
                      );
                    })}
                  </div>
                </div>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
}

const virtualItems = Array.from({ length: 10000 }, (_, i) => {
  const indexLabel = String(i + 1).padStart(4, '0');
  return `Item ${indexLabel}`;
});
