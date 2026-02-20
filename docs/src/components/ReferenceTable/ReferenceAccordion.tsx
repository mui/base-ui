import * as React from 'react';
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
      <pre {...props} className="ReferencePre" style={{ backgroundColor: undefined }} />
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
      <Accordion.HeaderRow className="ReferenceHeaderRow">
        <Accordion.HeaderCell>{nameLabel}</Accordion.HeaderCell>
        <Accordion.HeaderCell className="ReferenceHeaderTypeCell">Type</Accordion.HeaderCell>
        <Accordion.HeaderCell className="ReferenceHeaderDefaultCell">Default</Accordion.HeaderCell>
        <Accordion.HeaderCell className="ReferenceHeaderIconCell" />
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
          <Accordion.Item
            key={name}
            gaCategory="reference"
            gaLabel={`${nameLabel}: ${id}`}
            gaParams={{ type: nameLabel.toLowerCase(), slug: id, part_name: partName }}
          >
            <Accordion.Trigger
              id={id}
              index={index}
              aria-label={`${nameLabel}: ${name},${prop.required ? ' required,' : ''} type: ${shortPropTypeName} ${prop.default !== undefined ? `(default: ${prop.default})` : ''}`}
              className="ReferenceTrigger"
            >
              <Accordion.Scrollable className="ReferenceNameCell">
                <TableCode className="bui-ws-nw" style={{ color: 'var(--color-navy)' }}>
                  {name}
                  {prop.required ? <sup className="ReferenceRequired">*</sup> : ''}
                </TableCode>
              </Accordion.Scrollable>
              {prop.type && (
                <Accordion.Scrollable className="ReferenceTypeCell">
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
              <Accordion.Scrollable className="ReferenceDefaultCell">
                {prop.required || prop.default === undefined ? (
                  <TableCode style={{ color: 'var(--syntax-nullish)' }}>—</TableCode>
                ) : (
                  <PropDefault />
                )}
              </Accordion.Scrollable>
              <span className="ReferenceIconWrap">
                <svg
                  className="AccordionIcon ReferenceIcon"
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
                <DescriptionList.Root className="ReferenceContent" aria-label="Info">
                  <DescriptionList.Item>
                    <DescriptionList.Term>Name</DescriptionList.Term>
                    <DescriptionList.Details>
                      <Link href={`#${id}`}>
                        <TableCode style={{ color: 'var(--color-blue)' }}>{name}</TableCode>
                      </Link>
                    </DescriptionList.Details>
                  </DescriptionList.Item>
                  {PropDescription != null && (
                    <DescriptionList.Item>
                      <DescriptionList.Term separator>Description</DescriptionList.Term>
                      {/* one-off override of the default mt/mb on CodeBlock.Root */}
                      <DescriptionList.Details className="ReferenceDescription">
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
                      <DescriptionList.Details className="ReferenceExampleReset">
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
