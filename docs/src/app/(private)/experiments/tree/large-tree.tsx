'use client';
import * as React from 'react';
import { Tree } from '@base-ui/react/tree';
import type { TreeItemModel } from '@base-ui/react/tree';
import styles from './tree.module.css';

function generateItems(depth: number, breadth: number, prefix = ''): TreeItemModel[] {
  const items: TreeItemModel[] = [];
  for (let i = 0; i < breadth; i++) {
    const id = prefix ? `${prefix}-${i}` : `item-${i}`;
    const item: TreeItemModel = {
      id,
      label: `Item ${id}`,
    };
    if (depth > 0) {
      item.children = generateItems(depth - 1, breadth, id);
    }
    items.push(item);
  }
  return items;
}

// 5 root items x 10 children x 5 grandchildren = 5 + 50 + 250 = 305 items
// Plus 5 more root items with 20 children each = 5 + 100 = 105
// Total: 410 items
const items: TreeItemModel[] = [
  ...generateItems(2, 5),
  ...generateItems(1, 5, 'flat').map((item) => ({
    ...item,
    children: generateItems(0, 20, item.id),
  })),
];

const totalCount = countItems(items);

function countItems(list: TreeItemModel[]): number {
  return list.reduce(
    (acc, item) => acc + 1 + (item.children ? countItems(item.children) : 0),
    0,
  );
}

export default function LargeTree() {
  const [renderTime, setRenderTime] = React.useState<number | null>(null);

  React.useEffect(() => {
    const start = performance.now();
    requestAnimationFrame(() => {
      setRenderTime(performance.now() - start);
    });
  }, []);

  return (
    <div className={styles.wrapper} style={{ width: '28rem' }}>
      <div>
        <h3 className={styles.heading}>Large tree ({totalCount} items)</h3>
        <p className={styles.description}>
          {renderTime != null
            ? `Initial render: ${renderTime.toFixed(1)}ms`
            : 'Measuring render time...'}
        </p>
      </div>
      <Tree.Root
        items={items}
        defaultExpandedItems={['item-0']}
        className={styles.tree}
        style={{ maxHeight: 500, overflow: 'auto' }}
      >
        {(item) => (
          <Tree.Item className={styles.item}>
            <Tree.ItemExpansionTrigger className={styles.expansionTrigger}>
              <ChevronIcon />
            </Tree.ItemExpansionTrigger>
            <Tree.ItemLabel className={styles.label} />
          </Tree.Item>
        )}
      </Tree.Root>
    </div>
  );
}

function ChevronIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 12 12" fill="currentColor" {...props}>
      <path d="M4.5 2L8.5 6L4.5 10" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
