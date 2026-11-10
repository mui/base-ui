'use client';
import * as React from 'react';
import { Tree } from '@base-ui/react/tree';
import styles from './index.module.css';

const items: Tree.DefaultItem[] = Array.from({ length: 3 }, (_, index) => ({
  id: `item-${index + 1}`,
  label: `Item ${index + 1}`,
  children: Array.from({ length: 3 }, (_, childIndex) => ({
    id: `item-${index + 1}-child-${childIndex + 1}`,
    label: `Item ${index + 1} / Child ${childIndex + 1}`,
  })),
}));

export default function ExampleTreeAnimated() {
  return (
    <Tree.Root items={items} defaultExpandedItems={['item-1']}>
      <Tree.List aria-label="File system" className={styles.Tree}>
        {/* @focus-start */}
        {(item: Tree.DefaultItem) => (
          <React.Fragment>
            <Tree.Item itemId={item.id} className={styles.Item}>
              <Tree.ItemContent className={styles.ItemContent}>
                <Tree.ItemExpansionTrigger className={styles.ExpansionTrigger}>
                  <ChevronIcon />
                </Tree.ItemExpansionTrigger>
                <span className={styles.Label}>{item.label}</span>
              </Tree.ItemContent>
            </Tree.Item>
            {/* @highlight-start */}
            <Tree.GroupTransition className={styles.GroupTransition} />
            {/* @highlight-end */}
          </React.Fragment>
          // @focus-end
        )}
      </Tree.List>
    </Tree.Root>
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
