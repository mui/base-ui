import * as React from 'react';
import { expect, vi, describe, beforeEach, it } from 'vitest';
import { Autocomplete } from '@base-ui/react/autocomplete';
import { Combobox } from '@base-ui/react/combobox';
import { Virtualizer } from '@base-ui/react/virtualizer';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, createDOMRect, setElementClientHeight } from '#test-utils';

interface Produce {
  id: string;
  label: string;
}

// A type literal rather than an interface: `Combobox.Root`'s own `filteredItems` prop is typed
// against the list components' `Group`, whose index signature an interface cannot satisfy.
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

function GroupedCombobox(props: {
  isItemDisabled?: (item: Produce) => boolean;
  renderGroupHeader?: (group: ProduceGroup) => React.ReactElement;
}) {
  return (
    <Combobox.Root items={groups} isItemDisabled={props.isItemDisabled}>
      <Combobox.Input data-testid="input" />
      <Combobox.Portal>
        <Combobox.Positioner>
          <Combobox.Popup>
            <Combobox.List>
              <Virtualizer<Produce>
                estimatedItemHeight={20}
                getItemKey={(item) => item.id}
                getGroupKey={(group: ProduceGroup) => group.value}
                render={<div ref={setElementClientHeight(1000)} />}
                renderGroupHeader={
                  props.renderGroupHeader ??
                  ((group: ProduceGroup) => (
                    <Combobox.GroupLabel>{group.value}</Combobox.GroupLabel>
                  ))
                }
              >
                {(item) => (
                  <Combobox.Item key={item.id} value={item}>
                    {item.label}
                  </Combobox.Item>
                )}
              </Virtualizer>
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

describe('<Virtualizer /> in a grouped Combobox', () => {
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
      const { user } = await render(<GroupedCombobox />);

      await user.click(screen.getByTestId('input'));

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

  it('drops a group whose items are filtered out', async () => {
    const { user } = await render(<GroupedCombobox />);

    await user.click(screen.getByTestId('input'));
    await user.keyboard('ka');

    await waitFor(() => expect(screen.getAllByRole('group')).toHaveLength(1));
    expect(screen.queryByText('Fruits')).toBe(null);
    expect(screen.getByRole('group')).toHaveAttribute(
      'aria-labelledby',
      screen.getByText('Vegetables').id,
    );
    expect(screen.getByRole('option', { name: 'Kale' })).toHaveAttribute('aria-posinset', '1');
  });

  it('navigates across a group boundary on the flat item indexes', async () => {
    const { user } = await render(<GroupedCombobox />);

    await user.click(screen.getByTestId('input'));
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');

    expect(screen.getByRole('option', { name: 'Carrot' })).toHaveAttribute('data-highlighted');

    await user.keyboard('{Enter}');
    expect(screen.getByTestId('input')).toHaveValue('Carrot');
  });

  it('skips a disabled item across a group boundary', async () => {
    const { user } = await render(
      <GroupedCombobox isItemDisabled={(item) => item.id === 'carrot'} />,
    );

    await user.click(screen.getByTestId('input'));
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');

    expect(screen.getByRole('option', { name: 'Kale' })).toHaveAttribute('data-highlighted');
  });

  it('warns when a group part is rendered inside the virtualizer', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      const { user } = await render(
        <GroupedCombobox
          renderGroupHeader={(group) => (
            <Combobox.Group>
              <Combobox.GroupLabel>{group.value}</Combobox.GroupLabel>
            </Combobox.Group>
          )}
        />,
      );

      await user.click(screen.getByTestId('input'));
      await screen.findAllByRole('group');

      expect(warnSpy.mock.calls.map(([message]) => String(message)).join('\n')).toContain(
        '<Combobox.Group> was rendered inside <Virtualizer>',
      );
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('warns when a virtualized group label is given a conflicting id', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      const { user } = await render(
        <GroupedCombobox
          renderGroupHeader={(group) => (
            <Combobox.GroupLabel id="custom">{group.value}</Combobox.GroupLabel>
          )}
        />,
      );

      await user.click(screen.getByTestId('input'));
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

  describe('page keys', () => {
    // Five groups of eight, in a 40px window: every paging destination starts unmounted, and
    // every one of them lies in a different group from the highlight it leaves.
    const pagedGroups: ProduceGroup[] = Array.from({ length: 5 }, (_, groupIndex) => ({
      value: `Group ${groupIndex + 1}`,
      items: Array.from({ length: 8 }, (_, offset) => {
        const index = groupIndex * 8 + offset;
        return { id: `item-${index}`, label: `Item ${index + 1}` };
      }),
    }));

    function PagedCombobox() {
      return (
        <Combobox.Root defaultOpen items={pagedGroups}>
          <Combobox.Input data-testid="input" />
          <Combobox.List>
            <Virtualizer<Produce>
              estimatedItemHeight={20}
              estimatedGroupHeaderHeight={20}
              getItemKey={(item) => item.id}
              getGroupKey={(group: ProduceGroup) => group.value}
              overscanPx={0}
              render={<div ref={setElementClientHeight(40)} data-testid="virtualizer" />}
              renderGroupHeader={(group: ProduceGroup) => (
                <Combobox.GroupLabel>{group.value}</Combobox.GroupLabel>
              )}
            >
              {(item) => (
                <Combobox.Item key={item.id} value={item}>
                  {item.label}
                </Combobox.Item>
              )}
            </Virtualizer>
          </Combobox.List>
        </Combobox.Root>
      );
    }

    async function expectActive(input: HTMLElement, name: string, groupName: string) {
      await waitFor(() => {
        const option = screen.getByRole('option', { name });
        expect(input).toHaveAttribute('aria-activedescendant', option.id);
      });
      const option = screen.getByRole('option', { name });
      expect(option).toHaveAttribute('data-highlighted');
      const wrapper = option.closest('[role="group"]') as HTMLElement;
      expect(wrapper).toHaveAttribute('aria-labelledby', screen.getByText(groupName).id);
    }

    it('pages the highlight across groups through items that are not mounted', async () => {
      await render(<PagedCombobox />);

      const input = screen.getByTestId('input');
      const virtualizer = screen.getByTestId('virtualizer');
      await act(async () => input.focus());

      fireEvent.keyDown(input, { key: 'ArrowDown' });
      await expectActive(input, 'Item 1', 'Group 1');
      expect(screen.queryByRole('option', { name: 'Item 11' })).toBe(null);

      // Ten items on: item 11 is the third of group 2, two headers down the row list.
      fireEvent.keyDown(input, { key: 'PageDown' });
      await expectActive(input, 'Item 11', 'Group 2');
      expect(virtualizer.scrollTop).toBeGreaterThanOrEqual(2 * 20 + 10 * 20 - 40);

      fireEvent.keyDown(input, { key: 'PageDown' });
      await expectActive(input, 'Item 21', 'Group 3');
      expect(screen.queryByRole('option', { name: 'Item 11' })).toBe(null);

      // Home and End move the input's caret, so paging back is the way up through the headers.
      fireEvent.keyDown(input, { key: 'PageUp' });
      await expectActive(input, 'Item 11', 'Group 2');

      fireEvent.keyDown(input, { key: 'ArrowUp' });
      await expectActive(input, 'Item 10', 'Group 2');
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      await expectActive(input, 'Item 8', 'Group 1');

      fireEvent.keyDown(input, { key: 'PageUp' });
      await expectActive(input, 'Item 1', 'Group 1');
      expect(virtualizer.scrollTop).toBeLessThanOrEqual(20);
    });
  });

  it('publishes the groups of an externally supplied filtered collection', async () => {
    const { user } = await render(
      <Combobox.Root items={groups} filteredItems={[groups[1]]}>
        <Combobox.Input data-testid="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Virtualizer<Produce>
                  estimatedItemHeight={20}
                  getItemKey={(item) => item.id}
                  render={<div ref={setElementClientHeight(1000)} />}
                  renderGroupHeader={(group: ProduceGroup) => (
                    <Combobox.GroupLabel>{group.value}</Combobox.GroupLabel>
                  )}
                >
                  {(item) => (
                    <Combobox.Item key={item.id} value={item}>
                      {item.label}
                    </Combobox.Item>
                  )}
                </Virtualizer>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    await user.click(screen.getByTestId('input'));

    const wrappers = await screen.findAllByRole('group');
    expect(wrappers).toHaveLength(1);
    expect(wrappers[0]).toHaveAttribute('aria-labelledby', screen.getByText('Vegetables').id);
    expect(screen.getAllByRole('option')).toHaveLength(3);
    expect(screen.getByRole('option', { name: 'Kale' })).toHaveAttribute('aria-posinset', '2');
  });

  it('works through the Autocomplete parts', async () => {
    const { user } = await render(
      <Autocomplete.Root items={groups}>
        <Autocomplete.Input data-testid="input" />
        <Autocomplete.Portal>
          <Autocomplete.Positioner>
            <Autocomplete.Popup>
              <Autocomplete.List>
                <Virtualizer<Produce>
                  estimatedItemHeight={20}
                  getItemKey={(item) => item.id}
                  render={<div ref={setElementClientHeight(1000)} />}
                  renderGroupHeader={(group: ProduceGroup) => (
                    <Autocomplete.GroupLabel>{group.value}</Autocomplete.GroupLabel>
                  )}
                >
                  {(item) => (
                    <Autocomplete.Item key={item.id} value={item}>
                      {item.label}
                    </Autocomplete.Item>
                  )}
                </Virtualizer>
              </Autocomplete.List>
            </Autocomplete.Popup>
          </Autocomplete.Positioner>
        </Autocomplete.Portal>
      </Autocomplete.Root>,
    );

    // An autocomplete opens on input rather than on click. Every item but Banana and Carrot
    // contains an "e", so both groups survive the filter.
    await user.type(screen.getByTestId('input'), 'e');

    const wrappers = await screen.findAllByRole('group');
    expect(wrappers).toHaveLength(2);
    expect(wrappers[1]).toHaveAttribute('aria-labelledby', screen.getByText('Vegetables').id);
    expect(screen.queryByRole('option', { name: 'Carrot' })).toBe(null);
  });
});
