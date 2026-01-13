import * as React from 'react';
import clsx from 'clsx';
import { visuallyHidden } from '@base-ui/utils/visuallyHidden';
import { createMdxComponent } from 'docs/src/mdx/createMdxComponent';
import { inlineMdxComponents, mdxComponents } from 'docs/src/mdx-components';
import { rehypeSyntaxHighlighting } from 'docs/src/syntax-highlighting';
import { Link } from 'docs/src/components/Link';
import * as Accordion from '../Accordion';
import * as DescriptionList from '../DescriptionList';
import type { PropDef as BasePropDef } from './types';
import { TableCode, type TableCodeProps } from '../TableCode';
import * as ReferenceTableTooltip from './ReferenceTableTooltip';

function ExpandedCode(props: React.ComponentProps<'code'>) {
  const { className = '', ...other } = props;
  const cleaned = className
    .split(' ')
    .filter((c) => c !== 'Code')
    .join(' ');
  return <code {...other} className={cleaned} />;
}

function ExpandedPre(props: React.ComponentProps<'pre'>) {
  return (
    <Accordion.Scrollable tag="div" gradientColor="var(--color-gray-50)">
      <pre {...props} className="text-xs p-0 m-0" style={{ backgroundColor: undefined }} />
    </Accordion.Scrollable>
  );
}

interface PropDef extends BasePropDef {
  detailedType?: string;
  example?: string;
}

interface Props extends React.ComponentPropsWithoutRef<any> {
  data: Record<string, PropDef>;
  type?: 'props' | 'return';
  name: string;
  // When reusing a component's reference for another component,
  // replace occurrences of "renameFrom.*" with "renameTo.*" in types
  renameFrom?: string;
  renameTo?: string;
  nameLabel?: string;
  caption?: string;
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

  if (name === 'style') {
    return { type: 'React.CSSProperties | function', detailedType: true };
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

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceComponentPrefix(input: string | undefined, from?: string, to?: string) {
  if (!input || !from || !to) {
    return input ?? '';
  }
  const pattern = new RegExp(`\\b${escapeRegExp(from)}(?=\\.)`, 'g');
  return input.replace(pattern, to);
}

export async function ReferenceAccordion({
  data,
  name: partName,
  renameFrom,
  renameTo,
  nameLabel = 'Prop',
  caption = 'Component props table',
  ...props
}: Props) {
  const captionId = `${partName}-caption`;

  return (
    <Accordion.Root aria-describedby={captionId} {...props}>
      <span id={captionId} style={visuallyHidden} aria-hidden>
        {caption}
      </span>
      <Accordion.HeaderRow className={clsx('grid', TRIGGER_GRID_LAYOUT)}>
        <Accordion.HeaderCell>{nameLabel}</Accordion.HeaderCell>
        <Accordion.HeaderCell className="max-xs:hidden">Type</Accordion.HeaderCell>
        <Accordion.HeaderCell className="max-md:hidden">Default</Accordion.HeaderCell>
        <Accordion.HeaderCell className="max-md:hidden w-10" />
      </Accordion.HeaderRow>
      {Object.keys(data).map(async (name, index) => {
        const prop = data[name];

        const displayType = replaceComponentPrefix(prop.type, renameFrom, renameTo);
        const detailedDisplayType = replaceComponentPrefix(
          prop.detailedType ?? prop.type,
          renameFrom,
          renameTo,
        );

        const PropType = await createMdxComponent(`\`${displayType}\``, {
          rehypePlugins: rehypeSyntaxHighlighting,
          useMDXComponents: () => ({ ...inlineMdxComponents, code: TableCode }),
        });

        const PropDetailedType = await createMdxComponent(
          `\`\`\`ts\n${detailedDisplayType}\n\`\`\``,
          {
            rehypePlugins: rehypeSyntaxHighlighting,
            useMDXComponents: () => ({
              ...inlineMdxComponents,
              figure: 'figure',
              pre: ExpandedPre,
              code: ExpandedCode,
            }),
          },
        );

        const { type: shortPropTypeName, detailedType } = getShortPropType(name, displayType);
        const hasExpandedType = Boolean(prop.detailedType);

        const ShortPropType = await createMdxComponent(`\`${shortPropTypeName}\``, {
          rehypePlugins: rehypeSyntaxHighlighting,
          useMDXComponents: () => ({
            ...inlineMdxComponents,
            code: (codeProps: TableCodeProps) => (
              <TableCode {...codeProps} printWidth={name === 'children' ? 999 : undefined} />
            ),
          }),
        });

        const PropDefault = await createMdxComponent(`\`${prop.default}\``, {
          rehypePlugins: rehypeSyntaxHighlighting,
          useMDXComponents: () => ({ ...inlineMdxComponents, code: TableCode }),
        });

        const PropDescription = prop.description
          ? await createMdxComponent(prop.description, {
              rehypePlugins: rehypeSyntaxHighlighting,
              useMDXComponents: () => ({ ...mdxComponents, p: 'p' }),
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
              aria-label={`${nameLabel}: ${name},${prop.required ? ' required,' : ''} type: ${shortPropTypeName} ${prop.default !== undefined ? `(default: ${prop.default})` : ''}`}
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
                  {hasExpandedType || detailedType ? (
                    <ReferenceTableTooltip.Root disableHoverablePopup>
                      <ReferenceTableTooltip.Trigger render={<ShortPropType />} delay={300} />
                      <ReferenceTableTooltip.Popup>
                        {hasExpandedType ? <PropDetailedType /> : <PropType />}
                      </ReferenceTableTooltip.Popup>
                    </ReferenceTableTooltip.Root>
                  ) : (
                    <ShortPropType />
                  )}
                </Accordion.Scrollable>
              )}
              <Accordion.Scrollable className="max-md:hidden break-keep whitespace-nowrap px-3">
                {prop.required || prop.default === undefined ? (
                  <TableCode className="text-(--syntax-nullish)">—</TableCode>
                ) : (
                  <PropDefault />
                )}
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
                  {PropDescription != null && (
                    <DescriptionList.Item>
                      <DescriptionList.Term separator>Description</DescriptionList.Term>
                      {/* one-off override of the default mt/mb on CodeBlock.Root */}
                      <DescriptionList.Details className="[&_[role='figure']]:mt-1 [&_[role='figure']]:mb-1">
                        <PropDescription />
                      </DescriptionList.Details>
                    </DescriptionList.Item>
                  )}
                  <DescriptionList.Item>
                    <DescriptionList.Term separator>Type</DescriptionList.Term>
                    <DescriptionList.Details>
                      <PropDetailedType />
                    </DescriptionList.Details>
                  </DescriptionList.Item>
                  {prop.default !== undefined && (
                    <DescriptionList.Item>
                      <DescriptionList.Term separator>Default</DescriptionList.Term>
                      <DescriptionList.Details>
                        <PropDefault />
                      </DescriptionList.Details>
                    </DescriptionList.Item>
                  )}
                  {ExampleSnippet != null && (
                    <DescriptionList.Item>
                      <DescriptionList.Term separator>Example</DescriptionList.Term>
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
  'md:grid-cols-[5fr_7fr_4.5fr_theme(spacing.10)] ';

const PANEL_GRID_LAYOUT =
  'max-xs:flex max-xs:flex-col ' +
  'min-xs:gap-0 ' +
  'xs:grid-cols-[theme(spacing.48)_1fr_theme(spacing.10)] ' +
  'sm:grid-cols-[theme(spacing.56)_1fr_theme(spacing.10)] ' +
  // 5fr+11.5fr aligns with 5fr+7fr+4.5fr above
  'md:grid-cols-[5fr_11.5fr_theme(spacing.10)] ';
