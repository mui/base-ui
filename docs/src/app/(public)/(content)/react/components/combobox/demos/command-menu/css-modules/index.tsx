import * as React from 'react';
import { Dialog } from '@base-ui-components/react/dialog';
import { Combobox } from '@base-ui-components/react/combobox';
import styles from './index.module.css';
import { type Item, type Group, groupedItems } from './data';

function customFilter(item: Item, query: string) {
  if (!query.trim()) {
    return true;
  }

  const itemText = item.label.toLowerCase();
  const queryWords = query.toLowerCase().trim().split(/\s+/);

  return queryWords.every((word) => itemText.includes(word));
}

export default function CommandMenuCombobox() {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');

  function handleItemClick(item: Item) {
    // eslint-disable-next-line no-console
    console.log('Command executed:', item);
    setOpen(false);
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) {
          setSearchValue('');
        }
      }}
    >
      <Dialog.Trigger className={styles.Button}>Open Command Menu</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.Backdrop} />
        <Dialog.Popup className={styles.Popup} aria-label="Command menu">
          <Combobox.Root
            items={groupedItems}
            value={searchValue}
            onValueChange={setSearchValue}
            filter={customFilter}
          >
            <Combobox.Input
              className={styles.Input}
              placeholder="Search for apps and commands..."
            />

            <Combobox.Empty className={styles.Empty}>No results found.</Combobox.Empty>

            <Combobox.List className={styles.List}>
              {(group: Group) => (
                <Combobox.Group key={group.value} items={group.items} className={styles.Group}>
                  <Combobox.GroupLabel className={styles.GroupLabel}>
                    {group.value}
                  </Combobox.GroupLabel>
                  <Combobox.Collection>
                    {(item: Item) => (
                      <Combobox.Item
                        key={item.value}
                        value={item.value}
                        className={styles.Item}
                        onClick={() => handleItemClick(item)}
                      >
                        <span className={styles.ItemLabel}>{item.label}</span>
                        <span className={styles.ItemType}>
                          {group.value === 'Suggestions' ? 'Application' : 'Command'}
                        </span>
                      </Combobox.Item>
                    )}
                  </Combobox.Collection>
                </Combobox.Group>
              )}
            </Combobox.List>

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
          </Combobox.Root>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
