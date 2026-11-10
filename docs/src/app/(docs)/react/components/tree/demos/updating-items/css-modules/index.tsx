'use client';
import * as React from 'react';
import { Button } from '@base-ui/react/button';
import { Tree } from '@base-ui/react/tree';
import styles from './index.module.css';

const INITIAL_ITEMS: Tree.DefaultItem[] = [
  {
    id: 'documents',
    label: 'Documents',
    children: [
      { id: 'resume', label: 'Resume.pdf' },
      { id: 'notes', label: 'Notes.txt' },
      { id: 'budget', label: 'Budget.xlsx' },
    ],
  },
  {
    id: 'photos',
    label: 'Photos',
    children: [
      { id: 'sunset', label: 'Sunset.jpg' },
      { id: 'beach', label: 'Beach.png' },
    ],
  },
  { id: 'todo', label: 'Todo.md' },
];

let fileCount = 0;

export default function ExampleTreeUpdatingItems() {
  const actionsRef = React.useRef<Tree.Root.Actions>(null);
  const [items, setItems] = React.useState(INITIAL_ITEMS);
  const [selected, setSelected] = React.useState<Tree.ItemId | null>('documents');
  // Where each archived item was, so Unarchive can put it back.
  const origins = React.useRef(
    new Map<Tree.ItemId, { parentId: Tree.ItemId | null; index: number }>(),
  );

  const archiveFolder = items.find((item) => item.id === 'archive');
  const isArchived = selected != null && containsItem(archiveFolder?.children, selected);

  const addFile = () => {
    const actions = actionsRef.current;
    if (actions == null || selected == null) {
      return;
    }
    fileCount += 1;
    const file = { id: `file-${fileCount}`, label: `Untitled ${fileCount}.txt` };
    // Folders have `children`, even when empty.
    const inFolder = actions.getItemModel(selected)?.children != null;
    // @highlight-start
    void actions.applyTransaction((transaction) => {
      // Inside the selected folder, or right after the selected file.
      transaction.add(file, inFolder ? { parentId: selected } : { after: selected });
    });
    // @highlight-end
    if (inFolder) {
      actions.setItemExpansion(selected, true);
    }
    setSelected(file.id);
  };

  const sortFolder = () => {
    const actions = actionsRef.current;
    if (actions == null || selected == null) {
      return;
    }
    // The selected folder, or the folder of the selected file.
    const folderId =
      actions.getItemModel(selected)?.children != null ? selected : actions.getParentId(selected);
    const folder = folderId == null ? undefined : actions.getItemModel(folderId);
    if (folder?.children == null) {
      return;
    }
    const children = [...folder.children].sort((a, b) => a.label.localeCompare(b.label));
    void actions.applyTransaction((transaction) => {
      // Replaces the folder, children included.
      transaction.set({ ...folder, children });
    });
  };

  const archive = () => {
    const actions = actionsRef.current;
    if (actions == null || selected == null) {
      return;
    }
    origins.current.set(selected, {
      parentId: actions.getParentId(selected),
      index: actions.getItemIndex(selected),
    });
    // @highlight-start @focus @padding 2
    void actions.applyTransaction((transaction) => {
      // The move goes into the folder an earlier operation of the same transaction adds.
      if (archiveFolder == null) {
        transaction.add({ id: 'archive', label: 'Archive', children: [] });
      }
      transaction.move(selected, { parentId: 'archive' });
    });
    // @highlight-end
    actions.setItemExpansion('archive', true);
  };

  const unarchive = () => {
    const actions = actionsRef.current;
    if (actions == null || selected == null) {
      return;
    }
    const origin = origins.current.get(selected);
    origins.current.delete(selected);
    // Back where it was, or to the root when that folder is gone or archived too.
    const restoresOrigin =
      origin != null &&
      (origin.parentId == null ||
        (actions.hasItem(origin.parentId) &&
          !containsItem(archiveFolder?.children, origin.parentId)));
    void actions.applyTransaction((transaction) => {
      transaction.move(selected, restoresOrigin ? origin : { parentId: null });
      // The Archive folder goes away with its last item.
      if (archiveFolder?.children?.every((item) => item.id === selected)) {
        transaction.remove('archive');
      }
    });
  };

  const remove = () => {
    if (selected != null) {
      void actionsRef.current?.applyTransaction((transaction) => transaction.remove(selected));
    }
  };

  return (
    <div className={styles.Container}>
      <div className={styles.Toolbar}>
        <Button className={styles.Button} disabled={selected == null} onClick={addFile}>
          New file
        </Button>
        <Button className={styles.Button} disabled={selected == null} onClick={sortFolder}>
          Sort
        </Button>
        <Button
          className={styles.Button}
          disabled={selected == null || selected === 'archive'}
          onClick={isArchived ? unarchive : archive}
        >
          {isArchived ? 'Unarchive' : 'Archive'}
        </Button>
        <Button className={styles.Button} disabled={selected == null} onClick={remove}>
          Delete
        </Button>
      </div>
      <Tree.Root
        items={items}
        onItemsChange={setItems}
        defaultExpandedItems={['documents']}
        // @highlight-start
        actionsRef={actionsRef}
        // @highlight-end
        selectedItems={selected}
        onSelectedItemsChange={setSelected}
      >
        <Tree.List aria-label="File system" className={styles.Tree}>
          {(item: Tree.DefaultItem) => (
            <Tree.Item itemId={item.id} className={styles.Item}>
              <Tree.ItemContent className={styles.ItemContent}>
                <Tree.ItemExpansionTrigger className={styles.ExpansionTrigger}>
                  <ChevronIcon />
                </Tree.ItemExpansionTrigger>
                <Tree.ItemGroupIndicator className={styles.GroupIndicator}>
                  <FolderIcon />
                </Tree.ItemGroupIndicator>
                <span className={styles.Label}>{item.label}</span>
              </Tree.ItemContent>
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>
    </div>
  );
}

function containsItem(
  items: readonly Tree.DefaultItem[] | undefined,
  itemId: Tree.ItemId,
): boolean {
  return items?.some((item) => item.id === itemId || containsItem(item.children, itemId)) ?? false;
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true">
      <path d="M4.5 2 8.5 6l-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M1.5 4.5A1.5 1.5 0 0 1 3 3h3.4l1.8 1.7H13a1.5 1.5 0 0 1 1.5 1.5v5.3A1.5 1.5 0 0 1 13 13H3a1.5 1.5 0 0 1-1.5-1.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      />
    </svg>
  );
}
