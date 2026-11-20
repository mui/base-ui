import * as React from 'react';
import { ActionTree } from '@base-ui/react/action-tree';

const items: ActionTree.DefaultItem[] = [
  {
    id: 'documents',
    label: 'Documents',
    children: [
      { id: 'resume', label: 'Resume' },
      { id: 'cover-letter', label: 'Cover letter' },
    ],
  },
  { id: 'notes', label: 'Notes' },
];

export default function CheckboxSelectionTree() {
  return (
    <ActionTree.Root items={items} defaultExpandedItems={['documents']} selectionMode="multiple">
      <ActionTree.Label>Files to share</ActionTree.Label>
      <ActionTree.List>
        {(item: ActionTree.DefaultItem) => (
          <ActionTree.Item itemId={item.id}>
            <ActionTree.ItemContent
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                paddingInlineStart: 'calc((var(--tree-item-level) - 1) * 1.5rem)',
              }}
            >
              <ActionTree.ItemCheckbox
                style={{
                  display: 'inline-flex',
                  width: '0.875rem',
                  height: '0.875rem',
                  border: '1px solid',
                }}
              >
                <ActionTree.ItemCheckboxIndicator>
                  <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
                    <path
                      d="M2.5 6.5 5 9l4.5-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                </ActionTree.ItemCheckboxIndicator>
              </ActionTree.ItemCheckbox>
              {item.label}
            </ActionTree.ItemContent>
          </ActionTree.Item>
        )}
      </ActionTree.List>
    </ActionTree.Root>
  );
}
