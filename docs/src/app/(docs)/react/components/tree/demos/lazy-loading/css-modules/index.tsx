'use client';
import * as React from 'react';
import { Tree } from '@base-ui/react/tree';
import type { TreeItemModel } from '@base-ui/react/tree';
import styles from './index.module.css';

// Simulated server data
const SERVER_DATA: Record<string, TreeItemModel[]> = {
  documents: [
    { id: 'resume', label: 'Resume.pdf' },
    { id: 'cover-letter', label: 'Cover Letter.docx' },
    { id: 'invoices', label: 'Invoices', childrenCount: 2 },
  ],
  invoices: [
    { id: 'invoice-q1', label: 'Invoice_Q1.pdf' },
    { id: 'invoice-q2', label: 'Invoice_Q2.pdf' },
  ],
  photos: [
    { id: 'sunset', label: 'Sunset.jpg' },
    { id: 'mountains', label: 'Mountains.png' },
    { id: 'family-dinner', label: 'Family Dinner.jpg' },
  ],
  music: [
    { id: 'blue-in-green', label: 'Blue in Green.mp3' },
    { id: 'moonlight-sonata', label: 'Moonlight Sonata.flac' },
  ],
};

const INITIAL_ITEMS: TreeItemModel[] = [
  { id: 'documents', label: 'Documents', childrenCount: 3 },
  { id: 'photos', label: 'Photos', childrenCount: 3 },
  { id: 'music', label: 'Music', childrenCount: 2 },
  { id: 'notes', label: 'Notes.txt' },
];

function fetchChildren(parentId: string | undefined): Promise<TreeItemModel[]> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const children = parentId ? SERVER_DATA[parentId] : undefined;
      if (children) {
        resolve(children);
      } else {
        reject(new Error('Failed to load'));
      }
    }, 1000);
  });
}

function getChildrenCount(item: TreeItemModel) {
  return item.childrenCount ?? 0;
}

export default function ExampleTreeLazyLoading() {
  const lazyLoading = Tree.useLazyLoading({ fetchChildren, getChildrenCount });

  return (
    <Tree.Root items={INITIAL_ITEMS} lazyLoading={lazyLoading} className={styles.Tree}>
      {(_item) => (
        <Tree.Item className={styles.Item}>
          <Tree.ItemExpansionTrigger className={styles.ExpansionTrigger}>
            <ChevronIcon />
          </Tree.ItemExpansionTrigger>
          <Tree.ItemLoadingIndicator>
            <SpinnerIcon />
          </Tree.ItemLoadingIndicator>
          <Tree.ItemGroupIndicator className={styles.Icon}>
            <FolderIcon />
          </Tree.ItemGroupIndicator>
          <Tree.ItemLabel className={styles.Label} />
        </Tree.Item>
      )}
    </Tree.Root>
  );
}

function SpinnerIcon() {
  return <span className={styles.Spinner} />;
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="currentColor">
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

function FolderIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor">
      <path
        d="M2 4.5C2 3.67 2.67 3 3.5 3H6.38a1 1 0 01.7.29l1.13 1.13a1 1 0 00.7.29H12.5c.83 0 1.5.67 1.5 1.5V12c0 .83-.67 1.5-1.5 1.5h-9A1.5 1.5 0 012 12V4.5z"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
