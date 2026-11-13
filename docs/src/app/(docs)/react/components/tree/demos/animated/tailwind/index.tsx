'use client';
import * as React from 'react';
import { Tree } from '@base-ui/react/tree';

const items: Tree.DefaultItem[] = Array.from({ length: 3 }, (_, index) => ({
  id: `item-${index + 1}`,
  label: `Item ${index + 1}`,
  children: Array.from({ length: 3 }, (_, childIndex) => ({
    id: `item-${index + 1}-child-${childIndex + 1}`,
    label: `Item ${index + 1} / Child ${childIndex + 1}`,
  })),
}));

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
  '[&_svg]:size-3 [&_svg]:transition-transform [&_svg]:duration-150 [&_svg]:ease-[ease] motion-reduce:[&_svg]:transition-none data-expanded:[&_svg]:rotate-90';

const HIERARCHY_CLASS =
  'ms-[calc(1.5rem*(var(--tree-item-level)-1))] flex min-w-0 flex-1 items-center gap-1 ' +
  'ps-[var(--leaf-offset)]';

export default function ExampleTreeAnimated() {
  return (
    <Tree.Root items={items} defaultExpandedItems={['item-1']}>
      <Tree.List
        aria-label="File system"
        className="box-content w-56 overflow-auto border border-neutral-200 bg-white p-1 text-neutral-950 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
      >
        {/* @focus-start @min 13 */}
        {(item: Tree.DefaultItem) => (
          <React.Fragment>
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
            {/* The wrapper the tree inserts around a group while it expands or collapses. */}
            {/* @highlight-start */}
            <Tree.GroupTransition className="h-[var(--tree-group-transition-height)] transition-[height] duration-200 ease-[ease-out] motion-reduce:transition-none data-ending-style:h-0 data-starting-style:h-0" />
            {/* @highlight-end */}
          </React.Fragment>
          // @focus-end
        )}
      </Tree.List>
    </Tree.Root>
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
