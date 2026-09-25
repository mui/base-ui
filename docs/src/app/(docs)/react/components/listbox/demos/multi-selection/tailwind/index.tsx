import * as React from 'react';
import { Listbox } from '@base-ui/react/listbox';

const songs = [
  { title: 'Bohemian Rhapsody', artist: 'Queen', value: 'bohemian-rhapsody' },
  { title: 'Billie Jean', artist: 'Michael Jackson', value: 'billie-jean' },
  { title: 'Hotel California', artist: 'Eagles', value: 'hotel-california' },
  { title: 'Superstition', artist: 'Stevie Wonder', value: 'superstition' },
  { title: 'Dancing Queen', artist: 'ABBA', value: 'dancing-queen' },
];

export default function ExampleListboxMultiSelection() {
  return (
    <div className="flex flex-wrap gap-6">
      <SongList label="multiple" selectionMode="multiple" />
      <SongList label="explicit-multiple" selectionMode="explicit-multiple" />
    </div>
  );
}

function SongList({
  label,
  selectionMode,
}: {
  label: string;
  selectionMode: 'multiple' | 'explicit-multiple';
}) {
  return (
    <div className="flex flex-col gap-1">
      <Listbox.Root selectionMode={selectionMode} defaultValue={['bohemian-rhapsody']}>
        <Listbox.Label className="cursor-default text-sm leading-5 font-medium text-gray-900">
          {label}
        </Listbox.Label>
        <Listbox.List className="box-border w-64 max-h-80 overflow-y-auto py-1 rounded-md outline outline-1 outline-gray-200 dark:outline-gray-300 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800">
          {songs.map(({ title, artist, value }) => (
            <Listbox.Item
              key={value}
              value={value}
              className="grid cursor-default grid-cols-[0.75rem_1fr] items-center gap-2 py-2 pr-4 pl-2.5 text-sm leading-4 text-gray-900 outline-hidden select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-xs data-[highlighted]:before:bg-gray-100 data-[disabled]:text-gray-400 data-[disabled]:data-[highlighted]:before:bg-gray-200 pointer-coarse:py-2.5 pointer-coarse:text-[0.925rem]"
            >
              <Listbox.ItemIndicator className="col-start-1">
                <CheckIcon className="size-3" />
              </Listbox.ItemIndicator>
              <Listbox.ItemText className="col-start-2 flex flex-col gap-0.5">
                <span className="font-semibold">{title}</span>
                <span className="text-xs text-gray-500">{artist}</span>
              </Listbox.ItemText>
            </Listbox.Item>
          ))}
        </Listbox.List>
      </Listbox.Root>
    </div>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}
