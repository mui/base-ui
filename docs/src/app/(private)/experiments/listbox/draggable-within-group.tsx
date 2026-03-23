'use client';
import * as React from 'react';
import { Listbox } from '@base-ui/react/listbox';
import styles from './listbox.module.css';

const initialGroups = [
  {
    label: 'Letters',
    items: [
      { label: 'A', value: 'a' },
      { label: 'B', value: 'b' },
      { label: 'C', value: 'c' },
      { label: 'D', value: 'd' },
    ],
  },
  {
    label: 'Numbers',
    items: [
      { label: '1', value: '1' },
      { label: '2', value: '2' },
      { label: '3', value: '3' },
      { label: '4', value: '4' },
    ],
  },
  {
    label: 'Symbols',
    items: [
      { label: '@', value: 'at' },
      { label: '#', value: 'hash' },
      { label: '&', value: 'amp' },
    ],
  },
];

export default function DraggableWithinGroupListbox() {
  const [groups, setGroups] = React.useState(initialGroups);

  function handleReorder(event: {
    items: string[];
    referenceItem: string;
    edge: 'before' | 'after';
  }) {
    const movedValue = event.items[0];

    setGroups((prev) => {
      // Find the group containing the moved item
      const sourceGroupIdx = prev.findIndex((g) => g.items.some((i) => i.value === movedValue));
      if (sourceGroupIdx === -1) {
        return prev;
      }

      const sourceGroup = prev[sourceGroupIdx];
      const movedItem = sourceGroup.items.find((i) => i.value === movedValue)!;
      const filteredItems = sourceGroup.items.filter((i) => i.value !== movedValue);
      const refIndex = filteredItems.findIndex((i) => i.value === event.referenceItem);
      const insertAt = event.edge === 'after' ? refIndex + 1 : refIndex;
      filteredItems.splice(insertAt, 0, movedItem);

      const next = [...prev];
      next[sourceGroupIdx] = { ...sourceGroup, items: filteredItems };
      return next;
    });
  }

  return (
    <div className={styles.Wrapper}>
      <div className={styles.Section}>
        <span className={styles.SectionTitle}>
          Items can only be reordered within their group
        </span>
        <div className={styles.Field}>
          <Listbox.Root defaultValue={["a"]} onItemsReorder={handleReorder}>
            <Listbox.Label className={styles.Label}>Constrained reorder</Listbox.Label>
            <Listbox.List className={styles.List}>
              {groups.map((group) => (
                <Listbox.Group key={group.label} className={styles.Group}>
                  <Listbox.GroupLabel className={styles.GroupLabel}>
                    {group.label}
                  </Listbox.GroupLabel>
                  {group.items.map(({ label, value }) => (
                    <Listbox.Item
                      key={value}
                      value={value}
                      draggable="within-group"
                      className={styles.DraggableItemWithHandle}
                    >
                      <Listbox.ItemDragHandle className={styles.DragHandle}>
                        <GripIcon />
                      </Listbox.ItemDragHandle>
                      <Listbox.ItemIndicator className={styles.HandleItemIndicator}>
                        <CheckIcon className={styles.ItemIndicatorIcon} />
                      </Listbox.ItemIndicator>
                      <Listbox.ItemText className={styles.HandleItemText}>
                        {label}
                      </Listbox.ItemText>
                    </Listbox.Item>
                  ))}
                </Listbox.Group>
              ))}
            </Listbox.List>
          </Listbox.Root>
        </div>
      </div>
    </div>
  );
}

function GripIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="8"
      height="14"
      viewBox="0 0 8 14"
      fill="currentcolor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="2" cy="2" r="1.25" />
      <circle cx="6" cy="2" r="1.25" />
      <circle cx="2" cy="7" r="1.25" />
      <circle cx="6" cy="7" r="1.25" />
      <circle cx="2" cy="12" r="1.25" />
      <circle cx="6" cy="12" r="1.25" />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}
