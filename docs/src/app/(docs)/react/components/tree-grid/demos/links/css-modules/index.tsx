'use client';
import * as React from 'react';
import { TreeGrid } from '@base-ui/react/tree-grid';
import styles from './index.module.css';

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

export default function ExampleTreeGridLinks() {
  return (
    <TreeGrid.Root
      items={items}
      defaultExpandedItems={['overview']}
      // @highlight-start
      selectionMode="none"
      // @highlight-end
    >
      <TreeGrid.Table aria-label="Documentation" className={styles.Table}>
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
            <TreeGrid.Row itemId={page.id} className={styles.Row}>
              <TreeGrid.Cell className={styles.Cell}>
                <TreeGrid.RowExpansionTrigger className={styles.ExpansionTrigger}>
                  <ChevronIcon />
                </TreeGrid.RowExpansionTrigger>
                <span className={styles.Label}>{page.label}</span>
              </TreeGrid.Cell>
            </TreeGrid.Row>
          );
        }}
      </TreeGrid.Table>
    </TreeGrid.Root>
  );
}

function PageItem({ page, href, active }: { page: Page; href: string; active: boolean }) {
  return (
    // @focus-start
    <TreeGrid.Row
      itemId={page.id}
      className={styles.PageItem}
      data-active={active ? '' : undefined}
      // @highlight-start
      aria-description="Press Tab to reach the links"
      // @highlight-end
    >
      <TreeGrid.Cell className={styles.Cell}>
        {/* @highlight-start */}
        <TreeGrid.CellLink href={href} active={active} className={styles.Link}>
          {page.label}
        </TreeGrid.CellLink>
        <TreeGrid.CellLink
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${page.label} in a new tab`}
          className={styles.IconLink}
        >
          <ExternalLinkIcon />
        </TreeGrid.CellLink>
        {/* @highlight-end */}
      </TreeGrid.Cell>
    </TreeGrid.Row>
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
