import * as React from 'react';
import { createMdxComponent } from 'docs/src/mdx/createMdxComponent';
import { inlineMdxComponents } from 'docs/src/mdx-components';
import { rehypeSyntaxHighlighting } from 'docs/src/syntax-highlighting';
import { ReferenceTablePopover } from './ReferenceTablePopover';
import type { AttributeDef } from './types';
import * as Table from '../Table';
import { TableCode } from '../TableCode';

interface AttributesReferenceTableProps extends React.ComponentProps<typeof Table.Root> {
  data: Record<string, AttributeDef>;
}

export async function AttributesReferenceTable({ data, ...props }: AttributesReferenceTableProps) {
  return (
    <Table.Root {...props}>
      <Table.Head>
        <Table.Row>
          <Table.ColumnHeader className="w-full xs:w-48 sm:w-56 md:w-1/3">
            Attribute
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
          const attribute = data[name];

          const AttributeDescription = await createMdxComponent(attribute.description, {
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
                  <AttributeDescription />
                </div>
                <div className="contents xs:hidden">
                  <ReferenceTablePopover>
                    <AttributeDescription />
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
