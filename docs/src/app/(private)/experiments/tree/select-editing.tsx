'use client';
import * as React from 'react';
import { Tree } from '@base-ui/react/tree';
import styles from './tree.module.css';

interface CategoryItem {
  id: string;
  label: string;
  category: 'stable' | 'beta' | 'alpha';
  children?: CategoryItem[];
}

const initialItems: CategoryItem[] = [
  {
    id: 'components',
    label: 'Components',
    category: 'stable',
    children: [
      { id: 'button', label: 'Button', category: 'stable' },
      { id: 'dialog', label: 'Dialog', category: 'beta' },
      { id: 'tooltip', label: 'Tooltip', category: 'stable' },
    ],
  },
  {
    id: 'hooks',
    label: 'Hooks',
    category: 'stable',
    children: [
      { id: 'use-focus-trap', label: 'useFocusTrap', category: 'alpha' },
      { id: 'use-scroll-lock', label: 'useScrollLock', category: 'beta' },
    ],
  },
  {
    id: 'utils',
    label: 'Utils',
    category: 'alpha',
  },
];

const CATEGORIES = ['stable', 'beta', 'alpha'] as const;

const EditingContext = React.createContext<{
  editingItemId: string | null;
  startEditing: (itemId: string) => void;
  stopEditing: () => void;
  saveCategory: (itemId: string, category: CategoryItem['category']) => void;
}>({
  editingItemId: null,
  startEditing: () => {},
  stopEditing: () => {},
  saveCategory: () => {},
});

function EditableCategoryLabel({ item }: { item: CategoryItem }) {
  const { editingItemId, startEditing, stopEditing, saveCategory } =
    React.useContext(EditingContext);
  const isEditing = editingItemId === item.id;
  const selectRef = React.useRef<HTMLSelectElement>(null);
  const wasEditingRef = React.useRef(false);

  React.useEffect(() => {
    if (isEditing) {
      selectRef.current?.focus();
      wasEditingRef.current = true;
    } else if (wasEditingRef.current) {
      wasEditingRef.current = false;
      document.querySelector<HTMLElement>(`[data-item-id="${item.id}"]`)?.focus();
    }
  }, [isEditing, item.id]);

  return (
    <Tree.ItemLabel
      className={styles.label}
      onDoubleClick={(event) => {
        event.stopPropagation();
        startEditing(item.id);
      }}
    >
      {isEditing ? (
        <select
          ref={selectRef}
          defaultValue={item.category}
          onChange={(event) => {
            saveCategory(item.id, event.currentTarget.value as CategoryItem['category']);
          }}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === 'Escape') {
              stopEditing();
            }
          }}
          onBlur={() => stopEditing()}
          onClick={(event) => event.stopPropagation()}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      ) : undefined}
    </Tree.ItemLabel>
  );
}

export default function SelectEditingTree() {
  const [items, setItems] = React.useState(initialItems);
  const [editingItemId, setEditingItemId] = React.useState<string | null>(null);

  const editingContext = React.useMemo(
    () => ({
      editingItemId,
      startEditing: (itemId: string) => setEditingItemId(itemId),
      stopEditing: () => setEditingItemId(null),
      saveCategory: (itemId: string, category: CategoryItem['category']) => {
        setItems((prev) => updateCategory(prev, itemId, category));
        setEditingItemId(null);
      },
    }),
    [editingItemId],
  );

  const itemToStringLabel = React.useCallback(
    (item: CategoryItem) => `${item.label} (${item.category})`,
    [],
  );

  return (
    <div className={styles.wrapper}>
      <div>
        <h3 className={styles.heading}>Select dropdown editing</h3>
        <p className={styles.description}>
          Double-click a label to change its category via a dropdown. Selection saves immediately.
        </p>
      </div>
      <EditingContext.Provider value={editingContext}>
        <Tree.Root
          items={items}
          defaultExpandedItems={['components', 'hooks']}
          className={styles.tree}
          itemToStringLabel={itemToStringLabel}
        >
          {(item) => (
            <Tree.Item className={styles.item}>
              <Tree.ItemExpansionTrigger className={styles.expansionTrigger}>
                <ChevronIcon />
              </Tree.ItemExpansionTrigger>
              <EditableCategoryLabel item={item as CategoryItem} />
            </Tree.Item>
          )}
        </Tree.Root>
      </EditingContext.Provider>
    </div>
  );
}

function updateCategory(
  items: CategoryItem[],
  targetId: string,
  category: CategoryItem['category'],
): CategoryItem[] {
  return items.map((item) => {
    if (item.id === targetId) {
      return { ...item, category };
    }
    if (item.children) {
      return { ...item, children: updateCategory(item.children, targetId, category) };
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
