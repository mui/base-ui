'use client';
import * as React from 'react';
import { Tree } from '@base-ui/react/tree';
import styles from './tree.module.css';

const initialItems: Tree.DefaultItemModel[] = [
  {
    id: 'groceries',
    label: 'Groceries',
    children: [
      { id: 'fruits', label: 'Fruits' },
      { id: 'vegetables', label: 'Vegetables' },
      { id: 'dairy', label: 'Dairy' },
    ],
  },
  {
    id: 'tasks',
    label: 'Tasks',
    children: [
      { id: 'urgent', label: 'Urgent' },
      { id: 'later', label: 'Later' },
    ],
  },
  {
    id: 'bookmarks',
    label: 'Bookmarks',
  },
];

export default function LabelEditingTree() {
  const [items, setItems] = React.useState(initialItems);

  const handleLabelChange = React.useCallback((itemId: string, newLabel: string) => {
    setItems((prev) => updateLabel(prev, itemId, newLabel));
  }, []);

  return (
    <div className={styles.wrapper}>
      <div>
        <h3 className={styles.heading}>Label editing</h3>
        <p className={styles.description}>
          Double-click a label to edit it. Press Enter to save, Escape to cancel.
        </p>
      </div>
      <Tree.Root
        items={items}
        defaultExpandedItems={['groceries', 'tasks']}
        isItemEditable
        onItemLabelChange={handleLabelChange}
        className={styles.tree}
      >
        {(_item) => (
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

function updateLabel(items: Tree.DefaultItemModel[], targetId: string, newLabel: string): Tree.DefaultItemModel[] {
  return items.map((item) => {
    if (item.id === targetId) {
      return { ...item, label: newLabel };
    }
    if (item.children) {
      return { ...item, children: updateLabel(item.children, targetId, newLabel) };
    }
    return item;
  });
}

function ChevronIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 12 12" fill="currentColor" {...props}>
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
