import * as React from 'react';
import clsx from 'clsx';
import type { ProcessedProperty } from '@mui/internal-docs-infra/useTypes';
import * as Accordion from '../Accordion';
import * as Table from '../Table';
import { TableCode } from '../TableCode';

interface ReturnValueReferenceTableProps extends React.ComponentProps<typeof Table.Root> {
  data: Record<string, ProcessedProperty>;
}

export function ReturnValueReferenceTable({ data, ...props }: ReturnValueReferenceTableProps) {
  const entries = Object.entries(data);
  const includeName = entries.length > 1;

  return (
    <React.Fragment>
      <Accordion.Root {...props} className={clsx(props.className, 'xs:hidden')}>
        <Accordion.HeaderRow>
          <Accordion.HeaderCell className="pl-3">Type</Accordion.HeaderCell>
        </Accordion.HeaderRow>
        {entries.map(([name, def], index) => {
          const typeValue = def.type ?? def.detailedType;

          return (
            <Accordion.Item key={name}>
              <Accordion.Trigger index={index}>
                {typeValue ?? <TableCode className="text-(--syntax-nullish)">—</TableCode>}
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
                  {includeName && <strong>{name}</strong>}
                  {def.description ?? <TableCode className="text-(--syntax-nullish)">—</TableCode>}
                  {def.example}
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
          {entries.map(([name, def]) => {
            const typeValue = def.type ?? def.detailedType;

            return (
              <Table.Row key={name}>
                <Table.Cell>
                  {typeValue ?? <TableCode className="text-(--syntax-nullish)">—</TableCode>}
                </Table.Cell>
                <Table.Cell>
                  {includeName && <strong>{name}: </strong>}
                  {def.description ?? <TableCode className="text-(--syntax-nullish)">—</TableCode>}
                  {def.example && (
                    <React.Fragment>
                      <br />
                      {def.example}
                    </React.Fragment>
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
