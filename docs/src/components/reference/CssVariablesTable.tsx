import * as React from 'react';
import { createMdxComponent } from 'docs/src/mdx/createMdxComponent';
import { inlineMdxComponents, tableMdxComponents } from 'docs/src/mdx-components';
import { rehypeSyntaxHighlighting } from 'docs/src/syntax-highlighting';
import { ReferenceTablePopover } from './ReferenceTablePopover';
import * as Table from '../Table';
import type { CssVariableDef } from './types';

interface CssVariablesTableProps extends React.ComponentProps<typeof Table.Root> {
  data: Record<string, CssVariableDef>;
}

export async function CssVariablesTable({ data, ...props }: CssVariablesTableProps) {
  return (
    <Table.Root {...props}>
      <Table.Head>
        <Table.Row>
          <Table.HeaderCell className="w-[188px]">CSS variable</Table.HeaderCell>
          <Table.HeaderCell className="w-full">Type</Table.HeaderCell>
          <Table.HeaderCell className="w-[36px]" aria-label="Description" />
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
              <Table.HeaderCell scope="row">
                <code className="text-navy text-xs">{name}</code>
              </Table.HeaderCell>
              <Table.Cell>
                <CssVaribleType />
              </Table.Cell>
              <Table.Cell>
                <div className="mt-0.5">
                  <ReferenceTablePopover>
                    <CssVaribleDescription />
                  </ReferenceTablePopover>
                </div>
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
}
