import * as React from 'react';
import { TreeGrid } from '@base-ui/react/tree-grid';

const items: TreeGrid.DefaultItem[] = [
  {
    id: 'redesign',
    label: 'Website redesign',
    children: [
      { id: 'wireframes', label: 'Wireframes' },
      { id: 'homepage', label: 'Homepage copy' },
      { id: 'mockups', label: 'Archived mockups', disabled: true },
    ],
  },
];

export default function ItemControlsTree() {
  return (
    <TreeGrid.Root items={items} defaultExpandedItems={['redesign']}>
      <TreeGrid.Table aria-label="Projects">
        {(item: TreeGrid.DefaultItem) => (
          <TreeGrid.Row
            itemId={item.id}
            aria-description={item.children ? undefined : 'Press Tab to reach the task controls'}
          >
            <TreeGrid.Cell
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
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
                <React.Fragment>
                  <TreeGrid.CellLink
                    href={`/tasks/${item.id}`}
                    onClick={(event) => event.preventDefault()}
                  >
                    {item.label}
                  </TreeGrid.CellLink>
                  <TreeGrid.CellInput
                    aria-label={`Estimate for ${item.label}, in hours`}
                    defaultValue="2"
                    style={{ width: '3rem' }}
                  />
                  <TreeGrid.CellButton aria-label={`Remove ${item.label}`}>×</TreeGrid.CellButton>
                </React.Fragment>
              )}
            </TreeGrid.Cell>
          </TreeGrid.Row>
        )}
      </TreeGrid.Table>
    </TreeGrid.Root>
  );
}
