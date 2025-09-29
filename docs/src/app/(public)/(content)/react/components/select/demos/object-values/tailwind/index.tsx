import * as React from 'react';
import { Select } from '@base-ui-components/react/select';

export default function ObjectValueSelect() {
  return (
    <Select.Root defaultValue={shippingMethods[0]} itemToStringValue={(item) => item.id}>
      <Select.Trigger className="flex min-h-10 min-w-[16rem] items-start justify-between gap-3 rounded-md border border-gray-200 pr-3 pl-3.5 py-2 text-base text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 data-[popup-open]:bg-gray-100">
        <Select.Value>
          {(method: ShippingMethod) => (
            <span className="flex flex-col items-start gap-0.5">
              <span className="text-base leading-6">{method.name}</span>
              <span className="text-xs leading-4 text-gray-600">
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
        <Select.Positioner className="outline-none select-none z-10" sideOffset={8}>
          <Select.Popup className="group origin-[var(--transform-origin)] bg-clip-padding rounded-md bg-[canvas] text-gray-900 shadow-lg shadow-gray-200 outline outline-1 outline-gray-200 transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[side=none]:data-[ending-style]:transition-none data-[starting-style]:scale-90 data-[starting-style]:opacity-0 data-[side=none]:data-[starting-style]:scale-100 data-[side=none]:data-[starting-style]:opacity-100 data-[side=none]:data-[starting-style] :transition-none dark:shadow-none dark:outline-gray-300">
            <Select.ScrollUpArrow className="top-0 z-[1] flex h-4 w-full cursor-default items-center justify-center rounded-md bg-[canvas] text-center text-xs before:absolute before:top-[-100%] before:left-0 before:h-full before:w-full before:content-[''] data-[direction=down]:bottom-0 data-[direction=down]:before:bottom-[-100%]" />
            <Select.List className="relative py-1 scroll-py-6 overflow-y-auto max-h-[var(--available-height)]">
              {shippingMethods.map((method) => (
                <Select.Item
                  key={method.id}
                  value={method}
                  className="grid min-w-[var(--anchor-width)] cursor-default grid-cols-[0.75rem_1fr] items-start gap-2 py-2.5 pr-4 pl-2.5 text-sm leading-4 outline-none select-none group-data-[side=none]:min-w-[calc(var(--anchor-width)+1rem)] group-data-[side=none]:pr-12 group-data-[side=none]:text-base group-data-[side=none]:leading-5 pointer-coarse:py-2.5 pointer-coarse:text-[0.925rem] [@media(hover:hover)]:[&[data-highlighted]]:relative [@media(hover:hover)]:[&[data-highlighted]]:z-0 [@media(hover:hover)]:[&[data-highlighted]]:text-gray-50 [@media(hover:hover)]:[&[data-highlighted]]:before:content-[''] [@media(hover:hover)]:[&[data-highlighted]]:before:absolute [@media(hover:hover)]:[&[data-highlighted]]:before:inset-y-0 [@media(hover:hover)]:[&[data-highlighted]]:before:inset-x-1 [@media(hover:hover)]:[&[data-highlighted]]:before:rounded-sm [@media(hover:hover)]:[&[data-highlighted]]:before:bg-gray-900 [@media(hover:hover)]:[&[data-highlighted]]:before:z-[-1]"
                >
                  <Select.ItemIndicator className="col-start-1 flex items-center self-start relative top-[0.4em]">
                    <CheckIcon className="size-3" />
                  </Select.ItemIndicator>
                  <Select.ItemText className="col-start-2 flex flex-col items-start gap-0.5">
                    <span className="text-base leading-6">{method.name}</span>
                    <span className="text-xs leading-4 opacity-80">
                      {method.duration} ({method.price})
                    </span>
                  </Select.ItemText>
                </Select.Item>
              ))}
            </Select.List>
            <Select.ScrollDownArrow className="bottom-0 z-[1] flex h-4 w-full cursor-default items-center justify-center rounded-md bg-[canvas] text-center text-xs before:absolute before:top-[-100%] before:left-0 before:h-full before:w-full before:content-[''] data-[direction=down]:bottom-0 data-[direction=down]:before:bottom-[-100%]" />
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

function ChevronUpDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="8"
      height="12"
      viewBox="0 0 8 12"
      fill="none"
      stroke="currentcolor"
      strokeWidth="1.5"
      {...props}
    >
      <path d="M0.5 4.5L4 1.5L7.5 4.5" />
      <path d="M0.5 7.5L4 10.5L7.5 7.5" />
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
