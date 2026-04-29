import * as React from 'react';
import { NumberField } from '@base-ui/react/number-field';

const stepperClasses =
  'flex h-full w-8 items-center justify-center border border-gray-950 rounded-none bg-white bg-clip-padding text-gray-950 outline-0 select-none hover:not-data-disabled:bg-gray-100 dark:hover:not-data-disabled:bg-gray-800 active:not-data-disabled:bg-gray-200 dark:active:not-data-disabled:bg-gray-700 data-disabled:border-gray-500 data-disabled:text-gray-500 dark:data-disabled:border-gray-400 dark:data-disabled:text-gray-400 focus-visible:z-1 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800';

export default function ExampleNumberField() {
  const id = React.useId();
  return (
    <NumberField.Root id={id} defaultValue={100} className="flex flex-col items-start gap-1">
      <NumberField.ScrubArea className="cursor-ew-resize font-bold select-none">
        <label
          htmlFor={id}
          className="cursor-ew-resize text-sm leading-5 font-bold text-gray-950 dark:text-white"
        >
          Amount
        </label>
        <NumberField.ScrubAreaCursor className="drop-shadow-[0_1px_1px_#0008] filter">
          <CursorGrowIcon />
        </NumberField.ScrubAreaCursor>
      </NumberField.ScrubArea>

      <NumberField.Group className="flex h-8">
        <NumberField.Decrement className={stepperClasses}>
          <MinusIcon />
        </NumberField.Decrement>
        <NumberField.Input className="h-full w-[7ch] border-y border-gray-950 rounded-none bg-transparent px-3 text-left text-sm font-normal text-gray-950 tabular-nums focus:z-1 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-800 dark:border-white dark:text-white" />
        <NumberField.Increment className={stepperClasses}>
          <PlusIcon />
        </NumberField.Increment>
      </NumberField.Group>
    </NumberField.Root>
  );
}

function CursorGrowIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="26" height="14" viewBox="0 0 24 14" fill="black" stroke="white" {...props}>
      <path d="M19.5 5.5L6.49737 5.51844V2L1 6.9999L6.5 12L6.49737 8.5L19.5 8.5V12L25 6.9999L19.5 2V5.5Z" />
    </svg>
  );
}

function PlusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      {...props}
    >
      <path d="M5 0.5V9.5" />
      <path d="M0.5 5H9.5" />
    </svg>
  );
}

function MinusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      {...props}
    >
      <path d="M0.5 5H9.5" />
    </svg>
  );
}
