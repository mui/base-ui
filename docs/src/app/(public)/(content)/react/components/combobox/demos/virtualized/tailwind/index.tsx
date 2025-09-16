'use client';
import * as React from 'react';
import { Combobox } from '@base-ui-components/react/combobox';
import { useVirtualizer } from '@tanstack/react-virtual';

export default function ExampleVirtualizedCombobox() {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');
  const [value, setValue] = React.useState<string | null>(null);

  const scrollElementRef = React.useRef<HTMLDivElement | null>(null);

  const { contains } = Combobox.useFilter({ sensitivity: 'base', value });

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
      filter={contains}
      items={virtualItems}
      open={open}
      onOpenChange={setOpen}
      inputValue={searchValue}
      onInputValueChange={setSearchValue}
      value={value}
      onValueChange={setValue}
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
      <label className="flex flex-col gap-1 text-sm leading-5 font-medium text-gray-900">
        Search 10,000 items
        <Combobox.Input className="h-10 w-64 rounded-md font-normal border border-gray-200 pl-3.5 text-base text-gray-900 bg-[canvas] focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800" />
      </label>

      <Combobox.Portal>
        <Combobox.Positioner className="outline-none" sideOffset={4}>
          <Combobox.Popup className="w-[var(--anchor-width)] max-h-[min(22rem,var(--available-height))] max-w-[var(--available-width)] rounded-md bg-[canvas] text-gray-900 outline-1 outline-gray-200 shadow-lg shadow-gray-200 dark:-outline-offset-1 dark:outline-gray-300">
            <Combobox.Empty className="px-4 py-4 text-[0.925rem] leading-4 text-gray-600 empty:m-0 empty:p-0">
              No items found.
            </Combobox.Empty>
            <Combobox.List className="p-0">
              {filteredItems.length > 0 && (
                <div
                  role="presentation"
                  ref={handleScrollElementRef}
                  className="h-[min(22rem,var(--total-size))] max-h-[var(--available-height)] overflow-auto overscroll-contain scroll-p-2"
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
                        <Combobox.Item
                          key={virtualItem.key}
                          index={virtualItem.index}
                          value={item}
                          className="grid cursor-default grid-cols-[0.75rem_1fr] items-center gap-2 py-2 pr-8 pl-4 text-base leading-4 outline-none select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-2 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-gray-900"
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
                          <Combobox.ItemIndicator className="col-start-1">
                            <CheckIcon className="size-3" />
                          </Combobox.ItemIndicator>
                          <div className="col-start-2">{item}</div>
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
