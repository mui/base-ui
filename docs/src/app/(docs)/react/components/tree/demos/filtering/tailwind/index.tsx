'use client';
import * as React from 'react';
import { Tree } from '@base-ui/react/tree';

const items: Tree.DefaultItem[] = [
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
const ITEM_CLASS =
  'flex items-center gap-1 px-2 py-1 text-sm/[1.5] text-neutral-950 select-none dark:text-white ' +
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

const HIERARCHY_CLASS =
  'ms-[calc(1.5rem*(var(--tree-item-level)-1))] flex min-w-0 flex-1 items-center gap-1 ' +
  'ps-[var(--leaf-offset)]';

const MODE_SELECT_CLASS =
  'box-border w-full min-w-0 border border-neutral-950 bg-white px-3 py-2 text-sm/[normal] text-neutral-950 ' +
  'focus:outline-2 focus:-outline-offset-1 focus:outline-neutral-950 ' +
  'dark:border-white dark:bg-neutral-950 dark:text-white dark:focus:outline-white';

const INPUT_CONTAINER_CLASS =
  'flex items-center border-b border-neutral-200 focus-within:border-neutral-950 focus-within:ring-1 focus-within:ring-neutral-950 focus-within:ring-inset ' +
  'dark:border-neutral-700 dark:focus-within:border-white dark:focus-within:ring-white';

const INPUT_CLASS =
  'min-h-8 w-0 flex-1 border-0 bg-transparent px-2.5 text-sm leading-none text-inherit outline-0 ' +
  'placeholder:text-neutral-500 dark:placeholder:text-neutral-400';

export default function ExampleTreeFiltering() {
  const [mode, setMode] = React.useState<Tree.FilterMode>('hide-non-matches');

  return (
    <div className="flex w-80 max-w-full flex-col gap-3">
      <label className="flex flex-col gap-1 text-[0.8125rem]/[1.5] text-neutral-500 dark:text-neutral-400">
        Show
        <select
          className={MODE_SELECT_CLASS}
          value={mode}
          onChange={(event) => setMode(event.target.value as Tree.FilterMode)}
        >
          <option value="hide-non-matches">Only matching branches</option>
          <option value="collapse-non-matches">All branches, unrelated collapsed</option>
          <option value="expand-matches">Entire tree</option>
        </select>
      </label>
      {/* @focus-start */}
      {/* @highlight-start */}
      <Tree.FilterProvider defaultValue="invoice" mode={mode}>
        {/* @highlight-end */}
        <Tree.Root items={items}>
          <div className="border border-neutral-200 bg-white text-neutral-950 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white">
            <div className={INPUT_CONTAINER_CLASS}>
              {/* @highlight-start */}
              <Tree.Input
                className={INPUT_CLASS}
                aria-label="Filter files"
                placeholder="e.g. invoice"
              />
              <Tree.Clear className="flex size-8 items-center justify-center border-0 bg-transparent p-0 text-inherit outline-0 [&_svg]:size-4">
                <ClearIcon />
              </Tree.Clear>
              {/* @highlight-end */}
              {/* @focus-end */}
            </div>
            <Tree.List aria-label="File system" className="box-border w-full p-1">
              {(item: Tree.DefaultItem) => (
                <Tree.Item itemId={item.id} className={ITEM_CLASS}>
                  <Tree.ItemContent className={HIERARCHY_CLASS}>
                    <Tree.ItemExpansionTrigger className={TRIGGER_CLASS}>
                      <ChevronIcon />
                    </Tree.ItemExpansionTrigger>
                    <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                      {item.label}
                    </span>
                  </Tree.ItemContent>
                </Tree.Item>
              )}
            </Tree.List>
            {/* The live region stays mounted, so it only takes space while it shows the message. */}
            <Tree.Status className="sr-only" />
            {/* @highlight-start */}
            <Tree.Empty className="text-sm/[1.5] text-neutral-500 not-empty:p-3 dark:text-neutral-400">
              No files found.
            </Tree.Empty>
            {/* @highlight-end */}
          </div>
        </Tree.Root>
      </Tree.FilterProvider>
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

function ClearIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" {...props}>
      <path d="m3.5 3.5 9 9m0-9-9 9" />
    </svg>
  );
}
