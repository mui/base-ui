'use client';
import * as React from 'react';
import { TreeGrid } from '@base-ui/react/tree-grid';
import { Switch } from '@base-ui/react/switch';
import styles from './index.module.css';

interface Task extends TreeGrid.DefaultItem {
  estimate?: string;
  done?: boolean;
  children?: Task[];
}

const items: Task[] = [
  {
    id: 'website',
    label: 'Website redesign',
    children: [
      { id: 'wireframes', label: 'Wireframes', estimate: '4', done: true },
      { id: 'homepage-copy', label: 'Homepage copy', estimate: '2' },
    ],
  },
  {
    id: 'mobile-app',
    label: 'Mobile app',
    children: [{ id: 'login-screen', label: 'Login screen', estimate: '6' }],
  },
];

// A switch only uses Space and Enter, so it leaves the other keys to the tree.
const SWITCH_CONTROL_KEYS: TreeGrid.CellControl.Keys = {
  horizontal: 'tree',
  vertical: 'tree',
  homeEnd: 'tree',
  escape: 'tree',
};

export default function ExampleTreeGridHero() {
  const actionsRef = React.useRef<TreeGrid.Root.Actions<Task>>(null);

  return (
    // @focus-start
    <TreeGrid.Root
      defaultItems={items}
      defaultExpandedItems={['website', 'mobile-app']}
      actionsRef={actionsRef}
    >
      <TreeGrid.Table aria-label="Projects" className={styles.Table}>
        {(task: Task) => (
          <TreeGrid.Row
            itemId={task.id}
            className={styles.Row}
            aria-description={task.children ? undefined : 'Press Tab to reach the task controls'}
          >
            <TreeGrid.Cell className={styles.Cell}>
              <TreeGrid.RowExpansionTrigger className={styles.ExpansionTrigger}>
                <ChevronIcon />
              </TreeGrid.RowExpansionTrigger>
              {task.children ? (
                <span className={styles.Label}>{task.label}</span>
              ) : (
                <React.Fragment>
                  <TreeGrid.CellLink
                    href="#"
                    onClick={(event) => event.preventDefault()}
                    className={styles.Link}
                  >
                    {task.label}
                  </TreeGrid.CellLink>
                  <span className={styles.Estimate}>
                    <TreeGrid.CellInput
                      defaultValue={task.estimate}
                      aria-label={`Estimate for ${task.label}, in hours`}
                      className={styles.Input}
                    />
                    <span aria-hidden="true">h</span>
                  </span>
                  <label className={styles.SwitchLabel}>
                    <TreeGrid.CellControl
                      controlKeys={SWITCH_CONTROL_KEYS}
                      render={
                        <Switch.Root
                          defaultChecked={task.done}
                          aria-label={`Mark ${task.label} as done`}
                          className={styles.Switch}
                        />
                      }
                    >
                      <Switch.Thumb className={styles.Thumb} />
                    </TreeGrid.CellControl>
                    Done
                  </label>
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
                </React.Fragment>
              )}
            </TreeGrid.Cell>
          </TreeGrid.Row>
        )}
      </TreeGrid.Table>
    </TreeGrid.Root>
    // @focus-end
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
