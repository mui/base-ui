'use client';
import * as React from 'react';
import { Combobox } from '@base-ui-components/react/combobox';
import { useVirtualizer } from '@tanstack/react-virtual';
import styles from './index.module.css';

export default function ExampleVirtualizedCombobox() {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');
  const [queryChangedAfterOpen, setQueryChangedAfterOpen] = React.useState(false);

  const scrollElementRef = React.useRef<HTMLDivElement>(null);

  const { contains } = Combobox.useFilter({ sensitivity: 'base' });

  const filteredItems = React.useMemo(() => {
    return queryChangedAfterOpen
      ? virtualItems.filter((item) => contains(item, searchValue))
      : virtualItems;
  }, [contains, searchValue, queryChangedAfterOpen]);

  const virtualizer = useVirtualizer({
    enabled: open,
    count: filteredItems.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => 32,
    overscan: 20,
    paddingStart: 8,
    paddingEnd: 8,
    scrollPaddingEnd: 8,
    scrollPaddingStart: 8,
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
    <Combobox.Root
      virtualized
      items={virtualItems}
      open={open}
      onOpenChange={setOpen}
      inputValue={searchValue}
      onInputValueChange={(value) => {
        setSearchValue(value);
        if (open) {
          setQueryChangedAfterOpen(true);
        }
      }}
      onValueChange={setSearchValue}
      onOpenChangeComplete={(nextOpen) => {
        if (!nextOpen) {
          setQueryChangedAfterOpen(false);
        }
      }}
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
        Search 10,000 items
        <Combobox.Input className={styles.Input} />
      </label>

      <Combobox.Portal>
        <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
          <Combobox.Popup className={styles.Popup}>
            <Combobox.Empty className={styles.Empty}>No items found.</Combobox.Empty>
            <Combobox.List className={styles.List}>
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
                        <Combobox.Item
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
                          <Combobox.ItemIndicator className={styles.ItemIndicator}>
                            <CheckIcon className={styles.ItemIndicatorIcon} />
                          </Combobox.ItemIndicator>
                          <div className={styles.ItemText}>{item}</div>
                        </Combobox.Item>
                      );
                    })}
                  </div>
                </div>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}

const virtualItems = Array.from({ length: 10000 }, (_, i) => {
  const indexLabel = String(i + 1).padStart(4, '0');
  return `Item ${indexLabel}`;
});
