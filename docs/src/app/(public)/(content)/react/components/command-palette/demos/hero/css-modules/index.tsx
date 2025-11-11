'use client';

import * as React from 'react';
import { CommandPalette, useCommandPaletteItems } from '@base-ui-components/react/command-palette';
import styles from './index.module.css';

const items = [
  { id: '1', label: 'New File', onSelect: () => {} },
  { id: '2', label: 'Open File', onSelect: () => {} },
  { id: '3', label: 'Save', keywords: ['save', 'write'], onSelect: () => {} },
  {
    id: '4',
    label: 'Save As',
    keywords: ['save', 'export'],
    onSelect: () => {},
  },
  { id: '5', label: 'Close', onSelect: () => {} },
  { id: '6', label: 'Undo', keywords: ['undo', 'revert'], onSelect: () => {} },
  { id: '7', label: 'Redo', keywords: ['redo', 'repeat'], onSelect: () => {} },
  { id: '8', label: 'Cut', keywords: ['cut', 'remove'], onSelect: () => {} },
  { id: '9', label: 'Copy', keywords: ['copy', 'duplicate'], onSelect: () => {} },
  { id: '10', label: 'Paste', keywords: ['paste', 'insert'], onSelect: () => {} },
];

function CommandPaletteContent() {
  const filteredItems = useCommandPaletteItems();

  return (
    <React.Fragment>
      <CommandPalette.Input className={styles.Input} placeholder="Search commands..." />
      <CommandPalette.List className={styles.List}>
        {filteredItems.map(({ id, label }) => (
          <CommandPalette.Item key={id} itemId={id} className={styles.Item}>
            {label}
          </CommandPalette.Item>
        ))}
      </CommandPalette.List>
      <CommandPalette.Empty className={styles.Empty}>No results found</CommandPalette.Empty>
    </React.Fragment>
  );
}

export default function ExampleCommandPalette() {
  return (
    <CommandPalette.Root items={items}>
      <CommandPalette.Trigger className={styles.Button}>
        Open Command Palette
      </CommandPalette.Trigger>
      <CommandPalette.Portal>
        <CommandPalette.Popup className={styles.Popup}>
          <CommandPaletteContent />
        </CommandPalette.Popup>
      </CommandPalette.Portal>
    </CommandPalette.Root>
  );
}
