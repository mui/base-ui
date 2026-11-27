'use client';
import * as React from 'react';
import { TreeGrid } from '@base-ui/react/tree-grid';

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

const ROW_CLASS =
  'flex items-center gap-2 px-2 py-1 select-none text-sm/[1.5] text-neutral-950 ' +
  '[--leaf-offset:0rem] not-data-expandable:[--leaf-offset:1.75rem] ' +
  'hover:bg-neutral-100 ' +
  'data-selected:bg-neutral-200 focus-visible:outline-2 focus-visible:-outline-offset-1 ' +
  'focus-visible:outline-neutral-950 dark:text-white dark:hover:bg-neutral-800 ' +
  'dark:data-selected:bg-neutral-700 dark:focus-visible:outline-white ' +
  'border-s-2 border-transparent data-selected:border-neutral-950 dark:data-selected:border-white ' +
  'forced-colors:border-[color:Canvas] forced-colors:data-selected:border-[color:Highlight]';

const CELL_CLASS =
  'ms-[calc(1.5rem*(var(--tree-item-level)-1))] flex min-w-0 flex-1 items-center gap-2 ' +
  'ps-[var(--leaf-offset)]';

const ICON_BUTTON_CLASS =
  'relative after:absolute after:-inset-0.5 ' +
  'inline-flex size-5 shrink-0 items-center justify-center border-0 bg-transparent p-0 ' +
  'text-neutral-500 hover:text-neutral-950 focus-visible:outline-2 ' +
  'focus-visible:outline-neutral-950 dark:text-neutral-400 dark:hover:text-white ' +
  'dark:focus-visible:outline-white';

export default function ExampleTreeGridMultipleSelection() {
  const actionsRef = React.useRef<TreeGrid.Root.Actions>(null);

  return (
    <div className="flex flex-col items-start gap-1">
      {/* @focus-start */}
      <TreeGrid.Root
        defaultItems={items}
        defaultExpandedItems={['website', 'mobile-app']}
        actionsRef={actionsRef}
        // @highlight-start
        multiple
        defaultSelectedItems={['wireframes', 'login-screen']}
        // @highlight-end
      >
        <TreeGrid.Label className="cursor-default text-sm font-bold text-neutral-950 dark:text-white">
          Projects
        </TreeGrid.Label>
        <TreeGrid.Table className="box-border w-96 max-w-full border border-neutral-200 bg-white p-1 text-neutral-950 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white">
          {(task: TreeGrid.DefaultItem) => (
            <TreeGrid.Row
              itemId={task.id}
              className={ROW_CLASS}
              aria-description={task.children ? undefined : 'Press Tab to reach the remove button'}
            >
              <TreeGrid.Cell className={CELL_CLASS}>
                <TreeGrid.RowExpansionTrigger
                  className={`${ICON_BUTTON_CLASS} data-expanded:[&_svg]:rotate-90 [&_svg]:size-3`}
                >
                  <ChevronIcon />
                </TreeGrid.RowExpansionTrigger>
                <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {task.label}
                </span>
                {task.children ? null : (
                  <TreeGrid.CellButton
                    aria-label={`Remove ${task.label}`}
                    className={`${ICON_BUTTON_CLASS} [&_svg]:size-3.5`}
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
