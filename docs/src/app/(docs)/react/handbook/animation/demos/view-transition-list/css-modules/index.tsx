'use client';
import * as React from 'react';
import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import styles from './index.module.css';
import './index.css';

const files = [
  { id: 'readme', name: 'README.md', size: 4 },
  { id: 'package', name: 'package.json', size: 2 },
  { id: 'index', name: 'index.tsx', size: 12 },
  { id: 'styles', name: 'styles.css', size: 7 },
  { id: 'logo', name: 'logo.svg', size: 30 },
];

type SortKey = 'name' | 'size';

export default function ViewTransitionList() {
  const [sortKey, setSortKey] = React.useState<SortKey>('name');

  const sortedFiles = [...files].sort((a, b) =>
    sortKey === 'name' ? a.name.localeCompare(b.name) : a.size - b.size,
  );

  return (
    <div className={styles.Container}>
      <ToggleGroup
        aria-label="Sort files by"
        className={styles.Panel}
        value={[sortKey]}
        onValueChange={(groupValue: SortKey[]) => {
          const nextSortKey = groupValue[0];
          if (nextSortKey) {
            React.startTransition(() => {
              setSortKey(nextSortKey);
            });
          }
        }}
      >
        <Toggle value="name" className={styles.Button}>
          Name
        </Toggle>
        <Toggle value="size" className={styles.Button}>
          Size
        </Toggle>
      </ToggleGroup>
      <ul className={styles.List}>
        {sortedFiles.map((file) => (
          <React.ViewTransition key={file.id}>
            <li className={styles.Item}>
              {file.name}
              <span className={styles.Size}>{file.size} KB</span>
            </li>
          </React.ViewTransition>
        ))}
      </ul>
    </div>
  );
}
