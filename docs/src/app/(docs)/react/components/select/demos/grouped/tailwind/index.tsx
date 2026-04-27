import * as React from 'react';
import { Select } from '@base-ui/react/select';
import { Field } from '@base-ui/react/field';

export default function ExampleSelectGrouped() {
  return (
    <Field.Root className="flex flex-col items-start gap-1">
      <Field.Label
        className="cursor-default text-sm leading-5 font-bold text-gray-950 dark:text-white"
        nativeLabel={false}
        render={<div />}
      >
        Produce
      </Field.Label>
      <Select.Root items={groupedProduce}>
        <Select.Trigger className="flex h-8 min-w-44 items-center justify-between gap-3 pl-3 pr-2 text-sm leading-5 border border-gray-950 dark:border-white bg-white dark:bg-gray-950 text-gray-950 dark:text-white select-none hover:bg-gray-50 dark:hover:bg-gray-900 active:bg-gray-100 dark:active:bg-gray-800 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800 data-[popup-open]:bg-gray-100 dark:data-[popup-open]:bg-gray-800 font-normal">
          <Select.Value
            className="data-[placeholder]:text-gray-600 dark:data-[placeholder]:text-gray-400"
            placeholder="Select produce"
          />
          <Select.Icon className="flex">
            <ChevronUpDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className="outline-hidden select-none z-10" sideOffset={8}>
            <Select.Popup className="group min-w-[var(--anchor-width)] origin-[var(--transform-origin)] bg-clip-padding border border-gray-950 bg-white text-gray-950 outline-hidden shadow-[0.25rem_0.25rem_0_rgb(0_0_0/12%)] transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[side=none]:translate-y-px data-[side=none]:min-w-[calc(var(--anchor-width)+1rem)] data-[side=none]:data-[ending-style]:transition-none data-[starting-style]:scale-90 data-[starting-style]:opacity-0 data-[side=none]:data-[starting-style]:scale-100 data-[side=none]:data-[starting-style]:opacity-100 data-[side=none]:data-[starting-style]:transition-none dark:border-white dark:bg-gray-950 dark:text-white dark:shadow-none">
              <Select.ScrollUpArrow className="top-0 z-[2] flex h-4 w-full cursor-default items-center justify-center bg-white text-center text-xs before:absolute data-[side=none]:before:top-[-100%] before:left-0 before:h-full before:w-full before:content-[''] dark:bg-gray-950">
                ⏶
              </Select.ScrollUpArrow>
              <Select.List className="relative py-1 scroll-pt-[2.25rem] scroll-pb-6 overflow-y-auto max-h-[var(--available-height)]">
                {groupedProduce.map((group, index) => (
                  <React.Fragment key={group.value}>
                    <Select.Group className="block pb-0.5">
                      <Select.GroupLabel className="sticky top-0 z-[1] bg-white pr-4 pb-1 pl-[1.875rem] pt-2 text-xs font-bold text-gray-500 uppercase tracking-wider dark:bg-gray-950 dark:text-gray-400">
                        {group.value}
                      </Select.GroupLabel>
                      {group.items.map((item) => (
                        <Select.Item
                          key={item.value}
                          value={item.value}
                          className="grid cursor-default grid-cols-[0.75rem_1fr] items-center gap-2 py-1.5 pr-4 pl-2.5 text-sm leading-5 outline-hidden select-none group-data-[side=none]:pr-12 data-[highlighted]:bg-gray-950 data-[highlighted]:text-white dark:data-[highlighted]:bg-white dark:data-[highlighted]:text-gray-950"
                        >
                          <Select.ItemIndicator className="col-start-1">
                            <CheckIcon className="size-3" />
                          </Select.ItemIndicator>
                          <Select.ItemText className="col-start-2">{item.label}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Group>
                    {index < groupedProduce.length - 1 ? (
                      <Select.Separator className="mx-4 my-1 h-px bg-gray-950 dark:bg-white" />
                    ) : null}
                  </React.Fragment>
                ))}
              </Select.List>
              <Select.ScrollDownArrow className="bottom-0 z-[2] flex h-4 w-full cursor-default items-center justify-center bg-white text-center text-xs before:absolute before:left-0 before:h-full before:w-full before:content-[''] data-[side=none]:before:bottom-[-100%] dark:bg-gray-950">
                ⏷
              </Select.ScrollDownArrow>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </Field.Root>
  );
}

function ChevronUpDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m7 15 5 5 5-5" />
      <path d="m7 9 5-5 5 5" />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

const groupedProduce = [
  {
    value: 'Fruits',
    items: [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
      { value: 'mango', label: 'Mango' },
      { value: 'kiwi', label: 'Kiwi' },
      { value: 'grape', label: 'Grape' },
      { value: 'orange', label: 'Orange' },
      { value: 'strawberry', label: 'Strawberry' },
      { value: 'watermelon', label: 'Watermelon' },
    ],
  },
  {
    value: 'Vegetables',
    items: [
      { value: 'broccoli', label: 'Broccoli' },
      { value: 'carrot', label: 'Carrot' },
      { value: 'cauliflower', label: 'Cauliflower' },
      { value: 'cucumber', label: 'Cucumber' },
      { value: 'kale', label: 'Kale' },
      { value: 'pepper', label: 'Bell pepper' },
      { value: 'spinach', label: 'Spinach' },
      { value: 'zucchini', label: 'Zucchini' },
    ],
  },
];
