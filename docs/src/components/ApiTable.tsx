import * as React from 'react';
import { Popover } from '@base_ui/react';
import * as Table from './Table';
import { getApiReferenceData } from '../app/(content)/components/[slug]/getApiReferenceData';
import { ToolbarButton } from './ToolbarButton';
import { Popup } from './Popup';

interface ApiTableProps extends React.ComponentProps<typeof Table.Root> {
  component: string;
}

export async function ApiTable({ component, ...props }: ApiTableProps) {
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
        {data.props.map((prop) => (
          <Table.Row key={prop.name}>
            <Table.Cell>
              <code>{prop.name}</code>
            </Table.Cell>
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
              <Popover.Root>
                <Popover.Trigger
                  render={
                    // TODO: rework this into an IconButton or a generic ghost button component
                    <ToolbarButton aria-label="Info">
                      <span className="-mx-0.5 flex h-4 w-4 items-center justify-center">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="currentcolor"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M7 0.5C3.41797 0.5 0.5 3.41797 0.5 7C0.5 10.582 3.41797 13.5 7 13.5C10.582 13.5 13.5 10.582 13.5 7C13.5 3.41797 10.582 0.5 7 0.5ZM7 1.5C10.043 1.5 12.5 3.95703 12.5 7C12.5 10.043 10.043 12.5 7 12.5C3.95703 12.5 1.5 10.043 1.5 7C1.5 3.95703 3.95703 1.5 7 1.5ZM6.5 3.5V4.5H7.5V3.5H6.5ZM6.5 6.5V9.5H5.5V10.5H6.5H7.5H8.5V9.5H7.5V6.5V5.5H6.5H5.5V6.5H6.5Z"
                          />
                        </svg>
                      </span>
                    </ToolbarButton>
                  }
                />
                <Popover.Positioner
                  alignment="end"
                  side="bottom"
                  sideOffset={2}
                  collisionPadding={16}
                >
                  <Popover.Popup render={<Popup className="p-4 text-sm" />}>
                    <div className="max-w-[300px]">
                      <Popover.Description
                        dangerouslySetInnerHTML={{
                          __html: naiveInlineCodeHighlighter(prop.description),
                        }}
                      />
                    </div>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Root>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}

// To be continued; probably a temporary thing
function naiveInlineCodeHighlighter(html: string) {
  return html.replace('<code>', '<code class="Code syntax-constant">');
}
