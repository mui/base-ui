'use client';
import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { ListVirtualizer } from '@base-ui/react/list-virtualizer';
import { useVirtualizer } from '@tanstack/react-virtual';
import { SettingsMetadata, useExperimentSettings } from '../_components/SettingsPanel';
import styles from './virtualizer.module.css';

interface Settings {
  varyingHeights: boolean;
}

export const settingsMetadata: SettingsMetadata<Settings> = {
  varyingHeights: {
    type: 'boolean',
    label: 'Vary row heights',
    default: true,
  },
};

export default function ComboboxVirtualizerExperiment() {
  const { settings } = useExperimentSettings<Settings>();

  return (
    <div className={styles.Root}>
      <header className={styles.Header}>
        <h1>Combobox virtualizers</h1>
        <p>
          Compare the built-in <code>ListVirtualizer</code> with the external{' '}
          <code>@tanstack/react-virtual</code> integration, and with a plain list that renders every
          item. Each list contains 10,000 items.
        </p>
      </header>

      <div className={styles.Comparison}>
        <section className={styles.Panel}>
          <div className={styles.PanelHeader}>
            <h2>Built in</h2>
            <code>@mui/x-virtualizer</code>
          </div>
          <BuiltInVirtualizer varyingHeights={settings.varyingHeights} />
        </section>

        <section className={styles.Panel}>
          <div className={styles.PanelHeader}>
            <h2>Third party</h2>
            <code>@tanstack/react-virtual</code>
          </div>
          <TanStackVirtualizer varyingHeights={settings.varyingHeights} />
        </section>

        <section className={styles.Panel}>
          <div className={styles.PanelHeader}>
            <h2>No virtualization</h2>
            <code>Combobox.List</code>
          </div>
          <PlainList varyingHeights={settings.varyingHeights} />
        </section>
      </div>
    </div>
  );
}

function BuiltInVirtualizer(props: { varyingHeights: boolean }) {
  return (
    <Combobox.Root items={virtualizedItems} itemToStringLabel={getItemLabel}>
      <ComboboxField label="Search the built-in list" />
      <Combobox.Portal>
        <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
          <Combobox.Popup className={styles.Popup}>
            <Combobox.Empty className={styles.Empty}>No items found.</Combobox.Empty>
            <Combobox.List className={styles.List}>
              <ListVirtualizer
                className={styles.Scroller}
                estimatedItemHeight={12}
                getItemKey={(item) => item.id}
                overscanPx={40}
              >
                {(item: VirtualizedItem) => (
                  <VirtualizedItemRow item={item} varyingHeights={props.varyingHeights} />
                )}
              </ListVirtualizer>
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

function TanStackVirtualizer(props: { varyingHeights: boolean }) {
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
              <TanStackVirtualizedList
                virtualizerRef={virtualizerRef}
                varyingHeights={props.varyingHeights}
              />
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

function PlainList(props: { varyingHeights: boolean }) {
  return (
    <Combobox.Root items={virtualizedItems} itemToStringLabel={getItemLabel}>
      <ComboboxField label="Search the plain list" />
      <Combobox.Portal>
        <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
          <Combobox.Popup className={styles.Popup}>
            <Combobox.Empty className={styles.Empty}>No items found.</Combobox.Empty>
            <Combobox.List className={styles.PlainList}>
              {(item: VirtualizedItem) => (
                <Combobox.Item
                  key={item.id}
                  value={item}
                  className={getItemClassName(item, props.varyingHeights)}
                >
                  <ItemContent item={item} varyingHeights={props.varyingHeights} />
                </Combobox.Item>
              )}
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
  varyingHeights,
}: {
  virtualizerRef: React.RefObject<TanStackVirtualizerInstance | null>;
  varyingHeights: boolean;
}) {
  const filteredItems = Combobox.useFilteredItems<VirtualizedItem>();
  const scrollElementRef = React.useRef<HTMLDivElement | null>(null);

  // Both virtualized panels take their spacing from the scroller's CSS padding, so the comparison
  // is between the virtualizers rather than their styles.
  const virtualizer = useVirtualizer({
    count: filteredItems.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => 32,
    overscan: 20,
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
              className={getItemClassName(item, varyingHeights)}
              aria-setsize={filteredItems.length}
              aria-posinset={virtualItem.index + 1}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <ItemContent item={item} varyingHeights={varyingHeights} />
            </Combobox.Item>
          );
        })}
      </div>
    </div>
  );
}

function VirtualizedItemRow(props: { item: VirtualizedItem; varyingHeights: boolean }) {
  return (
    <Combobox.Item
      value={props.item}
      className={getItemClassName(props.item, props.varyingHeights)}
    >
      <ItemContent item={props.item} varyingHeights={props.varyingHeights} />
    </Combobox.Item>
  );
}

function ItemContent(props: { item: VirtualizedItem; varyingHeights: boolean }) {
  return (
    <React.Fragment>
      <Combobox.ItemIndicator className={styles.ItemIndicator}>
        <CheckIcon />
      </Combobox.ItemIndicator>
      <span className={styles.ItemText}>
        <span>{props.item.name}</span>
        {props.varyingHeights && props.item.hasTwoLines && (
          <span>Additional details for this item</span>
        )}
      </span>
    </React.Fragment>
  );
}

function getItemClassName(item: VirtualizedItem, varyingHeights: boolean) {
  return varyingHeights && item.hasLargeText ? `${styles.Item} ${styles.ItemLarge}` : styles.Item;
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
  hasLargeText: boolean;
  hasTwoLines: boolean;
}

function getItemLabel(item: VirtualizedItem | null) {
  return item ? item.name : '';
}

const virtualizedItems: VirtualizedItem[] = Array.from({ length: 10000 }, (_, index) => {
  const id = String(index + 1);
  const indexLabel = id.padStart(4, '0');
  return {
    id,
    name: `Item ${indexLabel}`,
    hasLargeText: (index + 1) % 3 === 0,
    hasTwoLines: (index + 1) % 5 === 0,
  };
});

type TanStackVirtualizerInstance = ReturnType<typeof useVirtualizer<HTMLDivElement, Element>>;
