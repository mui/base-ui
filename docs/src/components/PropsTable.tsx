import * as React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { evaluate, EvaluateOptions } from '@mdx-js/mdx';
import * as Table from './Table';
import { getApiReferenceData } from '../app/(content)/components/[slug]/getApiReferenceData';
import { PropsTableTooltip } from './PropsTableTooltip';
// eslint-disable-next-line import/extensions
import { rehypeInlineCode } from '../syntax-highlighting/rehype-inline-code.mjs';

interface PropsTableProps extends React.ComponentProps<typeof Table.Root> {
  component: string;
}

export async function PropsTable({ component, ...props }: PropsTableProps) {
  const [data] = await getApiReferenceData([component]);

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
        {data.props.map(async (prop) => {
          const { default: Description } = await evaluate(prop.description, {
            ...(jsxRuntime as EvaluateOptions),
            rehypePlugins: [rehypeInlineCode],
          });

          return (
            <Table.Row key={prop.name}>
              <Table.HeaderCell scope="row">
                <code>{prop.name}</code>
              </Table.HeaderCell>
              <Table.Cell>
                <code className="text-violet">{prop.type.name}</code>
              </Table.Cell>
              <Table.Cell>
                {prop.defaultValue ? (
                  <code className="text-blue">{prop.defaultValue}</code>
                ) : (
                  <code className="text-pale">undefined</code>
                )}
              </Table.Cell>
              <Table.Cell>
                <PropsTableTooltip>
                  <Description />
                </PropsTableTooltip>
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
}
