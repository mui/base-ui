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

// `group` so the two icons below can react to the indicator's checked state.
const INDICATOR_CLASS =
  'group box-content inline-flex size-4 shrink-0 items-center justify-center border border-neutral-950 bg-white text-white ' +
  'data-checked:bg-neutral-950 data-indeterminate:bg-neutral-950 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 ' +
  'dark:border-white dark:bg-neutral-950 dark:text-neutral-950 dark:data-checked:bg-white dark:data-indeterminate:bg-white dark:focus-visible:outline-white';

// Native checkbox restyled to match the base-ui Checkbox: ink-bordered square,
// ink fill with a background-colored tick when checked, sharp corners.
const NATIVE_CHECKBOX_CLASS =
  'm-0 inline-grid size-4 shrink-0 appearance-none place-content-center border border-neutral-950 bg-white ' +
  'before:-mt-0.5 before:h-2 before:w-1 before:rotate-45 before:border-solid before:border-white before:opacity-0 before:content-[""] ' +
  'before:[border-width:0_0.125rem_0.125rem_0] ' +
  'checked:bg-neutral-950 checked:before:opacity-100 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 ' +
  'dark:border-white dark:bg-neutral-950 dark:before:border-neutral-950 dark:checked:bg-white dark:focus-visible:outline-white';

export default function ExampleTreeSelectionPropagation() {
  const [propagateParents, setPropagateParents] = React.useState(true);
  const [propagateDescendants, setPropagateDescendants] = React.useState(true);

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="mx-0.5 box-content flex gap-4 border border-neutral-200 px-4 py-3 text-sm/[1.5] text-neutral-950 dark:border-neutral-700 dark:text-white">
        <legend className="px-1 font-semibold">Selection propagation</legend>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            className={NATIVE_CHECKBOX_CLASS}
            checked={propagateParents}
            onChange={(event) => setPropagateParents(event.target.checked)}
          />
          parents
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            className={NATIVE_CHECKBOX_CLASS}
            checked={propagateDescendants}
            onChange={(event) => setPropagateDescendants(event.target.checked)}
          />
          descendants
        </label>
      </fieldset>
      <Tree.Root
        items={items}
        defaultExpandedItems={['documents']}
        selectionMode="multiple"
        // @highlight-start @focus @padding 2
        checkboxSelectionPropagation={{
          parents: propagateParents,
          descendants: propagateDescendants,
        }}
        // @highlight-end
      >
        <Tree.List
          aria-label="File system"
          className="box-content w-56 border border-neutral-200 bg-white p-1 text-neutral-950 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
        >
          {(item: Tree.DefaultItem) => (
            <Tree.Item itemId={item.id} className={ITEM_CLASS}>
              <Tree.ItemContent className="flex min-w-0 w-full [align-items:inherit] [gap:inherit]">
                <Tree.ItemCheckbox className={INDICATOR_CLASS}>
                  <Tree.ItemCheckboxIndicator keepMounted>
                    <CheckIcon className="hidden size-3 group-data-checked:block" />
                    <MinusIcon className="hidden size-3 group-data-indeterminate:block" />
                  </Tree.ItemCheckboxIndicator>
                </Tree.ItemCheckbox>
                <div className={HIERARCHY_CLASS}>
                  <Tree.ItemExpansionTrigger className={TRIGGER_CLASS}>
                    <ChevronIcon />
                  </Tree.ItemExpansionTrigger>
                  <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                    {item.label}
                  </span>
                </div>
              </Tree.ItemContent>
            </Tree.Item>
          )}
        </Tree.List>
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

function MinusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 12 12" fill="currentColor" {...props}>
      <path d="M2.5 6a.5.5 0 01.5-.5h6a.5.5 0 010 1H3a.5.5 0 01-.5-.5z" />
    </svg>
  );
}
