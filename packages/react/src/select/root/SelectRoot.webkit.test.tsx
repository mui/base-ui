import * as React from 'react';
import { screen, waitFor } from '@mui/internal-test-utils';
import { expect, vi } from 'vitest';
import { createRenderer } from '#test-utils';
import { FilterSelect } from '@base-ui/react/filter-select';

// WebKit only tracks aria-activedescendant when DOM focus is on the list element, so navigation
// transfers real focus there. These tests mock the engine deterministically on every host.
vi.mock('@base-ui/utils/platform', async () => {
  const actual =
    await vi.importActual<typeof import('@base-ui/utils/platform')>('@base-ui/utils/platform');

  return {
    platform: {
      ...actual.platform,
      engine: { ...actual.platform.engine, webkit: true },
    },
  };
});

describe('<FilterSelect.Root /> (WebKit)', () => {
  const { render } = createRenderer();

  function App() {
    return (
      <FilterSelect.Root
        defaultOpen
        items={[
          { value: 'apple', label: 'Apple' },
          { value: 'banana', label: 'Banana' },
        ]}
      >
        <FilterSelect.Trigger>Fruit</FilterSelect.Trigger>
        <FilterSelect.Portal>
          <FilterSelect.Positioner>
            <FilterSelect.Popup>
              <FilterSelect.Input aria-label="Filter fruit" />
              <FilterSelect.List>
                {(item: { value: string; label: string }) => (
                  <FilterSelect.Item key={item.value} value={item.value}>
                    {item.label}
                  </FilterSelect.Item>
                )}
              </FilterSelect.List>
            </FilterSelect.Popup>
          </FilterSelect.Positioner>
        </FilterSelect.Portal>
      </FilterSelect.Root>
    );
  }

  it('moves DOM focus onto the listbox when navigating and resets when focus returns to the input', async () => {
    const { user } = await render(<App />);

    const input = screen.getByRole('searchbox', { name: 'Filter fruit' });
    await waitFor(() => {
      expect(input).toHaveFocus();
    });

    const list = screen.getByRole('listbox');
    const firstItem = screen.getByRole('option', { name: 'Apple' });
    expect(list).not.toHaveAttribute('aria-activedescendant');

    await user.keyboard('[ArrowDown]');

    await waitFor(() => {
      expect(list).toHaveFocus();
    });
    expect(list).toHaveAttribute('aria-activedescendant', firstItem.id);

    await user.keyboard('{Shift>}{Tab}{/Shift}');

    await waitFor(() => {
      expect(input).toHaveFocus();
    });
    expect(list).not.toHaveAttribute('aria-activedescendant');
  });

  it('returns focus to the input when typing while the listbox has focus', async () => {
    const { user } = await render(<App />);

    const input = screen.getByRole('searchbox', { name: 'Filter fruit' });
    await waitFor(() => {
      expect(input).toHaveFocus();
    });

    const list = screen.getByRole('listbox');

    await user.keyboard('[ArrowDown]');
    await waitFor(() => {
      expect(list).toHaveFocus();
    });

    await user.keyboard('b');

    // The keystroke lands in the input natively; synthetic events can't reproduce the
    // insertion, so assert the focus contract and that further typing filters.
    await waitFor(() => {
      expect(input).toHaveFocus();
    });

    await user.keyboard('b');

    await waitFor(() => {
      expect(screen.queryByRole('option', { name: 'Apple' })).toBe(null);
    });
  });
});
