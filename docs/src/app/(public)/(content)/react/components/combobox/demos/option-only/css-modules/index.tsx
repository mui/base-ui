import * as React from 'react';
import { Combobox } from '@base-ui-components/react/combobox';
import styles from './index.module.css';
import { options } from './data';

export default function OptionOnlyCombobox() {
  const [searchValue, setSearchValue] = React.useState('');
  const [selectedValue, setSelectedValue] = React.useState('');
  const [open, setOpen] = React.useState(false);

  // Show all items when query is empty or matches current selection
  const customFilter = React.useCallback(
    (item: string, query: string) => {
      const q = query.trim().toLowerCase();
      if (q === '' || q === selectedValue.toLowerCase()) {
        return true;
      }
      return item.toLowerCase().includes(q);
    },
    [selectedValue],
  );

  return (
    <Combobox.Root
      items={options}
      select="single"
      selectedValue={selectedValue}
      onSelectedValueChange={(nextValue) => {
        setSelectedValue(nextValue);
        setSearchValue(nextValue);
        setOpen(false);
      }}
      value={searchValue}
      onValueChange={setSearchValue}
      filter={customFilter}
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(nextOpen) => {
        if (!nextOpen) {
          setSearchValue(selectedValue);
        }
      }}
    >
      <label className={styles.Label}>
        Choose a fruit
        <Combobox.Input placeholder="e.g. Apple" className={styles.Input} />
      </label>

      <Combobox.Portal>
        <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
          <Combobox.Popup className={styles.Popup}>
            <Combobox.Empty className={styles.Empty}>
              No fruits found.
            </Combobox.Empty>
            <Combobox.List className={styles.List}>
              {(item: string) => (
                <Combobox.Item key={item} value={item} className={styles.Item}>
                  <Combobox.ItemIndicator className={styles.ItemIndicator}>
                    <CheckIcon className={styles.ItemIndicatorIcon} />
                  </Combobox.ItemIndicator>
                  <div className={styles.ItemText}>{item}</div>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}
