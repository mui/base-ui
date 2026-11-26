import * as React from 'react';
import { Listbox } from '@base-ui/react/listbox';
import styles from './index.module.css';

const groups = [
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

export default function ExampleListboxGrouped() {
  return (
    <Listbox.Root defaultValue="archive">
      <div className={styles.Panel}>
        <div className={styles.Header}>
          <Listbox.Label className={styles.Label}>Move to</Listbox.Label>
        </div>
        <Listbox.List className={styles.List}>
          {groups.map((group) => (
            <Listbox.Group key={group.label}>
              <Listbox.GroupLabel className={styles.GroupLabel}>{group.label}</Listbox.GroupLabel>
              {group.items.map(({ label, value }) => (
                <Listbox.Item key={value} value={value} className={styles.Item}>
                  <Listbox.ItemIndicator className={styles.ItemIndicator}>
                    <CheckIcon />
                  </Listbox.ItemIndicator>
                  <span className={styles.ItemText}>{label}</span>
                </Listbox.Item>
              ))}
            </Listbox.Group>
          ))}
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
