'use client';
import * as React from 'react';
import { Listbox } from '@base-ui/react/listbox';

const genres = [
  {
    label: 'Pop',
    songs: [
      { title: 'Billie Jean', artist: 'Michael Jackson', duration: '4:54', value: 'billie-jean' },
      { title: 'Dancing Queen', artist: 'ABBA', duration: '3:51', value: 'dancing-queen' },
      { title: 'Like a Prayer', artist: 'Madonna', duration: '5:41', value: 'like-a-prayer' },
      {
        title: 'Running Up That Hill',
        artist: 'Kate Bush',
        duration: '5:00',
        value: 'running-up-that-hill',
      },
    ],
  },
  {
    label: 'Rock',
    songs: [
      { title: 'Hotel California', artist: 'Eagles', duration: '6:30', value: 'hotel-california' },
      { title: 'London Calling', artist: 'The Clash', duration: '3:19', value: 'london-calling' },
      { title: 'Heroes', artist: 'David Bowie', duration: '6:07', value: 'heroes' },
      { title: 'Bohemian Rhapsody', artist: 'Queen', duration: '5:55', value: 'bohemian-rhapsody' },
    ],
  },
  {
    label: 'Soul',
    songs: [
      { title: 'Superstition', artist: 'Stevie Wonder', duration: '4:26', value: 'superstition' },
      { title: 'Respect', artist: 'Aretha Franklin', duration: '2:27', value: 'respect' },
      {
        title: "What's Going On",
        artist: 'Marvin Gaye',
        duration: '3:53',
        value: 'whats-going-on',
      },
      {
        title: "Let's Stay Together",
        artist: 'Al Green',
        duration: '3:18',
        value: 'lets-stay-together',
      },
    ],
  },
  {
    label: 'Electronic',
    songs: [
      { title: 'Blue Monday', artist: 'New Order', duration: '7:29', value: 'blue-monday' },
      {
        title: 'Around the World',
        artist: 'Daft Punk',
        duration: '7:09',
        value: 'around-the-world',
      },
      { title: 'Teardrop', artist: 'Massive Attack', duration: '5:29', value: 'teardrop' },
      { title: 'Windowlicker', artist: 'Aphex Twin', duration: '6:07', value: 'windowlicker' },
    ],
  },
];

const songCount = genres.reduce((count, genre) => count + genre.songs.length, 0);

export default function ExampleListbox() {
  const [value, setValue] = React.useState<string[]>(['billie-jean']);

  return (
    <Listbox.Root multiple value={value} onValueChange={setValue}>
      <div className="w-[26rem] border border-neutral-950 bg-white text-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-1 has-[:focus-visible]:outline-neutral-950 dark:has-[:focus-visible]:outline-white">
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
                  className="group grid cursor-default grid-cols-[1rem_1fr_auto_auto] items-center gap-3 px-3.5 py-1.5 text-sm outline-hidden select-none data-highlighted:bg-neutral-100 dark:data-highlighted:bg-neutral-800 data-disabled:text-neutral-500 dark:data-disabled:text-neutral-400"
                >
                  <span className="flex size-4 items-center justify-center border border-neutral-950 bg-white text-white group-data-selected:bg-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-neutral-950 dark:group-data-selected:bg-white">
                    <Listbox.ItemIndicator className="flex">
                      <CheckIcon />
                    </Listbox.ItemIndicator>
                  </span>
                  <span className="truncate">{song.title}</span>
                  <span className="text-neutral-500 dark:text-neutral-400">{song.artist}</span>
                  <span className="min-w-9 text-end text-neutral-500 tabular-nums dark:text-neutral-400">
                    {song.duration}
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
