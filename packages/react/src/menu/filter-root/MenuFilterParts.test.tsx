import * as React from 'react';
import { screen } from '@testing-library/react';
import { expect, vi, describe, it } from 'vitest';
import { Menu } from '@base-ui/react/menu';
import { createRenderer, describeConformance } from '#test-utils';

describe('Menu filter parts conformance', () => {
  const { render } = createRenderer();

  function renderInPopup(
    node: React.ReactNode,
    filterProps?: Partial<Menu.FilterProvider.Props>,
    withInput = true,
  ) {
    return render(
      <Menu.FilterProvider {...filterProps}>
        <Menu.Root open>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                {withInput && <Menu.Input aria-label="Filter" />}
                {node}
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </Menu.FilterProvider>,
    );
  }

  function renderInList(node: React.ReactNode) {
    return renderInPopup(<Menu.List>{node}</Menu.List>);
  }

  describeConformance(<Menu.Trigger />, () => ({
    refInstanceof: window.HTMLButtonElement,
    button: true,
    render: (node) =>
      render(
        <Menu.FilterProvider>
          <Menu.Root>{node}</Menu.Root>
        </Menu.FilterProvider>,
      ),
  }));

  describeConformance(<Menu.Input />, () => ({
    refInstanceof: window.HTMLInputElement,
    render: (node) => renderInPopup(node, undefined, false),
  }));

  describeConformance(<Menu.Clear />, () => ({
    refInstanceof: window.HTMLButtonElement,
    button: true,
    render: (node) => renderInPopup(node, { defaultValue: 'query' }),
  }));

  it('excludes Clear from the tab order and accessibility tree', async () => {
    await renderInPopup(<Menu.Clear aria-label="Clear filter" />, { defaultValue: 'query' });

    const clear = screen.getByLabelText('Clear filter');
    expect(clear).toHaveAttribute('tabindex', '-1');
    expect(clear).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('button', { name: 'Clear filter' })).toBe(null);
  });

  describeConformance(<Menu.Empty />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node) => renderInPopup(node),
  }));

  describeConformance(<Menu.List />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node) => renderInPopup(node),
  }));

  describeConformance(
    <Menu.Popup>
      <Menu.Input aria-label="Filter" />
    </Menu.Popup>,
    () => ({
      refInstanceof: window.HTMLDivElement,
      render: (node) =>
        render(
          <Menu.FilterProvider>
            <Menu.Root open>
              <Menu.Portal>
                <Menu.Positioner>{node}</Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </Menu.FilterProvider>,
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
        <Menu.FilterProvider>
          <Menu.Root open>
            <Menu.Portal>
              {node}
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.Input aria-label="Filter" />
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      ),
  }));

  describeConformance(<Menu.Separator />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: renderInList,
  }));

  describeConformance(<Menu.SubmenuTrigger />, () => ({
    refInstanceof: window.HTMLDivElement,
    button: true,
    render: (node) =>
      renderInList(
        <Menu.FilterProvider>
          <Menu.SubmenuRoot>{node}</Menu.SubmenuRoot>
        </Menu.FilterProvider>,
      ),
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

  it.each([
    ['Input', <Menu.Input />],
    ['Clear', <Menu.Clear />],
    ['Empty', <Menu.Empty />],
  ])('throws when <Menu.%s> is rendered without a filter provider', async (part, element) => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(render(element)).rejects.toThrow(
        `Base UI: <Menu.${part}> must be placed in a menu wrapped in <Menu.FilterProvider>.`,
      );
    } finally {
      errorSpy.mockRestore();
    }
  });
});
