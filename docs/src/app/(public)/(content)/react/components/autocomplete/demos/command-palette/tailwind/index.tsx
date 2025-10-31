import * as React from 'react';
import { Dialog } from '@base-ui-components/react/dialog';
import { Autocomplete } from '@base-ui-components/react/autocomplete';

export default function ExampleCommandPalette() {
  const [open, setOpen] = React.useState(false);

  function handleItemClick(item: Item) {
    // eslint-disable-next-line no-console
    console.log('Command executed:', item);
    setOpen(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="flex h-10 select-none items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 cursor-default hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100 dark:border-gray-300 dark:bg-gray-200/10 dark:text-gray-50 dark:hover:bg-gray-200/20">
        Open Command Palette
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black opacity-20 transition-[transform,opacity] duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 dark:opacity-70" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 flex w-[calc(100vw-1rem)] max-h-[min(32rem,calc(100vh-6rem))] max-w-[28rem] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg bg-[canvas] text-gray-900 outline outline-1 outline-gray-200 shadow-lg shadow-gray-200 transition-[transform,scale,opacity] duration-150 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0 dark:text-gray-50 dark:outline-gray-300 dark:shadow-none">
          <Autocomplete.Root open items={groupedItems} autoHighlight>
            <Autocomplete.Input
              className="w-full border-b border-gray-200 bg-[canvas] px-4 py-4 text-base text-gray-900 outline-none focus-visible:outline-none dark:border-gray-300 dark:text-gray-50"
              placeholder="Search for apps and commands..."
            />

            <Autocomplete.Empty className="flex h-[min(25.5rem,50dvh)] items-center justify-center px-4 py-4 text-[0.925rem] leading-4 text-gray-600 empty:m-0 empty:h-0 empty:p-0 empty:hidden dark:text-gray-400">
              No results found.
            </Autocomplete.Empty>

            <Autocomplete.List className="h-[min(25.5rem,50dvh)] overflow-auto overscroll-contain px-4 py-2 text-base text-gray-900 scroll-pt-2 scroll-pb-2 empty:h-0 empty:p-0 dark:text-gray-50">
              {(group: Group) => (
                <Autocomplete.Group
                  key={group.value}
                  items={group.items}
                  className="pb-2 last:pb-0"
                >
                  <Autocomplete.GroupLabel className="cursor-default select-none px-2 py-2 text-[0.875rem] leading-4 text-gray-600 dark:text-gray-400">
                    {group.value}
                  </Autocomplete.GroupLabel>
                  <Autocomplete.Collection>
                    {(item: Item) => (
                      <Autocomplete.Item
                        key={item.value}
                        value={item.value}
                        className="group relative grid h-8 cursor-default select-none grid-cols-[1fr_auto] items-center gap-3 rounded-md px-2 text-base leading-4 text-gray-900 outline-none data-[highlighted]:relative data-[highlighted]:text-gray-900 data-[highlighted]:before:absolute data-[highlighted]:before:inset-0 data-[highlighted]:before:-z-[1] data-[highlighted]:before:rounded data-[highlighted]:before:bg-gray-200 data-[highlighted]:before:content-[''] dark:text-gray-50 dark:data-[highlighted]:before:bg-gray-300/30"
                        onClick={() => handleItemClick(item)}
                      >
                        <span className="font-medium">{item.label}</span>
                        <span className="text-[0.75rem] text-gray-500 group-data-[highlighted]:text-gray-900 dark:text-gray-400 dark:group-data-[highlighted]:text-gray-900">
                          {group.value === 'Suggestions' ? 'Application' : 'Command'}
                        </span>
                      </Autocomplete.Item>
                    )}
                  </Autocomplete.Collection>
                </Autocomplete.Group>
              )}
            </Autocomplete.List>

            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600 dark:border-gray-300 dark:bg-gray-200/10 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <span>Open Application</span>
                <kbd className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded border border-gray-300 bg-gray-100 px-1 text-[0.6875rem] font-medium leading-none text-gray-700 shadow-sm dark:border-gray-300 dark:bg-gray-200/10 dark:text-gray-100">
                  ↵
                </kbd>
              </div>
              <div className="flex items-center gap-2">
                <span>Actions</span>
                <kbd className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded border border-gray-300 bg-gray-100 px-1 text-[0.6875rem] font-medium leading-none text-gray-700 shadow-sm dark:border-gray-300 dark:bg-gray-200/10 dark:text-gray-100">
                  ⌘
                </kbd>
                <kbd className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded border border-gray-300 bg-gray-100 px-1 text-[0.6875rem] font-medium leading-none text-gray-700 shadow-sm dark:border-gray-300 dark:bg-gray-200/10 dark:text-gray-100">
                  K
                </kbd>
              </div>
            </div>
          </Autocomplete.Root>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export interface Item {
  value: string;
  label: string;
}

export interface Group {
  value: string;
  items: Item[];
}

export const suggestions: Item[] = [
  { value: 'linear', label: 'Linear' },
  { value: 'figma', label: 'Figma' },
  { value: 'slack', label: 'Slack' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'raycast', label: 'Raycast' },
];

export const commands: Item[] = [
  { value: 'clipboard-history', label: 'Clipboard History' },
  { value: 'import-extension', label: 'Import Extension' },
  { value: 'create-snippet', label: 'Create Snippet' },
  { value: 'system-preferences', label: 'System Preferences' },
  { value: 'window-management', label: 'Window Management' },
];

export const groupedItems: Group[] = [
  { value: 'Suggestions', items: suggestions },
  { value: 'Commands', items: commands },
];
