'use client';
import * as React from 'react';
import { Tree } from '@base-ui/react/tree';
import styles from './tree.module.css';

const items: Tree.DefaultItemModel[] = [
  {
    id: 'frontend',
    label: 'Frontend',
    children: [
      {
        id: 'react',
        label: 'React',
        children: [
          { id: 'hooks', label: 'Hooks' },
          { id: 'components', label: 'Components' },
          { id: 'context', label: 'Context API' },
        ],
      },
      {
        id: 'vue',
        label: 'Vue',
        children: [
          { id: 'composition', label: 'Composition API' },
          { id: 'directives', label: 'Directives' },
        ],
      },
      { id: 'svelte', label: 'Svelte' },
    ],
  },
  {
    id: 'backend',
    label: 'Backend',
    children: [
      { id: 'node', label: 'Node.js' },
      { id: 'python', label: 'Python' },
      { id: 'go', label: 'Go' },
    ],
  },
  {
    id: 'devops',
    label: 'DevOps',
    children: [
      { id: 'docker', label: 'Docker' },
      { id: 'k8s', label: 'Kubernetes' },
      { id: 'ci-cd', label: 'CI/CD' },
    ],
  },
];

export default function CheckboxSelectionTree() {
  return (
    <div className={styles.wrapper}>
      <div>
        <h3 className={styles.heading}>Checkbox selection</h3>
        <p className={styles.description}>
          Use checkboxes to select. Shift+click for range selection.
        </p>
      </div>
      <Tree.Root
        items={items}
        defaultExpandedItems={['frontend', 'react']}
        selectionMode="multiple"
        selectionPropagation={{
          parents: true,
          descendants: true,
        }}
        className={styles.tree}
      >
        {() => (
          <Tree.CheckboxItem className={styles.item}>
            <Tree.ItemExpansionTrigger className={styles.expansionTrigger}>
              <ChevronIcon />
            </Tree.ItemExpansionTrigger>
            <Tree.CheckboxItemIndicator className={styles.checkboxIndicator} keepMounted>
              <CheckIcon />
            </Tree.CheckboxItemIndicator>
            <Tree.ItemLabel className={styles.label} />
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
