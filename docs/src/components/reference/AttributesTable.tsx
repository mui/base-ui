import * as React from 'react';
import { createMdxComponent } from 'docs/src/mdx/createMdxComponent';
import { inlineMdxComponents } from 'docs/src/mdx-components';
import { rehypeSyntaxHighlighting } from 'docs/src/syntax-highlighting';
import type { AttributeDef } from './Reference';
import * as Table from '../Table';

interface AttributesTableProps extends React.ComponentProps<typeof Table.Root> {
  data: Record<string, AttributeDef>;
}

export async function AttributesTable({ data, ...props }: AttributesTableProps) {
  return (
    <Table.Root {...props}>
      <Table.Head>
        <Table.Row>
          <Table.HeaderCell className="w-[188px]">Attribute</Table.HeaderCell>
          <Table.HeaderCell className="w-full">State</Table.HeaderCell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {Object.keys(data).map(async (name) => {
          const attribute = data[name];

          const AttributeDescription = await createMdxComponent(attribute.description, {
            rehypePlugins: rehypeSyntaxHighlighting,
            useMDXComponents: () => inlineMdxComponents,
          });

          return (
            <Table.Row key={name}>
              <Table.HeaderCell scope="row">
                <code className="text-green text-xs">{name}</code>
              </Table.HeaderCell>
              <Table.Cell>
                <p className="text-gray">
                  <AttributeDescription />
                </p>
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
}
