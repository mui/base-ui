import * as React from 'react';
import { expect, vi, describe, it } from 'vitest';
import { Menu } from '@base-ui/react/menu';
import { createRenderer, describeConformance } from '#test-utils';

describe('Menu filter parts conformance', () => {
  const { render } = createRenderer();

  function renderInPopup(
    node: React.ReactNode,
    rootProps?: Partial<Menu.FilterRoot.Props>,
    withInput = true,
  ) {
    return render(
      <Menu.FilterRoot open {...rootProps}>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              {withInput && <Menu.FilterInput aria-label="Filter" />}
              {node}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.FilterRoot>,
    );
  }

  function renderInList(node: React.ReactNode) {
    return renderInPopup(<Menu.FilterList>{node}</Menu.FilterList>);
  }

  describeConformance(<Menu.Trigger />, () => ({
    refInstanceof: window.HTMLButtonElement,
    button: true,
    render: (node) => render(<Menu.FilterRoot>{node}</Menu.FilterRoot>),
  }));

  describeConformance(<Menu.FilterInput />, () => ({
    refInstanceof: window.HTMLInputElement,
    render: (node) => renderInPopup(node, undefined, false),
  }));

  describeConformance(<Menu.FilterClear />, () => ({
    refInstanceof: window.HTMLButtonElement,
    button: true,
    render: (node) => renderInPopup(node, { defaultInputValue: 'query' }),
  }));

  describeConformance(<Menu.FilterEmpty />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node) => renderInPopup(node),
  }));

  describeConformance(<Menu.FilterList />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node) => renderInPopup(node),
  }));

  describeConformance(
    <Menu.Popup>
      <Menu.FilterInput aria-label="Filter" />
    </Menu.Popup>,
    () => ({
      refInstanceof: window.HTMLDivElement,
      render: (node) =>
        render(
          <Menu.FilterRoot open>
            <Menu.Portal>
              <Menu.Positioner>{node}</Menu.Positioner>
            </Menu.Portal>
          </Menu.FilterRoot>,
        ),
    }),
  );

  describeConformance(<Menu.Item />, () => ({
    refInstanceof: window.HTMLDivElement,
    button: true,
    render: renderInList,
  }));

  describeConformance(<Menu.LinkItem href="#" />, () => ({
    refInstanceof: window.HTMLAnchorElement,
    render: renderInList,
  }));

  describeConformance(<Menu.CheckboxItem />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: renderInList,
  }));

  describeConformance(
    <Menu.RadioGroup>
      <Menu.RadioItem value="value" />
    </Menu.RadioGroup>,
    () => ({
      refInstanceof: window.HTMLDivElement,
      render: renderInList,
    }),
  );

  describeConformance(<Menu.RadioItem value="value" />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node) => renderInList(<Menu.RadioGroup defaultValue="value">{node}</Menu.RadioGroup>),
  }));

  describeConformance(<Menu.Group />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: renderInList,
  }));

  describeConformance(<Menu.Arrow />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node) => renderInPopup(node),
  }));

  describeConformance(<Menu.Backdrop />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node) =>
      render(
        <Menu.FilterRoot open>
          <Menu.Portal>
            {node}
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.FilterInput aria-label="Filter" />
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.FilterRoot>,
      ),
  }));

  describeConformance(<Menu.Separator />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: renderInList,
  }));

  describeConformance(<Menu.SubmenuTrigger />, () => ({
    refInstanceof: window.HTMLDivElement,
    button: true,
    render: (node) => renderInList(<Menu.FilterSubmenuRoot>{node}</Menu.FilterSubmenuRoot>),
  }));

  it('throws when Trigger is rendered without a root or handle', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(render(<Menu.Trigger />)).rejects.toThrow(
        'Base UI: <Menu.Trigger> must be either used within a <Menu.Root> component or provided with a handle.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('throws when a filter part is rendered without any root', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(render(<Menu.FilterInput />)).rejects.toThrow(
        'Base UI: Filter parts must be placed within a filterable menu.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('throws when an item-context part is rendered without a root', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(render(<Menu.FilterEmpty />)).rejects.toThrow(
        'Base UI: Filter parts must be placed within a filterable menu.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });
});
