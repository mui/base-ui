import { expect, vi } from 'vitest';
import * as React from 'react';
import {
  FilterSelect,
  type FilterSelectFilter,
  type FilterSelectItemData,
} from '@base-ui/react/filter-select';
import { Field } from '@base-ui/react/field';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, isJSDOM } from '#test-utils';

describe('<FilterSelect.Root />', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render } = createRenderer();

  it('does not align the positioner with the trigger', async () => {
    await render(
      <FilterSelect.Root open items={[{ value: 'apple', label: 'Apple' }]}>
        <FilterSelect.Trigger>Fruit</FilterSelect.Trigger>
        <FilterSelect.Portal>
          <FilterSelect.Positioner data-testid="positioner">
            <FilterSelect.Popup />
          </FilterSelect.Positioner>
        </FilterSelect.Portal>
      </FilterSelect.Root>,
    );

    expect(screen.getByTestId('positioner')).toHaveAttribute('data-side', 'bottom');
  });

  describe('filtering', () => {
    it('does not set aria-activedescendant on open', async () => {
      const { user } = await render(
        <FilterSelect.Root
          items={[
            { value: 'apple', label: 'Apple' },
            { value: 'banana', label: 'Banana' },
          ]}
        >
          <FilterSelect.Trigger data-testid="trigger">
            <FilterSelect.Value />
          </FilterSelect.Trigger>
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
        </FilterSelect.Root>,
      );

      await user.click(screen.getByTestId('trigger'));
      const input = await screen.findByRole('searchbox', { name: 'Filter fruit' });

      if (isJSDOM) {
        Object.defineProperty(screen.getByRole('listbox'), 'scrollTo', {
          configurable: true,
          value: vi.fn(),
        });
      }

      const firstOption = screen.getByRole('option', { name: 'Apple' });

      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      expect(firstOption).not.toHaveAttribute('data-highlighted');
      expect(input).not.toHaveAttribute('aria-activedescendant');
    });

    it('highlights the selected item and points aria-activedescendant at it on open', async () => {
      const { user } = await render(
        <FilterSelect.Root
          defaultValue="banana"
          items={[
            { value: 'apple', label: 'Apple' },
            { value: 'banana', label: 'Banana' },
          ]}
        >
          <FilterSelect.Trigger data-testid="trigger">
            <FilterSelect.Value />
          </FilterSelect.Trigger>
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
        </FilterSelect.Root>,
      );

      await user.click(screen.getByTestId('trigger'));
      const input = await screen.findByRole('searchbox', { name: 'Filter fruit' });

      if (isJSDOM) {
        Object.defineProperty(screen.getByRole('listbox'), 'scrollTo', {
          configurable: true,
          value: vi.fn(),
        });
      }

      const selectedOption = screen.getByRole('option', { name: 'Banana' });

      await waitFor(() => {
        expect(selectedOption).toHaveAttribute('data-highlighted');
      });
      expect(input).toHaveAttribute('aria-activedescendant', selectedOption.id);
      // DOM focus stays on the filter input. The focus manager moves it in a later commit than
      // the highlight, so it needs its own wait.
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
    });

    it('highlights the selected item when opening with Enter', async () => {
      const { user } = await render(
        <FilterSelect.Root
          defaultValue="banana"
          items={[
            { value: 'apple', label: 'Apple' },
            { value: 'banana', label: 'Banana' },
          ]}
        >
          <FilterSelect.Trigger data-testid="trigger">
            <FilterSelect.Value />
          </FilterSelect.Trigger>
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
        </FilterSelect.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      await act(async () => {
        trigger.focus();
      });
      await user.keyboard('[Enter]');

      const input = await screen.findByRole('searchbox', { name: 'Filter fruit' });

      if (isJSDOM) {
        Object.defineProperty(screen.getByRole('listbox'), 'scrollTo', {
          configurable: true,
          value: vi.fn(),
        });
      }

      const selectedOption = screen.getByRole('option', { name: 'Banana' });

      await waitFor(() => {
        expect(selectedOption).toHaveAttribute('data-highlighted');
      });
      expect(input).toHaveAttribute('aria-activedescendant', selectedOption.id);
    });

    it('clears the highlight while typing and restores it when the query is fully cleared', async () => {
      const { user } = await render(
        <FilterSelect.Root
          defaultValue="banana"
          items={[
            { value: 'apple', label: 'Apple' },
            { value: 'banana', label: 'Banana' },
            { value: 'blueberry', label: 'Blueberry' },
          ]}
        >
          <FilterSelect.Trigger data-testid="trigger">
            <FilterSelect.Value />
          </FilterSelect.Trigger>
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
        </FilterSelect.Root>,
      );

      await user.click(screen.getByTestId('trigger'));
      const input = await screen.findByRole('searchbox', { name: 'Filter fruit' });

      if (isJSDOM) {
        Object.defineProperty(screen.getByRole('listbox'), 'scrollTo', {
          configurable: true,
          value: vi.fn(),
        });
      }

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Banana' })).toHaveAttribute('data-highlighted');
      });

      // Typing clears the highlight even though the selected item remains in the list,
      // and it must stay cleared while filtering re-indexes the list.
      await user.type(input, 'b');

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Banana' })).not.toHaveAttribute(
          'data-highlighted',
        );
      });
      expect(input).not.toHaveAttribute('aria-activedescendant');

      await user.type(input, 'l');

      expect(screen.getByRole('option', { name: 'Blueberry' })).not.toHaveAttribute(
        'data-highlighted',
      );
      expect(input).not.toHaveAttribute('aria-activedescendant');

      // Fully clearing the query restores the highlight to the selected item.
      await user.clear(input);

      const selectedOption = await screen.findByRole('option', { name: 'Banana' });
      await waitFor(() => {
        expect(selectedOption).toHaveAttribute('data-highlighted');
      });
      expect(input).toHaveAttribute('aria-activedescendant', selectedOption.id);
    });

    it('shows the input focus indicator only for keyboard virtual focus', async () => {
      const { user } = await render(
        <FilterSelect.Root items={[{ value: 'apple', label: 'Apple' }]}>
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
        </FilterSelect.Root>,
      );

      const trigger = screen.getByRole('combobox');
      await act(async () => {
        trigger.focus();
      });
      await user.keyboard('[Enter]');

      const input = await screen.findByRole('searchbox', { name: 'Filter fruit' });
      const list = screen.getByRole('listbox');
      if (isJSDOM) {
        Object.defineProperty(list, 'scrollTo', {
          configurable: true,
          value: vi.fn(),
        });
      }

      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      expect(input).toHaveAttribute('data-focus-visible');

      const item = screen.getByRole('option', { name: 'Apple' });
      await user.hover(item);
      expect(input).not.toHaveAttribute('data-focus-visible');

      await user.hover(input);
      expect(input).not.toHaveAttribute('data-focus-visible');

      await user.keyboard('[ArrowDown]');
      expect(input).not.toHaveAttribute('data-focus-visible');

      await user.keyboard('[ArrowDown]');
      expect(input).toHaveAttribute('data-focus-visible');
    });

    it('sets the first item as active when the filterable list receives focus', async () => {
      const { user } = await render(
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
        </FilterSelect.Root>,
      );

      const list = screen.getByRole('listbox');
      const firstItem = screen.getByRole('option', { name: 'Apple' });
      expect(list).not.toHaveAttribute('aria-activedescendant');

      await user.tab();

      await waitFor(() => {
        expect(list).toHaveAttribute('aria-activedescendant', firstItem.id);
      });

      await user.keyboard('{Shift>}{Tab}{/Shift}');

      await waitFor(() => {
        expect(screen.getByRole('searchbox', { name: 'Filter fruit' })).toHaveFocus();
      });
      expect(list).not.toHaveAttribute('aria-activedescendant');
    });

    it('supports a controlled input value', async () => {
      function Test() {
        const [inputValue, setInputValue] = React.useState('');

        return (
          <React.Fragment>
            <div data-testid="input-value">{inputValue}</div>
            <FilterSelect.Root
              open
              inputValue={inputValue}
              onInputValueChange={(nextInputValue) => {
                if (nextInputValue.length <= 3) {
                  setInputValue(nextInputValue);
                }
              }}
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
          </React.Fragment>
        );
      }

      const { user } = await render(<Test />);
      const input = await screen.findByRole('searchbox', { name: 'Filter fruit' });

      await user.type(input, 'ban');

      expect(input).toHaveValue('ban');
      expect(screen.getByTestId('input-value')).toHaveTextContent('ban');
      expect(screen.queryByRole('option', { name: 'Apple' })).toBe(null);
      expect(screen.getByRole('option', { name: 'Banana' })).toBeVisible();

      await user.type(input, 'x');

      expect(input).toHaveValue('ban');
      expect(screen.getByTestId('input-value')).toHaveTextContent('ban');
      expect(screen.getByRole('option', { name: 'Banana' })).toBeVisible();
    });

    it('resets the input value once when the popup closes', async () => {
      const onInputValueChange = vi.fn();

      function Test() {
        const [open, setOpen] = React.useState(true);

        return (
          <React.Fragment>
            <button type="button" onClick={() => setOpen(false)}>
              Close
            </button>
            <FilterSelect.Root
              open={open}
              onInputValueChange={onInputValueChange}
              items={[{ value: 'apple', label: 'Apple' }]}
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
          </React.Fragment>
        );
      }

      const { user } = await render(<Test />);
      const input = await screen.findByRole('searchbox', { name: 'Filter fruit' });

      await user.type(input, 'app');
      onInputValueChange.mockClear();

      await user.click(screen.getByRole('button', { name: 'Close' }));

      await waitFor(() => {
        expect(input).toHaveValue('');
      });
      expect(onInputValueChange).toHaveBeenCalledTimes(1);
      expect(onInputValueChange.mock.calls[0][0]).toBe('');
      expect(onInputValueChange.mock.calls[0][1].reason).toBe('popup-close');
    });

    it('points ARIA relationships at consumer-supplied popup and list ids', async () => {
      await render(
        <FilterSelect.Root open items={[{ value: 'apple', label: 'Apple' }]}>
          <FilterSelect.Trigger data-testid="trigger">Fruit</FilterSelect.Trigger>
          <FilterSelect.Portal>
            <FilterSelect.Positioner>
              <FilterSelect.Popup id="my-popup">
                <FilterSelect.Input aria-label="Filter fruit" />
                <FilterSelect.List id="my-list">
                  {(item: { value: string; label: string }) => (
                    <FilterSelect.Item key={item.value} value={item.value}>
                      {item.label}
                    </FilterSelect.Item>
                  )}
                </FilterSelect.List>
              </FilterSelect.Popup>
            </FilterSelect.Positioner>
          </FilterSelect.Portal>
        </FilterSelect.Root>,
      );

      expect(screen.getByRole('dialog')).toHaveAttribute('id', 'my-popup');
      expect(screen.getByRole('listbox')).toHaveAttribute('id', 'my-list');
      expect(screen.getByTestId('trigger')).toHaveAttribute('aria-controls', 'my-popup');
      expect(screen.getByRole('searchbox', { name: 'Filter fruit' })).toHaveAttribute(
        'aria-controls',
        'my-list',
      );
    });

    it('matches entries on their keywords', async () => {
      const items: FilterSelectItemData[] = [
        { value: 'delete', label: 'Delete', keywords: ['remove', 'trash'] },
        { value: 'rename', label: 'Rename' },
      ];
      const { user } = await render(
        <FilterSelect.Root open items={items}>
          <FilterSelect.Trigger>Actions</FilterSelect.Trigger>
          <FilterSelect.Portal>
            <FilterSelect.Positioner>
              <FilterSelect.Popup>
                <FilterSelect.Input aria-label="Filter actions" />
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
        </FilterSelect.Root>,
      );

      const input = await screen.findByRole('searchbox', { name: 'Filter actions' });
      await user.type(input, 'trash');

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Delete' })).toBeVisible();
      });
      expect(screen.queryByRole('option', { name: 'Rename' })).toBe(null);
    });

    it('renders and filters from the items data source', async () => {
      const fruit = [
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana' },
        { value: 'cherry', label: 'Cherry' },
      ];

      const { user } = await render(
        <FilterSelect.Root open items={fruit}>
          <FilterSelect.Trigger>
            <FilterSelect.Value />
          </FilterSelect.Trigger>
          <FilterSelect.Portal>
            <FilterSelect.Positioner>
              <FilterSelect.Popup>
                <FilterSelect.Input aria-label="Filter fruit" />
                <FilterSelect.Empty>No fruit found</FilterSelect.Empty>
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
        </FilterSelect.Root>,
      );

      expect(screen.getAllByRole('option')).toHaveLength(3);

      const input = screen.getByRole('searchbox', { name: 'Filter fruit' });
      await user.type(input, 'an');

      await waitFor(() => {
        expect(screen.getAllByRole('option')).toHaveLength(1);
      });
      expect(screen.getByRole('option', { name: 'Banana' })).toBeVisible();

      await user.clear(input);
      await user.type(input, 'zzz');

      await waitFor(() => {
        expect(screen.queryAllByRole('option')).toHaveLength(0);
      });
      expect(screen.queryAllByText('No fruit found').length).toBeGreaterThan(0);
    });

    it('filters grouped items from the items data source', async () => {
      const groups = [
        { value: 'citrus', items: [{ value: 'orange', label: 'Orange' }] },
        { value: 'berry', items: [{ value: 'strawberry', label: 'Strawberry' }] },
      ];

      const { user } = await render(
        <FilterSelect.Root open items={groups}>
          <FilterSelect.Trigger>
            <FilterSelect.Value />
          </FilterSelect.Trigger>
          <FilterSelect.Portal>
            <FilterSelect.Positioner>
              <FilterSelect.Popup>
                <FilterSelect.Input aria-label="Filter fruit" />
                <FilterSelect.List>
                  {(group: { value: string; items: { value: string; label: string }[] }) => (
                    <FilterSelect.Group key={group.value} items={group.items}>
                      <FilterSelect.GroupLabel>{group.value}</FilterSelect.GroupLabel>
                      <FilterSelect.Collection>
                        {(item: { value: string; label: string }) => (
                          <FilterSelect.Item key={item.value} value={item.value}>
                            {item.label}
                          </FilterSelect.Item>
                        )}
                      </FilterSelect.Collection>
                    </FilterSelect.Group>
                  )}
                </FilterSelect.List>
              </FilterSelect.Popup>
            </FilterSelect.Positioner>
          </FilterSelect.Portal>
        </FilterSelect.Root>,
      );

      expect(screen.getAllByRole('group')).toHaveLength(2);
      expect(screen.getAllByRole('option')).toHaveLength(2);

      await user.type(screen.getByRole('searchbox', { name: 'Filter fruit' }), 'straw');

      await waitFor(() => {
        expect(screen.getAllByRole('option')).toHaveLength(1);
      });
      // The group with no remaining matches is dropped entirely.
      expect(screen.getAllByRole('group')).toHaveLength(1);
      expect(screen.getByRole('option', { name: 'Strawberry' })).toBeVisible();
    });

    it('disables filter controls when disabled by a field', async () => {
      await render(
        <Field.Root disabled>
          <FilterSelect.Root
            open
            defaultInputValue="a"
            items={[{ value: 'apple', label: 'Apple' }]}
          >
            <FilterSelect.Trigger>Fruit</FilterSelect.Trigger>
            <FilterSelect.Portal>
              <FilterSelect.Positioner>
                <FilterSelect.Popup>
                  <FilterSelect.Input aria-label="Filter fruit" />
                  <FilterSelect.Clear aria-label="Clear filter" />
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
        </Field.Root>,
      );

      expect(screen.getByRole('searchbox', { name: 'Filter fruit' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Clear filter' })).toBeDisabled();
    });

    it('uses an updated custom filter function', async () => {
      const startsWith: FilterSelectFilter = (item, query) =>
        String((item as FilterSelectItemData).label)
          .toLowerCase()
          .startsWith(query);
      const endsWith: FilterSelectFilter = (item, query) =>
        String((item as FilterSelectItemData).label)
          .toLowerCase()
          .endsWith(query);

      function Test() {
        const [filter, setFilter] = React.useState(() => startsWith);

        return (
          <React.Fragment>
            <button type="button" onClick={() => setFilter(() => endsWith)}>
              Change filter
            </button>
            <FilterSelect.Root
              filter={filter}
              open
              defaultInputValue="a"
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
          </React.Fragment>
        );
      }

      const { user } = await render(<Test />);

      expect(screen.getByRole('option', { name: 'Apple' })).toBeVisible();
      expect(screen.queryByRole('option', { name: 'Banana' })).toBe(null);

      await user.click(screen.getByRole('button', { name: 'Change filter' }));

      expect(screen.queryByRole('option', { name: 'Apple' })).toBe(null);
      expect(screen.getByRole('option', { name: 'Banana' })).toBeVisible();
    });

    it('preserves the selected value when filtering hides its item', async () => {
      const onValueChange = vi.fn();

      const { user } = await render(
        <FilterSelect.Root
          open
          defaultValue="banana"
          onValueChange={onValueChange}
          items={[
            { value: 'apple', label: 'Apple' },
            { value: 'banana', label: 'Banana' },
          ]}
        >
          <FilterSelect.Trigger data-testid="trigger">
            <FilterSelect.Value />
          </FilterSelect.Trigger>
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
        </FilterSelect.Root>,
      );

      const input = await screen.findByRole('searchbox', { name: 'Filter fruit' });
      await user.type(input, 'app');

      expect(screen.queryByRole('option', { name: 'Banana' })).toBe(null);
      expect(screen.getByTestId('trigger')).toHaveTextContent('Banana');
      expect(onValueChange).not.toHaveBeenCalled();

      await user.clear(input);

      expect(screen.getByRole('option', { name: 'Banana' })).toHaveAttribute('data-selected', '');
    });

    it('removes the selected value when its item genuinely unmounts while filtered', async () => {
      function Test() {
        const [items, setItems] = React.useState([
          { value: 'apple', label: 'apple' },
          { value: 'banana', label: 'banana' },
        ]);
        const [value, setValue] = React.useState<string | null>('banana');

        return (
          <React.Fragment>
            <button
              onClick={() => setItems((current) => current.filter((item) => item.value !== value))}
            >
              Remove selected
            </button>
            <div data-testid="value">{value ?? 'none'}</div>
            <FilterSelect.Root
              open
              value={value}
              onValueChange={setValue}
              defaultInputValue="app"
              items={items}
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
          </React.Fragment>
        );
      }

      const { user } = await render(<Test />);

      expect(screen.queryByRole('option', { name: 'banana' })).toBe(null);
      expect(screen.getByTestId('value')).toHaveTextContent('banana');

      await user.click(screen.getByRole('button', { name: 'Remove selected' }));

      await waitFor(() => {
        expect(screen.getByTestId('value')).toHaveTextContent('none');
      });
    });

    it('preserves hidden multiple selections while filtering and drops only genuinely removed ones', async () => {
      function Test() {
        const [items, setItems] = React.useState([
          { value: 'apple', label: 'apple' },
          { value: 'banana', label: 'banana' },
          { value: 'cherry', label: 'cherry' },
        ]);
        const [value, setValue] = React.useState<string[]>(['banana', 'cherry']);

        return (
          <React.Fragment>
            <button
              type="button"
              onClick={() =>
                setItems((current) => current.filter((item) => item.value !== 'cherry'))
              }
            >
              Remove cherry
            </button>
            <div data-testid="value">{value.join(',') || 'none'}</div>
            <FilterSelect.Root multiple open value={value} onValueChange={setValue} items={items}>
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
          </React.Fragment>
        );
      }

      const { user } = await render(<Test />);
      const input = await screen.findByRole('searchbox', { name: 'Filter fruit' });

      // Filtering hides both selected items; neither selection may be dropped.
      await user.type(input, 'app');

      await waitFor(() => {
        expect(screen.queryByRole('option', { name: 'banana' })).toBe(null);
      });
      expect(screen.queryByRole('option', { name: 'cherry' })).toBe(null);
      expect(screen.getByTestId('value')).toHaveTextContent('banana,cherry');

      // A genuine unmount while filtered drops exactly that value.
      await user.click(screen.getByRole('button', { name: 'Remove cherry' }));

      await waitFor(() => {
        expect(screen.getByTestId('value')).toHaveTextContent('banana');
      });

      await user.clear(input);

      expect(screen.getByRole('option', { name: 'banana' })).toHaveAttribute('data-selected', '');
    });

    it('leaves the uncontrolled query and visible items unchanged when a change is canceled', async () => {
      const { user } = await render(
        <FilterSelect.Root
          open
          defaultInputValue="app"
          onInputValueChange={(_, eventDetails) => eventDetails.cancel()}
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
                <FilterSelect.Clear aria-label="Clear filter" />
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
        </FilterSelect.Root>,
      );

      const input = screen.getByRole('searchbox', { name: 'Filter fruit' });

      expect(input).toHaveValue('app');
      expect(screen.getByRole('option', { name: 'Apple' })).toBeVisible();
      expect(screen.queryByRole('option', { name: 'Banana' })).toBe(null);

      // Typing is rejected.
      await user.type(input, 'x');

      expect(input).toHaveValue('app');
      expect(screen.getByRole('option', { name: 'Apple' })).toBeVisible();
      expect(screen.queryByRole('option', { name: 'Banana' })).toBe(null);

      // Clearing is rejected.
      await user.click(screen.getByRole('button', { name: 'Clear filter' }));

      expect(input).toHaveValue('app');
      expect(screen.getByRole('option', { name: 'Apple' })).toBeVisible();
      expect(screen.queryByRole('option', { name: 'Banana' })).toBe(null);
    });

    it('keeps focus on the input while navigating and selects the active item with Enter', async () => {
      const { user } = await render(
        <FilterSelect.Root
          items={[
            { value: 'apple', label: 'Apple' },
            { value: 'banana', label: 'Banana' },
          ]}
        >
          <FilterSelect.Trigger data-testid="trigger">
            <FilterSelect.Value />
          </FilterSelect.Trigger>
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
        </FilterSelect.Root>,
      );

      await user.click(screen.getByTestId('trigger'));
      const input = await screen.findByRole('searchbox', { name: 'Filter fruit' });

      if (isJSDOM) {
        Object.defineProperty(screen.getByRole('listbox'), 'scrollTo', {
          configurable: true,
          value: vi.fn(),
        });
      }

      await waitFor(() => {
        expect(input).toHaveFocus();
      });

      await user.type(input, 'ban');
      await user.keyboard('{ArrowDown}');

      expect(input).toHaveFocus();
      expect(screen.getByRole('option', { name: 'Banana' })).toHaveAttribute(
        'data-highlighted',
        '',
      );

      await user.keyboard('{Enter}');

      expect(screen.getByTestId('trigger')).toHaveTextContent('Banana');
    });
  });
});
