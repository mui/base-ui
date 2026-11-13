import * as React from 'react';
import { Listbox } from '@base-ui/react/listbox';

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
      <div className="w-64 border border-neutral-950 bg-white text-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-1 has-[:focus-visible]:outline-neutral-950 dark:has-[:focus-visible]:outline-white">
        <div className="border-b border-neutral-200 px-3.5 py-3 dark:border-neutral-800">
          <Listbox.Label className="cursor-default text-sm font-bold">Move to</Listbox.Label>
        </div>
        <Listbox.List className="max-h-80 overflow-y-auto outline-hidden">
          {groups.map((group) => (
            <Listbox.Group key={group.label}>
              <Listbox.GroupLabel className="cursor-default border-b border-neutral-200 px-3.5 pt-2 pb-1.5 text-xs font-bold tracking-wider text-neutral-500 uppercase select-none dark:border-neutral-800 dark:text-neutral-400">
                {group.label}
              </Listbox.GroupLabel>
              {group.items.map(({ label, value }) => (
                <Listbox.Item
                  key={value}
                  value={value}
                  className="grid cursor-default grid-cols-[1rem_1fr] items-center gap-3 px-3.5 py-1.5 text-sm outline-hidden select-none data-highlighted:bg-neutral-100 dark:data-highlighted:bg-neutral-800 data-disabled:text-neutral-500 dark:data-disabled:text-neutral-400"
                >
                  <Listbox.ItemIndicator className="col-start-1">
                    <CheckIcon />
                  </Listbox.ItemIndicator>
                  <span className="col-start-2">{label}</span>
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
