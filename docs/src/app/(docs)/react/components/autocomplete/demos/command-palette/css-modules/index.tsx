'use client';
import * as React from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { Autocomplete } from '@base-ui/react/autocomplete';
import { ScrollArea } from '@base-ui/react/scroll-area';
import styles from './index.module.css';

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
      <Dialog.Trigger className={styles.Button}>Open command palette</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.Backdrop} />
        <Dialog.Popup className={styles.Popup} aria-label="Command palette">
          <Autocomplete.Root open items={groupedItems} filter={customFilter} autoHighlight="always">
            <Autocomplete.Input
              className={styles.Input}
              placeholder="Search for apps and commands..."
            />

            <ScrollArea.Root className={styles.ListArea}>
              <ScrollArea.Viewport className={styles.ListViewport}>
                <ScrollArea.Content>
                  <Autocomplete.Empty className={styles.Empty}>
                    No results found.
                  </Autocomplete.Empty>

                  <Autocomplete.List className={styles.List}>
                    {(group: Group) => (
                      <Autocomplete.Group
                        key={group.value}
                        items={group.items}
                        className={styles.Group}
                      >
                        <Autocomplete.GroupLabel className={styles.GroupLabel}>
                          {group.value}
                        </Autocomplete.GroupLabel>
                        <Autocomplete.Collection>
                          {(item: Item) => (
                            <Autocomplete.Item
                              key={item.value}
                              value={item}
                              className={styles.Item}
                              onClick={handleItemClick}
                            >
                              <span className={styles.ItemLabel}>{item.label}</span>
                              <span className={styles.ItemType}>
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
              <ScrollArea.Scrollbar className={styles.Scrollbar}>
                <ScrollArea.Thumb className={styles.ScrollbarThumb} />
              </ScrollArea.Scrollbar>
            </ScrollArea.Root>

            <div className={styles.Footer}>
              <div className={styles.FooterLeft}>
                <span>Open application</span>
                <kbd className={styles.Kbd}>Enter</kbd>
              </div>
              <div className={styles.FooterRight}>
                <span>Actions</span>
                <kbd className={styles.Kbd}>Cmd</kbd>
                <kbd className={styles.Kbd}>K</kbd>
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
];

const commands: Item[] = [
  { value: 'clipboard-history', label: 'Clipboard History' },
  { value: 'import-extension', label: 'Import Extension' },
  { value: 'create-snippet', label: 'Create Snippet' },
  { value: 'system-preferences', label: 'System Preferences' },
  { value: 'window-management', label: 'Window Management' },
];

const groupedItems: Group[] = [
  { value: 'Suggestions', items: suggestions },
  { value: 'Commands', items: commands },
];
