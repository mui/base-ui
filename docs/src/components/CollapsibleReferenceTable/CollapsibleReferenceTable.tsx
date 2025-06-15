import * as React from 'react';
import clsx from 'clsx';
import { Collapsible } from '@base-ui-components/react/collapsible';
import { createMdxComponent } from 'docs/src/mdx/createMdxComponent';
import { inlineMdxComponents } from 'docs/src/mdx-components';
import { rehypeSyntaxHighlighting } from 'docs/src/syntax-highlighting';
import * as Table from '../Table';
import { TableCode } from '../TableCode';
import { GhostButton } from '../GhostButton';

import type { PropDef } from '../ReferenceTable/types';

interface PropsReferenceTableProps extends React.ComponentProps<typeof Table.Root> {
  data: Record<string, PropDef>;
  type?: 'props' | 'return';
}

// const DATA: Record<
//   string,
//   { type: string; description?: string; default?: boolean; required?: boolean }
// > = {
//   className: {
//     type: 'string | ((state: Fieldset.Root.State) => string)',
//     description:
//       'CSS class applied to the element, or a function that\n' +
//       'returns a class based on the component’s state.',
//   },
//   render: {
//     type: 'ReactElement | ((props: HTMLProps, state: Fieldset.Root.State) => ReactElement)',
//     description:
//       'Allows you to replace the component’s HTML element\n' +
//       'with a different tag, or compose it with another component.\n' +
//       '\n' +
//       'Accepts a `ReactElement` or a function that returns the element to render.',
//   },
// };

export function CollapsibleReferenceTable({
  data,
  type = 'props',
  ...props
}: PropsReferenceTableProps) {
  // console.log(props);
  const descriptionColumnId = React.useId();
  return (
    <Table.Root {...props}>
      <Table.Head>
        <Table.Row>
          <Table.ColumnHeader className="w-full xs:w-48 sm:w-56 md:w-1/3">Prop</Table.ColumnHeader>
          <Table.ColumnHeader
            className={
              type === 'props'
                ? 'max-xs:hidden xs:w-full md:w-7/15'
                : 'max-xs:hidden xs:w-full md:w-full'
            }
          >
            Type
          </Table.ColumnHeader>
          {type === 'props' && (
            <Table.ColumnHeader className="max-md:hidden md:w-1/5">Default</Table.ColumnHeader>
          )}
          <Table.ColumnHeader
            className="w-10 max-xs:hidden"
            aria-label="Description"
            id={descriptionColumnId}
          />
        </Table.Row>
      </Table.Head>
      {Object.keys(data).map(async (name) => {
        const prop = data[name];

        const PropType = await createMdxComponent(`\`${prop.type}\``, {
          rehypePlugins: rehypeSyntaxHighlighting,
          useMDXComponents: () => ({ code: TableCode }),
        });

        const PropDefault = await createMdxComponent(`\`${prop.required ? '—' : prop.default}\``, {
          rehypePlugins: rehypeSyntaxHighlighting,
          useMDXComponents: () => ({ code: TableCode }),
        });

        const PropDescription = await createMdxComponent(prop.description, {
          rehypePlugins: rehypeSyntaxHighlighting,
          useMDXComponents: () => inlineMdxComponents,
        });

        return (
          <Collapsible.Root render={<Table.Body />} key={name} data-collapsible>
            <Table.Row>
              <Table.RowHeader className="max-xs:hidden">
                <TableCode className="text-navy">
                  {name}
                  {prop.required ? <sup className="top-[-0.3em] text-xs text-red-800">*</sup> : ''}
                </TableCode>
              </Table.RowHeader>

              <Table.RowHeader className="min-xs:hidden">
                <Collapsible.Trigger className="flex w-full items-center justify-between">
                  <TableCode className="text-navy">
                    {name}
                    {prop.required ? (
                      <sup className="top-[-0.3em] text-xs text-red-800">*</sup>
                    ) : (
                      ''
                    )}
                  </TableCode>
                  <span className="flex min-h-[1rem] min-w-[1rem] items-center justify-center">
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M1 3.5L5 7.5L9 3.5" stroke="currentcolor" />
                    </svg>
                  </span>
                </Collapsible.Trigger>
              </Table.RowHeader>

              <Table.Cell className="max-xs:hidden">
                <PropType />
              </Table.Cell>
              {type === 'props' && (
                <Table.Cell className="max-md:hidden">
                  <PropDefault />
                </Table.Cell>
              )}
              <Table.TriggerCell className="relative max-xs:hidden">
                {prop.description && (
                  // className="data-[panel-open]:rotate-180"
                  <Collapsible.Trigger aria-label="Info" className="Trigger">
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M1 3.5L5 7.5L9 3.5" stroke="currentcolor" />
                    </svg>
                  </Collapsible.Trigger>
                )}
              </Table.TriggerCell>
            </Table.Row>
            <Collapsible.Panel render={<Table.Row />} hiddenUntilFound>
              <Table.DetailsCell
                colSpan={4}
                /* TODO: the headers attr should point to the 1st col at the smallest breakpoint */
                headers={descriptionColumnId}
                className="whitespace-normal"
              >
                {prop.description && (
                  <DescriptionList>
                    <DescriptionTerm>Description</DescriptionTerm>
                    <DescriptionDetails>
                      <PropDescription />
                    </DescriptionDetails>

                    {prop.type && (
                      <React.Fragment>
                        <DescriptionTerm>Type</DescriptionTerm>
                        <DescriptionDetails>
                          <PropType />
                        </DescriptionDetails>
                      </React.Fragment>
                    )}
                  </DescriptionList>
                )}
              </Table.DetailsCell>
            </Collapsible.Panel>
          </Collapsible.Root>
        );
      })}
    </Table.Root>
  );
}

export function DescriptionList({ className, ...props }: React.ComponentProps<'dl'>) {
  return <dl className={clsx('DescriptionList', className)} {...props} />;
}

export function DescriptionTerm({ className, ...props }: React.ComponentProps<'dt'>) {
  return <dt className={clsx('DescriptionTerm', className)} {...props} />;
}

export function DescriptionDetails({ className, ...props }: React.ComponentProps<'dd'>) {
  return <dd className={clsx('DescriptionDetails', className)} {...props} />;
}
