import * as React from 'react';
import { Dialog } from '@base-ui-components/react/dialog';
import { Autocomplete } from '@base-ui-components/react/autocomplete';
import styles from './index.module.css';

export default function ExampleCommandPalette() {
  const [open, setOpen] = React.useState(false);

  function handleItemClick(item: Item) {
    // eslint-disable-next-line no-console
    console.log('Command executed:', item);
    setOpen(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className={styles.Button}>Open Command Palette</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.Backdrop} />
        <Dialog.Popup className={styles.Popup} aria-label="Command Palette">
          <Autocomplete.Root open items={groupedItems} autoHighlight>
            <Autocomplete.Input
              className={styles.Input}
              placeholder="Search for apps and commands..."
            />

            <Autocomplete.Empty className={styles.Empty}>No results found.</Autocomplete.Empty>

            <Autocomplete.List className={styles.List}>
              {(group: Group) => (
                <Autocomplete.Group key={group.value} items={group.items} className={styles.Group}>
                  <Autocomplete.GroupLabel className={styles.GroupLabel}>
                    {group.value}
                  </Autocomplete.GroupLabel>
                  <Autocomplete.Collection>
                    {(item: Item) => (
                      <Autocomplete.Item
                        key={item.value}
                        value={item.value}
                        className={styles.Item}
                        onClick={() => handleItemClick(item)}
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

            <div className={styles.Footer}>
              <div className={styles.FooterLeft}>
                <span>Open Application</span>
                <kbd className={styles.Kbd}>↵</kbd>
              </div>
              <div className={styles.FooterRight}>
                <span>Actions</span>
                <kbd className={styles.Kbd}>⌘</kbd>
                <kbd className={styles.Kbd}>K</kbd>
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
