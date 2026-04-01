'use client';
import * as React from 'react';
import { Listbox } from '@base-ui/react/listbox';

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
  { label: 'IBM Plex Mono', value: 'ibm-plex-mono', group: 'Monospace' },
];

export default function ExampleListboxDragWithinGroups() {
  const [items, setItems] = React.useState(initialItems);
  const groups = React.useMemo(() => groupItems(items), [items]);

  return (
    <div className="flex flex-col gap-1">
      <Listbox.Root defaultValue={['die-grotesk']}>
        <Listbox.Label className="cursor-default text-sm leading-5 font-medium text-gray-900">
          Reorder within groups
        </Listbox.Label>
        <Listbox.DragAndDropProvider
          canDrop={(sourceItems, targetItem) =>
            sourceItems.every((item) => item.groupId === targetItem.groupId)
          }
          onItemsReorder={(event) => {
            setItems((prev) => reorderItems(prev, event));
          }}
        >
          <Listbox.List className="box-border w-56 max-h-96 overflow-y-auto rounded-md py-1 outline outline-1 outline-gray-200 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 dark:outline-gray-300">
            {groups.map((group) => (
              <Listbox.Group key={group.label} className="block pb-0.5">
                <Listbox.GroupLabel className="cursor-default px-4 pt-2 pb-1 pl-10 text-[0.6875rem] font-semibold uppercase tracking-wider text-gray-600">
                  {group.label}
                </Listbox.GroupLabel>
                {group.items.map(({ label, value }) => (
                  <Listbox.Item
                    key={value}
                    value={value}
                    className="relative grid cursor-default grid-cols-[1.5rem_0.75rem_1fr] items-center gap-1.5 py-2 pr-4 pl-1 text-sm leading-4 text-gray-900 outline-hidden select-none data-[highlighted]:z-0 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-xs data-[highlighted]:before:bg-gray-100 data-[dragging]:opacity-50 data-[drop-target-edge=before]:after:absolute data-[drop-target-edge=before]:after:top-[-1px] data-[drop-target-edge=before]:after:left-1 data-[drop-target-edge=before]:after:right-1 data-[drop-target-edge=before]:after:h-0.5 data-[drop-target-edge=before]:after:bg-blue-800 data-[drop-target-edge=before]:after:content-[''] data-[drop-target-edge=after]:after:absolute data-[drop-target-edge=after]:after:right-1 data-[drop-target-edge=after]:after:bottom-[-1px] data-[drop-target-edge=after]:after:left-1 data-[drop-target-edge=after]:after:h-0.5 data-[drop-target-edge=after]:after:bg-blue-800 data-[drop-target-edge=after]:after:content-[''] pointer-coarse:py-2.5 pointer-coarse:text-[0.925rem]"
                  >
                    <Listbox.ItemDragHandle className="col-start-1 flex w-6 shrink-0 items-center justify-center cursor-grab text-gray-400 active:cursor-grabbing">
                      <GripIcon />
                    </Listbox.ItemDragHandle>
                    <Listbox.ItemIndicator className="col-start-2">
                      <CheckIcon className="size-3" />
                    </Listbox.ItemIndicator>
                    <Listbox.ItemText className="col-start-3">{label}</Listbox.ItemText>
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
