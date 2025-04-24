import * as React from 'react';
import { createMdxComponent } from 'docs/src/mdx/createMdxComponent';
import { inlineMdxComponents } from 'docs/src/mdx-components';
import { rehypeSyntaxHighlighting } from 'docs/src/syntax-highlighting';
import { ReferenceTablePopover } from './ReferenceTablePopover';
import * as Table from '../Table';
import type { PropDef } from './types';
import { TableCode } from '../TableCode';

interface PropsReferenceTableProps extends React.ComponentProps<typeof Table.Root> {
  data: Record<string, PropDef>;
  type?: 'props' | 'return';
}

export async function PropsReferenceTable({
  data,
  type = 'props',
  ...props
}: PropsReferenceTableProps) {
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
          <Table.ColumnHeader className="w-10" aria-label="Description" />
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {Object.keys(data).map(async (name) => {
          const prop = data[name];

          const PropType = await createMdxComponent(`\`${prop.type}\``, {
            rehypePlugins: rehypeSyntaxHighlighting,
            useMDXComponents: () => ({ code: TableCode }),
          });

          const PropDefault = await createMdxComponent(
            `\`${prop.required ? '—' : prop.default}\``,
            {
              rehypePlugins: rehypeSyntaxHighlighting,
              useMDXComponents: () => ({ code: TableCode }),
            },
          );

          const PropDescription = await createMdxComponent(prop.description, {
            rehypePlugins: rehypeSyntaxHighlighting,
            useMDXComponents: () => inlineMdxComponents,
          });

          return (
            <Table.Row key={name}>
              <Table.RowHeader>
                <TableCode className="text-navy">
                  {name}
                  {prop.required ? ' *' : ''}
                </TableCode>
              </Table.RowHeader>
              <Table.Cell className="max-xs:hidden">
                <PropType />
              </Table.Cell>
              {type === 'props' && (
                <Table.Cell className="max-md:hidden">
                  <PropDefault />
                </Table.Cell>
              )}
              <Table.Cell>
                {prop.description && (
                  <ReferenceTablePopover>
                    <PropDescription />
                    <div className="flex flex-col gap-2 text-md md:hidden">
                      <div className="border-t border-gray-200 pt-2 xs:hidden">
                        <div className="mb-1 font-bold">Type</div>
                        <PropType />
                      </div>
                      {type === 'props' && (
                        <div className="border-t border-gray-200 pt-2">
                          <div className="mb-1 font-bold">Default</div>
                          <PropDefault />
                        </div>
                      )}
                    </div>
                  </ReferenceTablePopover>
                )}
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
}
