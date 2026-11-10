'use client';
import * as React from 'react';
import { Button } from '@base-ui/react/button';
import { Tree } from '@base-ui/react/tree';

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

const BUTTON_CLASS =
  'flex h-8 items-center justify-center gap-2 rounded-none border border-neutral-950 bg-white px-3 text-sm leading-none whitespace-nowrap font-normal text-neutral-950 select-none hover:not-data-disabled:bg-neutral-100 active:not-data-disabled:bg-neutral-200 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white data-disabled:border-neutral-500 data-disabled:text-neutral-500 dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:not-data-disabled:bg-neutral-800 dark:active:not-data-disabled:bg-neutral-700 dark:data-disabled:border-neutral-400 dark:data-disabled:text-neutral-400';

const ITEM_CLASS =
  'flex items-center gap-2 px-2 py-1 select-none text-sm/[1.5] text-neutral-950 ' +
  '[--leaf-offset:0rem] not-data-expandable:[--leaf-offset:3.25rem] ' +
  'hover:bg-neutral-100 ' +
  'data-selected:bg-neutral-200 focus-visible:outline-2 focus-visible:-outline-offset-1 ' +
  'focus-visible:outline-neutral-950 dark:text-white dark:hover:bg-neutral-800 ' +
  'dark:data-selected:bg-neutral-700 dark:focus-visible:outline-white ' +
  'border-s-2 border-transparent data-selected:border-neutral-950 dark:data-selected:border-white ' +
  'forced-colors:border-[color:Canvas] forced-colors:data-selected:border-[color:Highlight]';

const CONTROL_CLASS =
  'relative after:absolute after:-inset-0.5 ' +
  'inline-flex size-5 shrink-0 items-center justify-center border-0 bg-transparent p-0 ' +
  'text-neutral-500 focus-visible:outline-2 focus-visible:outline-neutral-950 ' +
  'dark:text-neutral-400 dark:focus-visible:outline-white [&_svg]:size-3';

const HIERARCHY_CLASS =
  'ms-[calc(1.5rem*(var(--tree-item-level)-1))] flex min-w-0 flex-1 items-center gap-2 ' +
  'ps-[var(--leaf-offset)]';

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
    <div className="flex flex-col items-start gap-3">
      <div className="flex flex-wrap gap-2">
        <Button className={BUTTON_CLASS} disabled={selected == null} onClick={addFile}>
          New file
        </Button>
        <Button className={BUTTON_CLASS} disabled={selected == null} onClick={sortFolder}>
          Sort
        </Button>
        <Button
          className={BUTTON_CLASS}
          disabled={selected == null || selected === 'archive'}
          onClick={isArchived ? unarchive : archive}
        >
          {isArchived ? 'Unarchive' : 'Archive'}
        </Button>
        <Button className={BUTTON_CLASS} disabled={selected == null} onClick={remove}>
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
        <Tree.List
          aria-label="File system"
          className="box-content w-68 border border-neutral-200 bg-white p-1 text-neutral-950 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
        >
          {(item: Tree.DefaultItem) => (
            <Tree.Item itemId={item.id} className={ITEM_CLASS}>
              <Tree.ItemContent className={HIERARCHY_CLASS}>
                <Tree.ItemExpansionTrigger
                  className={`${CONTROL_CLASS} data-expanded:[&_svg]:rotate-90`}
                >
                  <ChevronIcon />
                </Tree.ItemExpansionTrigger>
                <Tree.ItemGroupIndicator className="inline-flex shrink-0 text-neutral-500 dark:text-neutral-400 [&_svg]:size-4">
                  <FolderIcon />
                </Tree.ItemGroupIndicator>
                <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {item.label}
                </span>
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
