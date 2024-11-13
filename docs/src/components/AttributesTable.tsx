import * as React from 'react';
import { evaluateMdx } from 'docs/src/evaluate-mdx';
import { inlineMdxComponents } from 'docs/src/mdx-components';
import { rehypeSyntaxHighlighting } from 'docs/src/syntax-highlighting';
import type { AttributeDef } from './Reference';
import * as Table from './Table';

interface AttributesTableProps extends React.ComponentProps<typeof Table.Root> {
  data: Record<string, AttributeDef>;
}

export async function AttributesTable({ data, ...props }: AttributesTableProps) {
  return (
    <Table.Root {...props}>
      <Table.Body>
        {Object.keys(data).map(async (name) => {
          const attribute = data[name];

          const AttributeDescription = await evaluateMdx(attribute.description, {
            rehypePlugins: rehypeSyntaxHighlighting,
            useMDXComponents: () => inlineMdxComponents,
          });

          return (
            <Table.Row key={name}>
              <Table.HeaderCell className="w-[172px]" scope="row">
                <code style={{ color: 'var(--color-green)' }}>{name}</code>
              </Table.HeaderCell>
              <Table.Cell>
                <AttributeDescription />
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
}
