import * as React from 'react';
import { createMdxComponent } from 'docs/src/mdx/createMdxComponent';
import { inlineMdxComponents, tableMdxComponents } from 'docs/src/mdx-components';
import { rehypeSyntaxHighlighting } from 'docs/src/syntax-highlighting';
import { ReferenceTablePopover } from './ReferenceTablePopover';
import * as Table from '../Table';
import type { CssVariableDef } from './types';
import { Code } from '../Code';

interface CssVariablesTableProps extends React.ComponentProps<typeof Table.Root> {
  data: Record<string, CssVariableDef>;
}

export async function CssVariablesTable({ data, ...props }: CssVariablesTableProps) {
  return (
    <Table.Root {...props}>
      <Table.Head>
        <Table.Row>
          <Table.ColumnHeader className="w-full md:w-1/3">CSS Variable</Table.ColumnHeader>
          <Table.ColumnHeader className="w-2/3 max-md:hidden">Type</Table.ColumnHeader>
          <Table.ColumnHeader className="w-10" aria-label="Description" />
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {Object.keys(data).map(async (name) => {
          const cssVariable = data[name];

          const CssVaribleType = await createMdxComponent(`\`${cssVariable.type}\``, {
            rehypePlugins: rehypeSyntaxHighlighting,
            useMDXComponents: () => tableMdxComponents,
          });

          const CssVaribleDescription = await createMdxComponent(cssVariable.description, {
            rehypePlugins: rehypeSyntaxHighlighting,
            useMDXComponents: () => inlineMdxComponents,
          });

          return (
            <Table.Row key={name}>
              <Table.RowHeader>
                <Code className="text-navy">{name}</Code>
              </Table.RowHeader>
              <Table.Cell className="w-2/3 max-md:hidden">
                <CssVaribleType />
              </Table.Cell>
              <Table.Cell>
                <ReferenceTablePopover>
                  <CssVaribleDescription />
                  <div className="flex flex-col gap-2 text-xs md:hidden">
                    <div className="border-t border-gray-200 pt-2">
                      <div className="mb-1 font-bold">Type</div>
                      <CssVaribleType />
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
