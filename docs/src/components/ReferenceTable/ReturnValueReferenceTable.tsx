import * as React from 'react';
import clsx from 'clsx';
import { createMdxComponent } from 'docs/src/mdx/createMdxComponent';
import { inlineMdxComponents } from 'docs/src/mdx-components';
import { rehypeSyntaxHighlighting } from 'docs/src/syntax-highlighting';
import * as Accordion from '../Accordion';
import * as Table from '../Table';
import { TableCode } from '../TableCode';
import type { PropDef } from './types';

interface ReturnValueReferenceTableProps extends React.ComponentProps<typeof Table.Root> {
  data: Record<string, PropDef>;
}

const TYPE_MDX_OPTIONS = {
  rehypePlugins: rehypeSyntaxHighlighting,
  useMDXComponents: () => ({
    ...inlineMdxComponents,
    code: TableCode,
  }),
};

const DESCRIPTION_MDX_OPTIONS = {
  rehypePlugins: rehypeSyntaxHighlighting,
  useMDXComponents: () => inlineMdxComponents,
};

function getDescription(def: PropDef, name: string, includeName: boolean) {
  const baseDescription = [def.description, def.example].filter(Boolean).join('\n\n');
  if (!includeName) {
    return baseDescription;
  }

  const nameLabel = `**${name}**`;
  return baseDescription ? `${nameLabel}: ${baseDescription}` : nameLabel;
}

export async function ReturnValueReferenceTable({
  data,
  ...props
}: ReturnValueReferenceTableProps) {
  const entries = Object.entries(data);
  const includeName = entries.length > 1;

  return (
    <React.Fragment>
      <Accordion.Root {...props} className={clsx(props.className, 'xs:hidden')}>
        <Accordion.HeaderRow>
          <Accordion.HeaderCell className="pl-3">Type</Accordion.HeaderCell>
        </Accordion.HeaderRow>
        {entries.map(async ([name, def], index) => {
          const typeValue = def.type ?? def.detailedType;
          const descriptionText = getDescription(def, name, includeName);

          const ReturnType = typeValue
            ? await createMdxComponent(`\`${typeValue}\``, TYPE_MDX_OPTIONS)
            : null;

          const ReturnDescription = descriptionText
            ? await createMdxComponent(descriptionText, DESCRIPTION_MDX_OPTIONS)
            : null;

          return (
            <Accordion.Item key={name}>
              <Accordion.Trigger index={index}>
                {ReturnType ? (
                  <ReturnType />
                ) : (
                  <TableCode className="text-(--syntax-nullish)">—</TableCode>
                )}
                <svg
                  className="AccordionIcon ml-auto mr-1"
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
                <Accordion.Content className="flex flex-col gap-3 p-4 text-md text-pretty">
                  {ReturnDescription ? (
                    <ReturnDescription />
                  ) : (
                    <TableCode className="text-(--syntax-nullish)">—</TableCode>
                  )}
                </Accordion.Content>
              </Accordion.Panel>
            </Accordion.Item>
          );
        })}
      </Accordion.Root>

      <Table.Root {...props} className={clsx('hidden xs:block', props.className)}>
        <Table.Head>
          <Table.Row>
            <Table.ColumnHeader className="xs:w-2/5">Type</Table.ColumnHeader>
            <Table.ColumnHeader className="xs:w-3/5">
              <span className="sr-only xs:not-sr-only xs:contents">Description</span>
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {entries.map(async ([name, def]) => {
            const typeValue = def.type ?? def.detailedType;
            const descriptionText = getDescription(def, name, includeName);

            const ReturnType = typeValue
              ? await createMdxComponent(`\`${typeValue}\``, TYPE_MDX_OPTIONS)
              : null;

            const ReturnDescription = descriptionText
              ? await createMdxComponent(descriptionText, DESCRIPTION_MDX_OPTIONS)
              : null;

            return (
              <Table.Row key={name}>
                <Table.Cell>
                  {ReturnType ? (
                    <ReturnType />
                  ) : (
                    <TableCode className="text-(--syntax-nullish)">—</TableCode>
                  )}
                </Table.Cell>
                <Table.Cell>
                  {ReturnDescription ? (
                    <ReturnDescription />
                  ) : (
                    <TableCode className="text-(--syntax-nullish)">—</TableCode>
                  )}
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    </React.Fragment>
  );
}
