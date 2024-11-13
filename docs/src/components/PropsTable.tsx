import * as React from 'react';
import { PropsTablePopover } from './PropsTablePopover';
import * as Table from './Table';
import type { PropDef } from './Reference';
import { evaluateMdx } from '../evaluate-mdx';
import { mdxPlugins } from '../mdx-plugins';
import { inlineMdxComponents, tableMdxComponents } from '../mdx-components';

interface PropsTableProps extends React.ComponentProps<typeof Table.Root> {
  data: Record<string, PropDef>;
}

export async function PropsTable({ data, ...props }: PropsTableProps) {
  return (
    <Table.Root {...props}>
      <Table.Head>
        <Table.Row>
          <Table.HeaderCell className="w-[172px]">Prop</Table.HeaderCell>
          <Table.HeaderCell className="w-full">Type</Table.HeaderCell>
          <Table.HeaderCell className="w-[172px]">Default</Table.HeaderCell>
          <Table.HeaderCell className="w-[36px]" aria-label="Description" />
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {Object.keys(data).map(async (name) => {
          const prop = data[name];

          const PropDescription = await evaluateMdx(prop.description, {
            ...mdxPlugins,
            useMDXComponents: () => inlineMdxComponents,
          });

          const PropType = await evaluateMdx(`\`${prop.type}\``, {
            ...mdxPlugins,
            useMDXComponents: () => tableMdxComponents,
          });

          const PropDefault = await evaluateMdx(`\`${prop.default}\``, {
            ...mdxPlugins,
            useMDXComponents: () => tableMdxComponents,
          });

          return (
            <Table.Row key={name}>
              <Table.HeaderCell scope="row">
                <code>{name}</code>
              </Table.HeaderCell>
              <Table.Cell>
                <PropType />
              </Table.Cell>
              <Table.Cell>
                <PropDefault />
              </Table.Cell>
              <Table.Cell>
                <PropsTablePopover>
                  <PropDescription />
                </PropsTablePopover>
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
}
