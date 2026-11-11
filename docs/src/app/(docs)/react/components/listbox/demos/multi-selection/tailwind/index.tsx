'use client';
import * as React from 'react';
import { Listbox } from '@base-ui/react/listbox';

const labels = [
  { label: 'Bug', value: 'bug' },
  { label: 'Design', value: 'design' },
  { label: 'Docs', value: 'docs' },
  { label: 'Feature', value: 'feature' },
  { label: 'Good first issue', value: 'good-first-issue' },
  { label: 'Performance', value: 'performance' },
  { label: 'Question', value: 'question' },
  { label: 'Security', value: 'security' },
  { label: 'Tests', value: 'tests' },
];

export default function ExampleListboxMultiSelection() {
  const [value, setValue] = React.useState<string[]>(['bug', 'performance']);

  return (
    <Listbox.Root multiple value={value} onValueChange={setValue}>
      <div className="w-64 border border-neutral-950 bg-white text-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-1 has-[:focus-visible]:outline-neutral-950 dark:has-[:focus-visible]:outline-white">
        <div className="flex items-baseline justify-between gap-4 border-b border-neutral-200 px-3.5 py-3 dark:border-neutral-800">
          <Listbox.Label className="cursor-default text-sm font-bold">Labels</Listbox.Label>
          <span className="text-sm tabular-nums">
            {value.length} of {labels.length} selected
          </span>
        </div>
        <Listbox.List className="max-h-80 overflow-y-auto outline-hidden">
          {labels.map(({ label, value: itemValue }) => (
            <Listbox.Item
              key={itemValue}
              value={itemValue}
              className="group grid cursor-default grid-cols-[1rem_1fr] items-center gap-3 px-3.5 py-1.5 text-sm outline-hidden select-none data-highlighted:bg-neutral-100 dark:data-highlighted:bg-neutral-800 data-disabled:text-neutral-500 dark:data-disabled:text-neutral-400"
            >
              <span className="flex size-4 items-center justify-center border border-neutral-950 bg-white text-white group-data-selected:bg-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-neutral-950 dark:group-data-selected:bg-white">
                <Listbox.ItemIndicator className="flex">
                  <CheckIcon />
                </Listbox.ItemIndicator>
              </span>
              <span className="col-start-2">{label}</span>
            </Listbox.Item>
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
