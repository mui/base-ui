import * as React from 'react';
import clsx from 'clsx';
import { visuallyHidden } from '@base-ui-components/utils/visuallyHidden';
import { Link } from 'docs/src/components/Link';
import * as Accordion from '../Accordion';
import * as DescriptionList from '../DescriptionList';
import type { PropDef as BasePropDef } from './types';
import { TableCode } from '../TableCode';
import * as ReferenceTableTooltip from './ReferenceTableTooltip';

interface Props extends React.ComponentPropsWithoutRef<any> {
  data: Record<string, BasePropDef>;
  type?: 'props' | 'return';
  name: string;
  // When reusing a component's reference for another component,
  // replace occurrences of "renameFrom.*" with "renameTo.*" in types
  renameFrom?: string;
  renameTo?: string;
}

export function PropsReferenceAccordion({
  data,
  name: partName,
  renameFrom,
  renameTo,
  ...props
}: Props) {
  const captionId = `${partName}-caption`;

  return (
    <Accordion.Root aria-describedby={captionId} {...props}>
      <span id={captionId} style={visuallyHidden} aria-hidden>
        Component props table
      </span>
      <Accordion.HeaderRow className={clsx('grid', TRIGGER_GRID_LAYOUT)}>
        <Accordion.HeaderCell>Prop</Accordion.HeaderCell>
        <Accordion.HeaderCell className="max-xs:hidden">Type</Accordion.HeaderCell>
        <Accordion.HeaderCell className="max-md:hidden">Default</Accordion.HeaderCell>
        <Accordion.HeaderCell className="max-md:hidden w-10" />
      </Accordion.HeaderRow>
      {Object.keys(data).map((name, index) => {
        const prop = data[name];

        // Use shortType if available (set by useTypes), otherwise use the full type
        const displayShortType = prop.shortType ?? prop.type;
        const displayDetailedType = prop.detailedType ?? prop.type;
        const hasExpandedType = Boolean(prop.shortType || prop.detailedType);

        // anchor hash for each prop
        const id = `${partName}-${name}`;

        const shortTypeText = prop.shortTypeText ?? 'type';
        const defaultText = prop.defaultText;

        return (
          <Accordion.Item key={name}>
            <Accordion.Trigger
              id={id}
              index={index}
              aria-label={`prop: ${name},${prop.required ? ' required,' : ''} type: ${shortTypeText} ${defaultText !== undefined ? `(default: ${defaultText})` : ''}`}
              className={clsx('min-h-min scroll-mt-12 p-0 md:scroll-mt-0', TRIGGER_GRID_LAYOUT)}
            >
              <Accordion.Scrollable className="px-3">
                <TableCode className="text-navy whitespace-nowrap">
                  {name}
                  {prop.required ? <sup className="top-[-0.3em] text-xs text-red-800">*</sup> : ''}
                </TableCode>
              </Accordion.Scrollable>
              {prop.type && (
                <Accordion.Scrollable className="px-3 flex items-baseline text-sm leading-none break-keep whitespace-nowrap max-xs:hidden">
                  {hasExpandedType ? (
                    <ReferenceTableTooltip.Root hoverable={false}>
                      <ReferenceTableTooltip.Trigger
                        delay={300}
                        render={<span>{displayShortType}</span>}
                      />
                      <ReferenceTableTooltip.Popup>
                        {displayDetailedType}
                      </ReferenceTableTooltip.Popup>
                    </ReferenceTableTooltip.Root>
                  ) : (
                    displayShortType
                  )}
                </Accordion.Scrollable>
              )}
              <Accordion.Scrollable className="max-md:hidden break-keep whitespace-nowrap px-3">
                {prop.required || prop.default === undefined ? (
                  <TableCode className="text-(--syntax-nullish)">—</TableCode>
                ) : (
                  prop.default
                )}
              </Accordion.Scrollable>
              <div className="flex justify-center max-xs:ml-auto max-xs:mr-3">
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
              </div>
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

                  {prop.description && (
                    <DescriptionList.Item>
                      <DescriptionList.Separator className="max-xs:pt-2">
                        <DescriptionList.Term>Description</DescriptionList.Term>
                      </DescriptionList.Separator>
                      {/* one-off override of the default mt/mb on CodeBlock.Root */}
                      <DescriptionList.Details className="[&_[role='figure']]:mt-1 [&_[role='figure']]:mb-1">
                        {prop.description}
                      </DescriptionList.Details>
                    </DescriptionList.Item>
                  )}

                  <DescriptionList.Item>
                    <DescriptionList.Separator className="max-xs:pt-2">
                      <DescriptionList.Term>Type</DescriptionList.Term>
                    </DescriptionList.Separator>
                    <DescriptionList.Details>{displayDetailedType}</DescriptionList.Details>
                  </DescriptionList.Item>

                  {prop.default !== undefined && (
                    <DescriptionList.Item>
                      <DescriptionList.Separator className="max-xs:pt-2">
                        <DescriptionList.Term>Default</DescriptionList.Term>
                      </DescriptionList.Separator>
                      <DescriptionList.Details>{prop.default}</DescriptionList.Details>
                    </DescriptionList.Item>
                  )}

                  {prop.example && (
                    <DescriptionList.Item>
                      <DescriptionList.Separator className="max-xs:pt-2">
                        <DescriptionList.Term>Example</DescriptionList.Term>
                      </DescriptionList.Separator>
                      <DescriptionList.Details className="*:my-0">
                        {prop.example}
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
  'xs:grid-cols-[theme(spacing.48)_1fr_theme(spacing.10)] ' +
  'sm:grid-cols-[theme(spacing.56)_1fr_theme(spacing.10)] ' +
  'md:grid-cols-[5fr_7fr_4.5fr_theme(spacing.10)] ';

const PANEL_GRID_LAYOUT =
  'max-xs:flex max-xs:flex-col ' +
  'min-xs:gap-0 ' +
  'xs:grid-cols-[theme(spacing.48)_1fr_theme(spacing.10)] ' +
  'sm:grid-cols-[theme(spacing.56)_1fr_theme(spacing.10)] ' +
  // 5fr+11.5fr aligns with 5fr+7fr+4.5fr above
  'md:grid-cols-[5fr_11.5fr_theme(spacing.10)] ';
