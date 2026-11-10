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
    ],
  },
  {
    id: 'photos',
    label: 'Photos',
    children: [
      { id: 'sunset', label: 'Sunset.jpg' },
      { id: 'mountains', label: 'Mountains.png' },
    ],
  },
  { id: 'notes', label: 'Notes.txt' },
];

const ITEM_CLASS =
  'flex items-center gap-2 px-2 py-1 select-none text-sm/[1.5] text-neutral-950 ' +
  '[--leaf-offset:0rem] not-data-expandable:[--leaf-offset:3.25rem] ' +
  'hover:bg-neutral-100 ' +
  'data-selected:bg-neutral-200 focus-visible:outline-2 focus-visible:-outline-offset-1 ' +
  'focus-visible:outline-neutral-950 dark:text-white dark:hover:bg-neutral-800 ' +
  'dark:data-selected:bg-neutral-700 dark:focus-visible:outline-white ' +
  'border-s-2 border-transparent data-selected:border-neutral-950 dark:data-selected:border-white ' +
  'forced-colors:border-[color:Canvas] forced-colors:data-selected:border-[color:Highlight]';

const CONTROL_CLASS =
  'relative after:absolute after:-inset-0.5 ' +
  'inline-flex size-5 shrink-0 items-center justify-center border-0 bg-transparent p-0 ' +
  'text-neutral-500 focus-visible:outline-2 focus-visible:outline-neutral-950 ' +
  'dark:text-neutral-400 dark:focus-visible:outline-white [&_svg]:size-3';

const HIERARCHY_CLASS =
  'ms-[calc(1.5rem*(var(--tree-item-level)-1))] flex min-w-0 flex-1 items-center gap-2 ' +
  'ps-[var(--leaf-offset)]';

export default function ExampleTreeHero() {
  return (
    // @focus-start
    <Tree.Root items={items} defaultExpandedItems={['documents']}>
      <Tree.List
        aria-label="File system"
        className="box-content w-68 border border-neutral-200 bg-white p-1 text-neutral-950 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
      >
        {(item: Tree.DefaultItem) => (
          <Tree.Item itemId={item.id} className={ITEM_CLASS}>
            <Tree.ItemContent className={HIERARCHY_CLASS}>
              <Tree.ItemExpansionTrigger
                className={`${CONTROL_CLASS} data-expanded:[&_svg]:rotate-90`}
              >
                <ChevronIcon />
              </Tree.ItemExpansionTrigger>
              <Tree.ItemGroupIndicator className="inline-flex shrink-0 text-neutral-500 dark:text-neutral-400 [&_svg]:size-4">
                <FolderIcon />
              </Tree.ItemGroupIndicator>
              <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                {item.label}
              </span>
            </Tree.ItemContent>
          </Tree.Item>
        )}
      </Tree.List>
    </Tree.Root>
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

function FolderIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M1.5 4.5A1.5 1.5 0 0 1 3 3h3.4l1.8 1.7H13a1.5 1.5 0 0 1 1.5 1.5v5.3A1.5 1.5 0 0 1 13 13H3a1.5 1.5 0 0 1-1.5-1.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      />
    </svg>
  );
}
