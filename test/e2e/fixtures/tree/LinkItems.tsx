import * as React from 'react';
import { ActionTree } from '@base-ui/react/action-tree';

const items: ActionTree.DefaultItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    children: [
      { id: 'quick-start', label: 'Quick start' },
      { id: 'accessibility', label: 'Accessibility' },
    ],
  },
  { id: 'handbook', label: 'Handbook', children: [{ id: 'styling', label: 'Styling' }] },
];

export default function LinkItemsTree() {
  return (
    <ActionTree.Root items={items} defaultExpandedItems={['overview']} selectionMode="none">
      <ActionTree.List aria-label="Documentation">
        {(item: ActionTree.DefaultItem) => (
          <ActionTree.Item
            itemId={item.id}
            aria-description={item.children ? undefined : 'Press Tab to reach the link'}
          >
            <ActionTree.ItemContent
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                paddingInlineStart: 'calc((var(--tree-item-level) - 1) * 1.5rem)',
              }}
            >
              <ActionTree.ItemExpansionTrigger>
                <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
                  <path d="M4.5 2 8.5 6l-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </ActionTree.ItemExpansionTrigger>
              {item.children ? (
                item.label
              ) : (
                <ActionTree.ItemLink
                  href={`/docs/${item.id}`}
                  active={item.id === 'accessibility'}
                  onClick={(event) => event.preventDefault()}
                >
                  {item.label}
                </ActionTree.ItemLink>
              )}
            </ActionTree.ItemContent>
          </ActionTree.Item>
        )}
      </ActionTree.List>
    </ActionTree.Root>
  );
}
