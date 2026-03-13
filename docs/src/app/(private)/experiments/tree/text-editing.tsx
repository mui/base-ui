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

const EditingContext = React.createContext<{
  editingItemId: string | null;
  startEditing: (itemId: string) => void;
  stopEditing: () => void;
  saveEdit: (itemId: string, newLabel: string) => void;
}>({
  editingItemId: null,
  startEditing: () => {},
  stopEditing: () => {},
  saveEdit: () => {},
});

function EditableLabel({ itemId, label }: { itemId: string; label: string }) {
  const { editingItemId, startEditing, stopEditing, saveEdit } = React.useContext(EditingContext);
  const isEditing = editingItemId === itemId;
  const inputRef = React.useRef<HTMLInputElement>(null);
  const wasEditingRef = React.useRef(false);

  React.useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
      wasEditingRef.current = true;
    } else if (wasEditingRef.current) {
      wasEditingRef.current = false;
      document.querySelector<HTMLElement>(`[data-item-id="${itemId}"]`)?.focus();
    }
  }, [isEditing, itemId]);

  return (
    <Tree.ItemLabel
      className={styles.label}
      onDoubleClick={(event) => {
        event.stopPropagation();
        startEditing(itemId);
      }}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          defaultValue={label}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === 'Enter') {
              saveEdit(itemId, event.currentTarget.value);
            } else if (event.key === 'Escape') {
              stopEditing();
            }
          }}
          onBlur={(event) => {
            saveEdit(itemId, event.currentTarget.value);
          }}
          onClick={(event) => event.stopPropagation()}
        />
      ) : undefined}
    </Tree.ItemLabel>
  );
}

export default function TextEditingTree() {
  const [items, setItems] = React.useState(initialItems);
  const [editingItemId, setEditingItemId] = React.useState<string | null>(null);

  const editingContext = React.useMemo(
    () => ({
      editingItemId,
      startEditing: (itemId: string) => setEditingItemId(itemId),
      stopEditing: () => setEditingItemId(null),
      saveEdit: (itemId: string, newLabel: string) => {
        setItems((prev) => updateLabel(prev, itemId, newLabel));
        setEditingItemId(null);
      },
    }),
    [editingItemId],
  );

  return (
    <div className={styles.wrapper}>
      <div>
        <h3 className={styles.heading}>Text field editing</h3>
        <p className={styles.description}>
          Double-click a label to edit it. Press Enter to save, Escape to cancel. F2 to edit focused
          item.
        </p>
      </div>
      <EditingContext.Provider value={editingContext}>
        <Tree.Root
          items={items}
          defaultExpandedItems={['groceries', 'tasks']}
          className={styles.tree}
          onKeyDown={(event) => {
            const focused = (event.currentTarget as HTMLElement).querySelector('[data-focused]');
            const itemId = focused?.getAttribute('data-item-id');
            if (event.key === 'F2' && itemId && !editingItemId) {
              event.preventDefault();
              setEditingItemId(itemId);
            }
          }}
        >
          {(_item) => (
            <Tree.Item className={styles.item}>
              <Tree.ItemExpansionTrigger className={styles.expansionTrigger}>
                <ChevronIcon />
              </Tree.ItemExpansionTrigger>
              <EditableLabel itemId={_item.id} label={_item.label} />
            </Tree.Item>
          )}
        </Tree.Root>
      </EditingContext.Provider>
    </div>
  );
}

function updateLabel(
  items: Tree.DefaultItemModel[],
  targetId: string,
  newLabel: string,
): Tree.DefaultItemModel[] {
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
