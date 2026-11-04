import * as React from 'react';
import { Listbox } from '@base-ui/react/listbox';
import styles from './index.module.css';

const songs = [
  { title: 'Bohemian Rhapsody', artist: 'Queen', value: 'bohemian-rhapsody' },
  { title: 'Billie Jean', artist: 'Michael Jackson', value: 'billie-jean' },
  { title: 'Hotel California', artist: 'Eagles', value: 'hotel-california', disabled: true },
  { title: 'Superstition', artist: 'Stevie Wonder', value: 'superstition' },
  { title: 'Dancing Queen', artist: 'ABBA', value: 'dancing-queen' },
];

export default function ExampleListboxOptInSelection() {
  return (
    <div className={styles.Field}>
      <Listbox.Root multiple="opt-in" defaultValue={['billie-jean']}>
        <Listbox.Label className={styles.Label}>Playlist</Listbox.Label>
        <Listbox.List className={styles.List}>
          {songs.map(({ title, artist, value, disabled }) => (
            <Listbox.Item key={value} value={value} disabled={disabled} className={styles.Item}>
              <span className={styles.ItemTitle}>{title}</span>
              <span className={styles.ItemArtist}>{artist}</span>
            </Listbox.Item>
          ))}
        </Listbox.List>
      </Listbox.Root>
    </div>
  );
}
