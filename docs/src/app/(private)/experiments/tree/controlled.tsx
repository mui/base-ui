'use client';
import * as React from 'react';
import { Tree } from '@base-ui/react/tree';
import type { TreeItemModel, TreeItemId } from '@base-ui/react/tree';
import styles from './tree.module.css';

const items: TreeItemModel[] = [
  {
    id: 'usa',
    label: 'United States',
    children: [
      {
        id: 'ca',
        label: 'California',
        children: [
          { id: 'sf', label: 'San Francisco' },
          { id: 'la', label: 'Los Angeles' },
          { id: 'sd', label: 'San Diego' },
        ],
      },
      {
        id: 'ny',
        label: 'New York',
        children: [
          { id: 'nyc', label: 'New York City' },
          { id: 'buffalo', label: 'Buffalo' },
        ],
      },
      {
        id: 'tx',
        label: 'Texas',
        children: [
          { id: 'houston', label: 'Houston' },
          { id: 'austin', label: 'Austin' },
          { id: 'dallas', label: 'Dallas' },
        ],
      },
    ],
  },
  {
    id: 'uk',
    label: 'United Kingdom',
    children: [
      { id: 'london', label: 'London' },
      { id: 'manchester', label: 'Manchester' },
      { id: 'edinburgh', label: 'Edinburgh' },
    ],
  },
  {
    id: 'japan',
    label: 'Japan',
    children: [
      { id: 'tokyo', label: 'Tokyo' },
      { id: 'osaka', label: 'Osaka' },
      { id: 'kyoto', label: 'Kyoto' },
    ],
  },
];

export default function ControlledTree() {
  const [expandedItems, setExpandedItems] = React.useState<TreeItemId[]>(['usa']);
  const [selectedItems, setSelectedItems] = React.useState<TreeItemId[]>([]);

  return (
    <div className={styles.grid}>
      <div className={styles.wrapper}>
        <div>
          <h3 className={styles.heading}>Controlled tree</h3>
          <p className={styles.description}>
            Expansion and selection are controlled externally. State is shown on the right.
          </p>
        </div>
        <Tree.Root
          items={items}
          expandedItems={expandedItems}
          onExpandedItemsChange={setExpandedItems}
          selectedItems={selectedItems}
          onSelectedItemsChange={(v) => setSelectedItems(v as TreeItemId[])}
          multiSelect
          className={styles.tree}
        >
          {(item) => (
            <Tree.Item className={styles.item} clickToSelect={false}>
              <Tree.ItemExpansionTrigger className={styles.expansionTrigger}>
                <ChevronIcon />
              </Tree.ItemExpansionTrigger>
              <Tree.ItemCheckbox className={styles.checkbox} />
              <Tree.ItemLabel className={styles.label} />
            </Tree.Item>
          )}
        </Tree.Root>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setExpandedItems(['usa', 'ca', 'ny', 'tx', 'uk', 'japan'])}
            style={{ fontSize: '0.8rem' }}
          >
            Expand all
          </button>
          <button
            type="button"
            onClick={() => setExpandedItems([])}
            style={{ fontSize: '0.8rem' }}
          >
            Collapse all
          </button>
          <button
            type="button"
            onClick={() => setSelectedItems([])}
            style={{ fontSize: '0.8rem' }}
          >
            Clear selection
          </button>
        </div>
      </div>

      <div className={styles.wrapper}>
        <h3 className={styles.heading}>State</h3>
        <div className={styles.panel}>
          {`expandedItems: [\n${expandedItems.map((id) => `  "${id}"`).join(',\n')}\n]\n\nselectedItems: [\n${selectedItems.map((id) => `  "${id}"`).join(',\n')}\n]`}
        </div>
      </div>
    </div>
  );
}

function ChevronIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 12 12" fill="currentColor" {...props}>
      <path d="M4.5 2L8.5 6L4.5 10" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
