'use client';
import * as React from 'react';
import { TreeGrid } from '@base-ui/react/tree-grid';
import styles from '../../_index.module.css';

const items: TreeGrid.DefaultItem[] = [
  {
    id: 'website',
    label: 'Website redesign',
    children: [
      { id: 'wireframes', label: 'Wireframes' },
      { id: 'homepage-copy', label: 'Homepage copy' },
    ],
  },
  {
    id: 'mobile-app',
    label: 'Mobile app',
    children: [{ id: 'login-screen', label: 'Login screen' }],
  },
];

export default function ExampleTreeGridOptInSelection() {
  const actionsRef = React.useRef<TreeGrid.Root.Actions>(null);

  return (
    <div className={styles.Field}>
      {/* @focus-start */}
      <TreeGrid.Root
        defaultItems={items}
        defaultExpandedItems={['website', 'mobile-app']}
        actionsRef={actionsRef}
        // @highlight-start
        multiple="opt-in"
        defaultSelectedItems={['wireframes']}
        // @highlight-end
      >
        <TreeGrid.Label className={styles.Label}>Projects</TreeGrid.Label>
        <TreeGrid.Table className={styles.Table}>
          {(task: TreeGrid.DefaultItem) => (
            <TreeGrid.Row
              itemId={task.id}
              className={styles.Row}
              aria-description={task.children ? undefined : 'Press Tab to reach the remove button'}
            >
              <TreeGrid.Cell className={styles.Cell}>
                <TreeGrid.RowExpansionTrigger className={styles.ExpansionTrigger}>
                  <ChevronIcon />
                </TreeGrid.RowExpansionTrigger>
                <span className={styles.RowLabel}>{task.label}</span>
                {task.children ? null : (
                  <TreeGrid.CellButton
                    aria-label={`Remove ${task.label}`}
                    className={styles.RemoveButton}
                    onClick={() =>
                      actionsRef.current?.applyTransaction((transaction) =>
                        transaction.remove(task.id),
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
      </TreeGrid.Root>
      {/* @focus-end */}
    </div>
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
