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

export default function ExampleTreeGridFiltering() {
  const actionsRef = React.useRef<TreeGrid.Root.Actions>(null);

  return (
    <div className={styles.Demo}>
      {/* @focus-start */}
      {/* @highlight-start */}
      <TreeGrid.FilterProvider defaultValue="invoice">
        {/* @highlight-end */}
        <TreeGrid.Root defaultItems={items} actionsRef={actionsRef}>
          <div className={styles.Panel}>
            <div className={styles.InputContainer}>
              {/* @highlight-start */}
              <TreeGrid.Input
                className={styles.Input}
                aria-label="Filter files"
                placeholder="e.g. invoice"
              />
              <TreeGrid.Clear className={styles.Clear}>
                <ClearIcon />
              </TreeGrid.Clear>
              {/* @highlight-end */}
              {/* @focus-end */}
            </div>
            <TreeGrid.Table aria-label="File system" className={styles.Table}>
              {(item: TreeGrid.DefaultItem) => (
                <TreeGrid.Row
                  itemId={item.id}
                  className={styles.Row}
                  // Screen readers don't announce `data-filter-match`, so describe matches.
                  render={(props, state) => (
                    <div {...props} aria-description={describeItem(item, state.filterMatch)} />
                  )}
                >
                  <TreeGrid.Cell className={styles.Cell}>
                    <TreeGrid.RowExpansionTrigger className={styles.ExpansionTrigger}>
                      <ChevronIcon />
                    </TreeGrid.RowExpansionTrigger>
                    <span className={styles.Label}>{item.label}</span>
                    {item.children ? null : (
                      <TreeGrid.CellButton
                        aria-label={`Remove ${item.label}`}
                        className={styles.RemoveButton}
                        onClick={() =>
                          actionsRef.current?.applyTransaction((transaction) =>
                            transaction.remove(item.id),
                          )
                        }
                      >
                        <RemoveIcon />
                      </TreeGrid.CellButton>
                    )}
                  </TreeGrid.Cell>
                </TreeGrid.Row>
              )}
            </TreeGrid.Table>
            <TreeGrid.Status className={styles.VisuallyHidden} />
            {/* @highlight-start */}
            <TreeGrid.Empty className={styles.Empty}>No files found.</TreeGrid.Empty>
            {/* @highlight-end */}
          </div>
        </TreeGrid.Root>
      </TreeGrid.FilterProvider>
    </div>
  );
}

function describeItem(item: TreeGrid.DefaultItem, match: boolean) {
  const descriptions = match ? ['Match'] : [];
  if (!item.children) {
    descriptions.push('Press Tab to reach the remove button');
  }
  return descriptions.length > 0 ? descriptions.join('. ') : undefined;
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

function ClearIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" {...props}>
      <path d="m3.5 3.5 9 9m0-9-9 9" />
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
