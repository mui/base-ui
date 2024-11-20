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
          <Table.HeaderCell className="w-48">Prop</Table.HeaderCell>
          <Table.HeaderCell className="w-full">Type</Table.HeaderCell>
          <Table.HeaderCell className="w-44">Default</Table.HeaderCell>
          <Table.HeaderCell className="w-10" aria-label="Description" />
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
              <Table.HeaderCell scope="row">
                <Code className="text-navy">{name}</Code>
              </Table.HeaderCell>
              <Table.Cell>
                <PropType />
              </Table.Cell>
              <Table.Cell>
                <PropDefault />
              </Table.Cell>
              <Table.Cell>
                <ReferenceTablePopover>
                  <PropDescription />
                </ReferenceTablePopover>
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
}
