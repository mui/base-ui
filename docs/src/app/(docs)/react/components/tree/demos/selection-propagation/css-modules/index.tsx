'use client';
import * as React from 'react';
import { Tree } from '@base-ui/react/tree';
import type { TreeItemModel } from '@base-ui/react/tree';
import styles from './index.module.css';

const items: TreeItemModel[] = [
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

export default function ExampleTreeSelectionPropagation() {
  const [propagateParents, setPropagateParents] = React.useState(true);
  const [propagateDescendants, setPropagateDescendants] = React.useState(true);

  return (
    <div className={styles.Demo}>
      <fieldset className={styles.Controls}>
        <legend>Selection propagation</legend>
        <label className={styles.ControlLabel}>
          <input
            type="checkbox"
            checked={propagateParents}
            onChange={(event) => setPropagateParents(event.target.checked)}
          />
          parents
        </label>
        <label className={styles.ControlLabel}>
          <input
            type="checkbox"
            checked={propagateDescendants}
            onChange={(event) => setPropagateDescendants(event.target.checked)}
          />
          descendants
        </label>
      </fieldset>
      <Tree.Root
        items={items}
        defaultExpandedItems={['documents']}
        selectionMode="multiple"
        selectionPropagation={{
          parents: propagateParents,
          descendants: propagateDescendants,
        }}
        className={styles.Tree}
      >
        {() => (
          <Tree.CheckboxItem className={styles.Item}>
            <Tree.ItemExpansionTrigger className={styles.ExpansionTrigger}>
              <ChevronIcon />
            </Tree.ItemExpansionTrigger>
            <Tree.CheckboxItemIndicator className={styles.CheckboxIndicator} keepMounted>
              <CheckIcon className={styles.CheckIcon} />
              <MinusIcon className={styles.MinusIcon} />
            </Tree.CheckboxItemIndicator>
            <Tree.ItemLabel className={styles.Label} />
          </Tree.CheckboxItem>
        )}
      </Tree.Root>
    </div>
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
