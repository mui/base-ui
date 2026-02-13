'use client';
import * as React from 'react';
import { Autocomplete } from '@base-ui/react/autocomplete';
import { Dialog } from '@base-ui/react/dialog';
import { ScrollArea } from '@base-ui/react/scroll-area';

export default function ExampleAutocompleteCommandPalette() {
  const [open, setOpen] = React.useState(false);

  function handleItemClick() {
    setOpen(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="flex h-10 cursor-default items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
        Open command palette
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black opacity-20 transition-opacity duration-150 ease-[cubic-bezier(0.45,1.005,0,1.005)] data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 dark:opacity-70 supports-[-webkit-touch-callout:none]:absolute" />
        <Dialog.Viewport className="fixed inset-0 flex items-start justify-center overflow-hidden px-2 pt-18 pb-2">
          <Dialog.Popup
            className="relative flex max-h-[min(36rem,calc(100dvh-5rem))] w-[calc(100vw-1rem)] max-w-[28rem] flex-col overflow-hidden rounded-2xl bg-white text-gray-900 outline-1 outline-black/4 shadow-[0_.5px_1px_hsl(0_0%_0%/12%),0_1px_3px_-1px_hsl(0_0%_0%/4%),0_2px_4px_-1px_hsl(0_0%_0%/4%),0_4px_8px_-2px_hsl(0_0%_0%/4%),0_12px_14px_-4px_hsl(0_0%_0%/4%),0_24px_64px_-8px_hsl(0_0%_0%/4%),0_40px_48px_-32px_hsl(0_0%_0%/4%)] transition-[opacity,transform,scale,translate] duration-150 data-ending-style:-translate-y-4 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:-translate-y-4 data-starting-style:scale-95 data-starting-style:opacity-0 dark:bg-[oklch(20%_0.5%_264deg)] dark:outline-white/25"
            aria-label="Command palette"
          >
            <Autocomplete.Root
              open
              inline
              items={groupedItems}
              autoHighlight="always"
              keepHighlight
            >
              <Autocomplete.Input
                className="w-full border-0 border-b border-gray-100 bg-transparent p-4 text-base tracking-[0.016em] text-gray-900 placeholder:text-gray-500 outline-none"
                placeholder="Search for apps and commands..."
              />
              <Dialog.Close className="sr-only">Close command palette</Dialog.Close>

              <ScrollArea.Root className="relative flex max-h-[min(60dvh,24rem)] min-h-0 flex-[0_1_auto] overflow-hidden">
                <ScrollArea.Viewport className="min-h-0 flex-1 overscroll-contain [scroll-padding-block:0.25rem] focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-blue-800">
                  <ScrollArea.Content style={{ minWidth: '100%' }}>
                    <Autocomplete.Empty className="flex min-h-32 items-center justify-center p-4 text-[0.925rem] leading-4 text-gray-600 empty:m-0 empty:min-h-0 empty:p-0">
                      No results found.
                    </Autocomplete.Empty>

                    <Autocomplete.List className="p-2">
                      {(group: Group) => (
                        <Autocomplete.Group
                          key={group.value}
                          items={group.items}
                          className="not-last:mb-1"
                        >
                          <Autocomplete.GroupLabel className="m-0 flex h-8 items-center px-3.5 text-[0.9375rem] tracking-[0.00625em] font-normal leading-none text-gray-600 select-none outline-none">
                            {group.value}
                          </Autocomplete.GroupLabel>
                          <Autocomplete.Collection>
                            {(item: Item) => (
                              <Autocomplete.Item
                                key={item.value}
                                value={item}
                                onClick={handleItemClick}
                                className="grid min-h-8 cursor-default grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md pl-9 pr-3 text-[0.9375rem] tracking-[0.016em] font-normal leading-[1.25] select-none outline-none [scroll-margin-block:0.25rem] data-[highlighted]:bg-gray-100"
                              >
                                <span className="truncate font-normal">{item.label}</span>
                                <span className="shrink-0 whitespace-nowrap text-[0.875rem] tracking-[0.00625em] text-gray-500 data-[highlighted]:text-gray-700">
                                  {group.value === 'Suggestions' ? 'Application' : 'Command'}
                                </span>
                              </Autocomplete.Item>
                            )}
                          </Autocomplete.Collection>
                        </Autocomplete.Group>
                      )}
                    </Autocomplete.List>
                  </ScrollArea.Content>
                </ScrollArea.Viewport>
                <ScrollArea.Scrollbar className="-mr-1 flex w-6 justify-center py-2">
                  <ScrollArea.Thumb className="flex w-full justify-center before:block before:h-full before:w-1 before:rounded-sm before:bg-gray-400 before:content-['']" />
                </ScrollArea.Scrollbar>
              </ScrollArea.Root>

              <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <span>Activate</span>
                  <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-gray-300 bg-gray-100 px-1 text-[0.625rem] font-medium text-gray-700">
                    Enter
                  </kbd>
                </div>
                <div className="flex items-center gap-2">
                  <span>Actions</span>
                  <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-gray-300 bg-gray-100 px-1 text-[0.625rem] font-medium text-gray-700">
                    Cmd
                  </kbd>
                  <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-gray-300 bg-gray-100 px-1 text-[0.625rem] font-medium text-gray-700">
                    K
                  </kbd>
                </div>
              </div>
            </Autocomplete.Root>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface Item {
  value: string;
  label: string;
}

interface Group {
  value: string;
  items: Item[];
}

const suggestions: Item[] = [
  { value: 'linear', label: 'Linear' },
  { value: 'figma', label: 'Figma' },
  { value: 'slack', label: 'Slack' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'raycast', label: 'Raycast' },
  { value: 'notion', label: 'Notion' },
  { value: 'github', label: 'GitHub' },
  { value: 'jira', label: 'Jira' },
  { value: 'calendar', label: 'Google Calendar' },
  { value: 'chrome', label: 'Google Chrome' },
  { value: 'mail', label: 'Apple Mail' },
  { value: 'terminal', label: 'Terminal' },
];

const commands: Item[] = [
  { value: 'clipboard-history', label: 'Clipboard History' },
  { value: 'import-extension', label: 'Import Extension' },
  { value: 'create-snippet', label: 'Create Snippet' },
  { value: 'system-preferences', label: 'System Preferences' },
  { value: 'window-management', label: 'Window Management' },
  { value: 'toggle-dark-mode', label: 'Toggle Dark Mode' },
  { value: 'new-window', label: 'New Window' },
  { value: 'new-tab', label: 'New Tab' },
  { value: 'search-docs', label: 'Search Documentation' },
  { value: 'capture-screen', label: 'Capture Screenshot' },
  { value: 'close-sidebar', label: 'Toggle Sidebar' },
  { value: 'toggle-terminal', label: 'Toggle Integrated Terminal' },
  { value: 'run-script', label: 'Run Script' },
];

const groupedItems: Group[] = [
  { value: 'Suggestions', items: suggestions },
  { value: 'Commands', items: commands },
];
