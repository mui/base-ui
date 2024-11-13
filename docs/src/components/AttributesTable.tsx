import * as React from 'react';
import * as Table from './Table';
import type { AttributeDef } from './Reference';
import { evaluateMdx } from '../evaluate-mdx';
import { mdxPlugins } from '../mdx-plugins';
import { inlineMdxComponents } from '../mdx-components';

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
            ...mdxPlugins,
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
