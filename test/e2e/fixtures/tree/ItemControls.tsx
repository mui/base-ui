import * as React from 'react';
import { Tree } from '@base-ui/react/tree';

const items: Tree.DefaultItem[] = [
  {
    id: 'redesign',
    label: 'Website redesign',
    children: [
      { id: 'wireframes', label: 'Wireframes' },
      { id: 'homepage', label: 'Homepage copy' },
      { id: 'mockups', label: 'Archived mockups', disabled: true },
    ],
  },
];

export default function ItemControlsTree() {
  return (
    <Tree.Root items={items} defaultExpandedItems={['redesign']}>
      <Tree.List aria-label="Projects">
        {(item: Tree.DefaultItem) => (
          <Tree.Item
            itemId={item.id}
            aria-description={item.children ? undefined : 'Press Tab to reach the task controls'}
          >
            <Tree.ItemContent
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                paddingInlineStart: 'calc((var(--tree-item-level) - 1) * 1.5rem)',
              }}
            >
              <Tree.ItemExpansionTrigger>
                <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
                  <path d="M4.5 2 8.5 6l-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </Tree.ItemExpansionTrigger>
              {item.children ? (
                item.label
              ) : (
                <React.Fragment>
                  <Tree.ItemLink
                    href={`/tasks/${item.id}`}
                    onClick={(event) => event.preventDefault()}
                  >
                    {item.label}
                  </Tree.ItemLink>
                  <Tree.ItemInput
                    aria-label={`Estimate for ${item.label}, in hours`}
                    defaultValue="2"
                    style={{ width: '3rem' }}
                  />
                  <Tree.ItemButton aria-label={`Remove ${item.label}`}>×</Tree.ItemButton>
                </React.Fragment>
              )}
            </Tree.ItemContent>
          </Tree.Item>
        )}
      </Tree.List>
    </Tree.Root>
  );
}
