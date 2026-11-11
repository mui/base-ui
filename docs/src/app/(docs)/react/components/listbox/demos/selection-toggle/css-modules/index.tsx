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

export default function ExampleListboxSelectionToggle() {
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
          {songs.map(({ title, value: itemValue }) => (
            <Listbox.Item key={itemValue} value={itemValue} className={styles.Item}>
              <Listbox.ItemSelectionToggle className={styles.SelectionToggle}>
                <Listbox.ItemIndicator className={styles.ItemIndicator}>
                  <CheckIcon />
                </Listbox.ItemIndicator>
              </Listbox.ItemSelectionToggle>
              <span className={styles.ItemText}>{title}</span>
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
