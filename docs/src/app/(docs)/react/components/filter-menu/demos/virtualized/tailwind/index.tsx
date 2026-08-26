'use client';
import * as React from 'react';
import { FilterMenu } from '@base-ui/react/filter-menu';
import { useVirtualizer } from '@tanstack/react-virtual';

export default function ExampleVirtualizedFilterMenu() {
  const [searchValue, setSearchValue] = React.useState('');

  const virtualizerRef = React.useRef<Virtualizer | null>(null);

  const { contains } = FilterMenu.useFilter();

  const query = searchValue.trim();
  const filteredItems = React.useMemo(() => {
    if (query === '') {
      return virtualizedItems;
    }
    return virtualizedItems.filter((item) => contains(item.name, query));
  }, [contains, query]);

  return (
    <FilterMenu.Root
      virtualized={filteredItems.length}
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
      <FilterMenu.Trigger className="flex h-8 items-center justify-center gap-1.5 rounded-none border border-neutral-950 bg-white px-3 text-sm leading-none font-normal whitespace-nowrap text-neutral-950 select-none hover:not-data-disabled:bg-neutral-100 active:not-data-disabled:bg-neutral-200 data-pressed:bg-neutral-100 focus-visible:-outline-offset-1 focus-visible:outline-2 focus-visible:outline-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:not-data-disabled:bg-neutral-800 dark:active:not-data-disabled:bg-neutral-700 dark:data-pressed:bg-neutral-800 dark:focus-visible:outline-white">
        Search 10,000 actions
      </FilterMenu.Trigger>
      <FilterMenu.Portal>
        <FilterMenu.Positioner className="outline-0" sideOffset={8} align="start">
          <FilterMenu.Popup className="min-w-[max(16rem,var(--anchor-width))] overflow-hidden border border-neutral-950 bg-white text-neutral-950 shadow-[0.25rem_0.25rem_0] shadow-black/12 outline-hidden dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none">
            <div className="flex items-center border-b border-neutral-300 has-data-highlighted:border-neutral-950 has-data-highlighted:ring-1 has-data-highlighted:ring-neutral-950 has-data-highlighted:ring-inset dark:border-neutral-700 dark:has-data-highlighted:border-white dark:has-data-highlighted:ring-white">
              <FilterMenu.Input
                className="min-h-8 w-0 flex-1 bg-transparent px-2.5 text-sm leading-none outline-hidden placeholder:text-neutral-500 dark:placeholder:text-neutral-400"
                aria-label="Search actions"
                placeholder="e.g. Action 0042"
              />
            </div>
            <FilterMenu.Empty className="p-3 text-sm text-neutral-500 dark:text-neutral-400">
              No actions found.
            </FilterMenu.Empty>
            <FilterMenu.List className="outline-hidden">
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
      // Chromium adds scrollable elements without focusable content to the tab order.
      tabIndex={-1}
      ref={handleScrollElementRef}
      className="box-border max-h-[var(--available-height)] overflow-auto overscroll-contain scroll-py-1"
      style={{ height: `min(20rem, ${totalSize}px)` }}
    >
      <div role="presentation" className="relative w-full" style={{ height: totalSize }}>
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
              className="box-border flex cursor-default items-center py-2 pr-8 pl-4 text-sm leading-4 outline-hidden select-none data-highlighted:relative data-highlighted:z-0 data-highlighted:text-white data-highlighted:before:absolute data-highlighted:before:inset-x-1 data-highlighted:before:inset-y-0 data-highlighted:before:z-[-1] data-highlighted:before:bg-neutral-950 data-highlighted:before:content-[''] dark:data-highlighted:text-neutral-950 dark:data-highlighted:before:bg-white"
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
