import * as React from 'react';
import { Accordion } from '@base-ui-components/react/accordion';

export default function ExampleAccordion() {
  return (
    <Accordion.Root className="flex min-h-48 w-96 max-w-[calc(100vw-8rem)] flex-col justify-center">
      <Accordion.Item className="border-b border-gray-200">
        <Accordion.Header>
          <Accordion.Trigger className="group flex w-full cursor-pointer items-baseline justify-between py-2 font-medium focus-visible:outline-2 focus-visible:outline-blue">
            What is Base UI?
            <PlusIcon className="mr-2 size-3 transition-all ease-out group-data-[panel-open]:scale-110 group-data-[panel-open]:rotate-45" />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel className="h-[var(--accordion-panel-height)] overflow-hidden text-sm text-gray-600 transition-[height] ease-out [[data-entering],[data-exiting]]:h-0">
          <div className="pb-3">
            Base UI is a library of high-quality, accessible, unstyled React
            components for design systems and web apps.
          </div>
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item className="border-b border-gray-200">
        <Accordion.Header>
          <Accordion.Trigger className="group flex w-full cursor-pointer items-baseline justify-between py-2 font-medium focus-visible:outline-2 focus-visible:outline-blue">
            How do I get started?
            <PlusIcon className="mr-2 size-3 transition-all ease-out group-data-[panel-open]:scale-110 group-data-[panel-open]:rotate-45" />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel className="h-[var(--accordion-panel-height)] overflow-hidden text-sm text-gray-600 transition-[height] ease-out [[data-entering],[data-exiting]]:h-0">
          <div className="pb-3">
            Head to the “Quick start” guide in the docs. If you’ve used unstyled
            libraries before, you’ll feel right at home.
          </div>
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item className="border-b border-gray-200">
        <Accordion.Header>
          <Accordion.Trigger className="group flex w-full cursor-pointer items-baseline justify-between py-2 font-medium focus-visible:outline-2 focus-visible:outline-blue">
            Can I use it for my next project?
            <PlusIcon className="mr-2 size-3 transition-all ease-out group-data-[panel-open]:scale-110 group-data-[panel-open]:rotate-45" />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel className="h-[var(--accordion-panel-height)] overflow-hidden text-sm text-gray-600 transition-[height] ease-out [[data-entering],[data-exiting]]:h-0">
          <div className="pb-3">Of course! Base UI is free and open source.</div>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  );
}

function PlusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 12 12" fill="currentcolor" {...props}>
      <path d="M6.75 0H5.25V5.25H0V6.75L5.25 6.75V12H6.75V6.75L12 6.75V5.25H6.75V0Z" />
    </svg>
  );
}
