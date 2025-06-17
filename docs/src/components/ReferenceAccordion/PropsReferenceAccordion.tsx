import * as React from 'react';
import clsx from 'clsx';
import { visuallyHidden } from '@base-ui-components/react/utils';
import { createMdxComponent } from 'docs/src/mdx/createMdxComponent';
import { inlineMdxComponents } from 'docs/src/mdx-components';
import { rehypeSyntaxHighlighting } from 'docs/src/syntax-highlighting';
import * as Accordion from '../Accordion';
import * as DescriptionList from '../DescriptionList';
import type { PropDef as BasePropDef } from '../ReferenceTable/types';
import { TableCode } from '../TableCode';

interface PropDef extends BasePropDef {
  example?: string;
}

interface Props extends React.ComponentProps<typeof Accordion.Root> {
  data: Record<string, PropDef>;
  type?: 'props' | 'return';
  name: string;
}

const DATA: Record<string, PropDef> = {
  className: {
    type: 'string | ((state: Fieldset.Root.State) => string)',
    description:
      'CSS class applied to the element, or a function that\n' +
      'returns a class based on the component’s state.',
  },
  render: {
    type: 'ReactElement | ((props: HTMLProps, state: Fieldset.Root.State) => ReactElement)',
    description:
      'Allows you to replace the component’s HTML element\n' +
      'with a different tag, or compose it with another component.\n' +
      '\n' +
      'Accepts a `ReactElement` or a function that returns the element to render.',
  },
};

export function HeaderLabel({ className, children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={clsx(
        'HeaderLabel',
        'py-[0.5rem] text-(length:--text-sm) font-medium tracking-[-0.00625em]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function getShortPropType(name: string, type: string | undefined) {
  if (/^on[A-Z].*/.test(name)) {
    return 'Function';
  }

  if (type === undefined || type === null) {
    return String(type);
  }

  if (name === 'className') {
    return 'string | Function';
  }

  if (name === 'render') {
    return 'ReactElement | Function';
  }

  if (name.endsWith('Ref')) {
    return type;
  }

  if (['children'].includes(name)) {
    return type;
  }

  if (['boolean', 'string', 'number'].includes(type)) {
    return type;
  }

  if (!type.includes(' | ') || type.split('|').length < 3) {
    return type;
  }

  return 'Union';
}

export async function PropsReferenceAccordion({
  data = DATA,
  name: partName,
  // type = 'props',
  ...props
}: Props) {
  const captionId = `${partName}-caption`;
  return (
    <Accordion.Root hiddenUntilFound aria-describedby={captionId} {...props}>
      <span id={captionId} style={visuallyHidden} aria-hidden>
        Component props table
      </span>
      <div
        aria-hidden
        className="TableHeadRow rounded-t-(--radius-md) border-b-1 border-(--color-gray-200) bg-(--color-gray-50)"
      >
        <HeaderLabel className="max-xs:pl-[0.75rem]">Prop</HeaderLabel>
        <HeaderLabel className="max-xs:hidden">Type</HeaderLabel>
      </div>
      {Object.keys(data).map(async (name) => {
        const prop = data[name];

        const PropType = await createMdxComponent(`\`${prop.type}\``, {
          rehypePlugins: rehypeSyntaxHighlighting,
          useMDXComponents: () => ({ code: TableCode }),
        });

        const shortPropTypeName = getShortPropType(name, prop.type);
        // const shortPropTypeName = 'Union';

        const ShortPropType = await createMdxComponent(`\`${shortPropTypeName}\``, {
          rehypePlugins: rehypeSyntaxHighlighting,
          useMDXComponents: () => ({ code: TableCode }),
        });

        const PropDefault = await createMdxComponent(`\`${prop.required ? '—' : prop.default}\``, {
          rehypePlugins: rehypeSyntaxHighlighting,
          useMDXComponents: () => ({ code: TableCode }),
        });

        const ShortPropTypeWithDefault = await createMdxComponent(
          `\`${prop.required ? '—' : `(\`default\`: ${prop.default}\` )`}`,
          {
            rehypePlugins: rehypeSyntaxHighlighting,
            useMDXComponents: () => ({ code: TableCode }),
          },
        );

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

        return (
          <Accordion.Item>
            <Accordion.Header render={<h4 />}>
              <Accordion.Trigger
                aria-label={`prop: ${name}, type: ${shortPropTypeName} ${prop.default !== undefined ? `(default: ${prop.default})` : ''}`}
                className="Table"
              >
                <TableCode className="text-navy">{name}</TableCode>
                {prop.type && (
                  <span className="flex items-baseline gap-4 text-sm">
                    <ShortPropType />
                    {prop.default !== undefined && (
                      <span className="max-sm:hidden">
                        <ShortPropTypeWithDefault />
                      </span>
                    )}
                  </span>
                )}
                <svg
                  className="AccordionIcon"
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M1 3.5L5 7.5L9 3.5" stroke="currentcolor" />
                </svg>
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel aria-labelledby={`${name}-h5`}>
              <Accordion.Content className="min-xs:py-[0.25rem]">
                {/* avoid announcing the trigger again when moving from the trigger into content */}
                <h5 id={`${name}-h5`} style={visuallyHidden} aria-hidden>
                  Details
                </h5>
                <DescriptionList.Root className="max-xs:p-4">
                  {PropDescription != null && (
                    <React.Fragment>
                      <DescriptionList.Term>Description</DescriptionList.Term>
                      <DescriptionList.Details>
                        <PropDescription />
                      </DescriptionList.Details>
                    </React.Fragment>
                  )}
                  <DescriptionList.Term>Type</DescriptionList.Term>
                  <DescriptionList.Details>
                    <PropType />
                  </DescriptionList.Details>
                  <DescriptionList.Term>Default</DescriptionList.Term>
                  <DescriptionList.Details>
                    <PropDefault />
                  </DescriptionList.Details>
                  {ExampleSnippet != null && (
                    <React.Fragment>
                      <DescriptionList.Term>Example</DescriptionList.Term>
                      <DescriptionList.Details className="*:my-0">
                        <ExampleSnippet />
                      </DescriptionList.Details>
                    </React.Fragment>
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
