'use client';
import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { useVirtualizer } from '@tanstack/react-virtual';
import styles from './virtualizer.module.css';

export default function ComboboxVirtualizerExperiment() {
  return (
    <div className={styles.Root}>
      <header className={styles.Header}>
        <h1>Combobox virtualizers</h1>
        <p>
          Compare the built-in <code>Combobox.Virtualizer</code> with the previous external{' '}
          <code>@tanstack/react-virtual</code> integration. Each list contains 10,000 items.
        </p>
      </header>

      <div className={styles.Comparison}>
        <section className={styles.Panel}>
          <div className={styles.PanelHeader}>
            <h2>Built in</h2>
            <code>@mui/x-virtualizer</code>
          </div>
          <BuiltInVirtualizer />
        </section>

        <section className={styles.Panel}>
          <div className={styles.PanelHeader}>
            <h2>Third party</h2>
            <code>@tanstack/react-virtual</code>
          </div>
          <TanStackVirtualizer />
        </section>
      </div>
    </div>
  );
}

function BuiltInVirtualizer() {
  return (
    <Combobox.Root items={virtualizedItems} itemToStringLabel={getItemLabel}>
      <ComboboxField label="Search the built-in list" />
      <Combobox.Portal>
        <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
          <Combobox.Popup className={styles.Popup}>
            <Combobox.Empty className={styles.Empty}>No items found.</Combobox.Empty>
            <Combobox.List className={styles.List}>
              <Combobox.Virtualizer
                className={styles.Scroller}
                estimateSize={32}
                getItemKey={(item) => item.id}
                overscanPx={640}
                paddingStart={4}
                paddingEnd={4}
              >
                {(item: VirtualizedItem) => <VirtualizedItemRow item={item} />}
              </Combobox.Virtualizer>
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

function TanStackVirtualizer() {
  const virtualizerRef = React.useRef<TanStackVirtualizerInstance | null>(null);

  return (
    <Combobox.Root
      virtualized
      items={virtualizedItems}
      itemToStringLabel={getItemLabel}
      onItemHighlighted={(item, { reason, index }) => {
        const virtualizer = virtualizerRef.current;

        if (!item || !virtualizer) {
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
      <ComboboxField label="Search the TanStack list" />
      <Combobox.Portal>
        <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
          <Combobox.Popup className={styles.Popup}>
            <Combobox.Empty className={styles.Empty}>No items found.</Combobox.Empty>
            <Combobox.List className={styles.List}>
              <TanStackVirtualizedList virtualizerRef={virtualizerRef} />
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

function ComboboxField(props: { label: string }) {
  const id = React.useId();

  return (
    <div className={styles.Field}>
      <label className={styles.Label} htmlFor={id}>
        {props.label}
      </label>
      <div className={styles.InputWrapper}>
        <Combobox.Input id={id} className={styles.Input} placeholder="e.g. Item 5000" />
        <Combobox.Trigger className={styles.Trigger} aria-label="Open list">
          <ChevronDownIcon />
        </Combobox.Trigger>
      </div>
    </div>
  );
}

function TanStackVirtualizedList({
  virtualizerRef,
}: {
  virtualizerRef: React.RefObject<TanStackVirtualizerInstance | null>;
}) {
  const filteredItems = Combobox.useFilteredItems<VirtualizedItem>();
  const scrollElementRef = React.useRef<HTMLDivElement | null>(null);

  const virtualizer = useVirtualizer({
    count: filteredItems.length,
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

  if (filteredItems.length === 0) {
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
          const item = filteredItems[virtualItem.index];
          if (!item) {
            return null;
          }

          return (
            <Combobox.Item
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
              <ItemContent item={item} />
            </Combobox.Item>
          );
        })}
      </div>
    </div>
  );
}

function VirtualizedItemRow(props: { item: VirtualizedItem }) {
  return (
    <Combobox.Item value={props.item} className={styles.Item}>
      <ItemContent item={props.item} />
    </Combobox.Item>
  );
}

function ItemContent(props: { item: VirtualizedItem }) {
  return (
    <React.Fragment>
      <Combobox.ItemIndicator className={styles.ItemIndicator}>
        <CheckIcon />
      </Combobox.ItemIndicator>
      <span className={styles.ItemText}>{props.item.name}</span>
    </React.Fragment>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" {...props}>
      <path d="m2.5 8.5 4 4 7-9" />
    </svg>
  );
}

function ChevronDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" {...props}>
      <path d="m3.5 6 4.5 4 4.5-4" />
    </svg>
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

type TanStackVirtualizerInstance = ReturnType<typeof useVirtualizer<HTMLDivElement, Element>>;
