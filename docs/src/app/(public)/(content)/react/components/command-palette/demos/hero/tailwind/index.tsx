'use client';

import * as React from 'react';
import { CommandPalette, useCommandPaletteItems } from '@base-ui-components/react/command-palette';

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
      <CommandPalette.Input
        className="w-full px-4 py-3 border-0 border-b border-gray-200 rounded-t-lg bg-transparent text-base text-gray-900 placeholder:text-gray-500 focus:outline-0 dark:border-gray-300"
        placeholder="Search commands..."
      />
      <CommandPalette.List className="max-h-80 my-1 mx-1 overflow-y-auto list-none">
        {filteredItems.map(({ label, id }) => (
          <CommandPalette.Item
            key={id}
            itemId={id}
            className="flex items-center px-3 py-2 rounded-md text-[0.9375rem] text-gray-900 cursor-pointer data-highlighted:bg-blue-50 data-highlighted:text-blue-900 data-disabled:opacity-50 data-disabled:cursor-not-allowed hover:not-([data-disabled]):bg-gray-100"
          >
            {label}
          </CommandPalette.Item>
        ))}
      </CommandPalette.List>
      <CommandPalette.Empty className="px-6 py-6 text-center text-[0.9375rem] text-gray-500">
        No results found
      </CommandPalette.Empty>
    </React.Fragment>
  );
}

export default function ExampleCommandPalette() {
  return (
    <CommandPalette.Root items={items}>
      <CommandPalette.Trigger className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
        Open Command Palette
      </CommandPalette.Trigger>
      <CommandPalette.Portal>
        <CommandPalette.Popup className="fixed top-[20%] left-1/2 -translate-x-1/2 w-lg max-w-[calc(100vw-3rem)] rounded-lg bg-gray-50 outline outline-gray-200 shadow-lg transition-all duration-150 data-ending-style:opacity-0 data-ending-style:scale-95 data-starting-style:opacity-0 data-starting-style:scale-95 dark:outline-gray-300">
          <CommandPaletteContent />
        </CommandPalette.Popup>
      </CommandPalette.Portal>
    </CommandPalette.Root>
  );
}
