'use client';
import * as React from 'react';
import { ListboxPreview as Listbox } from '@base-ui/react/listbox';

const genres = [
  {
    label: 'Pop',
    songs: [
      { title: 'Billie Jean', artist: 'Michael Jackson', value: 'billie-jean' },
      { title: 'Dancing Queen', artist: 'ABBA', value: 'dancing-queen' },
      { title: 'Like a Prayer', artist: 'Madonna', value: 'like-a-prayer' },
      { title: 'Running Up That Hill', artist: 'Kate Bush', value: 'running-up-that-hill' },
    ],
  },
  {
    label: 'Rock',
    songs: [
      { title: 'Hotel California', artist: 'Eagles', value: 'hotel-california' },
      { title: 'London Calling', artist: 'The Clash', value: 'london-calling' },
      { title: 'Heroes', artist: 'David Bowie', value: 'heroes' },
      { title: 'Bohemian Rhapsody', artist: 'Queen', value: 'bohemian-rhapsody' },
    ],
  },
  {
    label: 'Soul',
    songs: [
      { title: 'Superstition', artist: 'Stevie Wonder', value: 'superstition' },
      { title: 'Respect', artist: 'Aretha Franklin', value: 'respect' },
      { title: "What's Going On", artist: 'Marvin Gaye', value: 'whats-going-on' },
      { title: "Let's Stay Together", artist: 'Al Green', value: 'lets-stay-together' },
    ],
  },
  {
    label: 'Electronic',
    songs: [
      { title: 'Blue Monday', artist: 'New Order', value: 'blue-monday' },
      { title: 'Around the World', artist: 'Daft Punk', value: 'around-the-world' },
      { title: 'Teardrop', artist: 'Massive Attack', value: 'teardrop' },
      { title: 'Windowlicker', artist: 'Aphex Twin', value: 'windowlicker' },
    ],
  },
];

const songCount = genres.reduce((count, genre) => count + genre.songs.length, 0);

export default function ExampleListbox() {
  const [value, setValue] = React.useState<string[]>(['billie-jean']);

  return (
    <Listbox.Root multiple value={value} onValueChange={setValue}>
      <div className="w-64 border border-neutral-950 bg-white text-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-1 has-[:focus-visible]:outline-neutral-950 dark:has-[:focus-visible]:outline-white">
        <div className="flex items-baseline justify-between gap-4 border-b border-neutral-200 px-3.5 py-3 dark:border-neutral-800">
          <Listbox.Label className="cursor-default text-sm font-bold">Playlist</Listbox.Label>
          <span className="text-sm tabular-nums">
            {value.length} of {songCount} selected
          </span>
        </div>
        <Listbox.List className="max-h-72 overflow-y-auto outline-hidden">
          {genres.map((genre) => (
            <Listbox.Group key={genre.label}>
              <Listbox.GroupLabel className="cursor-default border-b border-neutral-200 px-3.5 pt-2 pb-1.5 text-xs font-bold tracking-wider text-neutral-500 uppercase select-none dark:border-neutral-800 dark:text-neutral-400">
                {genre.label}
              </Listbox.GroupLabel>
              {genre.songs.map((song) => (
                <Listbox.Item
                  key={song.value}
                  value={song.value}
                  className="group grid cursor-default grid-cols-[1rem_1fr] items-start gap-3 px-3.5 py-2 text-sm outline-hidden select-none data-highlighted:bg-neutral-100 dark:data-highlighted:bg-neutral-800 data-disabled:text-neutral-500 dark:data-disabled:text-neutral-400"
                >
                  <span className="mt-0.5 flex size-4 items-center justify-center border border-neutral-950 bg-white text-white group-data-selected:bg-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-neutral-950 dark:group-data-selected:bg-white">
                    <Listbox.ItemIndicator className="flex">
                      <CheckIcon />
                    </Listbox.ItemIndicator>
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate">{song.title}</span>
                    <span className="truncate text-xs text-neutral-600 dark:text-neutral-400">
                      {song.artist}
                    </span>
                  </span>
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
