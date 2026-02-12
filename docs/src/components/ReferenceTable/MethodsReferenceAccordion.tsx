import * as React from 'react';
import clsx from 'clsx';
import { visuallyHidden } from '@base-ui/utils/visuallyHidden';
import { ProcessedMethod } from '@mui/internal-docs-infra/useTypes';
import { Link } from 'docs/src/components/Link';
import * as Accordion from '../Accordion';
import * as DescriptionList from '../DescriptionList';
import { TableCode } from '../TableCode';

interface Props extends React.ComponentPropsWithoutRef<any> {
  data: Record<string, ProcessedMethod>;
  name: string;
  methodLabel?: string;
}

export function MethodsReferenceAccordion({
  data,
  name: partName,
  methodLabel = 'Method',
  ...props
}: Props) {
  const captionId = `${partName}-methods-caption`;

  return (
    <Accordion.Root aria-describedby={captionId} {...props}>
      <span id={captionId} style={visuallyHidden} aria-hidden>
        Class methods table
      </span>
      <Accordion.HeaderRow className={clsx('grid', TRIGGER_GRID_LAYOUT)}>
        <Accordion.HeaderCell>{methodLabel}</Accordion.HeaderCell>
        <Accordion.HeaderCell className="max-xs:hidden">Returns</Accordion.HeaderCell>
        <Accordion.HeaderCell className="max-md:hidden w-10" />
      </Accordion.HeaderRow>
      {Object.keys(data).map((name, index) => {
        const method = data[name];

        // anchor hash for each method
        const id = `${partName}-${name}`;

        // Build parameter list for display
        const paramEntries = Object.entries(method.parameters);

        return (
          <Accordion.Item
            key={name}
            gaCategory="reference"
            gaLabel={`Method: ${id}`}
            gaParams={{ type: 'method', slug: id, part_name: partName }}
          >
            <Accordion.Trigger
              id={id}
              index={index}
              aria-label={`Method: ${name}, returns: ${method.returnValue ? 'value' : 'void'}`}
              className={clsx('min-h-min scroll-mt-12 p-0 md:scroll-mt-0', TRIGGER_GRID_LAYOUT)}
            >
              <Accordion.Scrollable className="px-3">
                <code
                  className="Code language-ts text-xs data-inline:mx-[0.1em]"
                  data-table-code=""
                >
                  <span className="pl-en">{name}</span>
                  {'('}
                  {paramEntries.map(([paramName, param], i) => (
                    <React.Fragment key={paramName}>
                      {i !== 0 && ', '}
                      <span className="pl-v">{paramName}</span>
                      {param.optional && '?'}
                    </React.Fragment>
                  ))}
                  {')'}
                </code>
              </Accordion.Scrollable>
              <Accordion.Scrollable className="px-3 flex items-baseline text-sm leading-none break-keep whitespace-nowrap max-xs:hidden">
                {method.returnValue}
              </Accordion.Scrollable>
              <span className="flex justify-center max-xs:ml-auto max-xs:mr-3">
                <svg
                  className="AccordionIcon translate-y-px"
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M1 3.5L5 7.5L9 3.5" stroke="currentcolor" />
                </svg>
              </span>
            </Accordion.Trigger>
            <Accordion.Panel>
              <Accordion.Content>
                <DescriptionList.Root
                  className={clsx('text-gray-600 max-xs:py-3', PANEL_GRID_LAYOUT)}
                  aria-label="Info"
                >
                  <DescriptionList.Item>
                    <DescriptionList.Term>Name</DescriptionList.Term>
                    <DescriptionList.Details>
                      <Link href={`#${id}`}>
                        <TableCode className="text-(--color-blue)">{name}</TableCode>
                      </Link>
                    </DescriptionList.Details>
                  </DescriptionList.Item>

                  {method.description && (
                    <DescriptionList.Item>
                      <DescriptionList.Term separator>Description</DescriptionList.Term>
                      <DescriptionList.Details className="**:[[role='figure']]:mt-1 **:[[role='figure']]:mb-1">
                        {method.description}
                      </DescriptionList.Details>
                    </DescriptionList.Item>
                  )}

                  {paramEntries.length > 0 && (
                    <DescriptionList.Item>
                      <DescriptionList.Term separator>Parameters</DescriptionList.Term>
                      <DescriptionList.Details>
                        <ul className="list-none p-0 m-0 space-y-2">
                          {paramEntries.map(([paramName, param]) => (
                            <li key={paramName}>
                              <div className="flex gap-2 items-baseline">
                                <TableCode className="text-navy">
                                  {paramName}
                                  {param.optional && '?'}
                                </TableCode>
                                <span className="text-gray-500">—</span>
                                {param.type}
                              </div>
                              {param.description && (
                                <div className="text-gray-600 text-sm mt-1 ml-0.5">
                                  {param.description}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </DescriptionList.Details>
                    </DescriptionList.Item>
                  )}

                  <DescriptionList.Item>
                    <DescriptionList.Term separator>Returns</DescriptionList.Term>
                    <DescriptionList.Details>{method.returnValue}</DescriptionList.Details>
                  </DescriptionList.Item>

                  {method.returnValueDescription && (
                    <DescriptionList.Item>
                      <DescriptionList.Term separator>Return description</DescriptionList.Term>
                      <DescriptionList.Details>
                        {method.returnValueDescription}
                      </DescriptionList.Details>
                    </DescriptionList.Item>
                  )}
                </DescriptionList.Root>
              </Accordion.Content>
            </Accordion.Panel>
          </Accordion.Item>
        );
      })}
    </Accordion.Root>
  );
}

const TRIGGER_GRID_LAYOUT =
  'xs:grid ' +
  'xs:grid-cols-[1fr_theme(spacing.48)_theme(spacing.10)] ' +
  'sm:grid-cols-[1fr_theme(spacing.56)_theme(spacing.10)] ' +
  'md:grid-cols-[8fr_4fr_theme(spacing.10)] ';

const PANEL_GRID_LAYOUT =
  'max-xs:flex max-xs:flex-col ' +
  'min-xs:gap-0 ' +
  'xs:grid-cols-[theme(spacing.48)_1fr_theme(spacing.10)] ' +
  'sm:grid-cols-[theme(spacing.56)_1fr_theme(spacing.10)] ' +
  'md:grid-cols-[5fr_11.5fr_theme(spacing.10)] ';
