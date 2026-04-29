'use client';
import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';

export default function ExampleComboboxInline() {
  const id = React.useId();
  return (
    <Combobox.Root items={fruits} multiple inline open>
      <div className="flex w-64 flex-col gap-2 text-sm leading-5 font-medium text-gray-900">
        <div className="flex flex-col gap-1">
          <label htmlFor={id}>Choose fruits</label>
          <Combobox.Chips className="flex flex-wrap items-center gap-1 rounded-md border border-gray-200 bg-[canvas] px-1.5 py-1 text-base font-normal focus-within:outline focus-within:outline-2 focus-within:-outline-offset-1 focus-within:outline-blue-800">
            <Combobox.Value>
              {(value: Fruit[]) => (
                <React.Fragment>
                  {value.map((fruit) => (
                    <Combobox.Chip
                      key={fruit.value}
                      className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-sm text-gray-900 outline-none data-[highlighted]:bg-blue-800 data-[highlighted]:text-gray-50"
                      aria-label={fruit.label}
                    >
                      {fruit.label}
                      <Combobox.ChipRemove
                        className="flex size-5 items-center justify-center rounded text-gray-600 hover:bg-gray-200"
                        aria-label="Remove"
                      >
                        <XIcon className="size-3.5" />
                      </Combobox.ChipRemove>
                    </Combobox.Chip>
                  ))}
                  <Combobox.Input
                    placeholder={value.length > 0 ? '' : 'e.g. Apple'}
                    id={id}
                    className="h-8 min-w-[3rem] flex-1 border-0 bg-transparent pl-2 text-base text-gray-900 outline-none"
                  />
                </React.Fragment>
              )}
            </Combobox.Value>
          </Combobox.Chips>
        </div>

        <div className="w-full max-h-[23rem] overflow-hidden rounded-md bg-[canvas] text-gray-900 shadow-lg shadow-gray-200 outline-1 outline-gray-200 dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300">
          <Combobox.Empty className="p-4 text-[0.925rem] leading-4 text-gray-600 empty:m-0 empty:p-0">
            No fruits found.
          </Combobox.Empty>
          <Combobox.List className="outline-0 overflow-y-auto scroll-py-[0.5rem] py-2 overscroll-contain max-h-[min(23rem,60vh)] data-[empty]:p-0">
            {(item: Fruit) => (
              <Combobox.Item
                key={item.value}
                value={item}
                className="grid cursor-default grid-cols-[0.75rem_1fr] items-center gap-2 py-2 pr-8 pl-4 text-base leading-4 outline-none select-none data-[selected]:relative data-[selected]:z-0 data-[selected]:text-gray-900 data-[selected]:before:absolute data-[selected]:before:inset-x-2 data-[selected]:before:inset-y-0 data-[selected]:before:z-[-1] data-[selected]:before:rounded-sm data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-2 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-gray-900"
              >
                <Combobox.ItemIndicator className="col-start-1">
                  <CheckIcon className="size-3" />
                </Combobox.ItemIndicator>
                <div className="col-start-2">{item.label}</div>
              </Combobox.Item>
            )}
          </Combobox.List>
        </div>
      </div>
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

function XIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
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
