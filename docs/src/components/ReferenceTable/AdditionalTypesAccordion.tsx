import * as React from 'react';
import { Accordion } from '@base-ui/react/accordion';
import { ProcessedTypesMeta } from '@mui/internal-docs-infra/useTypes';

export default function ExampleAccordion({ data }: { data: ProcessedTypesMeta[] }) {
  return (
    <Accordion.Root className="flex flex-col justify-center text-gray-900">
      {data.map((additionalType) => {
        return (
          additionalType.type === 'raw' && (
            <Accordion.Item
              className="border-b border-gray-200"
              key={additionalType.name}
              id={additionalType.slug}
            >
              <Accordion.Header>
                <Accordion.Trigger className="group relative flex w-full items-baseline justify-between gap-4 bg-gray-50 py-2 pr-1 pl-3 text-left font-medium hover:bg-gray-100 focus-visible:z-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800">
                  {additionalType.name}
                  <PlusIcon className="mr-2 size-3 shrink-0 transition-all ease-out group-data-[panel-open]:scale-110 group-data-[panel-open]:rotate-45" />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel className="h-[var(--accordion-panel-height)] border-l border-r border-gray-200 overflow-hidden text-base text-gray-600 transition-[height] ease-out data-[ending-style]:h-0 data-[starting-style]:h-0">
                {additionalType.data.formattedCode}
              </Accordion.Panel>
            </Accordion.Item>
          )
        );
      })}
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
