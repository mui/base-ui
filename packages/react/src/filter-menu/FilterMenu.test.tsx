import * as React from 'react';
import { expect, vi, describe, it } from 'vitest';
import { FilterMenu } from '@base-ui/react/filter-menu';
import { Menu } from '@base-ui/react/menu';
import { createRenderer, describeConformance } from '#test-utils';

describe('FilterMenu conformance', () => {
  const { render } = createRenderer();

  function renderInline(node: React.ReactNode) {
    return render(
      <FilterMenu.Root inline open>
        {node}
      </FilterMenu.Root>,
    );
  }

  function renderInList(node: React.ReactNode) {
    return renderInline(<FilterMenu.List>{node}</FilterMenu.List>);
  }

  describeConformance(<FilterMenu.Trigger />, () => ({
    refInstanceof: window.HTMLButtonElement,
    button: true,
    render: (node) => render(<FilterMenu.Root>{node}</FilterMenu.Root>),
  }));

  describeConformance(<FilterMenu.Input />, () => ({
    refInstanceof: window.HTMLInputElement,
    render: renderInline,
  }));

  describeConformance(<FilterMenu.Clear />, () => ({
    refInstanceof: window.HTMLButtonElement,
    button: true,
    render: (node) =>
      render(
        <FilterMenu.Root inline open defaultInputValue="query">
          {node}
        </FilterMenu.Root>,
      ),
  }));

  describeConformance(<FilterMenu.Empty />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: renderInline,
  }));

  describeConformance(<FilterMenu.Status>Loading</FilterMenu.Status>, () => ({
    refInstanceof: window.HTMLDivElement,
    render: renderInline,
  }));

  describeConformance(<FilterMenu.List />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: renderInline,
  }));

  describeConformance(<FilterMenu.Popup />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node) =>
      render(
        <FilterMenu.Root open>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>{node}</FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
      ),
  }));

  describeConformance(<FilterMenu.Item />, () => ({
    refInstanceof: window.HTMLDivElement,
    button: true,
    render: renderInList,
  }));

  describeConformance(<FilterMenu.LinkItem href="#" />, () => ({
    refInstanceof: window.HTMLAnchorElement,
    render: renderInList,
  }));

  describeConformance(<FilterMenu.CheckboxItem />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: renderInList,
  }));

  describeConformance(
    <FilterMenu.RadioGroup>
      <FilterMenu.RadioItem value="value" />
    </FilterMenu.RadioGroup>,
    () => ({
      refInstanceof: window.HTMLDivElement,
      render: renderInList,
    }),
  );

  describeConformance(<FilterMenu.RadioItem value="value" />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node) =>
      renderInList(<FilterMenu.RadioGroup defaultValue="value">{node}</FilterMenu.RadioGroup>),
  }));

  describeConformance(<FilterMenu.Group />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: renderInList,
  }));

  // Aliases of Menu parts, but they are exported from `FilterMenu` and appear in the documented
  // anatomy, so pin that they mount inside a filter popup.
  describeConformance(<FilterMenu.Arrow />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node) =>
      render(
        <FilterMenu.Root open>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>{node}</FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
      ),
  }));

  describeConformance(<FilterMenu.Backdrop />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node) =>
      render(
        <FilterMenu.Root open>
          <FilterMenu.Portal>
            {node}
            <FilterMenu.Positioner>
              <FilterMenu.Popup />
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
      ),
  }));

  describeConformance(<FilterMenu.Separator />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: renderInList,
  }));

  describeConformance(<FilterMenu.SubmenuTrigger />, () => ({
    refInstanceof: window.HTMLDivElement,
    button: true,
    render: (node) =>
      render(
        <FilterMenu.Root open>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.List>
                  <FilterMenu.SubmenuRoot>{node}</FilterMenu.SubmenuRoot>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
      ),
  }));

  it('throws when Trigger is rendered without a root or handle', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(render(<FilterMenu.Trigger />)).rejects.toThrow(
        'Base UI: <FilterMenu.Trigger> must be either used within a <FilterMenu.Root> component or provided with a handle.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('throws when Trigger is rendered in a plain Menu root', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(
        render(
          <Menu.Root>
            <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
          </Menu.Root>,
        ),
      ).rejects.toThrow(
        'Base UI: <FilterMenu.Trigger> must be either used within a <FilterMenu.Root> component or provided with a handle.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('throws when a filter part is rendered without any root', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(render(<FilterMenu.Input />)).rejects.toThrow(
        'Base UI: Filter parts must be placed within a filter root.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('throws when a filter part is rendered in a plain Menu root', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(
        render(
          <Menu.Root open>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <FilterMenu.Input />
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>,
        ),
      ).rejects.toThrow('Base UI: Filter parts must be placed within a filter root.');
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('throws when an item-context part is rendered without a root', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(render(<FilterMenu.Empty />)).rejects.toThrow(
        'Base UI: Filter parts must be placed within a filter root.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });
});
