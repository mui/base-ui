import * as React from 'react';
import { Checkbox } from '@base-ui/react/checkbox';

export default function ExampleCheckbox() {
  return (
    <label className="flex items-center gap-2 text-sm leading-5 font-normal text-gray-900 dark:text-gray-50">
      <Checkbox.Root
        defaultChecked
        className="flex size-4 shrink-0 items-center justify-center border rounded-none p-0 border-gray-900 bg-gray-50 text-gray-50 dark:border-gray-50 dark:bg-gray-900 dark:text-gray-900 data-checked:bg-gray-900 data-checked:text-gray-50 dark:data-checked:bg-gray-50 dark:data-checked:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <Checkbox.Indicator className="flex data-unchecked:hidden">
          <CheckIcon className="size-3" />
        </Checkbox.Indicator>
      </Checkbox.Root>
      Enable notifications
    </label>
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
