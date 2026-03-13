'use client';
import * as React from 'react';
import { Tree } from '@base-ui/react/tree';
import { useVirtualizer } from '@tanstack/react-virtual';
import styles from './index.module.css';

export default function ExampleVirtualizedTree() {
  const scrollToItemRef = React.useRef<ScrollToItem | null>(null);

  return (
    <Tree.Root
      virtualized
      items={items}
      expandOnClick
      onItemFocus={(itemId) => {
        scrollToItemRef.current?.(itemId);
      }}
      className={styles.Tree}
    >
      <VirtualizedList scrollToItemRef={scrollToItemRef} />
    </Tree.Root>
  );
}

function VirtualizedList({
  scrollToItemRef,
}: {
  scrollToItemRef: React.RefObject<ScrollToItem | null>;
}) {
  const visibleItems = Tree.useVisibleItems();
  const scrollElementRef = React.useRef<HTMLDivElement | null>(null);

  const virtualizer = useVirtualizer({
    count: visibleItems.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => 32,
    overscan: 20,
  });

  React.useImperativeHandle(
    scrollToItemRef,
    () => (itemId: string) => {
      const index = visibleItems.findIndex((v) => v.itemId === itemId);
      if (index >= 0) {
        queueMicrotask(() => {
          virtualizer.scrollToIndex(index, { align: 'auto' });
        });
      }
    },
    [visibleItems, virtualizer],
  );

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
          const { itemId, depth } = visibleItems[virtualItem.index];
          return (
            <Tree.Item
              key={itemId}
              itemId={itemId}
              ref={virtualizer.measureElement}
              data-index={virtualItem.index}
              className={styles.Item}
              style={
                {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                  '--depth-offset': `${depth * 1.5}rem`,
                } as React.CSSProperties
              }
            >
              <Tree.ItemExpansionTrigger className={styles.ExpansionTrigger}>
                <ChevronIcon />
              </Tree.ItemExpansionTrigger>
              <Tree.ItemGroupIndicator className={styles.Icon}>
                <FolderIcon />
              </Tree.ItemGroupIndicator>
              <Tree.ItemLabel className={styles.Label} />
            </Tree.Item>
          );
        })}
      </div>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="currentColor">
      <path
        d="M4.5 2L8.5 6L4.5 10"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor">
      <path
        d="M2 4.5C2 3.67 2.67 3 3.5 3H6.38a1 1 0 01.7.29l1.13 1.13a1 1 0 00.7.29H12.5c.83 0 1.5.67 1.5 1.5V12c0 .83-.67 1.5-1.5 1.5h-9A1.5 1.5 0 012 12V4.5z"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Generate 10,000 top-level items, 10 of which are expandable with 100 children each
function generateItems(): Tree.DefaultItemModel[] {
  const expandableIndices = new Set([0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000]);
  const rootItems: Tree.DefaultItemModel[] = [];

  for (let i = 0; i < 10000; i += 1) {
    const id = `item-${i}`;
    const label = `Item ${String(i + 1).padStart(5, '0')}`;

    if (expandableIndices.has(i)) {
      const children: Tree.DefaultItemModel[] = [];
      for (let j = 0; j < 100; j += 1) {
        children.push({
          id: `${id}-child-${j}`,
          label: `${label} / Child ${String(j + 1).padStart(3, '0')}`,
        });
      }
      rootItems.push({ id, label, children });
    } else {
      rootItems.push({ id, label });
    }
  }

  return rootItems;
}

const items = generateItems();

type ScrollToItem = (itemId: string) => void;
type Virtualizer = ReturnType<typeof useVirtualizer<HTMLDivElement, Element>>;
