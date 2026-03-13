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
      { id: 'quick-start', label: 'Quick Start', href: '/react/overview/quick-start' },
      { id: 'accessibility', label: 'Accessibility', href: '/react/overview/accessibility' },
      { id: 'releases', label: 'Releases', href: '/react/overview/releases' },
    ],
  },
  {
    id: 'handbook',
    label: 'Handbook',
    children: [
      { id: 'styling', label: 'Styling', href: '/react/handbook/styling' },
      { id: 'animation', label: 'Animation', href: '/react/handbook/animation' },
      { id: 'composition', label: 'Composition', href: '/react/handbook/composition' },
    ],
  },
  { id: 'about', label: 'About', href: '/react/overview/about' },
];

export default function ExampleTreeLinkItems() {
  return (
    <Tree.Root items={items} defaultExpandedItems={['overview']} className={styles.Tree}>
      <Tree.ItemList>
        {(item) => {
          if (item.href) {
            return (
              <Link
                itemId={item.id}
                className={styles.LinkItem}
                href={item.href}
                active={item.id === 'quick-start'}
              >
                <Tree.ItemLabel className={styles.Label} />
              </Link>
            );
          }

          return (
            <Tree.Item itemId={item.id} className={styles.Item}>
              <Tree.ItemExpansionTrigger className={styles.ExpansionTrigger}>
                <ChevronIcon />
              </Tree.ItemExpansionTrigger>
              <Tree.ItemLabel className={styles.Label} />
            </Tree.Item>
          );
        }}
      </Tree.ItemList>
    </Tree.Root>
  );
}

function Link(props: Tree.LinkItem.Props) {
  return (
    <Tree.LinkItem
      render={
        // Use the `render` prop to render your framework's Link component
        // for client-side routing.
        // e.g. `<NextLink href={props.href} />` instead of `<a />`.
        <a />
      }
      {...props}
    />
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
