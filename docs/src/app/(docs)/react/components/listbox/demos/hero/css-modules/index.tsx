'use client';
import * as React from 'react';
import { Listbox } from '@base-ui/react/listbox';
import styles from './index.module.css';

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
      <div className={styles.Panel}>
        <div className={styles.Header}>
          <Listbox.Label className={styles.Label}>Playlist</Listbox.Label>
          <span className={styles.Count}>
            {value.length} of {songCount} selected
          </span>
        </div>
        <Listbox.List className={styles.List}>
          {genres.map((genre) => (
            <Listbox.Group key={genre.label}>
              <Listbox.GroupLabel className={styles.GroupLabel}>{genre.label}</Listbox.GroupLabel>
              {genre.songs.map((song) => (
                <Listbox.Item key={song.value} value={song.value} className={styles.Item}>
                  <span className={styles.Checkbox}>
                    <Listbox.ItemIndicator className={styles.ItemIndicator}>
                      <CheckIcon />
                    </Listbox.ItemIndicator>
                  </span>
                  <span className={styles.ItemText}>
                    <span className={styles.ItemTitle}>{song.title}</span>
                    <span className={styles.ItemArtist}>{song.artist}</span>
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
