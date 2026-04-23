import * as React from 'react';
import { Collapsible } from '@base-ui/react/collapsible';

export default function ExampleCollapsible() {
  return (
    <Collapsible.Root className="flex min-h-36 w-56 flex-col justify-center text-gray-900 dark:text-white">
      <Collapsible.Trigger className="group flex h-8 items-center justify-between gap-2 rounded-none bg-gray-200 px-3.5 text-sm leading-5 font-normal text-gray-900 select-none hover:bg-gray-300 focus-visible:outline-2 focus-visible:outline-offset-2 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700">
        Recovery keys
        <ChevronIcon className="size-3 transition-transform duration-100 ease-out group-data-panel-open:rotate-90" />
      </Collapsible.Trigger>
      <Collapsible.Panel className="flex h-[var(--collapsible-panel-height)] flex-col justify-end overflow-hidden text-sm leading-5 transition-[height] duration-150 ease-out [&[hidden]:not([hidden='until-found'])]:hidden data-ending-style:h-0 data-starting-style:h-0">
        <div className="flex flex-col gap-2 px-3.5 py-2">
          <div>alien-bean-pasta</div>
          <div>wild-irish-burrito</div>
          <div>horse-battery-staple</div>
        </div>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}

export function ChevronIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" {...props}>
      <path d="M3.5 9L7.5 5L3.5 1" stroke="currentColor" />
    </svg>
  );
}
