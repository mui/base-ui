'use client';
import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { Dialog } from '@base-ui/react/dialog';
import styles from './index.module.css';

export default function ExampleComboboxDialogInline() {
  const [open, setOpen] = React.useState(false);
  const id = React.useId();

  return (
    <Combobox.Root
      items={fruits}
      inline
      open={open}
      onOpenChange={setOpen}
      itemToStringLabel={(fruit: Fruit) => fruit.label}
    >
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger className={styles.Button}>
          <Combobox.Value>
            {(value: Fruit | null) => value?.label ?? 'Choose a fruit'}
          </Combobox.Value>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop className={styles.Backdrop} />
          <Dialog.Popup className={styles.Popup}>
            <Dialog.Title className={styles.Title}>Choose a fruit</Dialog.Title>
            <Dialog.Description className={styles.Description}>
              Pick a fruit to add to your basket.
            </Dialog.Description>
            <div className={styles.Field}>
              <label className={styles.Label} htmlFor={id}>
                Fruit
              </label>
              <Combobox.Input placeholder="e.g. Apple" id={id} className={styles.Input} />
            </div>
            <div className={styles.Listbox}>
              <Combobox.Empty className={styles.Empty}>No fruits found.</Combobox.Empty>
              <Combobox.List className={styles.List}>
                {(item: Fruit) => (
                  <Combobox.Item key={item.value} value={item} className={styles.Item}>
                    <Combobox.ItemIndicator className={styles.ItemIndicator}>
                      <CheckIcon className={styles.ItemIndicatorIcon} />
                    </Combobox.ItemIndicator>
                    <div className={styles.ItemText}>{item.label}</div>
                  </Combobox.Item>
                )}
              </Combobox.List>
            </div>
            <div className={styles.Actions}>
              <Dialog.Close className={styles.Button}>Done</Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
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

interface Fruit {
  label: string;
  value: string;
}

const fruits: Fruit[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Orange', value: 'orange' },
  { label: 'Pineapple', value: 'pineapple' },
  { label: 'Grape', value: 'grape' },
  { label: 'Mango', value: 'mango' },
  { label: 'Strawberry', value: 'strawberry' },
  { label: 'Blueberry', value: 'blueberry' },
  { label: 'Raspberry', value: 'raspberry' },
  { label: 'Blackberry', value: 'blackberry' },
  { label: 'Cherry', value: 'cherry' },
  { label: 'Peach', value: 'peach' },
  { label: 'Pear', value: 'pear' },
  { label: 'Plum', value: 'plum' },
  { label: 'Kiwi', value: 'kiwi' },
  { label: 'Watermelon', value: 'watermelon' },
  { label: 'Cantaloupe', value: 'cantaloupe' },
  { label: 'Honeydew', value: 'honeydew' },
  { label: 'Papaya', value: 'papaya' },
  { label: 'Guava', value: 'guava' },
  { label: 'Lychee', value: 'lychee' },
  { label: 'Pomegranate', value: 'pomegranate' },
  { label: 'Apricot', value: 'apricot' },
  { label: 'Grapefruit', value: 'grapefruit' },
  { label: 'Passionfruit', value: 'passionfruit' },
];
