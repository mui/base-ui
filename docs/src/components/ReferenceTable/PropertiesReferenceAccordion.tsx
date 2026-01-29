import * as React from 'react';
import clsx from 'clsx';
import { visuallyHidden } from '@base-ui/utils/visuallyHidden';
import { ProcessedProperty } from '@mui/internal-docs-infra/useTypes';
import { Link } from 'docs/src/components/Link';
import * as Accordion from '../Accordion';
import * as DescriptionList from '../DescriptionList';
import { TableCode } from '../TableCode';
import * as ReferenceTableTooltip from './ReferenceTableTooltip';

interface ProcessedClassProperty extends ProcessedProperty {
  isStatic?: boolean;
  readonly?: boolean;
}

interface Props extends React.ComponentPropsWithoutRef<any> {
  data: Record<string, ProcessedClassProperty>;
  name: string;
}

export function PropertiesReferenceAccordion({ data, name: partName, ...props }: Props) {
  const captionId = `${partName}-properties-caption`;

  return (
    <Accordion.Root aria-describedby={captionId} {...props}>
      <span id={captionId} style={visuallyHidden} aria-hidden>
        Class properties table
      </span>
      <Accordion.HeaderRow className={clsx('grid', TRIGGER_GRID_LAYOUT)}>
        <Accordion.HeaderCell>Property</Accordion.HeaderCell>
        <Accordion.HeaderCell className="max-xs:hidden">Type</Accordion.HeaderCell>
        <Accordion.HeaderCell className="max-md:hidden">Modifiers</Accordion.HeaderCell>
        <Accordion.HeaderCell className="max-md:hidden w-10" />
      </Accordion.HeaderRow>
      {Object.keys(data).map((name, index) => {
        const prop = data[name];

        // Use shortType if available, otherwise use the full type
        const displayShortType = prop.shortType ?? prop.type;
        const displayDetailedType = prop.detailedType ?? prop.type;
        const hasExpandedType = Boolean(prop.shortType || prop.detailedType);

        // anchor hash for each property
        const id = `${partName}-${name}`;

        const shortTypeText = prop.shortTypeText ?? 'type';

        // Build modifiers string
        const modifiers: string[] = [];
        if (prop.isStatic) {
          modifiers.push('static');
        }
        if (prop.readonly) {
          modifiers.push('readonly');
        }
        const modifiersText = modifiers.join(', ') || '—';

        return (
          <Accordion.Item key={name}>
            <Accordion.Trigger
              id={id}
              index={index}
              aria-label={`Property: ${name}, type: ${shortTypeText}, modifiers: ${modifiersText}`}
              className={clsx('min-h-min scroll-mt-12 p-0 md:scroll-mt-0', TRIGGER_GRID_LAYOUT)}
            >
              <Accordion.Scrollable className="px-3">
                <TableCode className="text-navy whitespace-nowrap">{name}</TableCode>
              </Accordion.Scrollable>
              {prop.type && (
                <Accordion.Scrollable className="px-3 flex items-baseline text-sm leading-none break-keep whitespace-nowrap max-xs:hidden">
                  {hasExpandedType ? (
                    <ReferenceTableTooltip.Root disableHoverablePopup>
                      <ReferenceTableTooltip.Trigger delay={300}>
                        {displayShortType}
                      </ReferenceTableTooltip.Trigger>
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
                <TableCode className="text-(--syntax-nullish)">{modifiersText}</TableCode>
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

                  {prop.description && (
                    <DescriptionList.Item>
                      <DescriptionList.Term separator>Description</DescriptionList.Term>
                      <DescriptionList.Details className="**:[[role='figure']]:mt-1 **:[[role='figure']]:mb-1">
                        {prop.description}
                      </DescriptionList.Details>
                    </DescriptionList.Item>
                  )}
                  <DescriptionList.Item>
                    <DescriptionList.Term separator>Type</DescriptionList.Term>
                    <DescriptionList.Details>{displayDetailedType}</DescriptionList.Details>
                  </DescriptionList.Item>
                  {modifiers.length > 0 && (
                    <DescriptionList.Item>
                      <DescriptionList.Term separator>Modifiers</DescriptionList.Term>
                      <DescriptionList.Details>
                        <TableCode>{modifiersText}</TableCode>
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
