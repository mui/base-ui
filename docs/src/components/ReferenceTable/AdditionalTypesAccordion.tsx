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
    <div>
      <h4 className="mt-5 mb-3 text-base font-medium text-gray-900 dark:text-white">
        Additional Types
      </h4>
      <Accordion.Root className="flex flex-col justify-center text-sm text-gray-900">
        {rawTypes.map((additionalType, index) => {
          const isFirst = index === 0;
          const isLast = index === rawTypes.length - 1;

          return (
            <Accordion.Item
              className={isLast ? undefined : 'border-b border-gray-200'}
              key={additionalType.name}
              gaCategory="reference"
              gaLabel={`Additional type: ${additionalType.name}`}
              gaParams={{
                type: 'additional_type',
                slug: additionalType.slug ?? additionalType.name,
                part_name: additionalType.name,
              }}
            >
              <Accordion.Trigger
                id={additionalType.slug}
                index={index}
                className={`group relative flex w-full items-baseline justify-between gap-4 bg-gray-50 py-2 pr-1 pl-3 text-left font-medium hover:bg-gray-100 focus-visible:z-1 focus-visible:outline-2 focus-visible:outline-blue-800 scroll-mt-12 md:scroll-mt-0 ${isFirst ? 'rounded-t-[5px]' : ''} ${isLast ? 'rounded-b-[5px]' : ''}`}
              >
                {additionalType.name}
                <svg
                  className="AccordionIcon mr-2 size-2.5 shrink-0"
                  viewBox="0 0 10 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M1 3.5L5 7.5L9 3.5" stroke="currentcolor" />
                </svg>
              </Accordion.Trigger>
              <Accordion.Panel className="text-base text-gray-600">
                <Accordion.Content>
                  {additionalType.data.reExportOf ? (
                    <p className="p-3">
                      Re-Export of{' '}
                      <Link
                        href={multiple ? additionalType.data.reExportOf.slug : '#api-reference'}
                      >
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
    </div>
  );
}
