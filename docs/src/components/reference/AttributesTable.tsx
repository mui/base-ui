import * as React from 'react';
import { createMdxComponent } from 'docs/src/mdx/createMdxComponent';
import { inlineMdxComponents, tableMdxComponents } from 'docs/src/mdx-components';
import { rehypeSyntaxHighlighting } from 'docs/src/syntax-highlighting';
import type { AttributeDef } from './types';
import * as Table from '../Table';
import { ReferenceTablePopover } from './ReferenceTablePopover';
import { Code } from '../Code';

interface AttributesTableProps extends React.ComponentProps<typeof Table.Root> {
  data: Record<string, AttributeDef>;
}

export async function AttributesTable({ data, ...props }: AttributesTableProps) {
  return (
    <Table.Root {...props}>
      <Table.Head>
        <Table.Row>
          <Table.ColumnHeader className="w-1/2 xs:w-5/8 md:w-1/4">Attribute</Table.ColumnHeader>
          <Table.ColumnHeader className="w-1/2 xs:w-3/8 md:w-3/4">Type</Table.ColumnHeader>
          <Table.ColumnHeader className="w-10" aria-label="Description" />
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {Object.keys(data).map(async (name) => {
          const attribute = data[name];

          let AttributeType: (props: any) => React.JSX.Element = EmptyAttribute;
          if (attribute.type) {
            AttributeType = await createMdxComponent(`\`${attribute.type}\``, {
              rehypePlugins: rehypeSyntaxHighlighting,
              useMDXComponents: () => tableMdxComponents,
            });
          }

          const AttributeDescription = await createMdxComponent(attribute.description, {
            rehypePlugins: rehypeSyntaxHighlighting,
            useMDXComponents: () => inlineMdxComponents,
          });

          return (
            <Table.Row key={name}>
              <Table.RowHeader>
                <Code className="text-navy">{`[${name}]`}</Code>
              </Table.RowHeader>
              <Table.Cell>
                <AttributeType />
              </Table.Cell>
              <Table.Cell>
                <ReferenceTablePopover>
                  <AttributeDescription />
                </ReferenceTablePopover>
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
}

function EmptyAttribute() {
  return <span className="text-gray-500">Empty attribute</span>;
}
