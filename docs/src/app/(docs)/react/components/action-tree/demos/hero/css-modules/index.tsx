'use client';
import * as React from 'react';
import { ActionTree } from '@base-ui/react/action-tree';
import { Switch } from '@base-ui/react/switch';
import styles from './index.module.css';

interface Task extends ActionTree.DefaultItem {
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
const SWITCH_CONTROL_KEYS: ActionTree.ItemControl.Keys = {
  horizontal: 'tree',
  vertical: 'tree',
  homeEnd: 'tree',
  escape: 'tree',
};

export default function ExampleActionTreeHero() {
  const actionsRef = React.useRef<ActionTree.Root.Actions<Task>>(null);

  return (
    // @focus-start
    <ActionTree.Root
      defaultItems={items}
      defaultExpandedItems={['website', 'mobile-app']}
      actionsRef={actionsRef}
    >
      <ActionTree.List aria-label="Projects" className={styles.Tree}>
        {(task: Task) => (
          <ActionTree.Item
            itemId={task.id}
            className={styles.Item}
            aria-description={task.children ? undefined : 'Press Tab to reach the task controls'}
          >
            <ActionTree.ItemContent className={styles.ItemContent}>
              <ActionTree.ItemExpansionTrigger className={styles.ExpansionTrigger}>
                <ChevronIcon />
              </ActionTree.ItemExpansionTrigger>
              {task.children ? (
                <span className={styles.Label}>{task.label}</span>
              ) : (
                <React.Fragment>
                  <ActionTree.ItemLink
                    href="#"
                    onClick={(event) => event.preventDefault()}
                    className={styles.Link}
                  >
                    {task.label}
                  </ActionTree.ItemLink>
                  <ActionTree.ItemInput
                    defaultValue={task.estimate}
                    aria-label={`Estimate for ${task.label}, in hours`}
                    className={styles.Input}
                  />
                  <ActionTree.ItemControl
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
                  </ActionTree.ItemControl>
                  <ActionTree.ItemButton
                    aria-label={`Remove ${task.label}`}
                    className={styles.RemoveButton}
                    onClick={() =>
                      actionsRef.current?.applyTransaction((transaction) =>
                        transaction.remove(task.id),
                      )
                    }
                  >
                    <RemoveIcon />
                  </ActionTree.ItemButton>
                </React.Fragment>
              )}
            </ActionTree.ItemContent>
          </ActionTree.Item>
        )}
      </ActionTree.List>
    </ActionTree.Root>
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
