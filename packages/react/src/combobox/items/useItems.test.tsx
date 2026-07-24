import { expect, vi } from 'vitest';
import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { createRenderer } from '#test-utils';
import { screen, renderHook } from '@mui/internal-test-utils';

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

function useUserItems() {
  return Combobox.useItems(users, {
    value: getUserId,
    label: getUserName,
  });
}

describe('Combobox.useItems', () => {
  const { render } = createRenderer();

  describe('collection', () => {
    it('maps items with their derived values via each()', () => {
      const { result } = renderHook(() => useUserItems());

      expect(result.current.each((item, value, index) => [item.name, value, index])).toEqual([
        ['Alice', 1, 0],
        ['Bob', 2, 1],
        ['Carol', 3, 2],
      ]);
    });

    it('exposes length and iteration over the source items', () => {
      const { result } = renderHook(() => useUserItems());

      expect(result.current.length).toBe(3);
      expect([...result.current]).toEqual(users);
    });

    it('matches items against their labels', () => {
      const { result } = renderHook(() => useUserItems());

      expect(result.current.matches('bo')).toEqual([users[1]]);
      expect(result.current.matches('')).toEqual(users);
      expect(result.current.matches('')).not.toBe(users);
    });

    it('supports startsWith and endsWith filter modes', () => {
      const { result } = renderHook(() => useUserItems());

      expect(result.current.matches('li', { filterMode: 'startsWith' })).toEqual([]);
      expect(result.current.matches('al', { filterMode: 'startsWith' })).toEqual([users[0]]);
      expect(result.current.matches('ce', { filterMode: 'endsWith' })).toEqual([users[0]]);
    });

    it('matches diacritics via Intl.Collator', () => {
      const { result } = renderHook(() => Combobox.useItems(['São Paulo', 'Lisbon']));

      expect(result.current.matches('sao')).toEqual(['São Paulo']);
    });

    it('matches non-string primitive items without crashing', () => {
      const { result } = renderHook(() => Combobox.useItems([1, 22, 3]));

      expect(result.current.matches('2')).toEqual([22]);
    });

    it('uses a custom matches implementation when provided', () => {
      const matches = vi.fn(() => [users[2]]);
      const { result } = renderHook(() =>
        Combobox.useItems(users, { value: (user) => user.id, matches }),
      );

      expect(result.current.matches('anything')).toEqual([users[2]]);
      expect(matches).toHaveBeenCalledWith('anything', undefined);
    });

    it('returns the same collection when given one', () => {
      const { result } = renderHook(() => useUserItems());
      const { result: rebranded } = renderHook(() => Combobox.useItems(result.current));

      expect(rebranded.current).toBe(result.current);
    });

    it('is referentially stable across re-renders with stable options', () => {
      const { result, rerender } = renderHook(() =>
        Combobox.useItems(users, { value: getUserId, label: getUserName }),
      );
      const first = result.current;

      rerender();

      expect(result.current).toBe(first);
    });

    it('updates when options change', () => {
      const matchesAlice = () => [users[0]];
      const matchesBob = () => [users[1]];
      const { result, rerender } = renderHook(
        ({ matches }: { matches: typeof matchesAlice }) =>
          Combobox.useItems(users, { value: getUserId, label: getUserName, matches }),
        { initialProps: { matches: matchesAlice } },
      );

      expect(result.current.matches('user')).toEqual([users[0]]);

      rerender({ matches: matchesBob });

      expect(result.current.matches('user')).toEqual([users[1]]);
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

    it('updates filtering when collection options change', async () => {
      const matchesAlice = () => [users[0]];
      const matchesBob = () => [users[1]];

      function App(props: { matches: typeof matchesAlice }) {
        const items = Combobox.useItems(users, {
          value: getUserId,
          label: getUserName,
          matches: props.matches,
        });
        return (
          <Combobox.Root items={items} defaultOpen>
            <Combobox.Input data-testid="input" />
            <Combobox.List>
              {(user: User) => <Combobox.Item key={user.id}>{user.name}</Combobox.Item>}
            </Combobox.List>
          </Combobox.Root>
        );
      }

      const { setProps, user } = await render(<App matches={matchesAlice} />);
      await user.type(screen.getByTestId('input'), 'user');

      expect(screen.getByRole('option', { name: 'Alice' })).not.toBe(null);

      await setProps({ matches: matchesBob });

      expect(screen.queryByRole('option', { name: 'Alice' })).toBe(null);
      expect(screen.getByRole('option', { name: 'Bob' })).not.toBe(null);
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

    it('prefers an explicit item value over the derived value', async () => {
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

      expect(onValueChange.mock.lastCall?.[0]).toBe('explicit-2');
    });

    it('stops collection matching when the limit is reached', async () => {
      const manyUsers = Array.from({ length: 100 }, (_, id) => ({ id, name: `Alice ${id}` }));
      const getLabel = vi.fn((user: User) => user.name);

      function App() {
        const items = Combobox.useItems(manyUsers, {
          value: getUserId,
          label: getLabel,
        });
        return (
          <Combobox.Root items={items} limit={2} defaultOpen>
            <Combobox.Input data-testid="input" />
            <Combobox.List>
              {(user: User) => <Combobox.Item key={user.id}>{user.name}</Combobox.Item>}
            </Combobox.List>
          </Combobox.Root>
        );
      }

      const { user } = await render(<App />);
      getLabel.mockClear();

      await user.type(screen.getByTestId('input'), 'a');

      expect(getLabel.mock.calls.length).toBeLessThan(manyUsers.length);
    });
  });

  describe('Combobox.items', () => {
    it('produces a serializable payload usable through useItems', async () => {
      const payload = Combobox.items(users, {
        value: (user) => user.id,
        label: (user) => user.name,
      });

      // Simulate crossing the server/client boundary.
      const serialized = JSON.parse(JSON.stringify(payload)) as typeof payload;
      const onValueChange = vi.fn();

      function App() {
        const items = Combobox.useItems(serialized);
        return (
          <Combobox.Root items={items} defaultOpen onValueChange={onValueChange}>
            <Combobox.Input data-testid="input" />
            <Combobox.List>
              {(item: User) => <Combobox.Item key={item.id}>{item.name}</Combobox.Item>}
            </Combobox.List>
          </Combobox.Root>
        );
      }

      const { user } = await render(<App />);

      await user.click(screen.getByRole('option', { name: 'Bob' }));

      expect(onValueChange.mock.lastCall?.[0]).toBe(2);
      expect(screen.getByTestId<HTMLInputElement>('input').value).toBe('Bob');
    });

    it('re-brands a payload passed to useItems', () => {
      const payload = Combobox.items(users, { value: (user) => user.id });
      const serialized = JSON.parse(JSON.stringify(payload)) as typeof payload;

      const { result } = renderHook(() => Combobox.useItems(serialized));

      expect(result.current.each((item, value) => [item.name, value])).toEqual([
        ['Alice', 1],
        ['Bob', 2],
        ['Carol', 3],
      ]);
    });

    it('applies client matching options when re-branding a payload', () => {
      const payload = Combobox.items(users, { value: getUserId, label: getUserName });
      const serialized = JSON.parse(JSON.stringify(payload)) as typeof payload;
      const matches = vi.fn(() => [users[1]]);

      const { result } = renderHook(() => Combobox.useItems(serialized, { matches }));

      expect(result.current.matches('anything')).toEqual([users[1]]);
      expect(matches).toHaveBeenCalledWith('anything', undefined);
    });
  });
});
