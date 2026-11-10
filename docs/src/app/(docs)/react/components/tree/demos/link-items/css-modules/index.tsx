'use client';
import * as React from 'react';
import { Tree } from '@base-ui/react/tree';
import styles from './index.module.css';

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

export default function ExampleTreeLinkItems() {
  return (
    <Tree.Root
      items={items}
      defaultExpandedItems={['overview']}
      // @highlight-start
      selectionMode="none"
      // @highlight-end
    >
      <Tree.List aria-label="Documentation" className={styles.Tree}>
        {(item: LinkItemModel) => {
          if (item.href) {
            return (
              <Link
                itemId={item.id}
                className={styles.LinkItem}
                href={item.href}
                // @highlight-start
                active={item.id === 'quick-start'}
                // @highlight-end
              >
                <span className={styles.Label}>{item.label}</span>
              </Link>
            );
          }

          return (
            <Tree.Item itemId={item.id} className={styles.Item}>
              <Tree.ItemContent className={styles.ItemContent}>
                <Tree.ItemExpansionTrigger className={styles.ExpansionTrigger}>
                  <ChevronIcon />
                </Tree.ItemExpansionTrigger>
                <span className={styles.Label}>{item.label}</span>
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
    // @focus-start
    <Tree.Item
      itemId={itemId}
      className={className}
      data-active={active ? '' : undefined}
      // @highlight-start
      aria-description="Press Tab to reach the link"
      // @highlight-end
    >
      <Tree.ItemContent className={styles.ItemContent}>
        {/* @highlight-start */}
        <Tree.ItemLink {...props} className={styles.Link} active={active}>
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
