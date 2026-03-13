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

const DeleteContext = React.createContext<{
  deleteItem: (itemId: string) => void;
}>({
  deleteItem: () => {},
});

function DeleteButton({ itemId }: { itemId: string }) {
  const { deleteItem } = React.useContext(DeleteContext);

  return (
    <button
      type="button"
      className={styles.deleteButton}
      aria-label="Delete item"
      onClick={(event) => {
        event.stopPropagation();
        deleteItem(itemId);
      }}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <CloseIcon />
    </button>
  );
}

export default function DeleteItemTree() {
  const [items, setItems] = React.useState(initialItems);

  const deleteContext = React.useMemo(
    () => ({
      deleteItem: (itemId: string) => {
        setItems((prev) => removeItem(prev, itemId));
      },
    }),
    [],
  );

  return (
    <div className={styles.wrapper}>
      <div>
        <h3 className={styles.heading}>Delete items</h3>
        <p className={styles.description}>
          Hover over an item and click the X button to delete it. Deleting a parent removes all its
          children.
        </p>
      </div>
      <DeleteContext.Provider value={deleteContext}>
        <Tree.Root
          items={items}
          defaultExpandedItems={['groceries', 'tasks']}
          className={styles.tree}
        >
          {(_item) => (
            <Tree.Item className={styles.item}>
              <Tree.ItemExpansionTrigger className={styles.expansionTrigger}>
                <ChevronIcon />
              </Tree.ItemExpansionTrigger>
              <Tree.ItemLabel className={styles.label} />
              <DeleteButton itemId={_item.id} />
            </Tree.Item>
          )}
        </Tree.Root>
      </DeleteContext.Provider>
    </div>
  );
}

function removeItem(
  items: Tree.DefaultItemModel[],
  targetId: string,
): Tree.DefaultItemModel[] {
  return items
    .filter((item) => item.id !== targetId)
    .map((item) => {
      if (item.children) {
        return { ...item, children: removeItem(item.children, targetId) };
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

function CloseIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 12 12" fill="none" {...props} width="12" height="12">
      <path
        d="M3 3L9 9M9 3L3 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
