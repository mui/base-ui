'use client';
import * as React from 'react';
import { Switch } from '@base-ui/react/switch';
import { Tree } from '@base-ui/react/tree';

interface Task extends Tree.DefaultItem {
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

// @highlight-start
// A switch only uses Space and Enter, so it leaves the other keys to the tree.
const SWITCH_CONTROL_KEYS: Tree.ItemControl.Keys = {
  horizontal: 'tree',
  vertical: 'tree',
  homeEnd: 'tree',
  escape: 'tree',
};
// @highlight-end

const ITEM_CLASS =
  'flex items-center gap-2 px-2 py-1 select-none text-sm/[1.5] text-neutral-950 ' +
  '[--leaf-offset:0rem] not-data-expandable:[--leaf-offset:1.75rem] ' +
  'hover:bg-neutral-100 ' +
  'data-selected:bg-neutral-200 focus-visible:outline-2 focus-visible:-outline-offset-1 ' +
  'focus-visible:outline-neutral-950 dark:text-white dark:hover:bg-neutral-800 ' +
  'dark:data-selected:bg-neutral-700 dark:focus-visible:outline-white ' +
  'border-s-2 border-transparent data-selected:border-neutral-950 dark:data-selected:border-white ' +
  'forced-colors:border-[color:Canvas] forced-colors:data-selected:border-[color:Highlight]';

const CONTENT_CLASS =
  'ms-[calc(1.5rem*(var(--tree-item-level)-1))] flex min-w-0 flex-1 items-center gap-2 ' +
  'ps-[var(--leaf-offset)]';

const ICON_BUTTON_CLASS =
  'inline-flex size-5 shrink-0 items-center justify-center border-0 bg-transparent p-0 ' +
  'text-neutral-500 hover:text-neutral-950 focus-visible:outline-2 ' +
  'focus-visible:outline-neutral-950 dark:text-neutral-400 dark:hover:text-white ' +
  'dark:focus-visible:outline-white';

const LINK_CLASS =
  'min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-inherit underline ' +
  'decoration-neutral-500 underline-offset-2 hover:decoration-current ' +
  'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-neutral-950 ' +
  'dark:decoration-neutral-400 dark:focus-visible:outline-white';

const INPUT_CLASS =
  'box-border h-6 w-10 shrink-0 rounded-none border border-neutral-950 bg-transparent px-1.5 ' +
  'text-end font-[inherit] text-sm text-neutral-950 focus:outline-2 focus:-outline-offset-1 ' +
  'focus:outline-neutral-950 dark:border-white dark:text-white dark:focus:outline-white';

const SWITCH_CLASS =
  'flex h-5 w-9 shrink-0 border border-neutral-950 bg-white p-0.5 transition-colors ' +
  'duration-150 ease-[ease] data-checked:bg-neutral-950 focus-visible:outline-2 ' +
  'focus-visible:outline-offset-2 focus-visible:outline-neutral-950 dark:border-white ' +
  'dark:bg-neutral-950 dark:data-checked:bg-white dark:focus-visible:outline-white';

const THUMB_CLASS =
  'size-3.5 bg-neutral-950 transition-[translate,background-color] duration-150 ease-[ease] ' +
  'data-checked:translate-x-4 data-checked:bg-white dark:bg-white dark:data-checked:bg-neutral-950';

export default function ExampleTreeItemControls() {
  const actionsRef = React.useRef<Tree.Root.Actions<Task>>(null);

  return (
    <Tree.Root
      defaultItems={items}
      defaultExpandedItems={['website', 'mobile-app']}
      actionsRef={actionsRef}
    >
      <Tree.List
        aria-label="Projects"
        className="box-border w-96 max-w-full border border-neutral-200 bg-white p-1 text-neutral-950 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
      >
        {(task: Task) => (
          <Tree.Item
            itemId={task.id}
            className={ITEM_CLASS}
            aria-description={task.children ? undefined : 'Press Tab to reach the task controls'}
          >
            <Tree.ItemContent className={CONTENT_CLASS}>
              <Tree.ItemExpansionTrigger
                className={`${ICON_BUTTON_CLASS} relative after:absolute after:-inset-0.5 data-expanded:[&_svg]:rotate-90 [&_svg]:size-3`}
              >
                <ChevronIcon />
              </Tree.ItemExpansionTrigger>
              {task.children ? (
                <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {task.label}
                </span>
              ) : (
                <React.Fragment>
                  {/* @highlight-start */}
                  <Tree.ItemLink
                    href="#"
                    onClick={(event) => event.preventDefault()}
                    className={LINK_CLASS}
                  >
                    {task.label}
                  </Tree.ItemLink>
                  <Tree.ItemInput
                    defaultValue={task.estimate}
                    aria-label={`Estimate for ${task.label}, in hours`}
                    className={INPUT_CLASS}
                  />
                  {/* @highlight-end */}
                  {/* @highlight-start @focus @padding 1 */}
                  <Tree.ItemControl
                    controlKeys={SWITCH_CONTROL_KEYS}
                    render={
                      <Switch.Root
                        defaultChecked={task.done}
                        aria-label={`Mark ${task.label} as done`}
                        className={SWITCH_CLASS}
                      />
                    }
                  >
                    <Switch.Thumb className={THUMB_CLASS} />
                  </Tree.ItemControl>
                  {/* @highlight-end */}
                  {/* @highlight-start */}
                  <Tree.ItemButton
                    aria-label={`Remove ${task.label}`}
                    className={`${ICON_BUTTON_CLASS} [&_svg]:size-3.5`}
                    onClick={() =>
                      actionsRef.current?.applyTransaction((transaction) =>
                        transaction.remove(task.id),
                      )
                    }
                  >
                    <RemoveIcon />
                  </Tree.ItemButton>
                  {/* @highlight-end */}
                </React.Fragment>
              )}
            </Tree.ItemContent>
          </Tree.Item>
        )}
      </Tree.List>
    </Tree.Root>
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
