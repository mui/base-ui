'use client';
import * as React from 'react';
import { ListboxPreview as Listbox } from '@base-ui/react/listbox';
import styles from './index.module.css';

interface Folder {
  label: string;
  value: string;
}

interface FolderGroup {
  label: string;
  items: Folder[];
}

const groups: FolderGroup[] = [
  {
    label: 'Mailboxes',
    items: [
      { label: 'Inbox', value: 'inbox' },
      { label: 'Archive', value: 'archive' },
      { label: 'Drafts', value: 'drafts' },
    ],
  },
  {
    label: 'Folders',
    items: [
      { label: 'Projects', value: 'projects' },
      { label: 'Receipts', value: 'receipts' },
      { label: 'Travel', value: 'travel' },
    ],
  },
];

const items = Listbox.createItems(groups, {
  getValue: (folder) => folder.value,
  getLabel: (folder) => folder.label,
});

export default function ExampleListboxGrouped() {
  return (
    <Listbox.Root items={items} defaultValue="archive">
      <div className={styles.Panel}>
        <div className={styles.Header}>
          <Listbox.Label className={styles.Label}>Move to</Listbox.Label>
        </div>
        <Listbox.List className={styles.List}>
          {(group: FolderGroup) => (
            <Listbox.Group key={group.label} items={group.items}>
              <Listbox.GroupLabel className={styles.GroupLabel}>{group.label}</Listbox.GroupLabel>
              <Listbox.Collection>
                {(item: Folder) => (
                  <Listbox.Item key={item.value} value={item.value} className={styles.Item}>
                    <Listbox.ItemIndicator className={styles.ItemIndicator}>
                      <CheckIcon />
                    </Listbox.ItemIndicator>
                    <span className={styles.ItemText}>{item.label}</span>
                  </Listbox.Item>
                )}
              </Listbox.Collection>
            </Listbox.Group>
          )}
        </Listbox.List>
      </div>
    </Listbox.Root>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="m2.5 8.5 4 4 7-9" />
    </svg>
  );
}
