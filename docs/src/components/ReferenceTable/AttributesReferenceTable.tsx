import * as React from 'react';
import clsx from 'clsx';
import { createMdxComponent } from 'docs/src/mdx/createMdxComponent';
import { inlineMdxComponents } from 'docs/src/mdx-components';
import { rehypeSyntaxHighlighting } from 'docs/src/syntax-highlighting';
import type { AttributeDef } from './types';
import * as Table from '../Table';
import * as Accordion from '../Accordion';
import { TableCode } from '../TableCode';

interface AttributesReferenceTableProps extends React.ComponentProps<typeof Table.Root> {
  data: Record<string, AttributeDef>;
  name?: string;
}

const CREATE_MDX_OPTIONS = {
  rehypePlugins: rehypeSyntaxHighlighting,
  useMDXComponents: () => inlineMdxComponents,
};

export async function AttributesReferenceTable({
  data,
  name: partName,
  ...props
}: AttributesReferenceTableProps) {
  return (
    <React.Fragment>
      <Accordion.Root {...props} className={clsx(props.className, 'bp0:bui-d-n')}>
        <Accordion.HeaderRow>
          <Accordion.HeaderCell className="bui-pl-3">Attribute</Accordion.HeaderCell>
        </Accordion.HeaderRow>
        {Object.keys(data).map(async (name, index) => {
          const attribute = data[name];

          const AttributeDescription = await createMdxComponent(
            attribute.description,
            CREATE_MDX_OPTIONS,
          );

          return (
            <Accordion.Item
              key={name}
              gaCategory="reference"
              gaLabel={`Attribute: ${partName ? `${partName}-` : ''}${name}`}
              gaParams={{
                type: 'attribute',
                slug: `${partName ? `${partName}-` : ''}${name}`,
                part_name: partName || '',
              }}
            >
              <Accordion.Trigger index={index}>
                <TableCode style={{ color: 'var(--color-navy)' }}>{name}</TableCode>
                <svg
                  className="AccordionIcon bui-ml-a bui-mr-1"
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M1 3.5L5 7.5L9 3.5" stroke="currentcolor" />
                </svg>
              </Accordion.Trigger>
              <Accordion.Panel>
                <Accordion.Content className="ReferenceCompactPanel">
                  <AttributeDescription />
                </Accordion.Content>
              </Accordion.Panel>
            </Accordion.Item>
          );
        })}
      </Accordion.Root>
      <Table.Root {...props} className={clsx('bui-d-n', 'bp0:bui-d-b', props.className)}>
        <Table.Head>
          <Table.Row>
            {/* widths must match the props table grid layout */}
            <Table.ColumnHeader className="ReferenceWideNameColumn">Attribute</Table.ColumnHeader>
            <Table.ColumnHeader className="ReferenceWideDescriptionColumn">
              Description
            </Table.ColumnHeader>
            {/* A cell to maintain a layout consistent with the props table */}
            <Table.ColumnHeader className="bui-w-10" aria-hidden>
              <span className="bui-v-h">{'-'}</span>
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {Object.keys(data).map(async (name) => {
            const attribute = data[name];

            const AttributeDescription = await createMdxComponent(
              attribute.description,
              CREATE_MDX_OPTIONS,
            );

            return (
              <Table.Row key={name}>
                <Table.RowHeader>
                  <TableCode className="bui-ws-nw" style={{ color: 'var(--color-navy)' }}>
                    {name}
                  </TableCode>
                </Table.RowHeader>
                <Table.Cell colSpan={2}>
                  <AttributeDescription />
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    </React.Fragment>
  );
}
