import * as React from 'react';
import { TreeGrid } from '@base-ui/react/tree-grid';

interface File extends TreeGrid.DefaultItem {
  size: string;
  modified: string;
  children?: File[];
}

const items: File[] = [
  {
    id: 'documents',
    label: 'Documents',
    size: '2 items',
    modified: 'March 5',
    children: [
      { id: 'resume', label: 'Resume', size: '4 KB', modified: 'March 3' },
      { id: 'cover-letter', label: 'Cover letter', size: '2 KB', modified: 'March 5' },
    ],
  },
  { id: 'music', label: 'Music', size: '9 MB', modified: 'February 20' },
];

const ROW_STYLE: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '12rem 6rem 8rem',
};

export default function ColumnsTree() {
  return (
    <TreeGrid.Root items={items} defaultExpandedItems={['documents']}>
      <TreeGrid.Table aria-label="Files">
        <TreeGrid.HeaderRow style={ROW_STYLE}>
          <TreeGrid.HeaderCell>Name</TreeGrid.HeaderCell>
          <TreeGrid.HeaderCell>Size</TreeGrid.HeaderCell>
          <TreeGrid.HeaderCell>Modified</TreeGrid.HeaderCell>
        </TreeGrid.HeaderRow>
        <TreeGrid.Collection>
          {(item: File) => (
            <TreeGrid.Row itemId={item.id} style={ROW_STYLE}>
              <TreeGrid.Cell
                style={{ paddingInlineStart: 'calc((var(--tree-item-level) - 1) * 1.5rem)' }}
              >
                {item.label}
              </TreeGrid.Cell>
              <TreeGrid.Cell>{item.size}</TreeGrid.Cell>
              <TreeGrid.Cell>{item.modified}</TreeGrid.Cell>
            </TreeGrid.Row>
          )}
        </TreeGrid.Collection>
      </TreeGrid.Table>
    </TreeGrid.Root>
  );
}
