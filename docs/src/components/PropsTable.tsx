import * as React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { evaluate, EvaluateOptions } from '@mdx-js/mdx';
import rehypePrettyCode from 'rehype-pretty-code';
import { highlighter } from 'docs/src/syntax-highlighting';
import { getApiReferenceData } from 'docs/src/app/(content)/components/[slug]/getApiReferenceData';
import { rehypeInlineCode } from 'docs/src/syntax-highlighting/rehype-inline-code.mjs';
import * as Table from './Table';
import { PropsTableTooltip } from './PropsTableTooltip';

const getHighlighter = () => highlighter;

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
          // TODO this is because rehypePrettyCode can't parse `<code>`
          // written verbatim; I plan to figure out how to get the real markdown source in here.
          prop.description = prop.description.replace('<code>', '`').replace('</code>', '`');
          const { default: Description } = await evaluate(prop.description, {
            ...jsxRuntime,
            rehypePlugins: [
              rehypeInlineCode,
              [
                rehypePrettyCode,
                {
                  getHighlighter,
                  grid: false,
                  theme: 'base-ui',
                  defaultLang: 'jsx',
                },
              ],
            ],
          } as unknown as EvaluateOptions);

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
