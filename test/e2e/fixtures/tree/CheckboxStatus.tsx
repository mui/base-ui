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

export default function CheckboxStatusTree() {
  return (
    <TreeGrid.Root items={items} defaultExpandedItems={['documents']} multiple>
      <TreeGrid.Table aria-label="Files to share">
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
              <TreeGrid.RowExpansionTrigger>
                <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
                  <path d="M4.5 2 8.5 6l-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </TreeGrid.RowExpansionTrigger>
              {item.label}
            </TreeGrid.Cell>
          </TreeGrid.Row>
        )}
      </TreeGrid.Table>
      <TreeGrid.Status style={visuallyHidden} />
    </TreeGrid.Root>
  );
}
