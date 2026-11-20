import * as React from 'react';
import { ActionTree } from '@base-ui/react/action-tree';

const items: ActionTree.DefaultItem[] = [
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
    <ActionTree.Root items={items} defaultExpandedItems={['redesign']}>
      <ActionTree.List aria-label="Projects">
        {(item: ActionTree.DefaultItem) => (
          <ActionTree.Item
            itemId={item.id}
            aria-description={item.children ? undefined : 'Press Tab to reach the task controls'}
          >
            <ActionTree.ItemContent
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                paddingInlineStart: 'calc((var(--tree-item-level) - 1) * 1.5rem)',
              }}
            >
              <ActionTree.ItemExpansionTrigger>
                <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
                  <path d="M4.5 2 8.5 6l-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </ActionTree.ItemExpansionTrigger>
              {item.children ? (
                item.label
              ) : (
                <React.Fragment>
                  <ActionTree.ItemLink
                    href={`/tasks/${item.id}`}
                    onClick={(event) => event.preventDefault()}
                  >
                    {item.label}
                  </ActionTree.ItemLink>
                  <ActionTree.ItemInput
                    aria-label={`Estimate for ${item.label}, in hours`}
                    defaultValue="2"
                    style={{ width: '3rem' }}
                  />
                  <ActionTree.ItemButton aria-label={`Remove ${item.label}`}>
                    ×
                  </ActionTree.ItemButton>
                </React.Fragment>
              )}
            </ActionTree.ItemContent>
          </ActionTree.Item>
        )}
      </ActionTree.List>
    </ActionTree.Root>
  );
}
