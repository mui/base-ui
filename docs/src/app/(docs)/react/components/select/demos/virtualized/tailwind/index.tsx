'use client';
import * as React from 'react';
import { Select } from '@base-ui/react/select';
import { useVirtualizer } from '@tanstack/react-virtual';

export default function ExampleVirtualizedSelect() {
  const [open, setOpen] = React.useState(false);
  const virtualizerRef = React.useRef<Virtualizer | null>(null);

  return (
    <Select.FilterProvider virtualized>
      <Select.Root
        items={virtualizedItems}
        open={open}
        onOpenChange={setOpen}
        onItemHighlighted={(value, { reason, index }) => {
          const virtualizer = virtualizerRef.current;

          if (value === undefined || !virtualizer) {
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
        <div className="flex flex-col items-start gap-1">
          <Select.Label className="cursor-default text-sm font-bold text-neutral-950 dark:text-white">
            Item
          </Select.Label>
          <Select.Trigger className="flex h-8 min-w-48 items-center justify-between gap-3 pl-2 pr-1 text-sm leading-none whitespace-nowrap border border-neutral-950 dark:border-white bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white select-none hover:bg-neutral-100 dark:hover:bg-neutral-800 active:bg-neutral-200 dark:active:bg-neutral-700 data-pressed:bg-neutral-100 dark:data-pressed:bg-neutral-800 font-normal focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white">
            <Select.Value
              className="data-placeholder:text-neutral-500 dark:data-placeholder:text-neutral-400"
              placeholder="Select an item"
            />
            <Select.Icon>
              <CaretUpDownIcon />
            </Select.Icon>
          </Select.Trigger>
        </div>
        <Select.Portal>
          <Select.Positioner className="z-10 outline-hidden select-none" sideOffset={4}>
            <Select.Popup className="w-[var(--anchor-width)] min-w-64 origin-[var(--transform-origin)] bg-clip-padding border border-neutral-950 bg-white text-neutral-950 outline-hidden shadow-[0.25rem_0.25rem_0] shadow-black/12 transition-[scale,opacity] duration-100 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none">
              <div className="flex items-center border-b border-neutral-300 has-data-highlighted:border-neutral-950 has-data-highlighted:ring-1 has-data-highlighted:ring-neutral-950 has-data-highlighted:ring-inset dark:border-neutral-700 dark:has-data-highlighted:border-white dark:has-data-highlighted:ring-white">
                <Select.Input
                  className="min-h-8 w-0 flex-1 bg-transparent px-2.5 text-sm leading-none outline-hidden placeholder:text-neutral-500 dark:placeholder:text-neutral-400"
                  aria-label="Search 10,000 items"
                  placeholder="Search 10,000 items"
                />
              </div>
              <Select.Empty className="p-3 text-sm text-neutral-500 dark:text-neutral-400">
                No items found.
              </Select.Empty>
              <Select.List className="p-0">
                <VirtualizedList open={open} virtualizerRef={virtualizerRef} />
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </Select.FilterProvider>
  );
}

function VirtualizedList({
  open,
  virtualizerRef,
}: {
  open: boolean;
  virtualizerRef: React.RefObject<Virtualizer | null>;
}) {
  const filteredItems = Select.useFilteredItems<VirtualizedItem>();

  const scrollElementRef = React.useRef<HTMLDivElement | null>(null);

  const virtualizer = useVirtualizer({
    enabled: open,
    count: filteredItems.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => 28,
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

  if (!filteredItems.length) {
    return null;
  }

  return (
    <div
      role="presentation"
      ref={handleScrollElementRef}
      className="h-[min(16rem,var(--total-size))] max-h-[calc(var(--available-height)-2.0625rem)] overflow-auto overscroll-contain scroll-py-1"
      style={{ '--total-size': `${totalSize}px` } as React.CSSProperties}
    >
      <div role="presentation" className="relative w-full" style={{ height: totalSize }}>
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = filteredItems[virtualItem.index];
          if (!item) {
            return null;
          }

          return (
            <Select.Item
              key={virtualItem.key}
              index={virtualItem.index}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              value={item.value}
              className="grid cursor-default grid-cols-[1rem_1fr] items-center gap-2 py-1.5 pr-4 pl-2.5 text-sm outline-hidden select-none data-highlighted:bg-neutral-950 data-highlighted:text-white dark:data-highlighted:bg-white dark:data-highlighted:text-neutral-950"
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
              <Select.ItemIndicator className="col-start-1">
                <CheckIcon />
              </Select.ItemIndicator>
              <Select.ItemText className="col-start-2">{item.label}</Select.ItemText>
            </Select.Item>
          );
        })}
      </div>
    </div>
  );
}

function CaretUpDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M11 10H5l3 3.5zm0-4H5l3-3.5z" />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="m2.5 8.5 4 4 7-9" />
    </svg>
  );
}

interface VirtualizedItem {
  value: string;
  label: string;
}

const virtualizedItems: VirtualizedItem[] = Array.from({ length: 10000 }, (_, index) => {
  const value = String(index + 1);
  return { value, label: `Item ${value.padStart(4, '0')}` };
});

type Virtualizer = ReturnType<typeof useVirtualizer<HTMLDivElement, Element>>;
