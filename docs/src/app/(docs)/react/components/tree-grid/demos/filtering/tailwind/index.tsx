'use client';
import * as React from 'react';
import { TreeGrid } from '@base-ui/react/tree-grid';

const items: TreeGrid.DefaultItem[] = [
  {
    id: 'documents',
    label: 'Documents',
    children: [
      { id: 'resume', label: 'Resume.pdf' },
      { id: 'cover-letter', label: 'Cover Letter.docx' },
      {
        id: 'invoices',
        label: 'Invoices',
        children: [
          { id: 'invoice-q1', label: 'Invoice_Q1.pdf' },
          { id: 'invoice-q2', label: 'Invoice_Q2.pdf' },
        ],
      },
    ],
  },
  {
    id: 'photos',
    label: 'Photos',
    children: [
      { id: 'sunset', label: 'Sunset.jpg' },
      { id: 'mountains', label: 'Mountains.png' },
      { id: 'family-dinner', label: 'Family Dinner.jpg' },
    ],
  },
  {
    id: 'music',
    label: 'Music',
    children: [
      { id: 'blue-in-green', label: 'Blue in Green.mp3' },
      { id: 'moonlight-sonata', label: 'Moonlight Sonata.flac' },
    ],
  },
  { id: 'notes', label: 'Notes.txt' },
];

// A leaf has no expansion trigger, so it takes the trigger's width to line up
// with its expandable siblings.
const ROW_CLASS =
  'flex items-center gap-1 py-1 pe-2 text-sm/[1.5] text-neutral-950 select-none dark:text-white ' +
  'ps-[calc(0.5rem+1.5rem*(var(--tree-item-level)-1)+var(--leaf-offset))] ' +
  '[--leaf-offset:0rem] not-data-expandable:[--leaf-offset:1.5rem] ' +
  'hover:bg-neutral-100 dark:hover:bg-neutral-800 ' +
  'data-selected:bg-neutral-200 dark:data-selected:bg-neutral-700 ' +
  'border-s-2 border-transparent data-selected:border-neutral-950 dark:data-selected:border-white ' +
  'forced-colors:border-[color:Canvas] forced-colors:data-selected:border-[color:Highlight] ' +
  'data-filter-match:font-semibold ' +
  'data-disabled:cursor-default data-disabled:opacity-50 ' +
  'focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white';

const TRIGGER_CLASS =
  'relative after:absolute after:-inset-0.5 ' +
  'inline-flex size-5 shrink-0 items-center justify-center border-none bg-transparent p-0 text-neutral-500 ' +
  'hover:bg-neutral-200 hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-white ' +
  '[&_svg]:size-3 [&_svg]:transition-transform [&_svg]:duration-150 [&_svg]:ease-[ease] data-expanded:[&_svg]:rotate-90';

const REMOVE_BUTTON_CLASS =
  'relative after:absolute after:-inset-0.5 ' +
  'inline-flex size-5 shrink-0 items-center justify-center border-0 bg-transparent p-0 ' +
  'text-neutral-500 hover:text-neutral-950 focus-visible:outline-2 ' +
  'focus-visible:outline-neutral-950 dark:text-neutral-400 dark:hover:text-white ' +
  'dark:focus-visible:outline-white [&_svg]:size-3.5';

const INPUT_CONTAINER_CLASS =
  'flex items-center border-b border-neutral-200 focus-within:border-neutral-950 focus-within:ring-1 focus-within:ring-neutral-950 focus-within:ring-inset ' +
  'dark:border-neutral-700 dark:focus-within:border-white dark:focus-within:ring-white ' +
  // Forced colors drop the ring.
  'forced-colors:focus-within:outline-2 forced-colors:focus-within:-outline-offset-2 ' +
  'forced-colors:focus-within:outline-[color:Highlight]';

const INPUT_CLASS =
  'min-h-8 w-0 flex-1 border-0 bg-transparent px-2.5 text-sm leading-none text-inherit outline-0 ' +
  'placeholder:text-neutral-500 dark:placeholder:text-neutral-400';

export default function ExampleTreeGridFiltering() {
  const inputId = React.useId();
  const actionsRef = React.useRef<TreeGrid.Root.Actions>(null);

  return (
    <div className="flex w-80 max-w-full flex-col gap-3">
      {/* @focus-start */}
      {/* @highlight-start */}
      <TreeGrid.FilterProvider defaultValue="invoice">
        {/* @highlight-end */}
        <TreeGrid.Root defaultItems={items} actionsRef={actionsRef}>
          <div className="flex flex-col gap-1">
            <label
              htmlFor={inputId}
              className="text-[0.8125rem]/[1.5] text-neutral-500 dark:text-neutral-400"
            >
              Filter files
            </label>
            <div className="border border-neutral-200 bg-white text-neutral-950 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white">
              <div className={INPUT_CONTAINER_CLASS}>
                {/* @highlight-start */}
                <TreeGrid.Input id={inputId} className={INPUT_CLASS} placeholder="e.g. invoice" />
                <TreeGrid.Clear className="flex size-8 items-center justify-center border-0 bg-transparent p-0 text-inherit outline-0 [&_svg]:size-4">
                  <ClearIcon />
                </TreeGrid.Clear>
                {/* @highlight-end */}
                {/* @focus-end */}
              </div>
              <TreeGrid.Table aria-label="File system" className="box-border w-full p-1">
                {(item: TreeGrid.DefaultItem) => (
                  <TreeGrid.Row
                    itemId={item.id}
                    className={ROW_CLASS}
                    // Screen readers don't announce `data-filter-match`, so describe matches.
                    render={(props, state) => (
                      <div {...props} aria-description={describeItem(item, state.filterMatch)} />
                    )}
                  >
                    <TreeGrid.Cell className="flex min-w-0 flex-1 items-[inherit] gap-[inherit]">
                      <TreeGrid.RowExpansionTrigger className={TRIGGER_CLASS}>
                        <ChevronIcon />
                      </TreeGrid.RowExpansionTrigger>
                      <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                        {item.label}
                      </span>
                      {item.children ? null : (
                        <TreeGrid.CellButton
                          aria-label={`Remove ${item.label}`}
                          className={REMOVE_BUTTON_CLASS}
                          onClick={() =>
                            actionsRef.current?.applyTransaction((transaction) =>
                              transaction.remove(item.id),
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
              {/* The live region stays mounted, so it only takes space while it shows the message. */}
              <TreeGrid.Status className="sr-only" />
              {/* @highlight-start */}
              <TreeGrid.Empty className="text-sm/[1.5] text-neutral-500 not-empty:p-3 dark:text-neutral-400">
                No files found.
              </TreeGrid.Empty>
              {/* @highlight-end */}
            </div>
          </div>
        </TreeGrid.Root>
      </TreeGrid.FilterProvider>
    </div>
  );
}

function describeItem(item: TreeGrid.DefaultItem, match: boolean) {
  const descriptions = match ? ['Match'] : [];
  if (!item.children) {
    descriptions.push('Press Tab to reach the remove button');
  }
  return descriptions.length > 0 ? descriptions.join('. ') : undefined;
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

function ClearIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" {...props}>
      <path d="m3.5 3.5 9 9m0-9-9 9" />
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
