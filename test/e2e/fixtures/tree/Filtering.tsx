import * as React from 'react';
import { Tree } from '@base-ui/react/tree';

const items: Tree.DefaultItem[] = [
  {
    id: 'documents',
    label: 'Documents',
    children: [
      { id: 'resume', label: 'Resume.pdf' },
      {
        id: 'invoices',
        label: 'Invoices',
        children: [
          { id: 'invoice-q1', label: 'Invoice Q1.pdf' },
          { id: 'invoice-q2', label: 'Invoice Q2.pdf' },
        ],
      },
    ],
  },
  { id: 'photos', label: 'Photos', children: [{ id: 'sunset', label: 'Sunset.jpg' }] },
  { id: 'notes', label: 'Notes.txt' },
];

const visuallyHidden: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

export default function FilteringTree() {
  return (
    <Tree.FilterProvider>
      <Tree.Root items={items}>
        <Tree.Input aria-label="Filter files" />
        <Tree.Clear>×</Tree.Clear>
        <Tree.List aria-label="File system">
          {(item: Tree.DefaultItem) => (
            <Tree.Item itemId={item.id}>
              <Tree.ItemContent
                style={{ paddingInlineStart: 'calc((var(--tree-item-level) - 1) * 1.5rem)' }}
              >
                <Tree.ItemExpansionTrigger>
                  <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
                    <path
                      d="M4.5 2 8.5 6l-4 4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                </Tree.ItemExpansionTrigger>
                {item.label}
              </Tree.ItemContent>
            </Tree.Item>
          )}
        </Tree.List>
        <Tree.Status style={visuallyHidden} />
        <Tree.Empty>No files found.</Tree.Empty>
      </Tree.Root>
    </Tree.FilterProvider>
  );
}
