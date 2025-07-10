'use client';
import * as React from 'react';
import { Combobox } from '@base-ui-components/react/combobox';
import { useVirtualizer } from '@tanstack/react-virtual';
import styles from './index.module.css';
import { virtualItems } from './data';

export default function VirtualizedCombobox() {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');

  const scrollElementRef = React.useRef<HTMLDivElement>(null);

  const filteredItems = React.useMemo(() => {
    if (!searchValue.trim()) {
      return virtualItems;
    }
    const search = searchValue.toLowerCase();
    return virtualItems.filter((item) => item.toLowerCase().includes(search));
  }, [searchValue]);

  const virtualizer = useVirtualizer({
    enabled: open,
    count: filteredItems.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => 32,
    overscan: 50,
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
    <Combobox.Root
      items={filteredItems}
      open={open}
      onOpenChange={setOpen}
      inputValue={searchValue}
      onInputValueChange={setSearchValue}
      virtualized
      onItemHighlighted={(item, { type, index }) => {
        const isStart = index === 0;
        const isEnd = index === filteredItems.length - 1;
        const shouldScroll = type === 'keyboard' && (isStart || isEnd);
        if (shouldScroll) {
          virtualizer.scrollToIndex(index, { align: isStart ? 'end' : 'start' });
        }
      }}
    >
      <label className={styles.Label}>
        Search 10,000 items (virtualized)
        <Combobox.Input className={styles.Input} />
      </label>

      <Combobox.Portal>
        <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
          <Combobox.Popup className={styles.Popup}>
            <Combobox.Empty className={styles.Empty}>No items found.</Combobox.Empty>
            <Combobox.List className={styles.List}>
              {filteredItems.length > 0 && (
                <div
                  ref={handleScrollElementRef}
                  className={styles.Scroller}
                  style={{ '--total-size': totalSizePx } as React.CSSProperties}
                >
                  <div className={styles.VirtualizedPlaceholder} style={{ height: totalSizePx }}>
                    {virtualizer.getVirtualItems().map((virtualItem) => {
                      const item = filteredItems[virtualItem.index];
                      if (!item) {
                        return null;
                      }

                      return (
                        <Combobox.Item
                          key={virtualItem.key}
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
