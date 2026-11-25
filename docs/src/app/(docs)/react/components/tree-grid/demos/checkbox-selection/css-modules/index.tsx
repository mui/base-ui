'use client';
import * as React from 'react';
import { TreeGrid } from '@base-ui/react/tree-grid';
import styles from './index.module.css';

const items: TreeGrid.DefaultItem[] = [
  {
    id: 'documents',
    label: 'Documents',
    children: [
      { id: 'resume', label: 'Resume.pdf' },
      { id: 'cover-letter', label: 'Cover Letter.docx' },
      {
        id: 'invoices',
        label: 'Invoices',
        children: [
          { id: 'invoice-q1', label: 'Invoice_Q1.pdf' },
          { id: 'invoice-q2', label: 'Invoice_Q2.pdf' },
        ],
      },
    ],
  },
  {
    id: 'photos',
    label: 'Photos',
    children: [
      { id: 'sunset', label: 'Sunset.jpg' },
      { id: 'mountains', label: 'Mountains.png' },
      { id: 'family-dinner', label: 'Family Dinner.jpg' },
    ],
  },
  {
    id: 'music',
    label: 'Music',
    children: [
      { id: 'blue-in-green', label: 'Blue in Green.mp3' },
      { id: 'moonlight-sonata', label: 'Moonlight Sonata.flac' },
    ],
  },
  { id: 'notes', label: 'Notes.txt' },
];

export default function ExampleTreeGridCheckboxSelection() {
  return (
    <TreeGrid.Root
      items={items}
      defaultExpandedItems={['documents']}
      // @highlight-start
      selectionMode="multiple"
      // @highlight-end
    >
      <TreeGrid.Table aria-label="File system" className={styles.Table}>
        {(item: TreeGrid.DefaultItem) => (
          <TreeGrid.Row itemId={item.id} className={styles.Row}>
            <TreeGrid.Cell className={styles.Cell}>
              {/* @highlight-start @focus @padding 2 */}
              <TreeGrid.RowCheckbox className={styles.Checkbox}>
                <TreeGrid.RowCheckboxIndicator className={styles.CheckboxIndicator} keepMounted>
                  <CheckIcon className={styles.CheckIcon} />
                  <MinusIcon className={styles.MinusIcon} />
                </TreeGrid.RowCheckboxIndicator>
              </TreeGrid.RowCheckbox>
              {/* @highlight-end */}
              <div className={styles.Hierarchy}>
                <TreeGrid.RowExpansionTrigger className={styles.ExpansionTrigger}>
                  <ChevronIcon />
                </TreeGrid.RowExpansionTrigger>
                <span className={styles.Label}>{item.label}</span>
              </div>
            </TreeGrid.Cell>
          </TreeGrid.Row>
        )}
      </TreeGrid.Table>
      {/* @highlight-start */}
      {/* Screen readers don't reliably announce selection changes in a tree */}
      <TreeGrid.Status className={styles.VisuallyHidden} />
      {/* @highlight-end */}
    </TreeGrid.Root>
  );
}

function ChevronIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 12 12" fill="currentColor" {...props}>
      <path
        d="M4.5 2L8.5 6L4.5 10"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 12 12" fill="currentColor" {...props}>
      <path d="M9.854 3.146a.5.5 0 010 .708l-4.5 4.5a.5.5 0 01-.708 0l-2-2a.5.5 0 01.708-.708L5 7.293l4.146-4.147a.5.5 0 01.708 0z" />
    </svg>
  );
}

function MinusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 12 12" fill="currentColor" {...props}>
      <path d="M2.5 6a.5.5 0 01.5-.5h6a.5.5 0 010 1H3a.5.5 0 01-.5-.5z" />
    </svg>
  );
}
