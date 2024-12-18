import * as React from 'react';
import { createMdxComponent } from 'docs/src/mdx/createMdxComponent';
import { inlineMdxComponents } from 'docs/src/mdx-components';
import { rehypeSyntaxHighlighting } from 'docs/src/syntax-highlighting';
import { ReferenceTablePopover } from './ReferenceTablePopover';
import * as Table from '../Table';
import type { CssVariableDef } from './types';
import { TableCode } from '../TableCode';

interface CssVariablesReferenceTableProps extends React.ComponentProps<typeof Table.Root> {
  data: Record<string, CssVariableDef>;
}

export async function CssVariablesReferenceTable({
  data,
  ...props
}: CssVariablesReferenceTableProps) {
  return (
    <Table.Root {...props}>
      <Table.Head>
        <Table.Row>
          <Table.ColumnHeader className="w-full xs:w-48 sm:w-56 md:w-1/3">
            CSS Variable
          </Table.ColumnHeader>
          <Table.ColumnHeader className="w-10 xs:w-2/3">
            <div className="sr-only xs:not-sr-only xs:contents">Description</div>
          </Table.ColumnHeader>
          {/* A cell to maintain a layout consistent with the props table */}
          <Table.ColumnHeader className="w-10 max-xs:hidden" aria-hidden role="presentation" />
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {Object.keys(data).map(async (name) => {
          const cssVariable = data[name];

          const CssVaribleDescription = await createMdxComponent(cssVariable.description, {
            rehypePlugins: rehypeSyntaxHighlighting,
            useMDXComponents: () => inlineMdxComponents,
          });

          return (
            <Table.Row key={name}>
              <Table.RowHeader>
                <TableCode className="text-navy">{name}</TableCode>
              </Table.RowHeader>
              <Table.Cell colSpan={2}>
                <div className="hidden xs:contents">
                  <CssVaribleDescription />
                </div>
                <div className="contents xs:hidden">
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
