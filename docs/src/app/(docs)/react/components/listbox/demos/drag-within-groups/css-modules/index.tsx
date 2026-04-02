'use client';
import * as React from 'react';
import { Listbox } from '@base-ui/react/listbox';
import styles from './index.module.css';

interface Item {
  title: string;
  artist: string;
  value: string;
  group: string;
}

const initialItems: Item[] = [
  { title: 'Billie Jean', artist: 'Michael Jackson', value: 'billie-jean', group: 'Pop' },
  { title: 'Dancing Queen', artist: 'ABBA', value: 'dancing-queen', group: 'Pop' },
  { title: 'Like a Prayer', artist: 'Madonna', value: 'like-a-prayer', group: 'Pop' },
  { title: 'Hotel California', artist: 'Eagles', value: 'hotel-california', group: 'Rock' },
  {
    title: 'Smells Like Teen Spirit',
    artist: 'Nirvana',
    value: 'smells-like-teen-spirit',
    group: 'Rock',
  },
  { title: 'Back in Black', artist: 'AC/DC', value: 'back-in-black', group: 'Rock' },
];

export default function ExampleListboxDragWithinGroups() {
  const [items, setItems] = React.useState(initialItems);
  const groups = React.useMemo(() => groupItems(items), [items]);

  return (
    <div className={styles.Field}>
      <Listbox.Root defaultValue={['billie-jean']}>
        <Listbox.Label className={styles.Label}>Playlist</Listbox.Label>
        <Listbox.DragAndDropProvider
          canDrop={(sourceItems, targetItem) =>
            sourceItems.every((item) => item.groupId === targetItem.groupId)
          }
          onItemsReorder={(event) => {
            setItems((prev) => reorderItems(prev, event));
          }}
        >
          <Listbox.List className={styles.List}>
            {groups.map((group) => (
              <Listbox.Group key={group.label} className={styles.Group}>
                <Listbox.GroupLabel className={styles.GroupLabel}>{group.label}</Listbox.GroupLabel>
                {group.items.map(({ title, artist, value }) => (
                  <Listbox.Item key={value} value={value} className={styles.Item}>
                    <Listbox.ItemDragHandle className={styles.DragHandle}>
                      <GripIcon />
                    </Listbox.ItemDragHandle>
                    <Listbox.ItemIndicator className={styles.ItemIndicator}>
                      <CheckIcon className={styles.ItemIndicatorIcon} />
                    </Listbox.ItemIndicator>
                    <Listbox.ItemText className={styles.ItemText}>
                      <span className={styles.ItemTitle}>{title}</span>
                      <span className={styles.ItemArtist}>{artist}</span>
                    </Listbox.ItemText>
                  </Listbox.Item>
                ))}
              </Listbox.Group>
            ))}
          </Listbox.List>
        </Listbox.DragAndDropProvider>
      </Listbox.Root>
    </div>
  );
}

function groupItems(items: Item[]) {
  const groups: Array<{ label: string; items: Item[] }> = [];

  for (const item of items) {
    const lastGroup = groups.at(-1);

    if (lastGroup?.label === item.group) {
      lastGroup.items.push(item);
      continue;
    }

    groups.push({ label: item.group, items: [item] });
  }

  return groups;
}

function reorderItems(
  items: Item[],
  event: {
    items: string[];
    referenceItem: string;
    edge: 'before' | 'after';
  },
) {
  const movedValues = new Set(event.items);
  const movedItems = items.filter((item) => movedValues.has(item.value));
  const rest = items.filter((item) => !movedValues.has(item.value));
  const referenceIndex = rest.findIndex((item) => item.value === event.referenceItem);

  rest.splice(event.edge === 'after' ? referenceIndex + 1 : referenceIndex, 0, ...movedItems);

  return rest;
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
