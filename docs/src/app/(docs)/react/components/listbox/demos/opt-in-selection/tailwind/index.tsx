import * as React from 'react';
import { Listbox } from '@base-ui/react/listbox';

const songs = [
  { title: 'Bohemian Rhapsody', artist: 'Queen', value: 'bohemian-rhapsody' },
  { title: 'Billie Jean', artist: 'Michael Jackson', value: 'billie-jean' },
  { title: 'Hotel California', artist: 'Eagles', value: 'hotel-california' },
  { title: 'Superstition', artist: 'Stevie Wonder', value: 'superstition' },
  { title: 'Dancing Queen', artist: 'ABBA', value: 'dancing-queen' },
];

export default function ExampleListboxOptInSelection() {
  return (
    <div className="flex flex-col gap-1">
      <Listbox.Root multiple="opt-in" defaultValue={['billie-jean']}>
        <Listbox.Label className="cursor-default text-sm leading-5 font-medium text-neutral-900 dark:text-neutral-100">
          Playlist
        </Listbox.Label>
        <Listbox.List className="box-border flex flex-col gap-0.5 w-64 max-h-80 overflow-y-auto py-1 rounded-md outline outline-1 outline-neutral-200 dark:outline-neutral-700 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white">
          {songs.map(({ title, artist, value }) => (
            <Listbox.Item
              key={value}
              value={value}
              className="relative z-0 flex flex-col gap-0.5 cursor-default py-2 px-4 text-sm leading-4 text-neutral-900 dark:text-neutral-100 outline-hidden select-none before:absolute before:inset-x-1 before:inset-y-0 before:z-[-1] before:rounded-xs data-[highlighted]:not-data-[selected]:before:bg-neutral-100 dark:data-[highlighted]:not-data-[selected]:before:bg-neutral-800 data-[selected]:before:bg-neutral-200 dark:data-[selected]:before:bg-neutral-700 data-[disabled]:text-neutral-400 dark:data-[disabled]:text-neutral-500 pointer-coarse:py-2.5 pointer-coarse:text-[0.925rem]"
            >
              <span className="font-semibold">{title}</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">{artist}</span>
            </Listbox.Item>
          ))}
        </Listbox.List>
      </Listbox.Root>
    </div>
  );
}
