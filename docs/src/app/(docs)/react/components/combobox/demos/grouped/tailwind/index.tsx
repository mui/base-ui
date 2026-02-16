'use client';
import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';

export default function ExampleGroupedCombobox() {
  const id = React.useId();
  return (
    <Combobox.Root items={groupedProduce}>
      <div className="relative flex flex-col gap-1 text-sm leading-5 font-medium text-gray-900">
        <label htmlFor={id}>Select produce</label>
        <div className="relative [&>input]:pr-[calc(0.5rem+1.5rem)] has-[.combobox-clear]:[&>input]:pr-[calc(0.5rem+1.5rem*2)]">
          <Combobox.Input
            placeholder="e.g. Mango"
            id={id}
            className="bg-[canvas] h-10 w-[16rem] rounded-md border border-gray-200 pl-3.5 text-base font-normal text-gray-900 focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
          />
          <div className="absolute right-2 bottom-0 flex h-10 items-center justify-center text-gray-600">
            <Combobox.Clear
              className="combobox-clear flex h-10 w-6 items-center justify-center rounded-sm bg-transparent p-0"
              aria-label="Clear selection"
            >
              <ClearIcon className="size-4" />
            </Combobox.Clear>
            <Combobox.Trigger
              className="flex h-10 w-6 items-center justify-center rounded-sm bg-transparent p-0"
              aria-label="Open popup"
            >
              <ChevronDownIcon className="size-4" />
            </Combobox.Trigger>
          </div>
        </div>
      </div>

      <Combobox.Portal>
        <Combobox.Positioner className="outline-hidden" sideOffset={4}>
          <Combobox.Popup className="w-[var(--anchor-width)] max-h-[23rem] max-w-[var(--available-width)] origin-[var(--transform-origin)] overflow-hidden rounded-md bg-[canvas] pt-0 text-gray-900 shadow-lg shadow-gray-200 outline-1 outline-gray-200 transition-[transform,scale,opacity] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 dark:shadow-none dark:outline-gray-300 duration-100">
            <Combobox.Empty className="p-4 text-[0.925rem] leading-4 text-gray-600 empty:m-0 empty:p-0">
              No produce found.
            </Combobox.Empty>
            <Combobox.List className="outline-0 overflow-y-auto scroll-pt-[2.25rem] scroll-pb-[0.5rem] overscroll-contain max-h-[min(23rem,var(--available-height))]">
              {(group: ProduceGroup) => (
                <Combobox.Group key={group.value} items={group.items} className="block pb-2">
                  <Combobox.GroupLabel className="sticky top-0 z-[1] mb-0 mr-2 mt-0 ml-0 w-[calc(100%-0.5rem)] bg-[canvas] pr-4 pl-[2.25rem] pt-3 pb-1 text-[0.7rem] font-semibold uppercase tracking-wider">
                    {group.value}
                  </Combobox.GroupLabel>
                  <Combobox.Collection>
                    {(item: Produce) => (
                      <Combobox.Item
                        key={item.id}
                        className="grid cursor-default grid-cols-[0.75rem_1fr] items-center gap-2 py-2 pr-8 pl-4 text-base leading-4 outline-hidden select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-2 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-xs data-[highlighted]:before:bg-gray-900"
                        value={item}
                      >
                        <Combobox.ItemIndicator className="col-start-1 flex items-center justify-center">
                          <CheckIcon className="size-3" />
                        </Combobox.ItemIndicator>
                        <div className="col-start-2">{item.label}</div>
                      </Combobox.Item>
                    )}
                  </Combobox.Collection>
                </Combobox.Group>
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

function ClearIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

function ChevronDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

interface Produce {
  id: string;
  label: string;
  group: 'Fruits' | 'Vegetables';
}

interface ProduceGroup {
  value: string;
  items: Produce[];
}

const produceData: Produce[] = [
  { id: 'fruit-apple', label: 'Apple', group: 'Fruits' },
  { id: 'fruit-banana', label: 'Banana', group: 'Fruits' },
  { id: 'fruit-mango', label: 'Mango', group: 'Fruits' },
  { id: 'fruit-kiwi', label: 'Kiwi', group: 'Fruits' },
  { id: 'fruit-grape', label: 'Grape', group: 'Fruits' },
  { id: 'fruit-orange', label: 'Orange', group: 'Fruits' },
  { id: 'fruit-strawberry', label: 'Strawberry', group: 'Fruits' },
  { id: 'fruit-watermelon', label: 'Watermelon', group: 'Fruits' },
  { id: 'veg-broccoli', label: 'Broccoli', group: 'Vegetables' },
  { id: 'veg-carrot', label: 'Carrot', group: 'Vegetables' },
  { id: 'veg-cauliflower', label: 'Cauliflower', group: 'Vegetables' },
  { id: 'veg-cucumber', label: 'Cucumber', group: 'Vegetables' },
  { id: 'veg-kale', label: 'Kale', group: 'Vegetables' },
  { id: 'veg-pepper', label: 'Bell pepper', group: 'Vegetables' },
  { id: 'veg-spinach', label: 'Spinach', group: 'Vegetables' },
  { id: 'veg-zucchini', label: 'Zucchini', group: 'Vegetables' },
];

function groupProduce(items: Produce[]): ProduceGroup[] {
  const groups: Record<string, Produce[]> = {};
  items.forEach((item) => {
    (groups[item.group] ??= []).push(item);
  });
  const order = ['Fruits', 'Vegetables'];
  return order.map((value) => ({ value, items: groups[value] ?? [] }));
}

const groupedProduce: ProduceGroup[] = groupProduce(produceData);
