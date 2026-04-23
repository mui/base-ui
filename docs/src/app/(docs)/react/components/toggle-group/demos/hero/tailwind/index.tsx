import * as React from 'react';
import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';

export default function ExampleToggleGroup() {
  return (
    <ToggleGroup
      defaultValue={['left']}
      className="flex gap-px p-px border border-gray-950 dark:border-white"
    >
      <Toggle
        aria-label="Align left"
        value="left"
        className="flex size-8 items-center justify-center border-none rounded-none bg-transparent text-gray-950 dark:text-white select-none hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 data-pressed:bg-gray-950 data-pressed:text-white dark:data-pressed:bg-white dark:data-pressed:text-gray-950"
      >
        <AlignLeftIcon className="size-4" />
      </Toggle>
      <Toggle
        aria-label="Align center"
        value="center"
        className="flex size-8 items-center justify-center border-none rounded-none bg-transparent text-gray-950 dark:text-white select-none hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 data-pressed:bg-gray-950 data-pressed:text-white dark:data-pressed:bg-white dark:data-pressed:text-gray-950"
      >
        <AlignCenterIcon className="size-4" />
      </Toggle>
      <Toggle
        aria-label="Align right"
        value="right"
        className="flex size-8 items-center justify-center border-none rounded-none bg-transparent text-gray-950 dark:text-white select-none hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 data-pressed:bg-gray-950 data-pressed:text-white dark:data-pressed:bg-white dark:data-pressed:text-gray-950"
      >
        <AlignRightIcon className="size-4" />
      </Toggle>
    </ToggleGroup>
  );
}

function AlignLeftIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      stroke="currentColor"
      strokeLinecap="round"
      {...props}
    >
      <path d="M2.5 3.5H13.5" />
      <path d="M2.5 9.5H13.5" />
      <path d="M2.5 6.5H10.5" />
      <path d="M2.5 12.5H10.5" />
    </svg>
  );
}

function AlignCenterIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      stroke="currentColor"
      strokeLinecap="round"
      {...props}
    >
      <path d="M3 3.5H14" />
      <path d="M3 9.5H14" />
      <path d="M4.5 6.5H12.5" />
      <path d="M4.5 12.5H12.5" />
    </svg>
  );
}

function AlignRightIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      stroke="currentColor"
      strokeLinecap="round"
      {...props}
    >
      <path d="M2.5 3.5H13.5" />
      <path d="M2.5 9.5H13.5" />
      <path d="M5.5 6.5H13.5" />
      <path d="M5.5 12.5H13.5" />
    </svg>
  );
}
