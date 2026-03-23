'use client';
import * as React from 'react';
import { Listbox } from '@base-ui/react/listbox';
import styles from './listbox.module.css';

const initialItems = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry' },
  { label: 'Date', value: 'date' },
  { label: 'Elderberry', value: 'elderberry' },
  { label: 'Fig', value: 'fig' },
  { label: 'Grape', value: 'grape' },
];

export default function DraggableItemsListbox() {
  const [items, setItems] = React.useState(initialItems);

  return (
    <div className={styles.Wrapper}>
      <div className={styles.Section}>
        <span className={styles.SectionTitle}>
          Whole item is draggable (no drag handle)
        </span>
        <div className={styles.Field}>
          <Listbox.Root
            defaultValue={["cherry"]}
            onItemsReorder={(event) => {
              setItems((prev) => {
                const movedValues = new Set(event.items);
                const movedItems = prev.filter((item) => movedValues.has(item.value));
                const rest = prev.filter((item) => !movedValues.has(item.value));
                const refIndex = rest.findIndex((item) => item.value === event.referenceItem);
                rest.splice(event.edge === 'after' ? refIndex + 1 : refIndex, 0, ...movedItems);
                return rest;
              });
            }}
          >
            <Listbox.Label className={styles.Label}>Fruits</Listbox.Label>
            <Listbox.List className={styles.List}>
              {items.map(({ label, value }) => (
                <Listbox.Item
                  key={value}
                  value={value}
                  draggable
                  className={styles.DraggableItem}
                >
                  <Listbox.ItemIndicator className={styles.DraggableItemIndicator}>
                    <CheckIcon className={styles.ItemIndicatorIcon} />
                  </Listbox.ItemIndicator>
                  <Listbox.ItemText className={styles.DraggableItemText}>
                    {label}
                  </Listbox.ItemText>
                </Listbox.Item>
              ))}
            </Listbox.List>
          </Listbox.Root>
        </div>
        <span className={styles.SectionTitle}>
          Try Alt+Arrow to reorder with keyboard
        </span>
      </div>
    </div>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}
