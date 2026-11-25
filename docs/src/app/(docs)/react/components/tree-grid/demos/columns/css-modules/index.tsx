'use client';
import * as React from 'react';
import { TreeGrid } from '@base-ui/react/tree-grid';
import styles from './index.module.css';

interface File extends TreeGrid.DefaultItem {
  size: string;
  modified: string;
  children?: File[];
}

const items: File[] = [
  {
    id: 'src',
    label: 'src',
    size: '17 KB',
    modified: 'Mar 5',
    children: [
      {
        id: 'components',
        label: 'components',
        size: '16 KB',
        modified: 'Mar 5',
        children: [
          { id: 'button', label: 'Button.tsx', size: '4 KB', modified: 'Mar 3' },
          { id: 'dialog', label: 'Dialog.tsx', size: '12 KB', modified: 'Mar 5' },
        ],
      },
      { id: 'index', label: 'index.ts', size: '1 KB', modified: 'Feb 27' },
    ],
  },
  { id: 'package', label: 'package.json', size: '2 KB', modified: 'Mar 1' },
  { id: 'readme', label: 'README.md', size: '6 KB', modified: 'Feb 20' },
];

export default function ExampleTreeGridColumns() {
  const actionsRef = React.useRef<TreeGrid.Root.Actions<File>>(null);

  return (
    <TreeGrid.Root
      defaultItems={items}
      defaultExpandedItems={['src', 'components']}
      actionsRef={actionsRef}
    >
      <TreeGrid.Table
        aria-label="Files"
        aria-description="Press Tab to reach the remove buttons"
        className={styles.Table}
      >
        <TreeGrid.HeaderRow className={styles.HeaderRow}>
          <TreeGrid.HeaderCell className={styles.HeaderCell}>Name</TreeGrid.HeaderCell>
          <TreeGrid.HeaderCell className={styles.HeaderCell}>Size</TreeGrid.HeaderCell>
          <TreeGrid.HeaderCell className={styles.HeaderCell}>Modified</TreeGrid.HeaderCell>
          <TreeGrid.HeaderCell className={styles.HeaderCell}>
            <span className={styles.VisuallyHidden}>Actions</span>
          </TreeGrid.HeaderCell>
        </TreeGrid.HeaderRow>
        <TreeGrid.Collection>
          {(file: File) => (
            <TreeGrid.Row itemId={file.id} className={styles.Row}>
              <TreeGrid.Cell className={styles.NameCell}>
                <TreeGrid.RowExpansionTrigger className={styles.ExpansionTrigger}>
                  <ChevronIcon />
                </TreeGrid.RowExpansionTrigger>
                <span className={styles.Label}>{file.label}</span>
              </TreeGrid.Cell>
              <TreeGrid.Cell className={styles.Cell}>{file.size}</TreeGrid.Cell>
              <TreeGrid.Cell className={styles.Cell}>{file.modified}</TreeGrid.Cell>
              <TreeGrid.Cell className={styles.ActionCell}>
                <TreeGrid.CellButton
                  aria-label={`Remove ${file.label}`}
                  className={styles.RemoveButton}
                  onClick={() =>
                    actionsRef.current?.applyTransaction((transaction) =>
                      transaction.remove(file.id),
                    )
                  }
                >
                  <RemoveIcon />
                </TreeGrid.CellButton>
              </TreeGrid.Cell>
            </TreeGrid.Row>
          )}
        </TreeGrid.Collection>
      </TreeGrid.Table>
    </TreeGrid.Root>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true">
      <path d="M4.5 2 8.5 6l-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function RemoveIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="m4 4 8 8m0-8-8 8" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
