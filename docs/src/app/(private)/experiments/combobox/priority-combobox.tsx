'use client';
import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';

function CustomCombobox(props: { items: Priority[] }) {
  return (
    <Combobox.Root items={props.items} defaultValue={props.items?.[0]} autoHighlight>
      <Combobox.Trigger className="bg-[canvas] h-8 items-center justify-between rounded-lg border border-gray-200 px-3 text-sm text-gray-900 select-none hover:bg-gray-50 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 data-[popup-open]:bg-gray-50 cursor-default bg-clip-padding">
        <Combobox.Value>
          {(priority: Priority) => (
            <div className="flex items-center gap-2">
              {priority.icon}
              <span>{priority.label ?? priority.value}</span>
            </div>
          )}
        </Combobox.Value>
      </Combobox.Trigger>
      <Combobox.Portal>
        <Combobox.Positioner align="start" sideOffset={4} disableAnchorTracking={true}>
          <Combobox.Popup
            className="[--input-container-height:3rem] origin-[var(--transform-origin)] max-w-[15rem] max-h-[min(24rem,var(--available-height))] rounded-lg bg-[canvas] shadow-[0_1px_2px_rgba(0,0,0,.025),_0_1px_3px_rgba(0,0,0,.025)] shadow-gray-200 text-gray-900 outline-1 outline-gray-200 transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0 dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300 bg-clip-padding"
            aria-label="Select priority"
          >
            <div className="w-60 text-center p-1 px-2 grid gap-2 grid-cols-[1fr_1.4rem]">
              <Combobox.Input
                placeholder="Set priority to..."
                className="h-8 w-full font-normal col-start-1 pl-3.5 text-sm text-gray-900 focus:outline focus:outline-0"
              />
              <div className="align-self-center h-[1.4rem] grid-col-start-2 border border-1 border-gray-300 rounded-md self-center justify-center text-gray-800 text-xs flex">
                P
              </div>
            </div>
            <Combobox.Separator className="border-t border-gray-200" />
            <Combobox.Empty className="p-4 text-[0.925rem] leading-4 text-gray-600 empty:m-0 empty:p-0">
              No priority found.
            </Combobox.Empty>
            <Combobox.List className="overflow-y-auto scroll-py-2 py-2 overscroll-contain max-h-[min(calc(24rem-var(--input-container-height)),calc(var(--available-height)-var(--input-container-height)))] empty:p-0">
              {(priority: Priority) => (
                <Combobox.Item
                  key={priority.code}
                  value={priority}
                  className="grid min-w-[var(--anchor-width)] cursor-default grid-cols-[1rem_1fr_0.75rem_0.75rem] items-center gap-2 py-2 px-4 text-sm leading-4 outline-none select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-800 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-2 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-gray-100"
                >
                  <div className="col-start-1">{priority.icon}</div>
                  <div className="col-start-2">{priority.label ?? priority.value}</div>
                  <Combobox.ItemIndicator className="col-start-3">
                    <CheckIcon className="size-3" />
                  </Combobox.ItemIndicator>
                  <div className="col-start-4 text-xs text-center text-gray-600">
                    {priority.code}
                  </div>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

export default function PriorityCombobox() {
  return <CustomCombobox items={priorities} />;
}

interface Priority {
  code: string;
  value: string | null;
  icon: React.ReactNode;
  label: string;
}

const priorities: Priority[] = [
  { code: '0', value: '0', icon: <MinusIcon />, label: 'No priority' },
  { code: '1', value: '1', icon: <CircleAlertIcon />, label: 'Urgent' },
  { code: '2', value: '2', icon: <SignalHighIcon />, label: 'High' },
  { code: '3', value: '3', icon: <SignalMediumIcon />, label: 'Medium' },
  { code: '4', value: '4', icon: <SignalLowIcon />, label: 'Low' },
];

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}

function MinusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentcolor"
      strokeWidth="2"
      {...props}
    >
      <path d="M0 8H15"></path>
    </svg>
  );
}

function CircleAlertIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}

function SignalHighIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path strokeWidth="4" d="M2 20h.01" />
      <path strokeWidth="4" d="M8 20v-4" />
      <path strokeWidth="4" d="M14 20v-8" />
      <path strokeWidth="4" d="M20 20V8" />
    </svg>
  );
}

function SignalMediumIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path strokeWidth="4" d="M2 20h.01" />
      <path strokeWidth="4" d="M8 20v-4" />
      <path strokeWidth="4" d="M14 20v-8" />
      <path strokeWidth="4" d="M20 20V8" stroke="lightgrey" />
    </svg>
  );
}

function SignalLowIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path strokeWidth="4" d="M2 20h.01" />
      <path strokeWidth="4" d="M8 20v-4" />
      <path strokeWidth="4" d="M14 20v-8" stroke="lightgrey" />
      <path strokeWidth="4" d="M20 20V8" stroke="lightgrey" />
    </svg>
  );
}
