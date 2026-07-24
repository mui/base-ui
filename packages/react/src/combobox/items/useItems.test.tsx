import { expect, vi } from 'vitest';
import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { createRenderer } from '#test-utils';
import { act, screen, renderHook } from '@mui/internal-test-utils';

interface User {
  id: number;
  name: string;
}

const users: User[] = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Carol' },
];

const getUserId = (user: User) => user.id;
const getUserName = (user: User) => user.name;
const getTypeaheadLabel = (user: User) => (user.id === 2 ? 'Zebra' : 'Yak');

function useUserItems() {
  return Combobox.useItems(users, {
    value: getUserId,
    label: getUserName,
  });
}

describe('Combobox.useItems', () => {
  const { render } = createRenderer();

  describe('collection', () => {
    it('is referentially stable across re-renders with stable options', () => {
      const { result, rerender } = renderHook(() =>
        Combobox.useItems(users, { value: getUserId, label: getUserName }),
      );
      const first = result.current;

      rerender();

      expect(result.current).toBe(first);
    });
  });

  describe('integration', () => {
    it('uses the derived value for selection and resolves the label while closed', async () => {
      const onValueChange = vi.fn();

      function App() {
        const items = useUserItems();
        return (
          <Combobox.Root items={items} defaultOpen onValueChange={onValueChange}>
            <Combobox.Input data-testid="input" />
            <Combobox.List>
              {(user: User) => <Combobox.Item key={user.id}>{user.name}</Combobox.Item>}
            </Combobox.List>
          </Combobox.Root>
        );
      }

      const { user } = await render(<App />);

      await user.click(screen.getByRole('option', { name: 'Bob' }));

      expect(onValueChange.mock.lastCall?.[0]).toBe(2);
      expect(screen.getByTestId<HTMLInputElement>('input').value).toBe('Bob');
    });

    it('resolves the label of an initially selected value', async () => {
      function App() {
        const items = useUserItems();
        return (
          <Combobox.Root items={items} defaultValue={3}>
            <Combobox.Input data-testid="input" />
            <Combobox.List>
              {(user: User) => <Combobox.Item key={user.id}>{user.name}</Combobox.Item>}
            </Combobox.List>
          </Combobox.Root>
        );
      }

      await render(<App />);

      expect(screen.getByTestId<HTMLInputElement>('input').value).toBe('Carol');
    });

    it('highlights an initially selected derived value when opened', async () => {
      function App() {
        const items = useUserItems();
        return (
          <Combobox.Root items={items} defaultValue={3}>
            <Combobox.Input data-testid="input" />
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.List>
                    {(user: User) => <Combobox.Item key={user.id}>{user.name}</Combobox.Item>}
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        );
      }

      const { user } = await render(<App />);

      await user.click(screen.getByTestId('input'));

      expect(await screen.findByRole('option', { name: 'Carol' })).toHaveAttribute(
        'data-highlighted',
      );
    });

    it('renders the selected label via Combobox.Value', async () => {
      function App() {
        const items = useUserItems();
        return (
          <Combobox.Root items={items} defaultValue={1}>
            <Combobox.Input />
            <span data-testid="value">
              <Combobox.Value />
            </span>
          </Combobox.Root>
        );
      }

      await render(<App />);

      expect(screen.getByTestId('value')).toHaveTextContent('Alice');
    });

    it('filters items by their derived labels', async () => {
      function App() {
        const items = useUserItems();
        return (
          <Combobox.Root items={items} defaultOpen>
            <Combobox.Input data-testid="input" />
            <Combobox.List>
              {(user: User) => <Combobox.Item key={user.id}>{user.name}</Combobox.Item>}
            </Combobox.List>
          </Combobox.Root>
        );
      }

      const { user } = await render(<App />);

      await user.type(screen.getByTestId('input'), 'bo');

      expect(screen.queryByRole('option', { name: 'Alice' })).toBe(null);
      expect(screen.getByRole('option', { name: 'Bob' })).not.toBe(null);
    });

    it('uses the root label stringifier for filtering', async () => {
      function App() {
        const items = useUserItems();
        return (
          <Combobox.Root items={items} itemToStringLabel={(id: number) => `User ${id}`} defaultOpen>
            <Combobox.Input data-testid="input" />
            <Combobox.List>
              {(user: User) => <Combobox.Item key={user.id}>{user.name}</Combobox.Item>}
            </Combobox.List>
          </Combobox.Root>
        );
      }

      const { user } = await render(<App />);

      await user.type(screen.getByTestId('input'), 'user 2');

      expect(screen.queryByRole('option', { name: 'Alice' })).toBe(null);
      expect(screen.getByRole('option', { name: 'Bob' })).not.toBe(null);
    });

    it('uses the root locale for filtering', async () => {
      const cities = ['Isparta', 'İzmir'];

      function App() {
        const items = Combobox.useItems(cities);
        return (
          <Combobox.Root items={items} locale="tr" defaultOpen>
            <Combobox.Input data-testid="input" />
            <Combobox.List>
              {(city: string) => <Combobox.Item key={city}>{city}</Combobox.Item>}
            </Combobox.List>
          </Combobox.Root>
        );
      }

      const { user } = await render(<App />);

      await user.type(screen.getByTestId('input'), 'i');

      expect(screen.queryByRole('option', { name: 'Isparta' })).toBe(null);
      expect(screen.getByRole('option', { name: 'İzmir' })).not.toBe(null);
    });

    it('updates selected labels when the label accessor changes', async () => {
      const getEnglishName = (user: User) => user.name;
      const getSpanishName = (user: User) => (user.id === 1 ? 'Alicia' : user.name);

      function App(props: { getLabel: (user: User) => string }) {
        const items = Combobox.useItems(users, {
          value: getUserId,
          label: props.getLabel,
        });
        return (
          <Combobox.Root items={items} defaultValue={1}>
            <Combobox.Input data-testid="input" />
            <span data-testid="value">
              <Combobox.Value />
            </span>
          </Combobox.Root>
        );
      }

      const { setProps } = await render(<App getLabel={getEnglishName} />);

      expect(screen.getByTestId('input')).toHaveValue('Alice');
      expect(screen.getByTestId('value')).toHaveTextContent('Alice');

      await setProps({ getLabel: getSpanishName });

      expect(screen.getByTestId('input')).toHaveValue('Alicia');
      expect(screen.getByTestId('value')).toHaveTextContent('Alicia');
    });

    it('passes derived values to a custom root filter', async () => {
      const filter = vi.fn((id: number) => id === 2);

      function App() {
        const items = useUserItems();
        return (
          <Combobox.Root items={items} filter={filter} defaultOpen>
            <Combobox.Input data-testid="input" />
            <Combobox.List>
              {(user: User) => <Combobox.Item key={user.id}>{user.name}</Combobox.Item>}
            </Combobox.List>
          </Combobox.Root>
        );
      }

      const { user } = await render(<App />);

      await user.type(screen.getByTestId('input'), 'x');

      expect(screen.queryByRole('option', { name: 'Alice' })).toBe(null);
      expect(screen.getByRole('option', { name: 'Bob' })).not.toBe(null);
      expect(filter.mock.calls.every(([id]) => typeof id === 'number')).toBe(true);
      expect(new Set(filter.mock.calls.map(([id]) => id))).toEqual(new Set([1, 2, 3]));
    });

    it('labels a selected value that is not in the collection as itself', async () => {
      function App() {
        const items = Combobox.useItems(users, {
          value: getUserId,
          label: (user) => user.name.toUpperCase(),
        });
        return (
          <Combobox.Root items={items} defaultValue={99}>
            <Combobox.Input data-testid="input" />
          </Combobox.Root>
        );
      }

      await render(<App />);

      expect(screen.getByTestId<HTMLInputElement>('input').value).toBe('99');
    });

    it('uses the default object label fallback outside the collection', async () => {
      function App() {
        const items = Combobox.useItems<User, number | { label: string }>(users, {
          value: getUserId,
          label: getUserName,
        });
        return (
          <Combobox.Root items={items} defaultValue={{ label: 'New tag' }}>
            <Combobox.Input data-testid="input" />
          </Combobox.Root>
        );
      }

      await render(<App />);

      expect(screen.getByTestId<HTMLInputElement>('input').value).toBe('New tag');
    });

    it('uses derived labels for closed trigger typeahead', async () => {
      function App() {
        const items = Combobox.useItems(users, {
          value: getUserId,
          label: getTypeaheadLabel,
        });
        return (
          <Combobox.Root items={items}>
            <Combobox.Trigger data-testid="trigger">
              <Combobox.Value />
            </Combobox.Trigger>
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.List>
                    {(user: User) => <Combobox.Item key={user.id}>{user.name}</Combobox.Item>}
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        );
      }

      const { user } = await render(<App />);
      const trigger = screen.getByTestId('trigger');

      act(() => {
        trigger.focus();
      });
      await user.keyboard('z');

      expect(trigger).toHaveTextContent('Zebra');
      expect(screen.queryByRole('listbox')).toBe(null);
    });

    it('does not stringify null when no value is selected', async () => {
      function App() {
        const items = useUserItems();
        return (
          <Combobox.Root items={items} itemToStringLabel={(id) => `User ${id}`}>
            <span data-testid="value">
              <Combobox.Value />
            </span>
          </Combobox.Root>
        );
      }

      await render(<App />);

      expect(screen.getByTestId('value')).toBeEmptyDOMElement();
    });

    it('does not treat source value fields as derived selections', async () => {
      const sourceItems = [{ id: 1, value: null, label: 'No discount' }];

      function App() {
        const items = Combobox.useItems(sourceItems, {
          value: (item) => item.id,
          label: (item) => item.label,
        });
        return (
          <Combobox.Root items={items}>
            <span data-testid="placeholder">
              <Combobox.Value placeholder="Choose an option" />
            </span>
            <span data-testid="value">
              <Combobox.Value />
            </span>
          </Combobox.Root>
        );
      }

      await render(<App />);

      expect(screen.getByTestId('placeholder')).toHaveTextContent('Choose an option');
      expect(screen.getByTestId('value')).toBeEmptyDOMElement();
    });

    it('serializes derived values in multiple mode', async () => {
      function App() {
        const items = useUserItems();
        return <Combobox.Root items={items} multiple name="users" defaultValue={[1, 2]} />;
      }

      await render(<App />);

      expect(screen.getByDisplayValue('1')).toHaveAttribute('name', 'users');
      expect(screen.getByDisplayValue('2')).toHaveAttribute('name', 'users');
    });

    it('selects the derived value with the keyboard', async () => {
      const onValueChange = vi.fn();

      function App() {
        const items = useUserItems();
        return (
          <Combobox.Root items={items} onValueChange={onValueChange}>
            <Combobox.Input data-testid="input" />
            <Combobox.List>
              {(user: User) => <Combobox.Item key={user.id}>{user.name}</Combobox.Item>}
            </Combobox.List>
          </Combobox.Root>
        );
      }

      const { user } = await render(<App />);

      const input = screen.getByTestId('input');
      await user.click(input);
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      expect(onValueChange.mock.lastCall?.[0]).toBe(1);
    });

    it('resolves a virtualized item index from the derived value after filtering', async () => {
      const onValueChange = vi.fn();

      function App() {
        const items = useUserItems();
        return (
          <Combobox.Root items={items} virtualized defaultOpen onValueChange={onValueChange}>
            <Combobox.Input data-testid="input" />
            <Combobox.List>
              {(user: User) => <Combobox.Item key={user.id}>{user.name}</Combobox.Item>}
            </Combobox.List>
          </Combobox.Root>
        );
      }

      const { user } = await render(<App />);

      await user.type(screen.getByTestId('input'), 'bo');
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      expect(onValueChange.mock.lastCall?.[0]).toBe(2);
    });

    it('uses the derived value when an item also has an explicit value', async () => {
      const onValueChange = vi.fn();

      function App() {
        const items = useUserItems();
        return (
          <Combobox.Root items={items} defaultOpen onValueChange={onValueChange}>
            <Combobox.Input />
            <Combobox.List>
              {(user: User) => (
                <Combobox.Item key={user.id} value={`explicit-${user.id}`}>
                  {user.name}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Root>
        );
      }

      const { user } = await render(<App />);

      await user.click(screen.getByRole('option', { name: 'Bob' }));

      expect(onValueChange.mock.lastCall?.[0]).toBe(2);
    });

    it('stops filtering when the limit is reached', async () => {
      const manyUsers = Array.from({ length: 100 }, (_, id) => ({ id, name: `Alice ${id}` }));
      const filter = vi.fn((id: number) => id >= 0);

      function App() {
        const items = Combobox.useItems(manyUsers, {
          value: getUserId,
          label: getUserName,
        });
        return (
          <Combobox.Root items={items} filter={filter} limit={2} defaultOpen>
            <Combobox.Input data-testid="input" />
            <Combobox.List>
              {(user: User) => <Combobox.Item key={user.id}>{user.name}</Combobox.Item>}
            </Combobox.List>
          </Combobox.Root>
        );
      }

      const { user } = await render(<App />);
      filter.mockClear();

      await user.type(screen.getByTestId('input'), 'a');

      expect(screen.getAllByRole('option')).toHaveLength(2);
      expect(new Set(filter.mock.calls.map(([id]) => id))).toEqual(new Set([0, 1]));
    });
  });

  describe('grouped items', () => {
    interface Team {
      value: string;
      items: User[];
    }

    const teams: Team[] = [
      { value: 'Engineering', items: [users[0], users[1]] },
      { value: 'Design', items: [users[2]] },
    ];

    function GroupedApp(props: Partial<Combobox.Root.Props<number>>) {
      const items = Combobox.useItems(teams, {
        value: getUserId,
        label: getUserName,
      });
      return (
        <Combobox.Root items={items} {...props}>
          <Combobox.Input data-testid="input" />
          <Combobox.List>
            {(group: Team) => (
              <Combobox.Group key={group.value} items={group.items}>
                <Combobox.GroupLabel>{group.value}</Combobox.GroupLabel>
                <Combobox.Collection>
                  {(user: User) => <Combobox.Item key={user.id}>{user.name}</Combobox.Item>}
                </Combobox.Collection>
              </Combobox.Group>
            )}
          </Combobox.List>
        </Combobox.Root>
      );
    }

    it('uses the derived value for selection and resolves the label while closed', async () => {
      const onValueChange = vi.fn();

      const { user } = await render(<GroupedApp defaultOpen onValueChange={onValueChange} />);

      await user.click(screen.getByRole('option', { name: 'Bob' }));

      expect(onValueChange.mock.lastCall?.[0]).toBe(2);
      expect(screen.getByTestId<HTMLInputElement>('input').value).toBe('Bob');
    });

    it('resolves the label of an initially selected value', async () => {
      await render(<GroupedApp defaultValue={3} />);

      expect(screen.getByTestId<HTMLInputElement>('input').value).toBe('Carol');
    });

    it('filters items by their derived labels and drops empty groups', async () => {
      const { user } = await render(<GroupedApp defaultOpen />);

      await user.type(screen.getByTestId('input'), 'car');

      expect(screen.queryByRole('option', { name: 'Alice' })).toBe(null);
      expect(screen.getByRole('option', { name: 'Carol' })).not.toBe(null);
      expect(screen.queryByText('Engineering')).toBe(null);
      expect(screen.getByText('Design')).not.toBe(null);
    });

    it('passes derived values to a custom root filter', async () => {
      const filter = vi.fn((id: number) => id === 3);

      const { user } = await render(<GroupedApp defaultOpen filter={filter} />);

      await user.type(screen.getByTestId('input'), 'x');

      expect(screen.queryByRole('option', { name: 'Alice' })).toBe(null);
      expect(screen.getByRole('option', { name: 'Carol' })).not.toBe(null);
      expect(filter.mock.calls.every(([id]) => typeof id === 'number')).toBe(true);
    });

    it('only applies accessors to group items', async () => {
      const getValue = vi.fn((user: User) => user.id);
      const getLabel = vi.fn((user: User) => user.name);

      function App() {
        const items = Combobox.useItems(teams, {
          value: getValue,
          label: getLabel,
        });
        return (
          <Combobox.Root items={items} defaultOpen>
            <Combobox.Input />
            <Combobox.List>
              {(group: Team) => (
                <Combobox.Group key={group.value} items={group.items}>
                  <Combobox.Collection>
                    {(user: User) => <Combobox.Item key={user.id}>{user.name}</Combobox.Item>}
                  </Combobox.Collection>
                </Combobox.Group>
              )}
            </Combobox.List>
          </Combobox.Root>
        );
      }

      await render(<App />);

      expect(getValue.mock.calls.every(([item]) => !('items' in item))).toBe(true);
      expect(getLabel.mock.calls.every(([item]) => !('items' in item))).toBe(true);
    });
  });
});
