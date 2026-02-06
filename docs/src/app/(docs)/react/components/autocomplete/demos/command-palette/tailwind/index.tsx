'use client';
import * as React from 'react';
import { Autocomplete } from '@base-ui/react/autocomplete';
import { Dialog } from '@base-ui/react/dialog';
import { ScrollArea } from '@base-ui/react/scroll-area';

export default function ExampleAutocompleteCommandPalette() {
  const [open, setOpen] = React.useState(false);
  const { contains } = Autocomplete.useFilter();

  const customFilter = React.useCallback(
    (item: Item, query: string) => contains(item.label, query),
    [contains],
  );

  function handleItemClick() {
    setOpen(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
        Open command palette
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black opacity-20 transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 dark:opacity-70 supports-[-webkit-touch-callout:none]:absolute" />
        <Dialog.Popup
          className="fixed top-1/2 left-1/2 flex max-h-[min(44rem,calc(100dvh-1rem))] w-[calc(100vw-1rem)] max-w-[28rem] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white text-gray-900 outline-1 outline-black/4 shadow-[0_.5px_1px_hsl(0_0%_0%/12%),0_1px_3px_-1px_hsl(0_0%_0%/4%),0_2px_4px_-1px_hsl(0_0%_0%/4%),0_4px_8px_-2px_hsl(0_0%_0%/4%),0_12px_14px_-4px_hsl(0_0%_0%/4%),0_24px_64px_-8px_hsl(0_0%_0%/4%),0_40px_48px_-32px_hsl(0_0%_0%/4%)] transition-[transform,opacity] duration-150 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0 dark:bg-[oklch(20%_0.5%_264deg)] dark:outline-white/25"
          aria-label="Command palette"
        >
          <Autocomplete.Root
            open
            inline
            items={groupedItems}
            filter={customFilter}
            autoHighlight="always"
            keepHighlight
          >
            <Autocomplete.Input
              className="w-full border-0 border-b border-gray-100 bg-transparent p-4 text-base tracking-[0.016em] text-gray-900 placeholder:text-gray-500 outline-none"
              placeholder="Search for apps and commands..."
            />
            <Dialog.Close className="sr-only">Close command palette</Dialog.Close>

            <ScrollArea.Root className="relative flex h-[min(70dvh,30rem)] min-h-0 flex-1 overflow-hidden">
              <ScrollArea.Viewport className="min-h-0 flex-1 overscroll-contain focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-blue-800">
                <ScrollArea.Content style={{ minWidth: '100%' }}>
                  <Autocomplete.Empty className="flex min-h-[min(70dvh,30rem)] items-center justify-center p-4 text-[0.925rem] leading-4 text-gray-600 empty:m-0 empty:min-h-0 empty:p-0">
                    No results found.
                  </Autocomplete.Empty>

                  <Autocomplete.List className="p-2">
                    {(group: Group) => (
                      <Autocomplete.Group
                        key={group.value}
                        items={group.items}
                        className="not-last:mb-2"
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
                              className="grid min-h-[1.875rem] cursor-default grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg pl-9 pr-2 text-[0.9375rem] tracking-[0.016em] font-normal leading-[1.25] select-none outline-none data-[highlighted]:bg-gray-100"
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
              <ScrollArea.Scrollbar className="pointer-events-none absolute m-1 flex w-[0.25rem] justify-center rounded-[1rem] opacity-0 transition-opacity duration-[250ms] data-[hovering]:pointer-events-auto data-[hovering]:opacity-100 data-[hovering]:duration-[75ms] data-[scrolling]:pointer-events-auto data-[scrolling]:opacity-100 data-[scrolling]:duration-[75ms] md:w-[0.325rem]">
                <ScrollArea.Thumb className="w-full rounded-[inherit] bg-gray-500 before:absolute before:left-1/2 before:top-1/2 before:h-[calc(100%+1rem)] before:w-[calc(100%+1rem)] before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']" />
              </ScrollArea.Scrollbar>
            </ScrollArea.Root>

            <div className="flex items-center justify-between border-t border-gray-100 bg-white px-3 py-2.5 text-xs text-gray-500">
              <div className="flex items-center gap-3">
                <span>Activate</span>
                <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-gray-300 bg-gray-50 px-1 text-[0.625rem] font-medium text-gray-600">
                  Enter
                </kbd>
              </div>
              <div className="flex items-center gap-3">
                <span>Actions</span>
                <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-gray-300 bg-gray-50 px-1 text-[0.625rem] font-medium text-gray-600">
                  Cmd
                </kbd>
                <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-gray-300 bg-gray-50 px-1 text-[0.625rem] font-medium text-gray-600">
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
  { value: 'drive', label: 'Google Drive' },
  { value: 'spotify', label: 'Spotify' },
  { value: 'chrome', label: 'Google Chrome' },
  { value: 'mail', label: 'Apple Mail' },
  { value: 'terminal', label: 'Terminal' },
  { value: 'notes', label: 'Notes' },
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
  { value: 'open-recent', label: 'Open Recent Project' },
  { value: 'close-sidebar', label: 'Toggle Sidebar' },
  { value: 'toggle-terminal', label: 'Toggle Integrated Terminal' },
  { value: 'run-tests', label: 'Run Test Suite' },
  { value: 'sync-settings', label: 'Sync Settings' },
];

const groupedItems: Group[] = [
  { value: 'Suggestions', items: suggestions },
  { value: 'Commands', items: commands },
];
