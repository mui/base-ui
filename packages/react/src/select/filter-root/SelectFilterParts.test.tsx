import * as React from 'react';
import { expect, describe, it, vi } from 'vitest';
import { Select } from '@base-ui/react/select';
import { createRenderer, describeConformance } from '#test-utils';

describe('Select filter parts conformance', () => {
  const { render } = createRenderer();

  function renderInPopup(
    node: React.ReactNode,
    filterProps?: Partial<Select.FilterProvider.Props>,
    withInput = true,
  ) {
    return render(
      <Select.FilterProvider {...filterProps}>
        <Select.Root open>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                {withInput && <Select.Input aria-label="Filter" />}
                {node}
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </Select.FilterProvider>,
    );
  }

  function renderInList(node: React.ReactNode) {
    return renderInPopup(<Select.List>{node}</Select.List>);
  }

  describeConformance(<Select.Trigger />, () => ({
    refInstanceof: window.HTMLButtonElement,
    button: true,
    render: (node) =>
      render(
        <Select.FilterProvider>
          <Select.Root>{node}</Select.Root>
        </Select.FilterProvider>,
      ),
  }));

  describeConformance(<Select.Input />, () => ({
    refInstanceof: window.HTMLInputElement,
    render: (node) => renderInPopup(node, undefined, false),
  }));

  describeConformance(<Select.Clear />, () => ({
    refInstanceof: window.HTMLButtonElement,
    button: true,
    render: (node) => renderInPopup(node, { defaultValue: 'query' }),
  }));

  describeConformance(<Select.Empty />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node) => renderInPopup(node),
  }));

  describeConformance(
    <Select.Popup>
      <Select.Input aria-label="Filter" />
    </Select.Popup>,
    () => ({
      refInstanceof: window.HTMLDivElement,
      render: (node) =>
        render(
          <Select.FilterProvider>
            <Select.Root open>
              <Select.Portal>
                <Select.Positioner>{node}</Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </Select.FilterProvider>,
        ),
    }),
  );

  describeConformance(<Select.List />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node) => renderInPopup(node),
  }));

  describeConformance(<Select.Group />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node) => renderInList(node),
  }));

  describeConformance(<Select.Item value="a" />, () => ({
    refInstanceof: window.HTMLDivElement,
    button: true,
    render: (node) => renderInList(node),
  }));

  it.each([
    { part: 'Input', element: <Select.Input /> },
    { part: 'Clear', element: <Select.Clear /> },
    { part: 'Empty', element: <Select.Empty /> },
  ])(
    'throws when <Select.$part> is rendered without a filter provider',
    async ({ part, element }) => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        await expect(render(element)).rejects.toThrow(
          `Base UI: <Select.${part}> must be placed in a select wrapped in <Select.FilterProvider>.`,
        );
      } finally {
        errorSpy.mockRestore();
      }
    },
  );

  it('throws when a filter part renders in a plain select', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(
        render(
          <Select.Root open>
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Select.Input aria-label="Filter" />
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>,
        ),
      ).rejects.toThrow(
        'Base UI: <Select.Input> must be placed in a select wrapped in <Select.FilterProvider>.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });
});
