import * as React from 'react';
import { Autocomplete } from '@base-ui-components/react/autocomplete';
import { useVirtualizer } from '@tanstack/react-virtual';

export default function ExampleVirtualizedAutocomplete() {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');

  const scrollElementRef = React.useRef<HTMLDivElement>(null);

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
      <label className="flex flex-col gap-1 text-sm leading-5 font-medium text-gray-900">
        Search 10,000 items (virtualized)
        <Autocomplete.Input className="h-10 w-[16rem] rounded-md border border-gray-200 bg-[canvas] pl-3.5 text-base font-normal text-gray-900 focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800 md:w-[20rem]" />
      </label>

      <Autocomplete.Portal>
        <Autocomplete.Positioner className="outline-none" sideOffset={4}>
          <Autocomplete.Popup className="max-h-[min(22rem,var(--available-height))] w-[var(--anchor-width)] max-w-[var(--available-width)] rounded-md bg-[canvas] text-gray-900 shadow-lg shadow-gray-200 outline-1 outline-gray-200 dark:-outline-offset-1 dark:outline-gray-300">
            <Autocomplete.Empty className="px-4 py-4 text-[0.925rem] leading-4 text-gray-600 empty:m-0 empty:p-0">
              No items found.
            </Autocomplete.Empty>
            <Autocomplete.List className="p-0">
              {filteredItems.length > 0 && (
                <div
                  role="presentation"
                  ref={handleScrollElementRef}
                  className="h-[min(22rem,var(--total-size))] max-h-[var(--available-height)] scroll-pt-2 overflow-auto overscroll-contain"
                  style={{ '--total-size': totalSizePx } as React.CSSProperties}
                >
                  <div
                    role="presentation"
                    className="relative w-full"
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
                          className="flex cursor-default py-2 pr-8 pl-4 text-base leading-4 outline-none select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-2 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded data-[highlighted]:before:bg-gray-900"
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
