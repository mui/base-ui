import * as React from 'react';
import { Tree } from '@base-ui/react/tree';

const items: Tree.DefaultItem[] = [
  {
    id: 'documents',
    label: 'Documents',
    children: [
      { id: 'resume', label: 'Resume' },
      { id: 'cover-letter', label: 'Cover letter' },
    ],
  },
  {
    id: 'photos',
    label: 'Photos',
    children: [
      { id: 'sunset', label: 'Sunset' },
      { id: 'mountains', label: 'Mountains' },
    ],
  },
  { id: 'notes', label: 'Notes' },
];

export default function BasicTree() {
  return (
    <Tree.Root items={items} defaultExpandedItems={['documents']}>
      <Tree.List aria-label="File system">
        {(item: Tree.DefaultItem) => (
          <Tree.Item itemId={item.id}>
            <Tree.ItemContent
              style={{ paddingInlineStart: 'calc((var(--tree-item-level) - 1) * 1.5rem)' }}
            >
              <Tree.ItemExpansionTrigger>
                <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
                  <path d="M4.5 2 8.5 6l-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </Tree.ItemExpansionTrigger>
              {item.label}
            </Tree.ItemContent>
          </Tree.Item>
        )}
      </Tree.List>
    </Tree.Root>
  );
}
