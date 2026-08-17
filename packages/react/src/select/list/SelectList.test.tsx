import * as React from 'react';
import { expect } from 'vitest';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { Select } from '@base-ui/react/select';
import { createRenderer, describeConformance } from '#test-utils';

const items = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
];

describe('<Select.List />', () => {
  const { render } = createRenderer();

  describeConformance(<Select.List />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Select.Root open>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>{node}</Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );
    },
  }));

  it('defaults its id to the root id, and renders items from a function child', async () => {
    await render(
      <Select.Root open items={items}>
        <Select.Trigger data-testid="trigger">
          <Select.Value />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.List>
                {(item: (typeof items)[number]) => (
                  <Select.Item key={item.value} value={item.value}>
                    <Select.ItemText>{item.label}</Select.ItemText>
                  </Select.Item>
                )}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );

    const list = screen.getByRole('listbox');
    expect(list.id).toMatch(/-list$/);
    expect(list.id).not.toMatch(/^undefined-/);
    expect(screen.getAllByRole('option')).toHaveLength(2);
  });

  it('releases the highlight when tabbing backwards out of the list', async () => {
    const { user } = await render(
      <Select.Root open items={items}>
        <Select.Trigger data-testid="trigger">
          <Select.Value />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.List>
                {(item: (typeof items)[number]) => (
                  <Select.Item key={item.value} value={item.value}>
                    <Select.ItemText>{item.label}</Select.ItemText>
                  </Select.Item>
                )}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );

    const apple = screen.getByRole('option', { name: 'Apple' });
    await act(async () => {
      apple.focus();
    });
    await waitFor(() => {
      expect(apple).toHaveAttribute('data-highlighted');
    });

    await user.keyboard('{Shift>}{Tab}{/Shift}');

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Apple' })).not.toHaveAttribute('data-highlighted');
    });
  });
});
