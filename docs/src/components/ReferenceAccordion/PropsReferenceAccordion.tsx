import * as React from 'react';
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

interface Props extends React.ComponentPropsWithoutRef<any> {
  data: Record<string, PropDef>;
  type?: 'props' | 'return';
  name: string;
}

const DATA: Record<string, PropDef> = {
  value: {
    type: 'string',
    description: 'A unique string that identifies the toggle when used\ninside a toggle group.',
  },
  defaultPressed: {
    type: 'boolean',
    default: 'false',
    description:
      'Whether the toggle button is currently pressed.\nThis is the uncontrolled counterpart of `pressed`.',
  },
  pressed: {
    type: 'boolean',
    description:
      'Whether the toggle button is currently pressed.\nThis is the controlled counterpart of `defaultPressed`.',
  },
  onPressedChange: {
    type: '((pressed: boolean, event: Event) => void)',
    description: 'Callback fired when the pressed state is changed.',
    example:
      '```tsx\nconst [pressed, setPressed] = React.useState(true);\n\nreturn (\n  <Toggle pressed={pressed} onPressedChange={setPressed} />\n)\n```',
  },
  nativeButton: {
    type: 'boolean',
    default: 'true',
    description:
      'Whether the component renders a native `<button>` element when replacing it\nvia the `render` prop.\nSet to `false` if the rendered element is not a button (e.g. `<div>`).',
  },
  disabled: {
    type: 'boolean',
    default: 'false',
    description: 'Whether the component should ignore user interaction.',
  },
  className: {
    type: 'string | ((state: Toggle.State) => string)',
    description:
      'CSS class applied to the element, or a function that\nreturns a class based on the component’s state.',
  },
  render: {
    type: 'ReactElement | ((props: HTMLProps, state: Toggle.State) => ReactElement)',
    description:
      'Allows you to replace the component’s HTML element\nwith a different tag, or compose it with another component.\n\nAccepts a `ReactElement` or a function that returns the element to render.',
  },
};

function getShortPropType(name: string, type: string | undefined) {
  if (/^on[A-Z].*/.test(name)) {
    return 'function';
  }

  if (type === undefined || type === null) {
    return String(type);
  }

  if (name === 'className') {
    return 'string | function';
  }

  if (name === 'render') {
    return 'ReactElement | function';
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
    <Accordion.Root aria-describedby={captionId} {...props}>
      <span id={captionId} style={visuallyHidden} aria-hidden>
        Component props table
      </span>
      <Accordion.HeaderRow>
        <Accordion.HeaderLabel>Prop</Accordion.HeaderLabel>
        <Accordion.HeaderLabel className="max-xs:hidden">Type</Accordion.HeaderLabel>
      </Accordion.HeaderRow>
      {Object.keys(data).map(async (name, index) => {
        const prop = data[name];

        const PropType = await createMdxComponent(`\`${prop.type}\``, {
          rehypePlugins: rehypeSyntaxHighlighting,
          useMDXComponents: () => ({ code: TableCode }),
        });

        const shortPropTypeName = getShortPropType(name, prop.type);

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
            <Accordion.Trigger
              index={index}
              aria-label={`prop: ${name}, type: ${shortPropTypeName} ${prop.default !== undefined ? `(default: ${prop.default})` : ''}`}
              className="max-xs:gap-4 md:gap-4"
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
            <Accordion.Panel aria-labelledby={`${name}-h5`}>
              <Accordion.Content className="min-xs:py-1 min-md:py-2">
                {/* avoid announcing the trigger again when moving from the trigger into content */}
                <h5 id={`${name}-h5`} style={visuallyHidden} aria-hidden>
                  Details
                </h5>
                <DescriptionList.Root className="max-xs:p-4 xs:text-gray-600">
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
                  {prop.default !== undefined && (
                    <React.Fragment>
                      <DescriptionList.Term>Default</DescriptionList.Term>
                      <DescriptionList.Details>
                        <PropDefault />
                      </DescriptionList.Details>
                    </React.Fragment>
                  )}
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
