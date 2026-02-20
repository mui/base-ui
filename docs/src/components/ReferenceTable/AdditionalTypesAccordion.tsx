import * as React from 'react';
import { ProcessedTypesMeta } from '@mui/internal-docs-infra/useTypes';
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
    <React.Fragment>
      {rawTypes.map((additionalType) => (
        <div
          key={additionalType.name}
          id={additionalType.slug}
          className="sr-only target:not-sr-only scroll-mt-12 md:scroll-mt-0"
        >
          <h4 className="mt-5 mb-3 text-base font-medium text-gray-900 dark:text-white">
            {additionalType.name}
          </h4>
          {additionalType.data.reExportOf ? (
            <p className="text-sm text-gray-600">
              Re-Export of{' '}
              <Link href={multiple ? additionalType.data.reExportOf.slug : '#api-reference'}>
                {additionalType.data.reExportOf.name}
              </Link>{' '}
              {additionalType.data.reExportOf.suffix} as{' '}
              <code
                className="Code language-ts text-xs data-inline:mx-[0.1em] rounded bg-gray-100 px-1.5 py-0.5"
                data-inline=""
                data-table-code=""
              >
                <span className="pl-en">{additionalType.name.replaceAll('.', '')}</span>
              </code>
            </p>
          ) : (
            additionalType.data.formattedCode
          )}
        </div>
      ))}
    </React.Fragment>
  );
}
