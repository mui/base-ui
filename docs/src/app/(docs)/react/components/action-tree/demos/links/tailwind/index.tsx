'use client';
import * as React from 'react';
import { ActionTree } from '@base-ui/react/action-tree';

interface Page {
  id: string;
  label: string;
  href?: string;
  children?: Page[];
}

const items: Page[] = [
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
  'flex items-center gap-1 py-1 pr-2 text-sm/[1.5] text-neutral-950 select-none dark:text-white ' +
  'pl-[calc(0.5rem+1.5rem*(var(--tree-item-level)-1))] ' +
  'not-data-expandable:pl-[calc(0.5rem+1.5rem*(var(--tree-item-level)-1)+1.5rem)] ' +
  'hover:bg-neutral-100 dark:hover:bg-neutral-800 ' +
  'data-selected:bg-neutral-200 dark:data-selected:bg-neutral-700 ' +
  'data-disabled:cursor-default data-disabled:opacity-50 ' +
  'focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white';

const PAGE_ITEM_CLASS =
  `${ROW_CLASS} data-active:bg-neutral-950 data-active:font-medium data-active:text-white ` +
  'dark:data-active:bg-white dark:data-active:text-neutral-950 ' +
  'forced-colors:data-active:border-[color:Highlight] ' +
  // An inner ring that contrasts with the active background.
  'data-active:focus-visible:-outline-offset-4 data-active:focus-visible:outline-white ' +
  'dark:data-active:focus-visible:outline-neutral-950';

const TRIGGER_CLASS =
  'relative after:absolute after:-inset-0.5 ' +
  'inline-flex size-5 shrink-0 items-center justify-center border-none bg-transparent p-0 text-neutral-500 ' +
  'hover:bg-neutral-200 hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-white ' +
  '[&_svg]:size-3 [&_svg]:transition-transform [&_svg]:duration-150 [&_svg]:ease-[ease] data-expanded:[&_svg]:rotate-90';

const LINK_CLASS =
  'min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-inherit no-underline ' +
  'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-current';

const ICON_LINK_CLASS =
  'relative after:absolute after:-inset-0.5 ' +
  'inline-flex size-5 shrink-0 items-center justify-center text-inherit [&_svg]:size-3.5 ' +
  'focus-visible:outline-2 focus-visible:outline-current';

export default function ExampleActionTreeLinks() {
  return (
    <ActionTree.Root
      items={items}
      defaultExpandedItems={['overview']}
      // @highlight-start
      selectionMode="none"
      // @highlight-end
    >
      <ActionTree.List
        aria-label="Documentation"
        className="box-content w-56 border border-neutral-200 bg-white p-1 text-neutral-950 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
      >
        {(page: Page) => {
          if (page.href) {
            return (
              <PageItem
                page={page}
                href={page.href}
                // @highlight-start
                active={page.id === 'quick-start'}
                // @highlight-end
              />
            );
          }

          return (
            <ActionTree.Item itemId={page.id} className={ROW_CLASS}>
              <ActionTree.ItemContent className="flex w-full min-w-0 items-[inherit] gap-[inherit]">
                <ActionTree.ItemExpansionTrigger className={TRIGGER_CLASS}>
                  <ChevronIcon />
                </ActionTree.ItemExpansionTrigger>
                <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {page.label}
                </span>
              </ActionTree.ItemContent>
            </ActionTree.Item>
          );
        }}
      </ActionTree.List>
    </ActionTree.Root>
  );
}

function PageItem({ page, href, active }: { page: Page; href: string; active: boolean }) {
  return (
    // @focus-start
    <ActionTree.Item
      itemId={page.id}
      className={PAGE_ITEM_CLASS}
      data-active={active ? '' : undefined}
      // @highlight-start
      aria-description="Press Tab to reach the links"
      // @highlight-end
    >
      <ActionTree.ItemContent className="flex w-full min-w-0 items-[inherit] gap-[inherit]">
        {/* @highlight-start */}
        <ActionTree.ItemLink href={href} active={active} className={LINK_CLASS}>
          {page.label}
        </ActionTree.ItemLink>
        <ActionTree.ItemLink
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${page.label} in a new tab`}
          className={ICON_LINK_CLASS}
        >
          <ExternalLinkIcon />
        </ActionTree.ItemLink>
        {/* @highlight-end */}
      </ActionTree.ItemContent>
    </ActionTree.Item>
    // @focus-end
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

function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M9 2.5h4.5V7m0-4.5L7 9m-1-5.5H2.5v10h10V10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
