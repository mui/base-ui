'use client';
import * as React from 'react';
import { Tree } from '@base-ui/react/tree';
import styles from './tree.module.css';

interface LazyItem {
  id: string;
  label: string;
  childCount: number;
  children?: LazyItem[];
}

// Simulated server data
const serverData: Record<string, LazyItem[]> = {
  root: [
    { id: 'documents', label: 'Documents', childCount: 3 },
    { id: 'photos', label: 'Photos', childCount: 2 },
    { id: 'notes', label: 'Notes', childCount: 0 },
  ],
  documents: [
    { id: 'resume', label: 'Resume.pdf', childCount: 0 },
    { id: 'cover-letter', label: 'Cover Letter.docx', childCount: 0 },
    { id: 'projects', label: 'Projects', childCount: 2 },
  ],
  projects: [
    { id: 'project-a', label: 'Project A', childCount: 0 },
    { id: 'project-b', label: 'Project B', childCount: 0 },
  ],
  photos: [
    { id: 'vacation', label: 'Vacation', childCount: 0 },
    { id: 'family', label: 'Family', childCount: 0 },
  ],
};

// Mutable copy so edits persist across fetches
const mutableServerData = JSON.parse(JSON.stringify(serverData)) as typeof serverData;

async function fakeFetch(parentId?: string): Promise<LazyItem[]> {
  await new Promise((resolve) => {
    setTimeout(resolve, 300 + Math.random() * 200);
  });
  const key = parentId ?? 'root';
  return mutableServerData[key] ?? [];
}

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

export default function LazyLoadingEditingTree() {
  const [editingItemId, setEditingItemId] = React.useState<string | null>(null);
  const actionsRef = React.useRef<Tree.Root.Actions<LazyItem> | null>(null);

  const lazyLoading = Tree.useLazyLoading<LazyItem>({
    fetchChildren: fakeFetch,
    getChildrenCount: (item) => item.childCount,
  });

  const editingContext = React.useMemo(
    () => ({
      editingItemId,
      startEditing: (itemId: string) => setEditingItemId(itemId),
      stopEditing: () => setEditingItemId(null),
      saveEdit: (itemId: string, newLabel: string) => {
        // Update mutable server data so future fetches return the new label
        for (const items of Object.values(mutableServerData)) {
          const target = items.find((item) => item.id === itemId);
          if (target) {
            target.label = newLabel;
            break;
          }
        }

        // Find the parent that contains this item and refresh its children
        for (const [parentKey, items] of Object.entries(mutableServerData)) {
          if (items.some((item) => item.id === itemId)) {
            const parentId = parentKey === 'root' ? undefined : parentKey;
            actionsRef.current?.updateItemChildren(parentId ?? null);
            break;
          }
        }

        setEditingItemId(null);
      },
    }),
    [editingItemId],
  );

  const itemToStringLabel = React.useCallback((item: LazyItem) => item.label, []);

  return (
    <div className={styles.wrapper}>
      <div>
        <h3 className={styles.heading}>Lazy loading + editing</h3>
        <p className={styles.description}>
          Items load on expand. Double-click to edit a label. Edits update the server data and
          refresh the cache.
        </p>
      </div>
      <EditingContext.Provider value={editingContext}>
        <Tree.Root<undefined, LazyItem>
          items={[]}
          className={styles.tree}
          lazyLoading={lazyLoading}
          actionsRef={actionsRef}
          itemToStringLabel={itemToStringLabel}
        >
          {(item) => (
            <Tree.Item itemId={item.id} className={styles.item}>
              <Tree.ItemExpansionTrigger className={styles.expansionTrigger}>
                <ChevronIcon />
              </Tree.ItemExpansionTrigger>
              <Tree.ItemLoadingIndicator className={styles.loadingIndicator}>
                <span className={styles.spinner} />
              </Tree.ItemLoadingIndicator>
              <EditableLabel itemId={(item as LazyItem).id} label={(item as LazyItem).label} />
            </Tree.Item>
          )}
        </Tree.Root>
      </EditingContext.Provider>
    </div>
  );
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
