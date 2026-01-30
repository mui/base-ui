import * as React from 'react';
import { ProcessedTypesMeta } from '@mui/internal-docs-infra/useTypes';
import * as Accordion from '../Accordion';
import { Link } from '../Link';

export function AdditionalTypesAccordion({
  data,
  multiple,
}: {
  data: ProcessedTypesMeta[];
  multiple?: boolean;
}) {
  const rawTypes = data.filter((t) => t.type === 'raw');

  return (
    <Accordion.Root className="flex flex-col justify-center text-gray-900">
      {rawTypes.map((additionalType, index) => {
        const isFirst = index === 0;
        const isLast = index === rawTypes.length - 1;

        return (
          <Accordion.Item
            className={isLast ? undefined : 'border-b border-gray-200'}
            key={additionalType.name}
          >
            <Accordion.Trigger
              id={additionalType.slug}
              index={index}
              className={`group relative flex w-full items-baseline justify-between gap-4 bg-gray-50 py-2 pr-1 pl-3 text-left font-medium hover:bg-gray-100 focus-visible:z-1 focus-visible:outline-2 focus-visible:outline-blue-800 scroll-mt-12 md:scroll-mt-0 ${isFirst ? 'rounded-t-[5px]' : ''} ${isLast ? 'rounded-b-[5px]' : ''}`}
            >
              {additionalType.name}
              <PlusIcon className="mr-2 size-3 shrink-0 transition-all ease-out group-open:scale-110 group-open:rotate-45" />
            </Accordion.Trigger>
            <Accordion.Panel className="text-base text-gray-600">
              <Accordion.Content>
                {additionalType.data.reExportOf ? (
                  <p className="p-3">
                    Re-Export of{' '}
                    <Link href={multiple ? additionalType.data.reExportOf.slug : '#api-reference'}>
                      {additionalType.data.reExportOf.name}
                    </Link>{' '}
                    {additionalType.data.reExportOf.suffix} as{' '}
                    <code
                      className="Code language-ts text-xs data-inline:mx-[0.1em]"
                      data-inline=""
                      data-table-code=""
                    >
                      <span className="pl-en">{additionalType.name.replaceAll('.', '')}</span>
                    </code>
                  </p>
                ) : (
                  additionalType.data.formattedCode
                )}
              </Accordion.Content>
            </Accordion.Panel>
          </Accordion.Item>
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
