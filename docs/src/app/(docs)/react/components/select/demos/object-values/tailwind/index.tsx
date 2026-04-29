'use client';
import * as React from 'react';
import { Select } from '@base-ui/react/select';

export default function ObjectValueSelect() {
  return (
    <div className="flex flex-col items-start gap-1">
      <Select.Root defaultValue={shippingMethods[0]} itemToStringValue={(item) => item.id}>
        <Select.Label className="cursor-default text-sm font-bold text-neutral-950 dark:text-white">
          Shipping method
        </Select.Label>
        <Select.Trigger className="flex min-h-8 min-w-[16rem] items-start justify-between gap-3 pl-3 pr-2 py-1.5 text-sm border border-neutral-950 dark:border-white bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white select-none hover:not-data-disabled:bg-neutral-100 dark:hover:not-data-disabled:bg-neutral-800 active:not-data-disabled:bg-neutral-200 dark:active:not-data-disabled:bg-neutral-700 data-disabled:border-neutral-500 data-disabled:text-neutral-500 disabled:border-neutral-500 disabled:text-neutral-500 dark:data-disabled:border-neutral-400 dark:data-disabled:text-neutral-400 data-[popup-open]:bg-neutral-100 dark:data-[popup-open]:bg-neutral-800 font-normal focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800">
          <Select.Value>
            {(method: ShippingMethod) => (
              <span className="flex flex-col items-start gap-0.5">
                <span className="text-sm">{method.name}</span>
                <span className="text-xs text-neutral-600 dark:text-neutral-400">
                  {method.duration} ({method.price})
                </span>
              </span>
            )}
          </Select.Value>
          <Select.Icon className="flex items-center self-center">
            <ChevronUpDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className="outline-hidden select-none z-10" sideOffset={8}>
            <Select.Popup className="group min-w-[var(--anchor-width)] origin-[var(--transform-origin)] bg-clip-padding border border-neutral-950 bg-white text-neutral-950 outline-hidden shadow-[0.25rem_0.25rem_0_rgb(0_0_0/12%)] transition-[scale,opacity] duration-100 ease-out data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[side=none]:translate-y-px data-[side=none]:min-w-[calc(var(--anchor-width)+1rem)] data-[side=none]:data-[ending-style]:transition-none data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0 data-[side=none]:data-[starting-style]:scale-100 data-[side=none]:data-[starting-style]:opacity-100 data-[side=none]:data-[starting-style]:transition-none dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none">
              <Select.ScrollUpArrow className="top-0 z-[1] flex h-4 w-full cursor-default items-center justify-center bg-white text-center text-xs before:absolute data-[side=none]:before:top-[-100%] before:left-0 before:h-full before:w-full before:content-[''] dark:bg-neutral-950">
                ⏶
              </Select.ScrollUpArrow>
              <Select.List className="relative py-1 scroll-py-6 overflow-y-auto max-h-[var(--available-height)]">
                {shippingMethods.map((method) => (
                  <Select.Item
                    key={method.id}
                    value={method}
                    className="group/item grid cursor-default grid-cols-[0.75rem_1fr] items-start gap-2 py-1.5 pr-4 pl-2.5 text-sm outline-hidden select-none group-data-[side=none]:pr-12 [@media(hover:hover)]:[&[data-highlighted]]:bg-neutral-950 [@media(hover:hover)]:[&[data-highlighted]]:text-white dark:[@media(hover:hover)]:[&[data-highlighted]]:bg-white dark:[@media(hover:hover)]:[&[data-highlighted]]:text-neutral-950"
                  >
                    <Select.ItemIndicator className="col-start-1 flex items-center justify-center self-start relative top-[0.4em]">
                      <CheckIcon className="size-3" />
                    </Select.ItemIndicator>
                    <Select.ItemText className="col-start-2 flex flex-col gap-0.5">
                      <span className="text-sm">{method.name}</span>
                      <span className="text-xs text-neutral-600 [@media(hover:hover)]:group-data-[highlighted]/item:text-neutral-400 dark:text-neutral-400 dark:[@media(hover:hover)]:group-data-[highlighted]/item:text-neutral-600">
                        {method.duration} ({method.price})
                      </span>
                    </Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
              <Select.ScrollDownArrow className="bottom-0 z-[1] flex h-4 w-full cursor-default items-center justify-center bg-white text-center text-xs before:absolute before:left-0 before:h-full before:w-full before:content-[''] data-[side=none]:before:bottom-[-100%] dark:bg-neutral-950">
                ⏷
              </Select.ScrollDownArrow>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
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

interface ShippingMethod {
  id: string;
  name: string;
  duration: string;
  price: string;
}

const shippingMethods: ShippingMethod[] = [
  {
    id: 'standard',
    name: 'Standard',
    duration: 'Delivers in 4-6 business days',
    price: '$4.99',
  },
  {
    id: 'express',
    name: 'Express',
    duration: 'Delivers in 2-3 business days',
    price: '$9.99',
  },
  {
    id: 'overnight',
    name: 'Overnight',
    duration: 'Delivers next business day',
    price: '$19.99',
  },
];
