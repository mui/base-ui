'use client';
import * as React from 'react';
import { Tree } from '@base-ui/react/tree';
import type { TreeItemModel } from '@base-ui/react/tree';
import styles from './tree.module.css';

const items: TreeItemModel[] = [
  {
    id: 'documents',
    label: 'Documents',
    children: [
      {
        id: 'resume',
        label: 'Resume.pdf',
      },
      {
        id: 'cover-letter',
        label: 'Cover Letter.docx',
      },
      {
        id: 'projects',
        label: 'Projects',
        children: [
          { id: 'project-a', label: 'Project A' },
          { id: 'project-b', label: 'Project B' },
          {
            id: 'project-c',
            label: 'Project C',
            children: [
              { id: 'src', label: 'src' },
              { id: 'readme', label: 'README.md' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'photos',
    label: 'Photos',
    children: [
      { id: 'vacation', label: 'Vacation' },
      { id: 'family', label: 'Family' },
    ],
  },
  {
    id: 'music',
    label: 'Music',
    children: [
      { id: 'rock', label: 'Rock' },
      { id: 'jazz', label: 'Jazz' },
      { id: 'classical', label: 'Classical' },
    ],
  },
  {
    id: 'notes',
    label: 'Notes.txt',
  },
];

export default function BasicTree() {
  return (
    <div className={styles.wrapper}>
      <div>
        <h3 className={styles.heading}>File explorer</h3>
        <p className={styles.description}>
          Click items or use the arrow to expand/collapse. Keyboard navigation supported.
        </p>
      </div>
      <Tree.Root
        items={items}
        defaultExpandedItems={['documents']}
        className={styles.tree}
      >
        {(item) => (
          <Tree.Item className={styles.item}>
            <Tree.ItemExpansionTrigger className={styles.expansionTrigger}>
              <ChevronIcon />
            </Tree.ItemExpansionTrigger>
            <Tree.ItemGroupIndicator className={styles.groupIndicator}>
              <FolderIcon />
            </Tree.ItemGroupIndicator>
            <Tree.ItemLabel className={styles.label} />
          </Tree.Item>
        )}
      </Tree.Root>
    </div>
  );
}

function ChevronIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 12 12" fill="currentColor" {...props}>
      <path d="M4.5 2L8.5 6L4.5 10" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FolderIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
      <path d="M1 3.5A1.5 1.5 0 012.5 2h3.879a1.5 1.5 0 011.06.44l1.122 1.12A1.5 1.5 0 009.62 4H13.5A1.5 1.5 0 0115 5.5v7a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 12.5v-9z" />
    </svg>
  );
}
