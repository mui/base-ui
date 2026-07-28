import { expect, vi } from 'vitest';
import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { createRenderer } from '#test-utils';
import { act, screen, waitFor } from '@mui/internal-test-utils';

interface User {
  id: number;
  name: string;
}

const users: User[] = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Carol' },
];

interface ApiUser {
  id: string;
  name: string;
  role: string;
  email: string;
}

interface AssignmentResponse {
  users: ApiUser[];
  assigneeId: string | null;
}

const apiUsers: ApiUser[] = [
  {
    id: 'user-1',
    name: 'Alice',
    role: 'Engineer',
    email: 'alice@example.com',
  },
  {
    id: 'user-2',
    name: 'Bob',
    role: 'Product manager',
    email: 'bob@example.com',
  },
  {
    id: 'user-3',
    name: 'Carol',
    role: 'Designer',
    email: 'carol@example.com',
  },
];

const getUserId = (user: User) => user.id;
const getUserName = (user: User) => user.name;
const getTypeaheadLabel = (user: User) => (user.id === 2 ? 'Zebra' : 'Yak');

const userItems = Combobox.createItems(users, {
  getValue: (user) => user.id,
  getLabel: (user) => user.name,
});

describe('Combobox.createItems', () => {
  const { render } = createRenderer();

  describe('collection', () => {
    it('rejects an items object that is not a collection', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        await expect(render(<Combobox.Root items={{ a: 'A' } as any} />)).rejects.toThrow(
          /not a collection/,
        );
      } finally {
        errorSpy.mockRestore();
      }
    });

    it('passes the data through unchanged when no accessors are given', () => {
      expect(Combobox.createItems(users)).toBe(users);
    });

    it('shares one empty array between accessor-less calls with undefined data', () => {
      expect(Combobox.createItems(undefined)).toBe(Combobox.createItems(undefined));
    });
  });

  describe('no accessors', () => {
    const labeledItems = [
      { value: 'a', label: <b>Apple</b> },
      { value: 'b', label: 'Banana' },
    ];

    it('keeps React node labels resolvable through Combobox.Value', async () => {
      function App() {
        const items = Combobox.createItems(labeledItems);
        return (
          <Combobox.Root items={items} defaultValue={labeledItems[0]}>
            <span data-testid="value">
              <Combobox.Value />
            </span>
          </Combobox.Root>
        );
      }

      await render(<App />);

      expect(screen.getByTestId('value').querySelector('b')).not.toBe(null);
      expect(screen.getByTestId('value')).toHaveTextContent('Apple');
    });

    it("keeps a null item's label overriding the placeholder", async () => {
      const withNullItem = [{ value: null, label: 'None' }, ...labeledItems];

      function App() {
        const items = Combobox.createItems(withNullItem);
        return (
          <Combobox.Root items={items}>
            <span data-testid="value">
              <Combobox.Value placeholder="Pick one" />
            </span>
          </Combobox.Root>
        );
      }

      await render(<App />);

      expect(screen.getByTestId('value')).toHaveTextContent('None');
    });
  });

  describe('integration', () => {
    it('uses the derived value for selection and resolves the label while closed', async () => {
      const onValueChange = vi.fn();

      function App() {
        const items = userItems;
        return (
          <Combobox.Root items={items} defaultOpen onValueChange={onValueChange}>
            <Combobox.Input data-testid="input" />
            <Combobox.List>
              {(user: User) => (
                <Combobox.Item key={user.id} value={user.id}>
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
      expect(screen.getByTestId<HTMLInputElement>('input').value).toBe('Bob');
    });

    // Closes the use case from https://github.com/mui/base-ui/issues/5228
    it('supports rich API-loaded items with primitive ID values end to end', async () => {
      let resolveAssignment = (_response: AssignmentResponse) => {};
      const assignmentRequest = new Promise<AssignmentResponse>((resolve) => {
        resolveAssignment = resolve;
      });
      const api = {
        loadAssignment: vi.fn(() => assignmentRequest),
        saveAssignee: vi.fn(async (_assigneeId: string | null) => {}),
      };

      function App() {
        const [assignment, setAssignment] = React.useState<AssignmentResponse>();

        React.useEffect(() => {
          let cancelled = false;
          void api.loadAssignment().then((response) => {
            if (!cancelled) {
              setAssignment(response);
            }
          });

          return () => {
            cancelled = true;
          };
        }, []);

        const items = React.useMemo(
          () =>
            Combobox.createItems(assignment?.users, {
              getValue: (user) => user.id,
              getLabel: (user) => user.name,
            }),
          [assignment?.users],
        );

        return (
          <Combobox.Root
            items={items}
            value={assignment?.assigneeId ?? null}
            onValueChange={(assigneeId) => {
              setAssignment((current) => (current ? { ...current, assigneeId } : current));
              void api.saveAssignee(assigneeId);
            }}
            defaultOpen
          >
            <Combobox.Input data-testid="input" />
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.List>
                    {(user: ApiUser) => (
                      <Combobox.Item key={user.id} value={user.id}>
                        <strong>{user.name}</strong>
                        <span>{user.role}</span>
                        <span>{user.email}</span>
                      </Combobox.Item>
                    )}
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        );
      }

      const { user } = await render(<App />);
      const input = screen.getByTestId<HTMLInputElement>('input');

      expect(screen.queryByRole('option')).toBe(null);

      await act(async () => {
        resolveAssignment({
          users: apiUsers,
          assigneeId: 'user-2',
        });
      });

      const bob = await screen.findByRole('option', { name: /Bob/ });

      expect(input).toHaveValue('Bob');
      expect(bob).toHaveAttribute('aria-selected', 'true');
      expect(bob).toHaveTextContent('Product manager');
      expect(bob).toHaveTextContent('bob@example.com');

      await user.clear(input);
      await user.type(input, 'car');

      const carol = screen.getByRole('option', { name: /Carol/ });
      expect(screen.queryByRole('option', { name: /Bob/ })).toBe(null);
      expect(carol).toHaveTextContent('Designer');
      expect(carol).toHaveTextContent('carol@example.com');

      await user.click(carol);

      expect(api.saveAssignee).toHaveBeenCalledWith('user-3');
      expect(input).toHaveValue('Carol');
      await waitFor(() => expect(screen.queryByRole('listbox')).toBe(null));

      await user.click(input);

      expect(await screen.findByRole('option', { name: /Carol/ })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });

    it('falls back to the raw selected ID when API results are cleared', async () => {
      function App() {
        const [results, setResults] = React.useState<ApiUser[] | undefined>(apiUsers);
        const [assigneeId, setAssigneeId] = React.useState<string | null>(null);
        const items = React.useMemo(
          () =>
            Combobox.createItems(results, {
              getValue: (user) => user.id,
              getLabel: (user) => user.name,
            }),
          [results],
        );

        return (
          <Combobox.Root
            items={items}
            value={assigneeId}
            onValueChange={(nextAssigneeId) => {
              setAssigneeId(nextAssigneeId);
              setResults(undefined);
            }}
            defaultOpen
          >
            <Combobox.Input />
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.List>
                    {(user: ApiUser) => (
                      <Combobox.Item key={user.id} value={user.id}>
                        {user.name}
                      </Combobox.Item>
                    )}
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        );
      }

      const { user } = await render(<App />);
      const input = screen.getByRole('combobox');

      await user.click(screen.getByRole('option', { name: 'Carol' }));

      expect(input).toHaveValue('user-3');
      await waitFor(() => expect(screen.queryByRole('listbox')).toBe(null));
    });

    it.each(['pointer', 'keyboard'] as const)(
      'projects a null source item with the %s',
      async (interaction) => {
        const sourceItems: Array<User | null> = [null, users[0]];
        const onValueChange = vi.fn();

        function App() {
          const items = Combobox.createItems(sourceItems, {
            getValue: (user) => (user === null ? 'none' : user.id),
            getLabel: (user) => (user === null ? 'None' : user.name),
          });
          return (
            <Combobox.Root items={items} defaultOpen onValueChange={onValueChange}>
              <Combobox.Input />
              <Combobox.List>
                {(user: User | null) => (
                  <Combobox.Item key={user?.id ?? 'none'} value={user === null ? 'none' : user.id}>
                    {user?.name ?? 'None'}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Root>
          );
        }

        const { user } = await render(<App />);
        const input = screen.getByRole('combobox');

        await user.type(input, 'none');
        expect(screen.getByRole('option', { name: 'None' })).not.toBe(null);
        if (interaction === 'pointer') {
          await user.click(screen.getByRole('option', { name: 'None' }));
        } else {
          await user.keyboard('{ArrowDown}{Enter}');
        }

        expect(onValueChange.mock.lastCall?.[0]).toBe('none');
      },
    );

    it('resolves the label of an undefined source item', async () => {
      const sourceItems: Array<User | undefined> = [undefined];
      const items = Combobox.createItems(sourceItems, {
        getValue: (user) => (user === undefined ? 'none' : user.id),
        getLabel: (user) => (user === undefined ? 'None' : user.name),
      });

      await render(
        <Combobox.Root items={items} defaultValue="none">
          <Combobox.Input />
        </Combobox.Root>,
      );

      expect(screen.getByRole('combobox')).toHaveValue('None');
    });

    it('resolves the label of an initially selected value', async () => {
      function App() {
        const items = userItems;
        return (
          <Combobox.Root items={items} defaultValue={3}>
            <Combobox.Input data-testid="input" />
            <Combobox.List>
              {(user: User) => (
                <Combobox.Item key={user.id} value={user.id}>
                  {user.name}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Root>
        );
      }

      await render(<App />);

      expect(screen.getByTestId<HTMLInputElement>('input').value).toBe('Carol');
    });

    it('renders an empty list while the data is undefined and fills in once it loads', async () => {
      function App(props: { data: User[] | undefined }) {
        const items = Combobox.createItems(props.data, {
          getValue: getUserId,
          getLabel: getUserName,
        });
        return (
          <Combobox.Root items={items} defaultOpen>
            <Combobox.Input data-testid="input" />
            <Combobox.List>
              {(user: User) => (
                <Combobox.Item key={user.id} value={user.id}>
                  {user.name}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Root>
        );
      }

      const { setProps } = await render(<App data={undefined} />);

      expect(screen.queryAllByRole('option')).toHaveLength(0);

      await setProps({ data: users });

      expect(screen.getAllByRole('option')).toHaveLength(3);
    });

    it('resolves and degrades the selected label as the data loads and shrinks', async () => {
      function App(props: { data: User[] | undefined }) {
        const items = Combobox.createItems(props.data, {
          getValue: getUserId,
          getLabel: getUserName,
        });
        return (
          <Combobox.Root items={items} defaultValue={3}>
            <Combobox.Input data-testid="input" />
          </Combobox.Root>
        );
      }

      const { setProps } = await render(<App data={undefined} />);

      expect(screen.getByTestId('input')).toHaveValue('3');

      await setProps({ data: users });

      expect(screen.getByTestId('input')).toHaveValue('Carol');

      await setProps({ data: [users[0]] });

      expect(screen.getByTestId('input')).toHaveValue('3');
    });

    it('labels items by their derived value when no label accessor is given', async () => {
      function App() {
        const items = Combobox.createItems(users, { getValue: getUserId });
        return (
          <Combobox.Root items={items} defaultOpen>
            <Combobox.Input data-testid="input" />
            <Combobox.List>
              {(user: User) => (
                <Combobox.Item key={user.id} value={user.id}>
                  {user.name}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Root>
        );
      }

      const { user } = await render(<App />);
      const input = screen.getByTestId('input');

      await user.type(input, '2');

      expect(screen.queryByRole('option', { name: 'Alice' })).toBe(null);
      expect(screen.getByRole('option', { name: 'Bob' })).not.toBe(null);

      await user.click(screen.getByRole('option', { name: 'Bob' }));

      expect(input).toHaveValue('2');
    });

    it('warns when an item value is a source item rather than a derived value', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      function App() {
        const items = userItems;
        return (
          <Combobox.Root items={items} defaultOpen>
            <Combobox.Input />
            <Combobox.List>
              {(user: User) => (
                <Combobox.Item key={user.id} value={user}>
                  {user.name}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Root>
        );
      }

      await render(<App />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            'Base UI: The `value` prop of <Combobox.Item> did not match any value derived by the `items` collection',
          ),
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('does not warn when item values are derived values', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      function App() {
        const items = userItems;
        return (
          <Combobox.Root items={items} defaultOpen>
            <Combobox.Input />
            <Combobox.List>
              {(user: User) => (
                <Combobox.Item key={user.id} value={user.id}>
                  {user.name}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Root>
        );
      }

      await render(<App />);

      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('highlights an initially selected derived value when opened', async () => {
      function App() {
        const items = userItems;
        return (
          <Combobox.Root items={items} defaultValue={3}>
            <Combobox.Input data-testid="input" />
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.List>
                    {(user: User) => (
                      <Combobox.Item key={user.id} value={user.id}>
                        {user.name}
                      </Combobox.Item>
                    )}
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
        const items = userItems;
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
        const items = userItems;
        return (
          <Combobox.Root items={items} defaultOpen>
            <Combobox.Input data-testid="input" />
            <Combobox.List>
              {(user: User) => (
                <Combobox.Item key={user.id} value={user.id}>
                  {user.name}
                </Combobox.Item>
              )}
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
        const items = userItems;
        return (
          <Combobox.Root items={items} itemToStringLabel={(id: number) => `User ${id}`} defaultOpen>
            <Combobox.Input data-testid="input" />
            <Combobox.List>
              {(user: User) => (
                <Combobox.Item key={user.id} value={user.id}>
                  {user.name}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Root>
        );
      }

      const { user } = await render(<App />);

      await user.type(screen.getByTestId('input'), 'user 2');

      expect(screen.queryByRole('option', { name: 'Alice' })).toBe(null);
      expect(screen.getByRole('option', { name: 'Bob' })).not.toBe(null);
    });

    it('replaces the collection label accessor entirely when itemToStringLabel is provided', async () => {
      // The prop is not a fallback for values the collection cannot resolve: it takes over
      // labeling for in-collection values too, so an external cache must label every value.
      const labelCache = new Map([[99, 'Archived user']]);

      function App() {
        const items = userItems;
        return (
          <Combobox.Root
            items={items}
            defaultValue={2}
            itemToStringLabel={(id: number) => labelCache.get(id) ?? `User ${id}`}
          >
            <Combobox.Input data-testid="input" />
            <span data-testid="value">
              <Combobox.Value />
            </span>
          </Combobox.Root>
        );
      }

      await render(<App />);

      expect(screen.getByTestId('input')).toHaveValue('User 2');
      expect(screen.getByTestId('value')).toHaveTextContent('User 2');
    });

    it('uses the root locale for filtering', async () => {
      const cities = ['Isparta', 'İzmir'];

      function App() {
        const items = Combobox.createItems(cities);
        return (
          <Combobox.Root items={items} locale="tr" defaultOpen>
            <Combobox.Input data-testid="input" />
            <Combobox.List>
              {(city: string) => (
                <Combobox.Item key={city} value={city}>
                  {city}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Root>
        );
      }

      const { user } = await render(<App />);

      await user.type(screen.getByTestId('input'), 'i');

      expect(screen.queryByRole('option', { name: 'Isparta' })).toBe(null);
      expect(screen.getByRole('option', { name: 'İzmir' })).not.toBe(null);
    });

    it('updates selected labels when the getLabel accessor changes', async () => {
      const getEnglishName = (user: User) => user.name;
      const getSpanishName = (user: User) => (user.id === 1 ? 'Alicia' : user.name);

      function App(props: { getLabel: (user: User) => string }) {
        const items = Combobox.createItems(users, {
          getValue: getUserId,
          getLabel: props.getLabel,
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

    it('resolves a label-only collection value using the root equality comparer', async () => {
      const selectedUser = { id: 2, name: 'Stale Bob' };

      function App() {
        const items = Combobox.createItems(users, {
          getLabel: getUserName,
        });
        return (
          <Combobox.Root
            items={items}
            defaultValue={selectedUser}
            isItemEqualToValue={(item, value) => item.id === value.id}
          >
            <Combobox.Input data-testid="input" />
          </Combobox.Root>
        );
      }

      await render(<App />);

      expect(screen.getByTestId('input')).toHaveValue('Bob');
    });

    it('resolves a derived value label using the root equality comparer', async () => {
      function App() {
        const items = Combobox.createItems(users, {
          getValue: (user) => user.name.toLowerCase(),
          getLabel: getUserName,
        });
        return (
          <Combobox.Root
            items={items}
            defaultValue="BOB"
            isItemEqualToValue={(item, value) => item.toLowerCase() === value.toLowerCase()}
          >
            <Combobox.Input data-testid="input" />
          </Combobox.Root>
        );
      }

      await render(<App />);

      expect(screen.getByTestId('input')).toHaveValue('Bob');
    });

    it('passes source items to a custom root filter', async () => {
      const filter = vi.fn((user: User) => user.id === 2);

      function App() {
        const items = userItems;
        return (
          <Combobox.Root items={items} filter={filter} defaultOpen>
            <Combobox.Input data-testid="input" />
            <Combobox.List>
              {(user: User) => (
                <Combobox.Item key={user.id} value={user.id}>
                  {user.name}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Root>
        );
      }

      const { user } = await render(<App />);

      await user.type(screen.getByTestId('input'), 'x');

      expect(screen.queryByRole('option', { name: 'Alice' })).toBe(null);
      expect(screen.getByRole('option', { name: 'Bob' })).not.toBe(null);
      expect(filter.mock.calls.every(([item]) => users.includes(item))).toBe(true);
      expect(new Set(filter.mock.calls.map(([item]) => item.id))).toEqual(new Set([1, 2, 3]));
    });

    it('lets a custom root filter match source fields that are neither the value nor the label', async () => {
      interface Contact {
        id: number;
        name: string;
        email: string;
      }

      const contacts: Contact[] = [
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@other.com' },
      ];

      function App() {
        const items = Combobox.createItems(contacts, {
          getValue: (contact) => contact.id,
          getLabel: (contact) => contact.name,
        });
        return (
          <Combobox.Root
            items={items}
            filter={(contact, query) => contact.email.includes(query)}
            defaultOpen
          >
            <Combobox.Input data-testid="input" />
            <Combobox.List>
              {(contact: Contact) => (
                <Combobox.Item key={contact.id} value={contact.id}>
                  {contact.name}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Root>
        );
      }

      const { user } = await render(<App />);

      await user.type(screen.getByTestId('input'), 'other.com');

      expect(screen.queryByRole('option', { name: 'Alice' })).toBe(null);
      expect(screen.getByRole('option', { name: 'Bob' })).not.toBe(null);
    });

    it('labels a selected value that is not in the collection as itself', async () => {
      function App() {
        const items = Combobox.createItems(users, {
          getValue: getUserId,
          getLabel: (user) => user.name.toUpperCase(),
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

    it('uses the default label fallback outside the collection', async () => {
      function App() {
        const items = Combobox.createItems<User, number | string>(users, {
          getValue: getUserId,
          getLabel: getUserName,
        });
        return (
          <Combobox.Root items={items} defaultValue="New tag">
            <Combobox.Input data-testid="input" />
          </Combobox.Root>
        );
      }

      await render(<App />);

      expect(screen.getByTestId<HTMLInputElement>('input').value).toBe('New tag');
    });

    it('uses derived labels for closed trigger typeahead', async () => {
      function App() {
        const items = Combobox.createItems(users, {
          getValue: getUserId,
          getLabel: getTypeaheadLabel,
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
                    {(user: User) => (
                      <Combobox.Item key={user.id} value={user.id}>
                        {user.name}
                      </Combobox.Item>
                    )}
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
        const items = userItems;
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
        const items = Combobox.createItems(sourceItems, {
          getValue: (item) => item.id,
          getLabel: (item) => item.label,
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
        const items = userItems;
        return <Combobox.Root items={items} multiple name="users" defaultValue={[1, 2]} />;
      }

      await render(<App />);

      expect(screen.getByDisplayValue('1')).toHaveAttribute('name', 'users');
      expect(screen.getByDisplayValue('2')).toHaveAttribute('name', 'users');
    });

    it('serializes a derived value in single mode', async () => {
      function App() {
        const items = userItems;
        return <Combobox.Root items={items} name="user" defaultValue={2} />;
      }

      await render(<App />);

      expect(screen.getByDisplayValue('2')).toHaveAttribute('name', 'user');
    });

    it('serializes the derived value with itemToStringValue', async () => {
      function App() {
        const items = userItems;
        return (
          <Combobox.Root
            items={items}
            name="user"
            defaultValue={2}
            itemToStringValue={(id) => `user-${id}`}
          />
        );
      }

      await render(<App />);

      expect(screen.getByDisplayValue('user-2')).toHaveAttribute('name', 'user');
    });

    it('passes the derived value to the Combobox.Value render prop', async () => {
      const renderValue = vi.fn((itemValue: number | null) => String(itemValue));

      function App() {
        const items = userItems;
        return (
          <Combobox.Root items={items} defaultValue={2}>
            <span data-testid="value">
              <Combobox.Value>{renderValue}</Combobox.Value>
            </span>
          </Combobox.Root>
        );
      }

      await render(<App />);

      expect(renderValue).toHaveBeenCalledWith(2);
      expect(screen.getByTestId('value')).toHaveTextContent('2');
    });

    it('renders every selected label via Combobox.Value in multiple mode', async () => {
      function App() {
        const items = userItems;
        return (
          <Combobox.Root items={items} multiple defaultValue={[1, 2]}>
            <span data-testid="value">
              <Combobox.Value />
            </span>
          </Combobox.Root>
        );
      }

      await render(<App />);

      expect(screen.getByTestId('value')).toHaveTextContent('Alice, Bob');
    });

    it('projects externally filtered source items into the derived value domain', async () => {
      const onValueChange = vi.fn();

      function App() {
        const items = userItems;
        return (
          <Combobox.Root
            items={items}
            filteredItems={[users[2]]}
            defaultOpen
            onValueChange={onValueChange}
          >
            <Combobox.Input data-testid="input" />
            <Combobox.List>
              {(user: User) => (
                <Combobox.Item key={user.id} value={user.id}>
                  {user.name}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Root>
        );
      }

      const { user } = await render(<App />);

      expect(screen.getAllByRole('option')).toHaveLength(1);

      await user.click(screen.getByRole('option', { name: 'Carol' }));

      expect(onValueChange.mock.lastCall?.[0]).toBe(3);
    });

    it('opens a reordered external list at the selected value in rendered-list coordinates', async () => {
      const onItemHighlighted = vi.fn();

      function App() {
        const items = userItems;
        return (
          <Combobox.Root
            items={items}
            filteredItems={[users[2], users[0]]}
            multiple
            defaultValue={[1]}
            onItemHighlighted={onItemHighlighted}
          >
            <Combobox.Input />
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.List>
                    {(user: User) => (
                      <Combobox.Item key={user.id} value={user.id}>
                        {user.name}
                      </Combobox.Item>
                    )}
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        );
      }

      const { user } = await render(<App />);

      await user.click(screen.getByRole('combobox'));

      const alice = await screen.findByRole('option', { name: 'Alice' });
      const carol = screen.getByRole('option', { name: 'Carol' });
      await waitFor(() => expect(alice).toHaveAttribute('data-highlighted'));
      expect(carol).not.toHaveAttribute('data-highlighted');
      expect(onItemHighlighted.mock.lastCall?.[0]).toBe(1);
    });

    it('projects externally filtered groups when the source collection is flat', async () => {
      const onValueChange = vi.fn();
      const filteredGroups = [{ value: 'Result', items: [users[2], users[0]] }];

      function App() {
        const items = Combobox.createItems(users, {
          getValue: (user) => user.id.toString(),
          getLabel: (user) => user.name,
        });
        return (
          <Combobox.Root
            items={items}
            filteredItems={filteredGroups}
            defaultValue="3"
            onValueChange={onValueChange}
          >
            <Combobox.Input />
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.List>
                    {(group: (typeof filteredGroups)[number], index: number) => (
                      <Combobox.Group key={index} items={group.items}>
                        <Combobox.GroupLabel>{group.value}</Combobox.GroupLabel>
                        <Combobox.Collection>
                          {(user: User) => (
                            <Combobox.Item key={user.id} value={user.id.toString()}>
                              {user.name}
                            </Combobox.Item>
                          )}
                        </Combobox.Collection>
                      </Combobox.Group>
                    )}
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        );
      }

      const { user } = await render(<App />);
      const input = screen.getByRole<HTMLInputElement>('combobox');

      expect(input).toHaveValue('Carol');
      await user.click(input);

      expect(await screen.findAllByRole('option')).toHaveLength(2);
      expect(screen.getByRole('option', { name: 'Carol' })).toHaveAttribute(
        'aria-selected',
        'true',
      );

      await user.click(screen.getByRole('option', { name: 'Alice' }));

      expect(onValueChange.mock.lastCall?.[0]).toBe('1');
      expect(input).toHaveValue('Alice');
      await waitFor(() => expect(screen.queryByRole('listbox')).toBe(null));

      await user.click(input);

      expect(await screen.findAllByRole('option')).toHaveLength(2);
      expect(screen.getByRole('option', { name: 'Alice' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });

    it('resolves virtualized collection items to their derived value', async () => {
      const onValueChange = vi.fn();

      function App() {
        const items = userItems;
        return (
          <Combobox.Root items={items} virtualized defaultOpen onValueChange={onValueChange}>
            <Combobox.Input data-testid="input" />
            <Combobox.List>
              {(user: User) => (
                <Combobox.Item key={user.id} value={user.id}>
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

    it('resolves a falsy derived value as a selection rather than as no selection', async () => {
      const zeroUsers = [
        { id: 0, name: 'Zero' },
        { id: 1, name: 'One' },
      ];

      function App() {
        const items = Combobox.createItems(zeroUsers, {
          getValue: getUserId,
          getLabel: getUserName,
        });
        return (
          <Combobox.Root items={items} defaultValue={0} defaultOpen>
            <Combobox.Input data-testid="input" />
            <span data-testid="value">
              <Combobox.Value placeholder="Pick one" />
            </span>
            <Combobox.List>
              {(user: User) => (
                <Combobox.Item key={user.id} value={user.id}>
                  {user.name}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Root>
        );
      }

      await render(<App />);

      expect(screen.getByTestId<HTMLInputElement>('input').value).toBe('Zero');
      expect(screen.getByTestId('value')).toHaveTextContent('Zero');
      expect(screen.getByRole('option', { name: 'Zero' })).toHaveAttribute('aria-selected', 'true');
    });

    it('resolves a duplicated derived value to the same label regardless of lookup order', async () => {
      const duplicated = [
        { id: 1, name: 'First' },
        { id: 2, name: 'Bob' },
        { id: 1, name: 'Clone' },
      ];

      function App(props: { value: number }) {
        const items = Combobox.createItems(duplicated, {
          getValue: getUserId,
          getLabel: getUserName,
        });
        return (
          <Combobox.Root items={items} value={props.value}>
            <Combobox.Input data-testid="input" />
          </Combobox.Root>
        );
      }

      // Resolving an absent value first exercises the fallback path, which must not change what
      // the duplicated value resolves to: the first occurrence always wins.
      const { setProps } = await render(<App value={99} />);
      await setProps({ value: 1 });

      expect(screen.getByTestId<HTMLInputElement>('input').value).toBe('First');
    });

    it('selects the derived value with the keyboard', async () => {
      const onValueChange = vi.fn();

      function App() {
        const items = userItems;
        return (
          <Combobox.Root items={items} onValueChange={onValueChange}>
            <Combobox.Input data-testid="input" />
            <Combobox.List>
              {(user: User) => (
                <Combobox.Item key={user.id} value={user.id}>
                  {user.name}
                </Combobox.Item>
              )}
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

    it('resolves externally virtualized item indexes and callbacks in the derived value domain', async () => {
      const onValueChange = vi.fn();
      const onItemHighlighted = vi.fn();

      function VirtualizedItems() {
        const filteredItems = Combobox.useFilteredItems<User>();
        return filteredItems.slice(0, 1).map((user) => (
          <Combobox.Item key={user.id} value={user.id}>
            {user.name}
          </Combobox.Item>
        ));
      }

      function App() {
        const items = userItems;
        return (
          <Combobox.Root
            items={items}
            virtualized
            defaultOpen
            onValueChange={onValueChange}
            onItemHighlighted={onItemHighlighted}
          >
            <Combobox.Input data-testid="input" />
            <Combobox.List>
              <VirtualizedItems />
            </Combobox.List>
          </Combobox.Root>
        );
      }

      const { user } = await render(<App />);

      await user.type(screen.getByTestId('input'), 'bo');
      await user.keyboard('{ArrowDown}');

      expect(onItemHighlighted.mock.lastCall?.[0]).toBe(2);

      await user.keyboard('{Enter}');

      expect(onValueChange.mock.lastCall?.[0]).toBe(2);
    });

    it('uses explicit item values in the derived value domain', async () => {
      const onValueChange = vi.fn();

      function App() {
        const items = userItems;
        return (
          <Combobox.Root items={items} defaultOpen onValueChange={onValueChange}>
            <Combobox.Input />
            <Combobox.List>
              {users.map((user) => (
                <Combobox.Item key={user.id} value={user.id}>
                  {user.name}
                </Combobox.Item>
              ))}
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
      const filter = vi.fn((user: User) => user.id >= 0);

      function App() {
        const items = Combobox.createItems(manyUsers, {
          getValue: getUserId,
          getLabel: getUserName,
        });
        return (
          <Combobox.Root items={items} filter={filter} limit={2} defaultOpen>
            <Combobox.Input data-testid="input" />
            <Combobox.List>
              {(user: User) => (
                <Combobox.Item key={user.id} value={user.id}>
                  {user.name}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Root>
        );
      }

      const { user } = await render(<App />);
      filter.mockClear();

      await user.type(screen.getByTestId('input'), 'a');

      expect(screen.getAllByRole('option')).toHaveLength(2);
      expect(new Set(filter.mock.calls.map(([item]) => item.id))).toEqual(new Set([0, 1]));
    });
  });

  describe('lazy normalization', () => {
    it('does not call the accessors when creating a flat collection', () => {
      const getValue = vi.fn(getUserId);
      const getLabel = vi.fn(getUserName);

      Combobox.createItems(users, { getValue, getLabel });

      expect(getValue).not.toHaveBeenCalled();
      expect(getLabel).not.toHaveBeenCalled();
    });

    it('does not call the accessors when creating a grouped collection', () => {
      const getValue = vi.fn(getUserId);
      const getLabel = vi.fn(getUserName);

      const groups = [{ value: 'Team', items: users }];
      Combobox.createItems(groups, { getValue, getLabel });

      expect(getValue).not.toHaveBeenCalled();
      expect(getLabel).not.toHaveBeenCalled();
    });

    it('derives each value at most once across renders', async () => {
      const getValue = vi.fn(getUserId);
      const getLabel = vi.fn(getUserName);
      const collection = Combobox.createItems(users, { getValue, getLabel });

      function App() {
        return (
          <Combobox.Root items={collection} defaultValue={3} defaultOpen>
            <Combobox.Input data-testid="input" />
            <Combobox.List>
              {(user: User) => (
                <Combobox.Item key={user.id} value={user.id}>
                  {user.name}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Root>
        );
      }

      const { user } = await render(<App />);

      expect(screen.getByTestId('input')).toHaveValue('Carol');
      expect(getValue.mock.calls.length).toBeLessThanOrEqual(users.length);

      await user.clear(screen.getByTestId('input'));
      await user.type(screen.getByTestId('input'), 'car');

      expect(screen.getByRole('option', { name: 'Carol' })).not.toBe(null);
      expect(screen.queryByRole('option', { name: 'Alice' })).toBe(null);
      expect(getValue.mock.calls.length).toBeLessThanOrEqual(users.length);
    });

    it('resolves labels only for the values that need them', async () => {
      const getValue = vi.fn(getUserId);
      const getLabel = vi.fn(getUserName);
      const collection = Combobox.createItems(users, { getValue, getLabel });

      function App() {
        return (
          <Combobox.Root items={collection} defaultValue={3}>
            <Combobox.Input data-testid="input" />
          </Combobox.Root>
        );
      }

      await render(<App />);

      expect(screen.getByTestId('input')).toHaveValue('Carol');
      expect(new Set(getLabel.mock.calls.map(([item]) => item))).toEqual(new Set([users[2]]));
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

    function GroupedApp(props: Partial<Combobox.Root.Props<number, false, User>>) {
      const items = Combobox.createItems(teams, {
        getValue: getUserId,
        getLabel: getUserName,
      });
      return (
        <Combobox.Root items={items} {...props}>
          <Combobox.Input data-testid="input" />
          <Combobox.List>
            {(group: Team) => (
              <Combobox.Group key={group.value} items={group.items}>
                <Combobox.GroupLabel>{group.value}</Combobox.GroupLabel>
                <Combobox.Collection>
                  {(user: User) => (
                    <Combobox.Item key={user.id} value={user.id}>
                      {user.name}
                    </Combobox.Item>
                  )}
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

    it('passes leaf source items to a custom root filter', async () => {
      const filter = vi.fn((user: User) => user.id === 3);

      const { user } = await render(<GroupedApp defaultOpen filter={filter} />);

      await user.type(screen.getByTestId('input'), 'x');

      expect(screen.queryByRole('option', { name: 'Alice' })).toBe(null);
      expect(screen.getByRole('option', { name: 'Carol' })).not.toBe(null);
      expect(filter.mock.calls.every(([item]) => 'name' in item)).toBe(true);
      expect(new Set(filter.mock.calls.map(([item]) => item.id))).toEqual(new Set([1, 2, 3]));
    });

    it('applies the limit across groups and drops the emptied ones', async () => {
      await render(<GroupedApp defaultOpen limit={1} />);

      expect(screen.getAllByRole('option')).toHaveLength(1);
      expect(screen.getByText('Engineering')).not.toBe(null);
      expect(screen.queryByText('Design')).toBe(null);
    });

    it('projects externally filtered grouped source items into the derived value domain', async () => {
      const onValueChange = vi.fn();

      const { user } = await render(
        <GroupedApp
          defaultOpen
          filteredItems={[{ value: 'Design', items: [users[2]] }]}
          onValueChange={onValueChange}
        />,
      );

      expect(screen.getAllByRole('option')).toHaveLength(1);

      await user.click(screen.getByRole('option', { name: 'Carol' }));

      expect(onValueChange.mock.lastCall?.[0]).toBe(3);
    });

    it('projects externally filtered flat items when the source collection is grouped', async () => {
      const onValueChange = vi.fn();
      const filteredUsers = [users[2], users[0]];

      function App() {
        const items = Combobox.createItems(teams, {
          getValue: getUserId,
          getLabel: getUserName,
        });
        return (
          <Combobox.Root
            items={items}
            filteredItems={filteredUsers}
            defaultValue={3}
            onValueChange={onValueChange}
          >
            <Combobox.Input />
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.List>
                    {(user: User) => (
                      <Combobox.Item key={user.id} value={user.id}>
                        {user.name}
                      </Combobox.Item>
                    )}
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        );
      }

      const { user } = await render(<App />);
      const input = screen.getByRole<HTMLInputElement>('combobox');

      expect(input).toHaveValue('Carol');
      await user.click(input);

      expect(await screen.findAllByRole('option')).toHaveLength(2);
      expect(screen.getByRole('option', { name: 'Carol' })).toHaveAttribute(
        'aria-selected',
        'true',
      );

      await user.click(screen.getByRole('option', { name: 'Alice' }));

      expect(onValueChange.mock.lastCall?.[0]).toBe(1);
      expect(input).toHaveValue('Alice');
      await waitFor(() => expect(screen.queryByRole('listbox')).toBe(null));

      await user.click(input);

      expect(await screen.findAllByRole('option')).toHaveLength(2);
      expect(screen.getByRole('option', { name: 'Alice' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });

    it('only applies accessors to group items', async () => {
      const getValue = vi.fn((user: User) => user.id);
      const getLabel = vi.fn((user: User) => user.name);

      function App() {
        const items = Combobox.createItems(teams, {
          getValue,
          getLabel,
        });
        return (
          <Combobox.Root items={items} defaultOpen>
            <Combobox.Input />
            <Combobox.List>
              {(group: Team) => (
                <Combobox.Group key={group.value} items={group.items}>
                  <Combobox.Collection>
                    {(user: User) => (
                      <Combobox.Item key={user.id} value={user.id}>
                        {user.name}
                      </Combobox.Item>
                    )}
                  </Combobox.Collection>
                </Combobox.Group>
              )}
            </Combobox.List>
          </Combobox.Root>
        );
      }

      const { user } = await render(<App />);

      // Filtering and resolving a selection force both accessors over the collection's leaves.
      await user.type(screen.getByRole('combobox'), 'a');
      await user.click(screen.getByRole('option', { name: 'Carol' }));

      expect(new Set(getValue.mock.calls.map(([item]) => item.id))).toEqual(new Set([1, 2, 3]));
      expect(new Set(getLabel.mock.calls.map(([item]) => item.name))).toEqual(
        new Set(['Alice', 'Bob', 'Carol']),
      );
    });
  });
});
