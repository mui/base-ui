'use client';
import * as React from 'react';
import { ActionTree } from '@base-ui/react/action-tree';
import styles from './index.module.css';

const items: ActionTree.DefaultItem[] = [
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

export default function ExampleActionTreeFiltering() {
  const actionsRef = React.useRef<ActionTree.Root.Actions>(null);

  return (
    <div className={styles.Demo}>
      {/* @focus-start */}
      {/* @highlight-start */}
      <ActionTree.FilterProvider defaultValue="invoice">
        {/* @highlight-end */}
        <ActionTree.Root defaultItems={items} actionsRef={actionsRef}>
          <div className={styles.Panel}>
            <div className={styles.InputContainer}>
              {/* @highlight-start */}
              <ActionTree.Input
                className={styles.Input}
                aria-label="Filter files"
                placeholder="e.g. invoice"
              />
              <ActionTree.Clear className={styles.Clear}>
                <ClearIcon />
              </ActionTree.Clear>
              {/* @highlight-end */}
              {/* @focus-end */}
            </div>
            <ActionTree.List aria-label="File system" className={styles.Tree}>
              {(item: ActionTree.DefaultItem) => (
                <ActionTree.Item
                  itemId={item.id}
                  className={styles.Item}
                  // Screen readers don't announce `data-filter-match`, so describe matches.
                  render={(props, state) => (
                    <div {...props} aria-description={describeItem(item, state.filterMatch)} />
                  )}
                >
                  <ActionTree.ItemContent className={styles.ItemContent}>
                    <ActionTree.ItemExpansionTrigger className={styles.ExpansionTrigger}>
                      <ChevronIcon />
                    </ActionTree.ItemExpansionTrigger>
                    <span className={styles.Label}>{item.label}</span>
                    {item.children ? null : (
                      <ActionTree.ItemButton
                        aria-label={`Remove ${item.label}`}
                        className={styles.RemoveButton}
                        onClick={() =>
                          actionsRef.current?.applyTransaction((transaction) =>
                            transaction.remove(item.id),
                          )
                        }
                      >
                        <RemoveIcon />
                      </ActionTree.ItemButton>
                    )}
                  </ActionTree.ItemContent>
                </ActionTree.Item>
              )}
            </ActionTree.List>
            <ActionTree.Status className={styles.VisuallyHidden} />
            {/* @highlight-start */}
            <ActionTree.Empty className={styles.Empty}>No files found.</ActionTree.Empty>
            {/* @highlight-end */}
          </div>
        </ActionTree.Root>
      </ActionTree.FilterProvider>
    </div>
  );
}

function describeItem(item: ActionTree.DefaultItem, match: boolean) {
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
