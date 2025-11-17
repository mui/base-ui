'use client';
import * as React from 'react';
import { Autocomplete } from '@base-ui-components/react/autocomplete';
import { useVirtualizer } from '@tanstack/react-virtual';
import styles from './index.module.css';

export default function ExampleVirtualizedAutocomplete() {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');

  const deferredSearchValue = React.useDeferredValue(searchValue);

  const scrollElementRef = React.useRef<HTMLDivElement | null>(null);

  const { contains } = Autocomplete.useFilter();

  const resolvedSearchValue =
    searchValue === '' || deferredSearchValue === '' ? searchValue : deferredSearchValue;

  const filteredItems = React.useMemo(() => {
    return virtualizedItems.filter((item) => contains(item, resolvedSearchValue, getItemLabel));
  }, [contains, resolvedSearchValue]);

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
    (element: HTMLDivElement | null) => {
      scrollElementRef.current = element;
      if (element) {
        virtualizer.measure();
      }
    },
    [virtualizer],
  );

  const totalSize = virtualizer.getTotalSize();

  return (
    <Autocomplete.Root
      virtualized
      items={virtualizedItems}
      filteredItems={filteredItems}
      open={open}
      onOpenChange={setOpen}
      value={searchValue}
      onValueChange={setSearchValue}
      openOnInputClick
      itemToStringValue={getItemLabel}
      onItemHighlighted={(item, { reason, index }) => {
        if (!item) {
          return;
        }

        const isStart = index === 0;
        const isEnd = index === filteredItems.length - 1;
        const shouldScroll = reason === 'none' || (reason === 'keyboard' && (isStart || isEnd));
        if (shouldScroll) {
          queueMicrotask(() => {
            virtualizer.scrollToIndex(index, { align: isEnd ? 'start' : 'end' });
          });
        }
      }}
    >
      <label className={styles.Label}>
        Search 10,000 items
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
                  style={{ '--total-size': `${totalSize}px` } as React.CSSProperties}
                >
                  <div
                    role="presentation"
                    className={styles.VirtualizedPlaceholder}
                    style={{ height: totalSize }}
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
                          data-index={virtualItem.index}
                          ref={virtualizer.measureElement}
                          value={item}
                          className={styles.Item}
                          aria-setsize={filteredItems.length}
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

interface VirtualizedItem {
  id: string;
  name: string;
}

function getItemLabel(item: VirtualizedItem | null) {
  return item ? item.name : '';
}

const virtualizedItems: VirtualizedItem[] = Array.from({ length: 10000 }, (_, index) => {
  const id = String(index + 1);
  const indexLabel = id.padStart(4, '0');
  return { id, name: `Item ${indexLabel}` };
});
