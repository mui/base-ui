import * as React from 'react';
import { expect, vi, describe, beforeEach, it } from 'vitest';
import { Select } from '@base-ui/react/select';
import { Virtualizer } from '@base-ui/react/virtualizer';
import { screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, createDOMRect, setElementClientHeight } from '#test-utils';

interface Produce {
  id: string;
  label: string;
}

// A type literal rather than an interface: `Select.Root`'s `items` prop is typed against the list
// components' `Group`, whose index signature an interface cannot satisfy.
type ProduceGroup = {
  value: string;
  items: Produce[];
};

const groups: ProduceGroup[] = [
  {
    value: 'Fruits',
    items: [
      { id: 'apple', label: 'Apple' },
      { id: 'banana', label: 'Banana' },
    ],
  },
  {
    value: 'Vegetables',
    items: [
      { id: 'carrot', label: 'Carrot' },
      { id: 'kale', label: 'Kale' },
      { id: 'pepper', label: 'Pepper' },
    ],
  },
];

const getLabel = (item: Produce) => item.label;

function GroupedSelect(props: {
  isItemDisabled?: (item: Produce) => boolean;
  renderGroupHeader?: (group: ProduceGroup) => React.ReactElement;
  value?: Produce | null;
}) {
  return (
    <Select.Root
      items={groups}
      itemToStringLabel={getLabel}
      isItemDisabled={props.isItemDisabled}
      value={props.value}
      onValueChange={() => {}}
    >
      <Select.Trigger data-testid="trigger">
        <Select.Value placeholder="Pick one" />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner>
          <Select.Popup>
            <Select.List>
              <Virtualizer<Produce>
                estimatedItemHeight={20}
                getItemKey={(item) => item.id}
                getGroupKey={(group: ProduceGroup) => group.value}
                render={<div ref={setElementClientHeight(1000)} />}
                renderGroupHeader={
                  props.renderGroupHeader ??
                  ((group: ProduceGroup) => <Select.GroupLabel>{group.value}</Select.GroupLabel>)
                }
              >
                {(item) => (
                  <Select.Item key={item.id} value={item}>
                    <Select.ItemText>{item.label}</Select.ItemText>
                  </Select.Item>
                )}
              </Virtualizer>
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

/** The highlighted option, which a Select also focuses, and the group wrapper naming it. */
async function expectActive(name: string, groupName: string) {
  await waitFor(() => {
    expect(screen.getByRole('option', { name })).toHaveAttribute('data-highlighted');
  });
  const option = screen.getByRole('option', { name });
  const wrapper = option.closest('[role="group"]') as HTMLElement;
  expect(wrapper).toHaveAttribute('aria-labelledby', screen.getByText(groupName).id);
}

describe('<Virtualizer /> in a grouped Select', () => {
  const { render } = createRenderer();

  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function mockRect(
      this: HTMLElement,
    ) {
      if (this.hasAttribute('data-row-index')) {
        return createDOMRect({ height: 20, width: 200 });
      }

      return createDOMRect({ height: 60, width: 200 });
    });
  });

  it('names each group by its label without a group part', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      const { user } = await render(<GroupedSelect />);

      await user.click(screen.getByTestId('trigger'));

      const wrappers = await screen.findAllByRole('group');
      expect(wrappers).toHaveLength(2);

      const label = screen.getByText('Fruits');
      expect(label).toHaveAttribute('aria-hidden', 'true');
      expect(wrappers[0]).toHaveAttribute('aria-labelledby', label.id);
      expect(wrappers[1]).toHaveAttribute('aria-labelledby', screen.getByText('Vegetables').id);
      expect(wrappers[1]).toContainElement(screen.getByRole('option', { name: 'Kale' }));
      expect(screen.getByRole('option', { name: 'Kale' })).toHaveAttribute('aria-posinset', '4');
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('navigates across a group boundary on the flat item indexes', async () => {
    const { user } = await render(<GroupedSelect />);

    await user.click(screen.getByTestId('trigger'));
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');

    await expectActive('Carrot', 'Vegetables');

    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(screen.getByTestId('trigger')).toHaveTextContent('Carrot');
    });
  });

  it('skips a disabled item across a group boundary', async () => {
    const { user } = await render(
      <GroupedSelect isItemDisabled={(item) => item.id === 'carrot'} />,
    );

    await user.click(screen.getByTestId('trigger'));
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');

    await expectActive('Kale', 'Vegetables');
  });

  it('opens on a selected item in a later group', async () => {
    const { user } = await render(<GroupedSelect value={groups[1].items[1]} />);

    expect(screen.getByTestId('trigger')).toHaveTextContent('Kale');

    await user.click(screen.getByTestId('trigger'));

    await expectActive('Kale', 'Vegetables');
  });

  it('types ahead into a later group', async () => {
    const { user } = await render(<GroupedSelect />);

    await user.click(screen.getByTestId('trigger'));
    await user.keyboard('pe');

    await expectActive('Pepper', 'Vegetables');
  });

  it('warns when a group part is rendered inside the virtualizer', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      const { user } = await render(
        <GroupedSelect
          renderGroupHeader={(group) => (
            <Select.Group>
              <Select.GroupLabel>{group.value}</Select.GroupLabel>
            </Select.Group>
          )}
        />,
      );

      await user.click(screen.getByTestId('trigger'));
      await screen.findAllByRole('group');

      expect(warnSpy.mock.calls.map(([message]) => String(message)).join('\n')).toContain(
        '<Select.Group> was rendered inside <Virtualizer>',
      );
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('warns when a virtualized group label is given a conflicting id', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      const { user } = await render(
        <GroupedSelect
          renderGroupHeader={(group) => (
            <Select.GroupLabel id="custom">{group.value}</Select.GroupLabel>
          )}
        />,
      );

      await user.click(screen.getByTestId('trigger'));
      const wrappers = await screen.findAllByRole('group');

      // The id the wrapper references wins, so the reference resolves.
      expect(wrappers[0]).toHaveAttribute('aria-labelledby', screen.getByText('Fruits').id);
      expect(warnSpy.mock.calls.map(([message]) => String(message)).join('\n')).toContain(
        'received an `id` prop that conflicts with the id provided by <Virtualizer>',
      );
    } finally {
      warnSpy.mockRestore();
    }
  });

  describe('navigation keys', () => {
    // Five groups of eight, in a 40px window: every paging destination starts unmounted, and
    // every one of them lies in a different group from the highlight it leaves.
    const pagedGroups: ProduceGroup[] = Array.from({ length: 5 }, (_, groupIndex) => ({
      value: `Group ${groupIndex + 1}`,
      items: Array.from({ length: 8 }, (_, offset) => {
        const index = groupIndex * 8 + offset;
        return { id: `item-${index}`, label: `Item ${index + 1}` };
      }),
    }));

    function PagedSelect() {
      return (
        <Select.Root items={pagedGroups} itemToStringLabel={getLabel}>
          <Select.Trigger data-testid="trigger">
            <Select.Value placeholder="Pick one" />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.List>
                  <Virtualizer<Produce>
                    estimatedItemHeight={20}
                    estimatedGroupHeaderHeight={20}
                    getItemKey={(item) => item.id}
                    getGroupKey={(group: ProduceGroup) => group.value}
                    overscanPx={0}
                    render={<div ref={setElementClientHeight(40)} data-testid="virtualizer" />}
                    renderGroupHeader={(group: ProduceGroup) => (
                      <Select.GroupLabel>{group.value}</Select.GroupLabel>
                    )}
                  >
                    {(item) => (
                      <Select.Item key={item.id} value={item}>
                        <Select.ItemText>{item.label}</Select.ItemText>
                      </Select.Item>
                    )}
                  </Virtualizer>
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      );
    }

    it('moves the highlight across groups through items that are not mounted', async () => {
      const { user } = await render(<PagedSelect />);

      await user.click(screen.getByTestId('trigger'));
      await user.keyboard('{ArrowDown}');
      await expectActive('Item 1', 'Group 1');
      expect(screen.queryByRole('option', { name: 'Item 11' })).toBe(null);

      // Ten items on: item 11 is the third of group 2, two headers down the row list.
      await user.keyboard('{PageDown}');
      await expectActive('Item 11', 'Group 2');

      await user.keyboard('{End}');
      await expectActive('Item 40', 'Group 5');
      expect(screen.queryByRole('option', { name: 'Item 11' })).toBe(null);

      await user.keyboard('{PageUp}');
      await expectActive('Item 30', 'Group 4');

      await user.keyboard('{Home}');
      await expectActive('Item 1', 'Group 1');
    });
  });
});
