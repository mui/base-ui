'use client';
import * as React from 'react';
import { Select } from '@base-ui/react/select';

export default function ExampleVirtualizedSelect() {
  return (
    <div className="flex flex-col items-start gap-1">
      <Select.Root items={items}>
        <Select.Label className="cursor-default text-sm font-bold text-neutral-950 dark:text-white">
          Item
        </Select.Label>
        <Select.Trigger className="flex h-8 min-w-40 items-center justify-between gap-3 border border-neutral-950 bg-white pr-1 pl-2 text-sm leading-none whitespace-nowrap text-neutral-950 select-none focus-visible:-outline-offset-1 focus-visible:outline-2 focus-visible:outline-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white dark:focus-visible:outline-white">
          <Select.Value
            className="data-placeholder:text-neutral-500 dark:data-placeholder:text-neutral-400"
            placeholder="Select item"
          />
          <Select.Icon>
            <CaretUpDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner
            className="z-10 outline-hidden"
            sideOffset={4}
            alignItemWithTrigger={false}
          >
            <Select.Popup className="min-w-[var(--anchor-width)] origin-[var(--transform-origin)] border border-neutral-950 bg-white text-neutral-950 shadow-[0.25rem_0.25rem_0] shadow-black/12 transition-[scale,opacity] duration-100 ease-out outline-hidden data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none">
              <Select.List className="py-1">
                <Select.Virtualizer<string>
                  className="box-border h-[min(22rem,var(--total-size))] max-h-[calc(var(--available-height)-0.5rem)] overflow-auto overscroll-contain scroll-py-1"
                  estimatedItemHeight={32}
                  overscanPx={640}
                >
                  {(item) => (
                    <Select.Item
                      value={item.value}
                      className="grid cursor-default grid-cols-[1rem_1fr] items-center gap-2 py-1.5 pr-4 pl-2.5 text-sm outline-hidden select-none data-highlighted:bg-neutral-950 data-highlighted:text-white dark:data-highlighted:bg-white dark:data-highlighted:text-neutral-950"
                    >
                      <Select.ItemIndicator className="col-start-1">
                        <CheckIcon />
                      </Select.ItemIndicator>
                      <Select.ItemText className="col-start-2">{item.label}</Select.ItemText>
                    </Select.Item>
                  )}
                </Select.Virtualizer>
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

const items = Array.from({ length: 10000 }, (_, index) => {
  const number = String(index + 1).padStart(5, '0');
  return { value: number, label: `Item ${number}` };
});
