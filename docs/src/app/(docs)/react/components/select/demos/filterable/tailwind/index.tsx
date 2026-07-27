import * as React from 'react';
import { Select } from '@base-ui/react/select';

const fruits = [
  'Apple',
  'Apricot',
  'Banana',
  'Blueberry',
  'Cherry',
  'Grape',
  'Kiwi',
  'Mango',
  'Orange',
  'Peach',
  'Pear',
  'Pineapple',
  'Strawberry',
];

export default function FilterableSelect() {
  return (
    <div className="flex flex-col items-start gap-1">
      <Select.Root filter>
        <Select.Label className="cursor-default text-sm font-bold text-neutral-950 dark:text-white">
          Fruit
        </Select.Label>
        <Select.Trigger className="flex h-8 min-w-40 items-center justify-between gap-3 border border-neutral-950 bg-white pr-1 pl-2 text-sm leading-none font-normal whitespace-nowrap text-neutral-950 select-none hover:not-data-disabled:bg-neutral-100 active:not-data-disabled:bg-neutral-200 data-pressed:bg-neutral-100 data-disabled:border-neutral-500 data-disabled:text-neutral-500 focus-visible:-outline-offset-1 focus-visible:outline-2 focus-visible:outline-neutral-950 disabled:border-neutral-500 disabled:text-neutral-500 dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:not-data-disabled:bg-neutral-800 dark:active:not-data-disabled:bg-neutral-700 dark:data-pressed:bg-neutral-800 dark:data-disabled:border-neutral-400 dark:data-disabled:text-neutral-400 dark:focus-visible:outline-white">
          <Select.Value
            className="data-placeholder:text-neutral-500 dark:data-placeholder:text-neutral-400"
            placeholder="Select a fruit"
          />
          <Select.Icon>
            <CaretUpDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className="z-10 outline-hidden select-none" sideOffset={4}>
            <Select.Popup className="min-w-[var(--anchor-width)] origin-[var(--transform-origin)] overflow-hidden border border-neutral-950 bg-white bg-clip-padding text-neutral-950 shadow-[0.25rem_0.25rem_0] shadow-black/12 transition-[scale,opacity] duration-100 ease-out outline-hidden data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none">
              <div className="flex items-center border-b border-neutral-300 has-data-focus-visible:border-neutral-950 has-data-focus-visible:ring-1 has-data-focus-visible:ring-neutral-950 has-data-focus-visible:ring-inset dark:border-neutral-700 dark:has-data-focus-visible:border-white dark:has-data-focus-visible:ring-white">
                <Select.Input
                  className="min-h-8 w-0 flex-1 bg-transparent px-2.5 text-sm leading-none outline-hidden placeholder:text-neutral-500 dark:placeholder:text-neutral-400"
                  aria-label="Filter fruits"
                  placeholder="e.g. Apple"
                />
                <Select.Clear
                  className="flex size-8 items-center justify-center bg-transparent"
                  aria-label="Clear filter"
                >
                  <ClearIcon />
                </Select.Clear>
              </div>
              <Select.Empty className="p-3 text-sm text-neutral-500 dark:text-neutral-400">
                No fruits found.
              </Select.Empty>
              <Select.List className="max-h-[min(16rem,var(--available-height))] overflow-y-auto py-1 scroll-py-1 empty:py-0">
                {fruits.map((fruit) => (
                  <Select.Item
                    key={fruit}
                    value={fruit}
                    className="grid cursor-default grid-cols-[1rem_1fr] items-center gap-2 py-1.5 pr-4 pl-2.5 text-sm outline-hidden select-none data-highlighted:bg-neutral-950 data-highlighted:text-white dark:data-highlighted:bg-white dark:data-highlighted:text-neutral-950"
                  >
                    <Select.ItemIndicator className="col-start-1">
                      <CheckIcon />
                    </Select.ItemIndicator>
                    <Select.ItemText className="col-start-2">{fruit}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}

function CaretUpDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M11 10H5l3 3.5zm0-4H5l3-3.5z" />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="m2.5 8.5 4 4 7-9" />
    </svg>
  );
}

function ClearIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="m3.5 3.5 9 9m0-9-9 9" />
    </svg>
  );
}
