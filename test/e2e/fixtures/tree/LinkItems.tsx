import * as React from 'react';
import { TreeGrid } from '@base-ui/react/tree-grid';

const items: TreeGrid.DefaultItem[] = [
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
    <TreeGrid.Root items={items} defaultExpandedItems={['overview']} selectionMode="none">
      <TreeGrid.Table aria-label="Documentation">
        {(item: TreeGrid.DefaultItem) => (
          <TreeGrid.Row
            itemId={item.id}
            aria-description={item.children ? undefined : 'Press Tab to reach the link'}
          >
            <TreeGrid.Cell
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                paddingInlineStart: 'calc((var(--tree-item-level) - 1) * 1.5rem)',
              }}
            >
              <TreeGrid.RowExpansionTrigger>
                <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
                  <path d="M4.5 2 8.5 6l-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </TreeGrid.RowExpansionTrigger>
              {item.children ? (
                item.label
              ) : (
                <TreeGrid.CellLink
                  href={`/docs/${item.id}`}
                  active={item.id === 'accessibility'}
                  onClick={(event) => event.preventDefault()}
                >
                  {item.label}
                </TreeGrid.CellLink>
              )}
            </TreeGrid.Cell>
          </TreeGrid.Row>
        )}
      </TreeGrid.Table>
    </TreeGrid.Root>
  );
}
