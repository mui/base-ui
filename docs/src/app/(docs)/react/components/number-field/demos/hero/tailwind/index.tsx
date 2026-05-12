import * as React from 'react';
import { NumberField } from '@base-ui/react/number-field';

const stepperClasses =
  'flex h-full w-8 items-center justify-center border border-neutral-950 rounded-none bg-white bg-clip-padding text-neutral-950 outline-0 select-none hover:not-data-disabled:bg-neutral-100 dark:hover:not-data-disabled:bg-neutral-800 active:not-data-disabled:bg-neutral-200 dark:active:not-data-disabled:bg-neutral-700 data-disabled:border-neutral-500 data-disabled:text-neutral-500 dark:data-disabled:border-neutral-400 dark:data-disabled:text-neutral-400';

export default function ExampleNumberField() {
  const id = React.useId();
  return (
    <NumberField.Root id={id} defaultValue={100} className="flex flex-col items-start gap-1">
      <NumberField.ScrubArea className="cursor-ew-resize font-bold select-none">
        <label
          htmlFor={id}
          className="cursor-ew-resize text-sm font-bold text-neutral-950 dark:text-white"
        >
          Amount
        </label>
        <NumberField.ScrubAreaCursor className="drop-shadow-[0_1px_1px_#0008] filter">
          <CursorGrowIcon />
        </NumberField.ScrubAreaCursor>
      </NumberField.ScrubArea>

      <NumberField.Group className="flex h-8">
        <NumberField.Decrement className={`${stepperClasses} border-r-0`}>
          <MinusIcon className="size-3" />
        </NumberField.Decrement>
        <NumberField.Input className="h-full w-[7ch] border border-neutral-950 rounded-none bg-white px-2 text-left text-sm any-pointer-coarse:text-base font-normal text-neutral-950 tabular-nums focus:z-1 focus:outline-2 focus:-outline-offset-1 focus:outline-neutral-950 dark:focus:outline-white dark:border-white dark:bg-neutral-950 dark:text-white" />
        <NumberField.Increment className={`${stepperClasses} border-l-0`}>
          <PlusIcon className="size-3" />
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
    <svg viewBox="0 0 12 12" fill="none" stroke="currentcolor" strokeWidth="1" {...props}>
      <path d="M6 0.5V11.5" vectorEffect="non-scaling-stroke" />
      <path d="M0.5 6H11.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function MinusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentcolor" strokeWidth="1" {...props}>
      <path d="M0.5 6H11.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
