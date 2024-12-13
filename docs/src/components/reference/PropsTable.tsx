import * as React from 'react';
import { createMdxComponent } from 'docs/src/mdx/createMdxComponent';
import { inlineMdxComponents, tableMdxComponents } from 'docs/src/mdx-components';
import { rehypeSyntaxHighlighting } from 'docs/src/syntax-highlighting';
import { ReferenceTablePopover } from './ReferenceTablePopover';
import * as Table from '../Table';
import type { PropDef } from './types';
import { Code } from '../Code';

interface PropsTableProps extends React.ComponentProps<typeof Table.Root> {
  data: Record<string, PropDef>;
}

export async function PropsTable({ data, ...props }: PropsTableProps) {
  return (
    <Table.Root {...props}>
      <Table.Head>
        <Table.Row>
          <Table.ColumnHeader className="w-full xs:w-48 sm:w-56 md:w-1/3">Prop</Table.ColumnHeader>
          <Table.ColumnHeader className="max-xs:hidden xs:w-full md:w-7/15">
            Type
          </Table.ColumnHeader>
          <Table.ColumnHeader className="max-md:hidden md:w-1/5">Default</Table.ColumnHeader>
          <Table.ColumnHeader className="w-10" aria-label="Description" />
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {Object.keys(data).map(async (name) => {
          const prop = data[name];

          const PropType = await createMdxComponent(`\`${prop.type}\``, {
            rehypePlugins: rehypeSyntaxHighlighting,
            useMDXComponents: () => tableMdxComponents,
          });

          const PropDefault = await createMdxComponent(`\`${prop.default}\``, {
            rehypePlugins: rehypeSyntaxHighlighting,
            useMDXComponents: () => tableMdxComponents,
          });

          const PropDescription = await createMdxComponent(prop.description, {
            rehypePlugins: rehypeSyntaxHighlighting,
            useMDXComponents: () => inlineMdxComponents,
          });

          return (
            <Table.Row key={name}>
              <Table.RowHeader>
                <Code className="text-navy">{name}</Code>
              </Table.RowHeader>
              <Table.Cell className="max-xs:hidden">
                <PropType />
              </Table.Cell>
              <Table.Cell className="max-md:hidden">
                <PropDefault />
              </Table.Cell>
              <Table.Cell>
                <ReferenceTablePopover>
                  <PropDescription />
                  <div className="flex flex-col gap-2 text-xs md:hidden">
                    <div className="border-t border-gray-200 pt-2 xs:hidden">
                      <div className="mb-1 font-bold">Type</div>
                      <PropType />
                    </div>
                    <div className="border-t border-gray-200 pt-2">
                      <div className="mb-1 font-bold">Default</div>
                      <PropDefault />
                    </div>
                  </div>
                </ReferenceTablePopover>
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
}
