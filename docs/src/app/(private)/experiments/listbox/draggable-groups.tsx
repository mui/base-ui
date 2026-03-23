'use client';
import * as React from 'react';
import { Listbox } from '@base-ui/react/listbox';
import styles from './listbox.module.css';

interface Item {
  label: string;
  value: string;
  group: string;
}

const initialItems: Item[] = [
  { label: 'Die Grotesk', value: 'die-grotesk', group: 'Sans-serif' },
  { label: 'Roboto', value: 'roboto', group: 'Sans-serif' },
  { label: 'Open Sans', value: 'open-sans', group: 'Sans-serif' },
  { label: 'JetBrains Mono', value: 'jetbrains-mono', group: 'Monospace' },
  { label: 'Fira Code', value: 'fira-code', group: 'Monospace' },
  { label: 'Source Code Pro', value: 'source-code-pro', group: 'Monospace' },
  { label: 'Merriweather', value: 'merriweather', group: 'Serif' },
  { label: 'Playfair Display', value: 'playfair-display', group: 'Serif' },
];

function groupItems(items: Item[]) {
  const groups: { label: string; items: Item[] }[] = [];
  for (const item of items) {
    let group = groups.find((g) => g.label === item.group);
    if (!group) {
      group = { label: item.group, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  }
  return groups;
}

export default function DraggableGroupsListbox() {
  const [items, setItems] = React.useState(initialItems);
  const groups = groupItems(items);

  return (
    <div className={styles.Wrapper}>
      <div className={styles.Section}>
        <span className={styles.SectionTitle}>
          Drag and drop with groups (items can cross groups)
        </span>
        <div className={styles.Field}>
          <Listbox.Root
            defaultValue={["die-grotesk"]}
            onItemsReorder={(event) => {
              setItems((prev) => {
                const movedValue = event.items[0] as string;
                const movedItem = prev.find((item) => item.value === movedValue)!;
                const refItem = prev.find((item) => item.value === event.referenceItem)!;
                // Move to the reference item's group
                const updated = { ...movedItem, group: refItem.group };
                const next = prev.filter((item) => item.value !== movedValue);
                const refIndex = next.findIndex((item) => item.value === event.referenceItem);
                next.splice(event.edge === 'after' ? refIndex + 1 : refIndex, 0, updated);
                return next;
              });
            }}
          >
            <Listbox.Label className={styles.Label}>Font family</Listbox.Label>
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
                      draggable
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
