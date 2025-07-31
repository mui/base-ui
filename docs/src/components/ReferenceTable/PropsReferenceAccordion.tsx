import * as React from 'react';
import clsx from 'clsx';
import { visuallyHidden } from '@base-ui-components/utils/visuallyHidden';
import { createMdxComponent } from 'docs/src/mdx/createMdxComponent';
import { inlineMdxComponents } from 'docs/src/mdx-components';
import { rehypeSyntaxHighlighting } from 'docs/src/syntax-highlighting';
import { Link } from 'docs/src/components/Link';
import * as Accordion from '../Accordion';
import * as DescriptionList from '../DescriptionList';
import type { PropDef as BasePropDef } from './types';
import { TableCode } from '../TableCode';
import * as ReferenceTableTooltip from './ReferenceTableTooltip';

function ExpandedCode(props: React.ComponentProps<'code'>) {
  const { className = '', ...rest } = props;
  const cleaned = className
    .split(' ')
    .filter((c) => c !== 'Code')
    .join(' ');
  return <code {...rest} className={cleaned} />;
}

function ExpandedPre(props: React.ComponentProps<'pre'>) {
  return (
    <Accordion.Scrollable gradientColor="var(--color-gray-50)">
      <pre {...props} className="text-xs p-0 m-0" style={{ backgroundColor: 'none' }} />
    </Accordion.Scrollable>
  );
}

interface PropDef extends BasePropDef {
  example?: string;
}

interface Props extends React.ComponentPropsWithoutRef<any> {
  data: Record<string, PropDef>;
  type?: 'props' | 'return';
  name: string;
}

function getShortPropType(name: string, type: string | undefined) {
  if (/^(on|get)[A-Z].*/.test(name)) {
    return { type: 'function', detailedType: true };
  }

  if (type === undefined || type === null) {
    return { type: String(type), detailedType: false };
  }

  if (name === 'className') {
    return { type: 'string | function', detailedType: true };
  }

  if (name === 'render') {
    return { type: 'ReactElement | function', detailedType: true };
  }

  if (
    name.endsWith('Ref') ||
    name === 'children' ||
    type === 'boolean' ||
    type === 'string' ||
    type === 'number' ||
    type.indexOf(' | ') === -1 ||
    (type.split('|').length < 3 && type.length < 30)
  ) {
    return { type, detailedType: false };
  }

  return { type: 'Union', detailedType: true };
}

export async function PropsReferenceAccordion({ data, name: partName, ...props }: Props) {
  const captionId = `${partName}-caption`;

  return (
    <Accordion.Root aria-describedby={captionId} {...props}>
      <span id={captionId} style={visuallyHidden} aria-hidden>
        Component props table
      </span>
      <Accordion.HeaderRow className={clsx('grid', TRIGGER_GRID_LAYOUT)}>
        <Accordion.HeaderCell>Prop</Accordion.HeaderCell>
        <Accordion.HeaderCell className="max-xs:hidden">Type</Accordion.HeaderCell>
      </Accordion.HeaderRow>
      {Object.keys(data).map(async (name, index) => {
        const prop = data[name];

        const PropType = await createMdxComponent(`\`${prop.type}\``, {
          rehypePlugins: rehypeSyntaxHighlighting,
          useMDXComponents: () => ({ code: TableCode }),
        });

        const PropExpandedType = await createMdxComponent(
          `\`\`\`ts\n${prop.expanded ?? prop.type}\n\`\`\``,
          {
            rehypePlugins: rehypeSyntaxHighlighting,
            useMDXComponents: () => ({
              code: ExpandedCode,
              pre: ExpandedPre,
            }),
          },
        );

        const { type: shortPropTypeName, detailedType } = getShortPropType(name, prop.type);

        const ShortPropType = await createMdxComponent(`\`${shortPropTypeName}\``, {
          rehypePlugins: rehypeSyntaxHighlighting,
          useMDXComponents: () => ({ code: TableCode }),
        });

        const PropDefault = await createMdxComponent(`\`${prop.required ? '—' : prop.default}\``, {
          rehypePlugins: rehypeSyntaxHighlighting,
          useMDXComponents: () => ({ code: TableCode }),
        });

        const PropDescription = prop.description
          ? await createMdxComponent(prop.description, {
              rehypePlugins: rehypeSyntaxHighlighting,
              useMDXComponents: () => inlineMdxComponents,
            })
          : null;

        const ExampleSnippet = prop.example
          ? await createMdxComponent(prop.example, {
              rehypePlugins: rehypeSyntaxHighlighting,
              useMDXComponents: () => inlineMdxComponents,
            })
          : null;

        // anchor hash for each prop
        const id = `${partName}-${name}`;

        return (
          <Accordion.Item key={name}>
            <Accordion.Trigger
              id={id}
              index={index}
              aria-label={`prop: ${name},${prop.required ? ' required,' : ''} type: ${shortPropTypeName} ${prop.default !== undefined ? `(default: ${prop.default})` : ''}`}
              className={clsx(
                'min-h-min scroll-mt-12 py-0 max-xs:gap-4 md:scroll-mt-0 md:gap-5',
                TRIGGER_GRID_LAYOUT,
              )}
            >
              <Accordion.Scrollable>
                <TableCode className="text-navy whitespace-nowrap">
                  {name}
                  {prop.required ? <sup className="top-[-0.3em] text-xs text-red-800">*</sup> : ''}
                </TableCode>
              </Accordion.Scrollable>
              {prop.type && (
                <Accordion.Scrollable className="flex items-baseline text-sm leading-none break-keep whitespace-nowrap max-xs:hidden">
                  {detailedType ? (
                    <ReferenceTableTooltip.Root delay={300} hoverable={false}>
                      <ReferenceTableTooltip.Trigger render={<ShortPropType />} />
                      <ReferenceTableTooltip.Popup>
                        <PropType />
                      </ReferenceTableTooltip.Popup>
                    </ReferenceTableTooltip.Root>
                  ) : (
                    <ShortPropType />
                  )}
                  {prop.default !== undefined && (
                    <span className="inline-flex items-baseline gap-1 break-keep whitespace-nowrap">
                      <span>(</span>default: <PropDefault />)
                    </span>
                  )}
                </Accordion.Scrollable>
              )}
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

                  {PropDescription != null && (
                    <DescriptionList.Item>
                      <DescriptionList.Separator className="max-xs:pt-2">
                        <DescriptionList.Term>Description</DescriptionList.Term>
                      </DescriptionList.Separator>
                      {/* one-off override of the default mt/mb on CodeBlock.Root */}
                      <DescriptionList.Details className="[&_[role='figure']]:mt-1 [&_[role='figure']]:mb-1">
                        <PropDescription />
                      </DescriptionList.Details>
                    </DescriptionList.Item>
                  )}

                  <DescriptionList.Item>
                    <DescriptionList.Separator className="max-xs:pt-2">
                      <DescriptionList.Term>Type</DescriptionList.Term>
                    </DescriptionList.Separator>
                    <DescriptionList.Details>
                      <PropExpandedType />
                    </DescriptionList.Details>
                  </DescriptionList.Item>

                  {prop.default !== undefined && (
                    <DescriptionList.Item>
                      <DescriptionList.Separator className="max-xs:pt-2">
                        <DescriptionList.Term>Default</DescriptionList.Term>
                      </DescriptionList.Separator>
                      <DescriptionList.Details>
                        <PropDefault />
                      </DescriptionList.Details>
                    </DescriptionList.Item>
                  )}

                  {ExampleSnippet != null && (
                    <DescriptionList.Item>
                      <DescriptionList.Separator className="max-xs:pt-2">
                        <DescriptionList.Term>Example</DescriptionList.Term>
                      </DescriptionList.Separator>
                      <DescriptionList.Details className="*:my-0">
                        <ExampleSnippet />
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
  'md:grid-cols-[1fr_2fr_theme(spacing.10)] ';

const PANEL_GRID_LAYOUT =
  'gap-3 ' +
  'max-xs:flex max-xs:flex-col ' +
  'xs:grid-cols-[theme(spacing.48)_1fr_theme(spacing.10)] ' +
  'xs:gap-0 ' +
  'sm:grid-cols-[theme(spacing.56)_1fr_theme(spacing.10)] ' +
  'md:grid-cols-[1fr_2fr_theme(spacing.10)] ';
