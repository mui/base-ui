'use client';
import * as React from 'react';
import { Tree } from '@base-ui/react/tree';
import type { TreeItemModel } from '@base-ui/react/tree';
import styles from './index.module.css';

function createPlaceholder(parentId: string): TreeItemModel {
  return {
    id: `__placeholder__${parentId}`,
    label: '',
    placeholder: true,
    placeholderParentId: parentId,
  };
}

function createFolder(id: string, label: string): TreeItemModel {
  return { id, label, children: [createPlaceholder(id)] };
}

const INITIAL_ITEMS: TreeItemModel[] = [
  createFolder('documents', 'Documents'),
  createFolder('photos', 'Photos'),
  createFolder('music', 'Music'),
  { id: 'notes', label: 'Notes.txt' },
];

// Simulated server data
const SERVER_DATA: Record<string, TreeItemModel[]> = {
  documents: [
    { id: 'resume', label: 'Resume.pdf' },
    { id: 'cover-letter', label: 'Cover Letter.docx' },
    createFolder('invoices', 'Invoices'),
  ],
  invoices: [
    { id: 'invoice-q1', label: 'Invoice_Q1.pdf' },
    { id: 'invoice-q2', label: 'Invoice_Q2.pdf' },
  ],
  photos: [
    { id: 'sunset', label: 'Sunset.jpg' },
    { id: 'mountains', label: 'Mountains.png' },
    { id: 'family-dinner', label: 'Family Dinner.jpg' },
  ],
  music: [
    { id: 'blue-in-green', label: 'Blue in Green.mp3' },
    { id: 'moonlight-sonata', label: 'Moonlight Sonata.flac' },
  ],
};

function fetchChildren(parentId: string): Promise<TreeItemModel[]> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const children = SERVER_DATA[parentId];
      if (children) {
        resolve(children);
      } else {
        reject(new Error('Failed to load'));
      }
    }, 1000);
  });
}

function hasPlaceholderChild(items: TreeItemModel[], parentId: string): boolean {
  for (const item of items) {
    if (item.id === parentId) {
      return item.children?.some((c) => c.placeholder) ?? false;
    }
    if (item.children) {
      const found = hasPlaceholderChild(item.children, parentId);
      if (found) {
        return true;
      }
    }
  }
  return false;
}

function replaceChildren(
  items: TreeItemModel[],
  parentId: string,
  newChildren: TreeItemModel[],
): TreeItemModel[] {
  return items.map((item) => {
    if (item.id === parentId) {
      return { ...item, children: newChildren };
    }
    if (item.children) {
      return { ...item, children: replaceChildren(item.children, parentId, newChildren) };
    }
    return item;
  });
}

export default function ExampleTreeLazyLoading() {
  const [items, setItems] = React.useState<TreeItemModel[]>(INITIAL_ITEMS);
  const [loadingItems, setLoadingItems] = React.useState<Set<string>>(() => new Set());

  const expandedItemsRef = React.useRef<string[]>([]);

  const loadChildren = React.useCallback((parentId: string) => {
    setLoadingItems((prev) => new Set(prev).add(parentId));

    fetchChildren(parentId).then((children) => {
      setItems((prev) => replaceChildren(prev, parentId, children));
      setLoadingItems((prev) => {
        const next = new Set(prev);
        next.delete(parentId);
        return next;
      });
    });
  }, []);

  const handleExpandedItemsChange = React.useCallback(
    (newExpandedItems: string[]) => {
      const previousExpanded = new Set(expandedItemsRef.current);
      expandedItemsRef.current = newExpandedItems;

      for (const itemId of newExpandedItems) {
        if (!previousExpanded.has(itemId) && hasPlaceholderChild(items, itemId)) {
          loadChildren(itemId);
        }
      }
    },
    [items, loadChildren],
  );

  return (
    <Tree.Root
      items={items}
      onExpandedItemsChange={handleExpandedItemsChange}
      className={styles.Tree}
    >
      {(item) => {
        if (item.placeholder) {
          return <Tree.Item className={styles.PlaceholderItem} />;
        }

        const isLoading = loadingItems.has(item.id);

        return (
          <Tree.Item className={styles.Item}>
            <Tree.ItemExpansionTrigger className={styles.ExpansionTrigger}>
              <ChevronIcon />
            </Tree.ItemExpansionTrigger>
            {isLoading ? (
              <SpinnerIcon />
            ) : item.children ? (
              <FolderIcon className={styles.Icon} />
            ) : (
              <FileIcon className={styles.Icon} />
            )}
            <Tree.ItemLabel className={styles.Label} />
          </Tree.Item>
        );
      }}
    </Tree.Root>
  );
}

function SpinnerIcon() {
  return <span className={styles.Spinner} />;
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

function FileIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
      <path d="M4 1.5A1.5 1.5 0 015.5 0h4.379a1.5 1.5 0 011.06.44l2.122 2.12A1.5 1.5 0 0113.5 3.5V14.5A1.5 1.5 0 0112 16H5.5A1.5 1.5 0 014 14.5v-13z" />
    </svg>
  );
}
