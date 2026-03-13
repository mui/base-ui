'use client';
import * as React from 'react';
import { Tree } from '@base-ui/react/tree';
import { Popover } from '@base-ui/react/popover';
import styles from './index.module.css';

const initialItems: Tree.DefaultItemModel[] = [
  {
    id: 'src',
    label: 'src',
    children: [
      {
        id: 'components',
        label: 'components',
        children: [
          { id: 'app', label: 'App.tsx' },
          { id: 'header', label: 'Header.tsx' },
        ],
      },
      { id: 'index', label: 'index.ts' },
      { id: 'styles', label: 'styles.css' },
    ],
  },
  {
    id: 'public',
    label: 'public',
    children: [{ id: 'favicon', label: 'favicon.ico' }],
  },
  { id: 'readme', label: 'README.md' },
  { id: 'package-json', label: 'package.json' },
];

const CrudContext = React.createContext<{
  editingItemId: string | null;
  startEditing: (itemId: string) => void;
  stopEditing: () => void;
  saveEdit: (itemId: string, newLabel: string) => void;
  deleteItem: (itemId: string) => void;
  addItem: (parentId: string, type: 'file' | 'folder') => void;
}>({
  editingItemId: null,
  startEditing: () => {},
  stopEditing: () => {},
  saveEdit: () => {},
  deleteItem: () => {},
  addItem: () => {},
});

function EditableLabel({ itemId, label }: { itemId: string; label: string }) {
  const { editingItemId, startEditing, stopEditing, saveEdit } = React.useContext(CrudContext);
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
      className={styles.Label}
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

function DeleteButton({ itemId }: { itemId: string }) {
  const { deleteItem } = React.useContext(CrudContext);

  return (
    <button
      type="button"
      className={`${styles.ActionButton} ${styles.DeleteButton}`}
      aria-label="Delete"
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

function AddItemButton({ parentId }: { parentId: string }) {
  const { addItem } = React.useContext(CrudContext);
  const [open, setOpen] = React.useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        className={`${styles.ActionButton} ${styles.AddButton}`}
        aria-label="Add item"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <PlusIcon />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={4}>
          <Popover.Popup className={styles.AddPopup} onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className={styles.AddPopupOption}
              onClick={() => {
                addItem(parentId, 'file');
                setOpen(false);
              }}
            >
              File
            </button>
            <button
              type="button"
              className={styles.AddPopupOption}
              onClick={() => {
                addItem(parentId, 'folder');
                setOpen(false);
              }}
            >
              Folder
            </button>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

export default function ExampleTreeCrud() {
  const [items, setItems] = React.useState(initialItems);
  const [editingItemId, setEditingItemId] = React.useState<string | null>(null);
  const [expandedItems, setExpandedItems] = React.useState<string[]>(['src', 'components']);
  const nextIdRef = React.useRef(0);

  const crudContext = React.useMemo(
    () => ({
      editingItemId,
      startEditing: (itemId: string) => setEditingItemId(itemId),
      stopEditing: () => setEditingItemId(null),
      saveEdit: (itemId: string, newLabel: string) => {
        setItems((prev) => updateLabel(prev, itemId, newLabel));
        setEditingItemId(null);
      },
      deleteItem: (itemId: string) => {
        setItems((prev) => removeItem(prev, itemId));
      },
      addItem: (parentId: string, type: 'file' | 'folder') => {
        const newId = `new-${type}-${nextIdRef.current}`;
        nextIdRef.current += 1;
        const newItem: Tree.DefaultItemModel =
          type === 'folder'
            ? { id: newId, label: 'New folder', children: [] }
            : { id: newId, label: 'New file' };
        setItems((prev) => addChildItem(prev, parentId, newItem));
        setExpandedItems((prev) => (prev.includes(parentId) ? prev : [...prev, parentId]));
        setEditingItemId(newId);
      },
    }),
    [editingItemId],
  );

  return (
    <CrudContext.Provider value={crudContext}>
      <Tree.Root
        items={items}
        expandedItems={expandedItems}
        onExpandedItemsChange={(newExpanded) => setExpandedItems(newExpanded)}
        className={styles.Tree}
        onKeyDown={(event) => {
          const focused = (event.currentTarget as HTMLElement).querySelector<HTMLElement>(
            '[data-focused]',
          );
          const itemId = focused?.getAttribute('data-item-id');
          if (event.key === 'F2' && itemId && !editingItemId) {
            event.preventDefault();
            setEditingItemId(itemId);
          }
        }}
      >
        {(item) => (
          <Tree.Item itemId={item.id} className={styles.Item}>
            <Tree.ItemExpansionTrigger className={styles.ExpansionTrigger}>
              <ChevronIcon />
            </Tree.ItemExpansionTrigger>
            <Tree.ItemGroupIndicator className={styles.GroupIndicator}>
              <FolderIcon />
            </Tree.ItemGroupIndicator>
            <EditableLabel itemId={item.id} label={item.label} />
            {item.children !== undefined && <AddItemButton parentId={item.id} />}
            <DeleteButton itemId={item.id} />
          </Tree.Item>
        )}
      </Tree.Root>
    </CrudContext.Provider>
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
      return {
        ...item,
        children: updateLabel(item.children, targetId, newLabel),
      };
    }
    return item;
  });
}

function removeItem(items: Tree.DefaultItemModel[], targetId: string): Tree.DefaultItemModel[] {
  return items
    .filter((item) => item.id !== targetId)
    .map((item) => {
      if (item.children) {
        return { ...item, children: removeItem(item.children, targetId) };
      }
      return item;
    });
}

function addChildItem(
  items: Tree.DefaultItemModel[],
  parentId: string,
  newItem: Tree.DefaultItemModel,
): Tree.DefaultItemModel[] {
  return items.map((item) => {
    if (item.id === parentId) {
      return { ...item, children: [...(item.children ?? []), newItem] };
    }
    if (item.children) {
      return {
        ...item,
        children: addChildItem(item.children, parentId, newItem),
      };
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

function FolderIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
      <path d="M1 3.5A1.5 1.5 0 012.5 2h3.879a1.5 1.5 0 011.06.44l1.122 1.12A1.5 1.5 0 009.62 4H13.5A1.5 1.5 0 0115 5.5v7a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 12.5v-9z" />
    </svg>
  );
}

function CloseIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 12 12" fill="none" {...props} width="12" height="12">
      <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 12 12" fill="none" {...props} width="12" height="12">
      <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
