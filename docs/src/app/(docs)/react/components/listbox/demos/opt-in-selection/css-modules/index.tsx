'use client';
import * as React from 'react';
import { Listbox } from '@base-ui/react/listbox';
import styles from './index.module.css';

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
      <div className={styles.Panel}>
        <div className={styles.Header}>
          <Listbox.Label className={styles.Label}>Songs</Listbox.Label>
          <span className={styles.Count}>
            {value.length} of {songs.length} selected
          </span>
        </div>
        <Listbox.List className={styles.List}>
          {songs.map(({ title, value: songValue }) => (
            <Listbox.Item key={songValue} value={songValue} className={styles.Item}>
              {title}
            </Listbox.Item>
          ))}
        </Listbox.List>
      </div>
    </Listbox.Root>
  );
}
