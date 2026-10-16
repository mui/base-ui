'use client';
import * as React from 'react';
import { Select } from '@base-ui/react/select';
import { useVirtualizer } from '@tanstack/react-virtual';
import styles from './index.module.css';

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
        <div className={styles.Field}>
          <Select.Label className={styles.Label}>Item</Select.Label>
          <Select.Trigger className={styles.Select}>
            <Select.Value className={styles.Value} placeholder="Select an item" />
            <Select.Icon>
              <CaretUpDownIcon />
            </Select.Icon>
          </Select.Trigger>
        </div>
        <Select.Portal>
          <Select.Positioner className={styles.Positioner} sideOffset={4}>
            <Select.Popup className={styles.Popup}>
              <div className={styles.InputContainer}>
                <Select.Input
                  className={styles.Input}
                  aria-label="Search 10,000 items"
                  placeholder="Search 10,000 items"
                />
              </div>
              <Select.Empty className={styles.Empty}>No items found.</Select.Empty>
              <Select.List className={styles.List}>
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
      className={styles.Scroller}
      style={{ '--total-size': `${totalSize}px` } as React.CSSProperties}
    >
      <div role="presentation" className={styles.Spacer} style={{ height: totalSize }}>
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
              <Select.ItemIndicator className={styles.ItemIndicator}>
                <CheckIcon />
              </Select.ItemIndicator>
              <Select.ItemText className={styles.ItemText}>{item.label}</Select.ItemText>
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
