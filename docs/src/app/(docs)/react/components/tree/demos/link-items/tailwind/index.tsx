'use client';
import * as React from 'react';
import { Tree } from '@base-ui/react/tree';

interface LinkItemModel {
  id: string;
  label: string;
  href?: string;
  children?: LinkItemModel[];
}

const items: LinkItemModel[] = [
  {
    id: 'overview',
    label: 'Overview',
    children: [
      {
        id: 'quick-start',
        label: 'Quick Start',
        href: 'https://base-ui.com/react/overview/quick-start',
      },
      {
        id: 'accessibility',
        label: 'Accessibility',
        href: 'https://base-ui.com/react/overview/accessibility',
      },
      { id: 'releases', label: 'Releases', href: 'https://base-ui.com/react/overview/releases' },
    ],
  },
  {
    id: 'handbook',
    label: 'Handbook',
    children: [
      { id: 'styling', label: 'Styling', href: 'https://base-ui.com/react/handbook/styling' },
      { id: 'animation', label: 'Animation', href: 'https://base-ui.com/react/handbook/animation' },
      {
        id: 'composition',
        label: 'Composition',
        href: 'https://base-ui.com/react/handbook/composition',
      },
    ],
  },
  { id: 'about', label: 'About', href: 'https://base-ui.com/react/overview/about' },
];

// A leaf has no expansion trigger, so it takes the trigger's width to line up
// with its expandable siblings.
const ROW_CLASS =
  'forced-colors:border-s-2 forced-colors:border-[color:Canvas] ' +
  'flex items-center gap-1 py-1 pr-2 text-sm/[1.5] text-neutral-950 no-underline select-none dark:text-white ' +
  'pl-[calc(0.5rem+1.5rem*(var(--tree-item-level)-1))] ' +
  'not-data-expandable:pl-[calc(0.5rem+1.5rem*(var(--tree-item-level)-1)+1.5rem)] ' +
  'hover:bg-neutral-100 dark:hover:bg-neutral-800 ' +
  'data-selected:bg-neutral-200 dark:data-selected:bg-neutral-700 ' +
  'data-disabled:cursor-default data-disabled:opacity-50 ' +
  'focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white';

const LINK_ITEM_CLASS =
  `${ROW_CLASS} data-active:bg-neutral-950 data-active:font-medium data-active:text-white ` +
  'dark:data-active:bg-white dark:data-active:text-neutral-950 ' +
  'forced-colors:data-active:border-[color:Highlight]';

const TRIGGER_CLASS =
  'relative after:absolute after:-inset-0.5 ' +
  'inline-flex size-5 shrink-0 items-center justify-center border-none bg-transparent p-0 text-neutral-500 ' +
  'hover:bg-neutral-200 hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-white ' +
  '[&_svg]:size-3 [&_svg]:transition-transform [&_svg]:duration-150 [&_svg]:ease-[ease] data-expanded:[&_svg]:rotate-90';

const LABEL_CLASS = 'min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap';

export default function ExampleTreeLinkItems() {
  return (
    <Tree.Root
      items={items}
      defaultExpandedItems={['overview']}
      // @highlight-start
      selectionMode="none"
      // @highlight-end
    >
      <Tree.List
        aria-label="Documentation"
        className="box-content w-56 border border-neutral-200 bg-white p-1 text-neutral-950 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
      >
        {(item: LinkItemModel) => {
          if (item.href) {
            return (
              <Link
                itemId={item.id}
                className={LINK_ITEM_CLASS}
                href={item.href}
                // @highlight-start
                active={item.id === 'quick-start'}
                // @highlight-end
              >
                <span className={LABEL_CLASS}>{item.label}</span>
              </Link>
            );
          }

          return (
            <Tree.Item itemId={item.id} className={ROW_CLASS}>
              <Tree.ItemContent className="flex w-full min-w-0 items-[inherit] gap-[inherit]">
                <Tree.ItemExpansionTrigger className={TRIGGER_CLASS}>
                  <ChevronIcon />
                </Tree.ItemExpansionTrigger>
                <span className={LABEL_CLASS}>{item.label}</span>
              </Tree.ItemContent>
            </Tree.Item>
          );
        }}
      </Tree.List>
    </Tree.Root>
  );
}

function Link({
  itemId,
  active,
  children,
  className,
  ...props
}: React.ComponentProps<'a'> & { itemId: Tree.ItemId; active?: boolean }) {
  return (
    // @focus-start @min 14
    <Tree.Item
      itemId={itemId}
      className={className}
      data-active={active ? '' : undefined}
      // @highlight-start
      aria-description="Press Tab to reach the link"
      // @highlight-end
    >
      <Tree.ItemContent className="flex w-full min-w-0 items-[inherit] gap-[inherit]">
        {/* @highlight-start */}
        <Tree.ItemLink
          {...props}
          className="min-w-0 flex-1 text-inherit no-underline"
          active={active}
        >
          {children}
        </Tree.ItemLink>
        {/* @highlight-end */}
        {/* @focus-end */}
      </Tree.ItemContent>
    </Tree.Item>
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
