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
}

const CREATE_MDX_OPTIONS = {
  rehypePlugins: rehypeSyntaxHighlighting,
  useMDXComponents: () => inlineMdxComponents,
};

export async function AttributesReferenceTable({ data, ...props }: AttributesReferenceTableProps) {
  return (
    <React.Fragment>
      <Accordion.Root {...props} className={clsx(props.className, 'xs:hidden')}>
        <Accordion.HeaderRow>
          <Accordion.HeaderCell className="pl-[0.75rem]">Attribute</Accordion.HeaderCell>
        </Accordion.HeaderRow>
        {Object.keys(data).map(async (name, index) => {
          const attribute = data[name];

          const AttributeDescription = await createMdxComponent(
            attribute.description,
            CREATE_MDX_OPTIONS,
          );

          return (
            <Accordion.Item key={name}>
              <Accordion.Trigger index={index}>
                <TableCode className="text-navy">{name}</TableCode>
                <svg
                  className="AccordionIcon mr-1 ml-auto"
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
                <Accordion.Content className="text-md flex flex-col gap-3 p-4 text-pretty">
                  <AttributeDescription />
                </Accordion.Content>
              </Accordion.Panel>
            </Accordion.Item>
          );
        })}
      </Accordion.Root>
      <Table.Root {...props} className={clsx('xs:block hidden', props.className)}>
        <Table.Head>
          <Table.Row>
            {/* widths must match the props table grid layout */}
            <Table.ColumnHeader className="xs:w-48 w-full sm:w-56 md:w-[calc(5/16.5*100%)]">
              Attribute
            </Table.ColumnHeader>
            <Table.ColumnHeader className="xs:w-2/3 md:w-[calc(11.5/16.5*100%)]">
              <div className="xs:not-sr-only xs:contents sr-only">Description</div>
            </Table.ColumnHeader>
            {/* A cell to maintain a layout consistent with the props table */}
            <Table.ColumnHeader className="max-xs:hidden w-10" aria-hidden role="presentation" />
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
                  <TableCode className="text-navy">{name}</TableCode>
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
