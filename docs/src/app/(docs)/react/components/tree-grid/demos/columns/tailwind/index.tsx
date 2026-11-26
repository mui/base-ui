'use client';
import * as React from 'react';
import { TreeGrid } from '@base-ui/react/tree-grid';

interface File extends TreeGrid.DefaultItem {
  size: string;
  modified: string;
  children?: File[];
}

const items: File[] = [
  {
    id: 'src',
    label: 'src',
    size: '17 KB',
    modified: 'Mar 5',
    children: [
      {
        id: 'components',
        label: 'components',
        size: '16 KB',
        modified: 'Mar 5',
        children: [
          { id: 'button', label: 'Button.tsx', size: '4 KB', modified: 'Mar 3' },
          { id: 'dialog', label: 'Dialog.tsx', size: '12 KB', modified: 'Mar 5' },
        ],
      },
      { id: 'index', label: 'index.ts', size: '1 KB', modified: 'Feb 27' },
    ],
  },
  { id: 'package', label: 'package.json', size: '2 KB', modified: 'Mar 1' },
  { id: 'readme', label: 'README.md', size: '6 KB', modified: 'Feb 20' },
];

const COLUMNS_CLASS = 'grid grid-cols-[minmax(0,1fr)_4.5rem_4.5rem_2rem]';

const ROW_CLASS =
  `${COLUMNS_CLASS} items-center px-2 py-1 select-none outline-none ` +
  '[--leaf-offset:0rem] not-data-expandable:[--leaf-offset:1.75rem] ' +
  'hover:bg-neutral-100 data-selected:bg-neutral-200 focus-visible:outline-2 ' +
  'focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:hover:bg-neutral-800 ' +
  'dark:data-selected:bg-neutral-700 dark:focus-visible:outline-white ' +
  'border-s-2 border-transparent data-selected:border-neutral-950 dark:data-selected:border-white ' +
  'forced-colors:border-[color:Canvas] forced-colors:data-selected:border-[color:Highlight]';

const FOCUS_CLASS =
  'outline-none focus-visible:outline-2 focus-visible:outline-neutral-950 ' +
  'dark:focus-visible:outline-white';

const NAME_CELL_CLASS =
  `${FOCUS_CLASS} ms-[calc(1.5rem*(var(--tree-item-level)-1))] flex min-w-0 items-center ` +
  'gap-2 ps-[var(--leaf-offset)]';

const CELL_CLASS = `${FOCUS_CLASS} text-end tabular-nums text-neutral-600 dark:text-neutral-300`;

const HEADER_CELL_CLASS = 'not-first:text-end';

const REMOVE_BUTTON_CLASS =
  'relative after:absolute after:-inset-0.5 inline-flex size-5 items-center justify-center ' +
  'border-0 bg-transparent p-0 text-neutral-500 hover:text-neutral-950 focus-visible:outline-2 ' +
  'focus-visible:outline-neutral-950 dark:text-neutral-400 dark:hover:text-white ' +
  'dark:focus-visible:outline-white [&_svg]:size-3.5';

const TRIGGER_CLASS =
  'relative after:absolute after:-inset-0.5 inline-flex size-5 shrink-0 items-center ' +
  'justify-center border-0 bg-transparent p-0 text-neutral-500 dark:text-neutral-400 ' +
  'data-expanded:[&_svg]:rotate-90 [&_svg]:size-3';

export default function ExampleTreeGridColumns() {
  const actionsRef = React.useRef<TreeGrid.Root.Actions<File>>(null);

  return (
    <TreeGrid.Root
      defaultItems={items}
      defaultExpandedItems={['src', 'components']}
      actionsRef={actionsRef}
    >
      <TreeGrid.Table
        aria-label="Files"
        aria-description="Press Tab to reach the remove buttons"
        className="box-border w-96 max-w-full border border-neutral-200 bg-white p-1 text-sm/[1.5] text-neutral-950 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
      >
        <TreeGrid.HeaderRow
          className={`${COLUMNS_CLASS} border-b border-neutral-200 px-2 py-1 text-xs font-medium text-neutral-500 dark:border-neutral-700 dark:text-neutral-400`}
        >
          <TreeGrid.HeaderCell className={HEADER_CELL_CLASS}>Name</TreeGrid.HeaderCell>
          <TreeGrid.HeaderCell className={HEADER_CELL_CLASS}>Size</TreeGrid.HeaderCell>
          <TreeGrid.HeaderCell className={HEADER_CELL_CLASS}>Modified</TreeGrid.HeaderCell>
          <TreeGrid.HeaderCell className={HEADER_CELL_CLASS}>
            <span className="sr-only">Actions</span>
          </TreeGrid.HeaderCell>
        </TreeGrid.HeaderRow>
        <TreeGrid.Collection>
          {(file: File) => (
            <TreeGrid.Row itemId={file.id} className={ROW_CLASS}>
              <TreeGrid.Cell className={NAME_CELL_CLASS}>
                <TreeGrid.RowExpansionTrigger className={TRIGGER_CLASS}>
                  <ChevronIcon />
                </TreeGrid.RowExpansionTrigger>
                <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                  {file.label}
                </span>
              </TreeGrid.Cell>
              <TreeGrid.Cell className={CELL_CLASS}>{file.size}</TreeGrid.Cell>
              <TreeGrid.Cell className={CELL_CLASS}>{file.modified}</TreeGrid.Cell>
              <TreeGrid.Cell className="flex justify-end">
                <TreeGrid.CellButton
                  aria-label={`Remove ${file.label}`}
                  className={REMOVE_BUTTON_CLASS}
                  onClick={() =>
                    actionsRef.current?.applyTransaction((transaction) =>
                      transaction.remove(file.id),
                    )
                  }
                >
                  <RemoveIcon />
                </TreeGrid.CellButton>
              </TreeGrid.Cell>
            </TreeGrid.Row>
          )}
        </TreeGrid.Collection>
      </TreeGrid.Table>
    </TreeGrid.Root>
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
