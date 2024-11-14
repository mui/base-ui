import * as React from 'react';
import { createMdxComponent } from 'docs/src/mdx/createMdxComponent';
import { inlineMdxComponents, tableMdxComponents } from 'docs/src/mdx-components';
import { rehypeSyntaxHighlighting } from 'docs/src/syntax-highlighting';
import { ReferenceTablePopover } from './ReferenceTablePopover';
import * as Table from '../Table';
import type { PropDef } from './types';

interface PropsTableProps extends React.ComponentProps<typeof Table.Root> {
  data: Record<string, PropDef>;
}

export async function PropsTable({ data, ...props }: PropsTableProps) {
  return (
    <Table.Root {...props}>
      <Table.Head>
        <Table.Row>
          <Table.HeaderCell className="w-[188px]">Prop</Table.HeaderCell>
          <Table.HeaderCell className="w-full">Type</Table.HeaderCell>
          <Table.HeaderCell className="w-[172px]">Default</Table.HeaderCell>
          <Table.HeaderCell className="w-[36px]" aria-label="Description" />
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
                <code className="text-navy text-xs">{name}</code>
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
