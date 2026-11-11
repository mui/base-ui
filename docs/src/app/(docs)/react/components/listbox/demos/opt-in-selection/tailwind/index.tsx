'use client';
import * as React from 'react';
import { Listbox } from '@base-ui/react/listbox';

const songs = [
  { title: 'Billie Jean', value: 'billie-jean' },
  { title: 'Dancing Queen', value: 'dancing-queen' },
  { title: 'Like a Prayer', value: 'like-a-prayer' },
  { title: 'Running Up That Hill', value: 'running-up-that-hill' },
  { title: 'Hotel California', value: 'hotel-california' },
  { title: 'London Calling', value: 'london-calling' },
  { title: 'Heroes', value: 'heroes' },
  { title: 'Bohemian Rhapsody', value: 'bohemian-rhapsody' },
];

export default function ExampleListboxOptInSelection() {
  const [value, setValue] = React.useState<string[]>(['billie-jean']);

  return (
    <Listbox.Root multiple="opt-in" value={value} onValueChange={setValue}>
      <div className="w-64 border border-neutral-950 bg-white text-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-1 has-[:focus-visible]:outline-neutral-950 dark:has-[:focus-visible]:outline-white">
        <div className="flex items-baseline justify-between gap-4 border-b border-neutral-200 px-3.5 py-3 dark:border-neutral-800">
          <Listbox.Label className="cursor-default text-sm font-bold">Songs</Listbox.Label>
          <span className="text-sm tabular-nums">
            {value.length} of {songs.length} selected
          </span>
        </div>
        <Listbox.List className="max-h-80 overflow-y-auto outline-hidden">
          {songs.map(({ title, value: songValue }) => (
            <Listbox.Item
              key={songValue}
              value={songValue}
              className="block cursor-default px-3.5 py-1.5 text-sm outline-hidden select-none data-highlighted:not-data-selected:bg-neutral-100 dark:data-highlighted:not-data-selected:bg-neutral-800 data-selected:bg-neutral-950 data-selected:text-white dark:data-selected:bg-white dark:data-selected:text-neutral-950 data-disabled:text-neutral-500 dark:data-disabled:text-neutral-400"
            >
              {title}
            </Listbox.Item>
          ))}
        </Listbox.List>
      </div>
    </Listbox.Root>
  );
}
