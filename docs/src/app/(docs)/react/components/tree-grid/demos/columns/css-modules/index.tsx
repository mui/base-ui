'use client';
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
  return (
    <TreeGrid.Root defaultItems={items} defaultExpandedItems={['src', 'components']}>
      <TreeGrid.Table aria-label="Files" className={styles.Table}>
        <TreeGrid.HeaderRow className={styles.HeaderRow}>
          <TreeGrid.HeaderCell className={styles.HeaderCell}>Name</TreeGrid.HeaderCell>
          <TreeGrid.HeaderCell className={styles.HeaderCell}>Size</TreeGrid.HeaderCell>
          <TreeGrid.HeaderCell className={styles.HeaderCell}>Modified</TreeGrid.HeaderCell>
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
