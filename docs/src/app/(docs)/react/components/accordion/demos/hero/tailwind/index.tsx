import * as React from 'react';
import { Accordion } from '@base-ui/react/accordion';

export default function ExampleAccordion() {
  return (
    <Accordion.Root className="flex w-80 max-w-full flex-col border-b border-gray-950 text-gray-950 dark:border-white dark:text-white">
      <Accordion.Item>
        <Accordion.Header>
          <Accordion.Trigger className="group flex w-full items-center justify-between gap-4 border-t border-gray-950 bg-transparent py-2 text-left text-sm leading-5 font-normal text-gray-950 select-none focus-visible:z-1 focus-visible:outline-2 focus-visible:outline-blue-800 dark:border-white dark:text-white">
            What is Base UI?
            <PlusIcon className="size-3 shrink-0 transition-transform duration-100 ease-out group-data-panel-open:rotate-45" />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel className="h-[var(--accordion-panel-height)] overflow-hidden text-sm leading-5 transition-[height] duration-150 ease-out data-ending-style:h-0 data-starting-style:h-0">
          <div className="py-2">
            Base UI is a library of high-quality unstyled React components for design systems and
            web apps.
          </div>
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item>
        <Accordion.Header>
          <Accordion.Trigger className="group flex w-full items-center justify-between gap-4 border-t border-gray-950 bg-transparent py-2 text-left text-sm leading-5 font-normal text-gray-950 select-none focus-visible:z-1 focus-visible:outline-2 focus-visible:outline-blue-800 dark:border-white dark:text-white">
            How do I get started?
            <PlusIcon className="size-3 shrink-0 transition-transform duration-100 ease-out group-data-panel-open:rotate-45" />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel className="h-[var(--accordion-panel-height)] overflow-hidden text-sm leading-5 transition-[height] duration-150 ease-out data-ending-style:h-0 data-starting-style:h-0">
          <div className="py-2">
            Head to the “Quick start” guide in the docs. If you’ve used unstyled libraries before,
            you’ll feel at home.
          </div>
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item>
        <Accordion.Header>
          <Accordion.Trigger className="group flex w-full items-center justify-between gap-4 border-t border-gray-950 bg-transparent py-2 text-left text-sm leading-5 font-normal text-gray-950 select-none focus-visible:z-1 focus-visible:outline-2 focus-visible:outline-blue-800 dark:border-white dark:text-white">
            Can I use it for my project?
            <PlusIcon className="size-3 shrink-0 transition-transform duration-100 ease-out group-data-panel-open:rotate-45" />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel className="h-[var(--accordion-panel-height)] overflow-hidden text-sm leading-5 transition-[height] duration-150 ease-out data-ending-style:h-0 data-starting-style:h-0">
          <div className="py-2">Of course! Base UI is free and open source.</div>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  );
}

function PlusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentcolor" strokeWidth="1" {...props}>
      <path d="M6 0.5V11.5" />
      <path d="M0.5 6H11.5" />
    </svg>
  );
}
