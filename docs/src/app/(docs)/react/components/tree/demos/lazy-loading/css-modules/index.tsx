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
  createFolder('system', 'System'),
];

// Simulated server data
const SERVER_DATA: Record<string, TreeItemModel[]> = {
  documents: [
    { id: 'resume.pdf', label: 'resume.pdf' },
    { id: 'cover-letter.docx', label: 'cover-letter.docx' },
    { id: 'notes.txt', label: 'notes.txt' },
  ],
  photos: [createFolder('vacation', 'vacation'), { id: 'profile.jpg', label: 'profile.jpg' }],
  vacation: [
    { id: 'beach.jpg', label: 'beach.jpg' },
    { id: 'sunset.png', label: 'sunset.png' },
  ],
  music: [{ id: 'playlist.m3u', label: 'playlist.m3u' }, createFolder('favorites', 'favorites')],
  favorites: [
    { id: 'song1.mp3', label: 'song1.mp3' },
    { id: 'song2.mp3', label: 'song2.mp3' },
  ],
  // 'system' is intentionally missing to simulate an error
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
  const [errorItems, setErrorItems] = React.useState<Map<string, string>>(() => new Map());
  const expandedItemsRef = React.useRef<string[]>([]);

  const loadChildren = React.useCallback((parentId: string) => {
    setLoadingItems((prev) => new Set(prev).add(parentId));
    setErrorItems((prev) => {
      const next = new Map(prev);
      next.delete(parentId);
      return next;
    });

    fetchChildren(parentId).then(
      (children) => {
        setItems((prev) => replaceChildren(prev, parentId, children));
        setLoadingItems((prev) => {
          const next = new Set(prev);
          next.delete(parentId);
          return next;
        });
      },
      (error: Error) => {
        setLoadingItems((prev) => {
          const next = new Set(prev);
          next.delete(parentId);
          return next;
        });
        setErrorItems((prev) => new Map(prev).set(parentId, error.message));
      },
    );
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
          const parentId = item.placeholderParentId as string;

          if (errorItems.has(parentId) && !loadingItems.has(parentId)) {
            return (
              <Tree.Item className={styles.Item} clickToExpand={false} clickToSelect={false}>
                <span className={styles.ErrorText}>Failed to load</span>
                <button
                  type="button"
                  className={styles.RetryButton}
                  onClick={(event) => {
                    event.stopPropagation();
                    loadChildren(parentId);
                  }}
                >
                  Retry
                </button>
              </Tree.Item>
            );
          }

          return (
            <Tree.Item className={styles.Item} clickToExpand={false} clickToSelect={false}>
              <span className={styles.Spinner} />
              <span className={styles.LoadingText}>Loading…</span>
            </Tree.Item>
          );
        }

        return (
          <Tree.Item className={styles.Item}>
            <Tree.ItemExpansionTrigger className={styles.ExpansionTrigger}>
              <ChevronIcon />
            </Tree.ItemExpansionTrigger>
            <Tree.ItemLabel className={styles.Label} />
          </Tree.Item>
        );
      }}
    </Tree.Root>
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
