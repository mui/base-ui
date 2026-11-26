import * as React from 'react';
import { TreeGrid } from '@base-ui/react/tree-grid';

const items: TreeGrid.DefaultItem[] = [
  {
    id: 'documents',
    label: 'Documents',
    children: [
      { id: 'resume', label: 'Resume' },
      { id: 'cover-letter', label: 'Cover letter' },
    ],
  },
  { id: 'notes', label: 'Notes' },
];

export default function CheckboxSelectionTree() {
  return (
    <TreeGrid.Root items={items} defaultExpandedItems={['documents']} multiple>
      <TreeGrid.Label>Files to share</TreeGrid.Label>
      <TreeGrid.Table>
        {(item: TreeGrid.DefaultItem) => (
          <TreeGrid.Row itemId={item.id}>
            <TreeGrid.Cell
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                paddingInlineStart: 'calc((var(--tree-item-level) - 1) * 1.5rem)',
              }}
            >
              <TreeGrid.RowCheckbox
                style={{
                  display: 'inline-flex',
                  width: '0.875rem',
                  height: '0.875rem',
                  border: '1px solid',
                }}
              >
                <TreeGrid.RowCheckboxIndicator>
                  <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
                    <path
                      d="M2.5 6.5 5 9l4.5-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                </TreeGrid.RowCheckboxIndicator>
              </TreeGrid.RowCheckbox>
              {item.label}
            </TreeGrid.Cell>
          </TreeGrid.Row>
        )}
      </TreeGrid.Table>
    </TreeGrid.Root>
  );
}
