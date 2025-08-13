import * as React from 'react';
import { Dialog } from '@base-ui-components/react/dialog';
import { FilterableMenu } from '@base-ui-components/react/filterable-menu';
import styles from './index.module.css';
import { type Item, type Group, groupedItems } from './data';

export default function ExampleCommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');

  const { contains } = FilterableMenu.useFilter({ sensitivity: 'base' });

  const customFilter = React.useCallback(
    (item: Item, query: string) => {
      return contains(item.label, query);
    },
    [contains],
  );

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
      <Dialog.Trigger className={styles.Button}>Open Command Palette</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.Backdrop} />
        <Dialog.Popup className={styles.Popup} aria-label="Command Palette">
          <FilterableMenu.Root
            items={groupedItems}
            inputValue={searchValue}
            onInputValueChange={setSearchValue}
            filter={customFilter}
          >
            <FilterableMenu.Input
              className={styles.Input}
              placeholder="Search for apps and commands..."
            />

            <FilterableMenu.Empty className={styles.Empty}>No results found.</FilterableMenu.Empty>

            <FilterableMenu.List className={styles.List}>
              {(group: Group) => (
                <FilterableMenu.Group
                  key={group.value}
                  items={group.items}
                  className={styles.Group}
                >
                  <FilterableMenu.GroupLabel className={styles.GroupLabel}>
                    {group.value}
                  </FilterableMenu.GroupLabel>
                  <FilterableMenu.Collection>
                    {(item: Item) => (
                      <FilterableMenu.Item
                        key={item.value}
                        value={item.value}
                        className={styles.Item}
                        onClick={() => handleItemClick(item)}
                      >
                        <span className={styles.ItemLabel}>{item.label}</span>
                        <span className={styles.ItemType}>
                          {group.value === 'Suggestions' ? 'Application' : 'Command'}
                        </span>
                      </FilterableMenu.Item>
                    )}
                  </FilterableMenu.Collection>
                </FilterableMenu.Group>
              )}
            </FilterableMenu.List>

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
          </FilterableMenu.Root>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
