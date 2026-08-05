import { expect, vi } from 'vitest';
import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { createRenderer } from '#test-utils';
import { act, fireEvent, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';

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

    it('treats undefined data as the absence of items rather than as an empty list', async () => {
      expect(Combobox.createItems(undefined)).toBe(undefined);

      const pendingItems = Combobox.createItems(undefined as User[] | undefined, {
        getValue: getUserId,
        getLabel: getUserName,
      });

      // Externally supplied results are rendered rather than filtered away by an items prop that
      // holds nothing.
      await render(
        <Combobox.Root items={pendingItems} filteredItems={users} defaultValue={2} defaultOpen>
          <Combobox.Input />
          <Combobox.List>
            {(user: User) => (
              <Combobox.Item key={user.id} value={user.id}>
                {user.name}
              </Combobox.Item>
            )}
          </Combobox.List>
        </Combobox.Root>,
      );

      expect(screen.getAllByRole('option')).toHaveLength(users.length);
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

    // Covers the paginated async-search use case from
    // https://github.com/mui/base-ui/issues/3818.
    it('keeps separately fetched selected metadata outside paginated search results', async () => {
      interface Employee {
        id: string;
        name: string;
        department: string;
      }

      const selectedEmployee: Employee = {
        id: 'employee-100000',
        name: 'Grace Hopper',
        department: 'Platform',
      };
      const firstPage: Employee[] = [
        { id: 'employee-1', name: 'Ada Lovelace', department: 'Research' },
        { id: 'employee-2', name: 'Alan Turing', department: 'Security' },
      ];
      const pageContainingSelection: Employee[] = [
        // A search endpoint can return a different object for the same selected ID.
        { id: 'employee-100000', name: 'Grace Hopper', department: 'Platform' },
        { id: 'employee-3', name: 'Margaret Hamilton', department: 'Flight software' },
      ];
      const onValueChange = vi.fn();

      function App(props: { searchResults: Employee[] }) {
        const knownEmployees = React.useMemo(
          () => [
            selectedEmployee,
            ...props.searchResults.filter((employee) => employee.id !== selectedEmployee.id),
          ],
          [props.searchResults],
        );
        const items = React.useMemo(
          () =>
            Combobox.createItems(knownEmployees, {
              getValue: (employee) => employee.id,
              getLabel: (employee) => employee.name,
            }),
          [knownEmployees],
        );

        return (
          <Combobox.Root
            items={items}
            filteredItems={props.searchResults}
            value={selectedEmployee.id}
            onValueChange={onValueChange}
            defaultOpen
          >
            <Combobox.Input />
            <span data-testid="selected-value">
              <Combobox.Value />
            </span>
            <Combobox.List>
              {(employee: Employee) => (
                <Combobox.Item key={employee.id} value={employee.id}>
                  <strong>{employee.name}</strong>
                  <span>{employee.department}</span>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Root>
        );
      }

      const { setProps, user } = await render(<App searchResults={firstPage} />);
      const input = screen.getByRole('combobox');

      expect(input).toHaveValue('Grace Hopper');

      await user.click(input);
      await user.keyboard('{Control>}a{/Control}a');

      expect(screen.queryByRole('option', { name: /Grace Hopper/ })).toBe(null);
      expect(screen.getAllByRole('option')).toHaveLength(2);
      onValueChange.mockClear();

      await setProps({ searchResults: pageContainingSelection });

      const visibleSelection = screen.getAllByRole('option', { name: /Grace Hopper/ });
      expect(visibleSelection).toHaveLength(1);
      expect(visibleSelection[0]).toHaveAttribute('aria-selected', 'true');

      await setProps({ searchResults: firstPage });

      expect(screen.queryByRole('option', { name: /Grace Hopper/ })).toBe(null);
      expect(onValueChange).not.toHaveBeenCalled();
      expect(screen.getByTestId('selected-value')).toHaveTextContent('Grace Hopper');
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

    it('keeps nullish entries out of the accessors and out of filtered results', async () => {
      // A hole in otherwise well-typed data, which is how it reaches a collection in practice.
      const sourceItems = [null, users[0]] as unknown as User[];
      const getValue = vi.fn((user: User) => user.id);

      function App() {
        const items = Combobox.createItems(sourceItems, {
          getValue,
          getLabel: getUserName,
        });
        return (
          <Combobox.Root items={items} defaultOpen>
            <Combobox.Input data-testid="input" />
            <Combobox.List>
              {(user: User | null) =>
                user && (
                  <Combobox.Item key={user.id} value={user.id}>
                    {user.name}
                  </Combobox.Item>
                )
              }
            </Combobox.List>
          </Combobox.Root>
        );
      }

      const { user } = await render(<App />);

      // A hole reaches the render callback while there is no query, exactly as it does for a
      // plain `items` array, but it is dropped as soon as filtering runs.
      await user.type(screen.getByTestId('input'), 'a');

      expect(screen.getAllByRole('option')).toHaveLength(1);
      expect(screen.getByRole('option', { name: 'Alice' })).not.toBe(null);
      expect(getValue.mock.calls.every(([item]) => item != null)).toBe(true);
    });

    it('renders a sentinel item for the empty selection like any other item', async () => {
      const withSentinel = [{ id: 'none', name: 'None' }, ...apiUsers];
      const items = Combobox.createItems(withSentinel, {
        getValue: (item) => item.id,
        getLabel: (item) => item.name,
      });

      await render(
        <Combobox.Root items={items} defaultValue="none">
          <Combobox.Input data-testid="input" />
        </Combobox.Root>,
      );

      expect(screen.getByTestId('input')).toHaveValue('None');
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

      try {
        await render(<App />);

        await waitFor(() => {
          expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining(
              'Base UI: The `value` prop of <Combobox.Item> is a source item of the `items` collection',
            ),
          );
        });
      } finally {
        consoleErrorSpy.mockRestore();
      }
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

      try {
        await render(<App />);

        expect(consoleErrorSpy).not.toHaveBeenCalled();
      } finally {
        consoleErrorSpy.mockRestore();
      }
    });

    it('does not warn when the data is replaced with a disjoint set of values', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      function App(props: { data: User[] }) {
        const items = React.useMemo(
          () => Combobox.createItems(props.data, { getValue: getUserId, getLabel: getUserName }),
          [props.data],
        );
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

      try {
        const { setProps } = await render(<App data={[users[0]]} />);

        await setProps({ data: [{ id: 7, name: 'Grace' }] });

        expect(consoleErrorSpy).not.toHaveBeenCalled();
      } finally {
        consoleErrorSpy.mockRestore();
      }
    });

    it('does not warn for a value that is not part of the collection', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      function App() {
        const items = userItems;
        return (
          <Combobox.Root items={items} defaultOpen>
            <Combobox.Input />
            <Combobox.List>
              <Combobox.Item value="create-new">Create new user</Combobox.Item>
            </Combobox.List>
          </Combobox.Root>
        );
      }

      try {
        await render(<App />);

        expect(consoleErrorSpy).not.toHaveBeenCalled();
      } finally {
        consoleErrorSpy.mockRestore();
      }
    });

    it('does not warn for an item without a value, or before the data has loaded', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const pendingItems = Combobox.createItems(undefined as User[] | undefined, {
        getValue: getUserId,
        getLabel: getUserName,
      });

      function App() {
        return (
          <Combobox.Root items={pendingItems} defaultOpen>
            <Combobox.Input />
            <Combobox.List>
              <Combobox.Item>All users</Combobox.Item>
              <Combobox.Item value={1}>Alice</Combobox.Item>
            </Combobox.List>
          </Combobox.Root>
        );
      }

      try {
        await render(<App />);

        expect(consoleErrorSpy).not.toHaveBeenCalled();
      } finally {
        consoleErrorSpy.mockRestore();
      }
    });

    it('does not warn when a custom comparer matches the derived value', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      function App() {
        const items = userItems;
        return (
          <Combobox.Root items={items} isItemEqualToValue={(a, b) => String(a) === String(b)}>
            <Combobox.Input />
            <Combobox.List>
              {(user: User) => (
                <Combobox.Item key={user.id} value={String(user.id)}>
                  {user.name}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Root>
        );
      }

      try {
        await render(<App />);

        expect(consoleErrorSpy).not.toHaveBeenCalled();
      } finally {
        consoleErrorSpy.mockRestore();
      }
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

    it('keeps filtering on the collection label when itemToStringLabel is provided', async () => {
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

      await user.type(screen.getByTestId('input'), 'bo');

      expect(screen.queryByRole('option', { name: 'Alice' })).toBe(null);
      expect(screen.getByRole('option', { name: 'Bob' })).not.toBe(null);
    });

    it('falls back to itemToStringLabel only for values the collection cannot resolve', async () => {
      // The prop covers what the data is missing; items the collection owns keep their `getLabel`
      // result, so a cache only has to know about the values that left the data.
      const labelCache = new Map([[99, 'Archived user']]);

      function App(props: { value: number }) {
        const items = userItems;
        return (
          <Combobox.Root
            items={items}
            value={props.value}
            itemToStringLabel={(id: number) => labelCache.get(id) ?? `User ${id}`}
          >
            <Combobox.Input data-testid="input" />
            <span data-testid="value">
              <Combobox.Value />
            </span>
          </Combobox.Root>
        );
      }

      const { setProps } = await render(<App value={2} />);

      expect(screen.getByTestId('input')).toHaveValue('Bob');
      expect(screen.getByTestId('value')).toHaveTextContent('Bob');

      await setProps({ value: 99 });

      expect(screen.getByTestId('input')).toHaveValue('Archived user');
      expect(screen.getByTestId('value')).toHaveTextContent('Archived user');
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

    it('labels a stale identity value from the value itself', async () => {
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
            defaultOpen
          >
            <Combobox.Input data-testid="input" />
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

      // The comparer still selects the matching item; the label of an instance the collection
      // does not hold comes from that instance, as it does for a plain `items` array.
      expect(screen.getByRole('option', { name: 'Bob' })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByTestId('input')).toHaveValue('Stale Bob');
    });

    it('selects the source item of a label-only collection', async () => {
      const onValueChange = vi.fn();
      const labelOnlyItems = Combobox.createItems(users, { getLabel: getUserName });

      function App() {
        return (
          <Combobox.Root items={labelOnlyItems} onValueChange={onValueChange} defaultOpen>
            <Combobox.Input data-testid="input" />
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

      const { user } = await render(<App />);

      await user.click(screen.getByRole('option', { name: 'Bob' }));

      expect(onValueChange.mock.lastCall?.[0]).toBe(users[1]);
      expect(screen.getByTestId('input')).toHaveValue('Bob');
    });

    it('labels an identity value outside the current data window from the value itself', async () => {
      const selectedUser = { id: 42, name: 'Archived user' };

      function App() {
        const items = Combobox.createItems(users.slice(0, 1), {
          getLabel: getUserName,
        });
        return (
          <Combobox.Root items={items} value={selectedUser}>
            <Combobox.Input data-testid="input" />
          </Combobox.Root>
        );
      }

      await render(<App />);

      expect(screen.getByTestId('input')).toHaveValue('Archived user');
    });

    it('selects a value that only a custom comparer matches, labeling it from the value', async () => {
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
            defaultOpen
          >
            <Combobox.Input data-testid="input" />
            <Combobox.List>
              {(user: User) => (
                <Combobox.Item key={user.id} value={user.name.toLowerCase()}>
                  {user.name}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Root>
        );
      }

      await render(<App />);

      // The comparer drives selection, while the label of a value the collection does not hold
      // comes from the value itself, the same way a plain `items` array labels it.
      expect(screen.getByRole('option', { name: 'Bob' })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByTestId('input')).toHaveValue('BOB');
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

    it('toggles derived values in multiple mode', async () => {
      const onValueChange = vi.fn();

      function App() {
        const items = userItems;
        return (
          <Combobox.Root items={items} multiple onValueChange={onValueChange} defaultOpen>
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

      const { user } = await render(<App />);

      await user.click(screen.getByRole('option', { name: 'Bob' }));

      expect(onValueChange.mock.lastCall?.[0]).toEqual([2]);
      expect(screen.getByRole('option', { name: 'Bob' })).toHaveAttribute('aria-selected', 'true');

      await user.click(screen.getByRole('option', { name: 'Carol' }));

      expect(onValueChange.mock.lastCall?.[0]).toEqual([2, 3]);

      await user.click(screen.getByRole('option', { name: 'Bob' }));

      expect(onValueChange.mock.lastCall?.[0]).toEqual([3]);
      expect(screen.getByRole('option', { name: 'Bob' })).toHaveAttribute('aria-selected', 'false');
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

    it.each([
      ['the serialized derived value', '2'],
      ['a derived label', 'Bob'],
    ])('matches browser autofill against %s', async (_, autofilledValue) => {
      const onValueChange = vi.fn();

      function App() {
        const items = userItems;
        return (
          <Combobox.Root items={items} name="user" onValueChange={onValueChange}>
            <Combobox.Input data-testid="input" />
          </Combobox.Root>
        );
      }

      await render(<App />);

      fireEvent.change(
        screen.getAllByDisplayValue('').find((el) => el.getAttribute('name') === 'user')!,
        { target: { value: autofilledValue } },
      );
      await flushMicrotasks();

      expect(onValueChange.mock.lastCall?.[0]).toBe(2);
      expect(screen.getByTestId('input')).toHaveValue('Bob');
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

    it('labels a selection that arrives together with its externally filtered item', async () => {
      function App(props: { results: ApiUser[]; value: string | null }) {
        const items = React.useMemo(
          () =>
            Combobox.createItems([] as ApiUser[], {
              getValue: (apiUser: ApiUser) => apiUser.id,
              getLabel: (apiUser: ApiUser) => apiUser.name,
            }),
          [],
        );
        return (
          <Combobox.Root items={items} filteredItems={props.results} value={props.value}>
            <Combobox.Input data-testid="input" />
            <span data-testid="value">
              <Combobox.Value />
            </span>
          </Combobox.Root>
        );
      }

      // One response carries both the result window and the persisted selection, so the label is
      // resolved in the same commit that first projects the item it comes from.
      const { setProps } = await render(<App results={[]} value={null} />);

      await setProps({ results: [apiUsers[0]], value: 'user-1' });

      expect(screen.getByTestId('input')).toHaveValue('Alice');
      expect(screen.getByTestId('value')).toHaveTextContent('Alice');
    });

    it('re-labels an unchanged selection when its item arrives in a later external window', async () => {
      function App(props: { results: ApiUser[] }) {
        const items = React.useMemo(
          () =>
            Combobox.createItems([] as ApiUser[], {
              getValue: (apiUser: ApiUser) => apiUser.id,
              getLabel: (apiUser: ApiUser) => apiUser.name,
            }),
          [],
        );
        return (
          <Combobox.Root items={items} filteredItems={props.results} value="user-1">
            <Combobox.Input data-testid="input" />
          </Combobox.Root>
        );
      }

      const { setProps } = await render(<App results={[]} />);

      // Nothing can resolve the label yet, so it degrades to the raw value.
      expect(screen.getByTestId('input')).toHaveValue('user-1');

      await setProps({ results: [apiUsers[0]] });

      expect(screen.getByTestId('input')).toHaveValue('Alice');
    });

    it('labels a defaultValue whose item only exists in the externally filtered window', async () => {
      function App() {
        const items = React.useMemo(
          () =>
            Combobox.createItems([] as ApiUser[], {
              getValue: (apiUser: ApiUser) => apiUser.id,
              getLabel: (apiUser: ApiUser) => apiUser.name,
            }),
          [],
        );
        return (
          <Combobox.Root items={items} filteredItems={apiUsers} defaultValue="user-1">
            <Combobox.Input data-testid="input" />
          </Combobox.Root>
        );
      }

      // The initial input value is derived on the first render, before anything else reads a
      // label from the collection.
      await render(<App />);

      expect(screen.getByTestId('input')).toHaveValue('Alice');
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

    it('keeps the label of an externally filtered source item after its window is gone', async () => {
      const externalUser = { id: 99, name: 'External user' };

      function App(props: { results: User[] }) {
        const items = React.useMemo(
          () =>
            Combobox.createItems(users.slice(0, 1), {
              getValue: getUserId,
              getLabel: getUserName,
            }),
          [],
        );

        return (
          <Combobox.Root items={items} filteredItems={props.results} defaultOpen>
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

      const { setProps, user } = await render(<App results={[externalUser]} />);

      await user.click(screen.getByRole('option', { name: 'External user' }));

      expect(screen.getByTestId('input')).toHaveValue('External user');

      await setProps({ results: [] });

      expect(screen.getByTestId('input')).toHaveValue('External user');
    });

    it('relabels a borrowed value when a later window carries a fresher item', async () => {
      function App(props: { results: User[] }) {
        const items = React.useMemo(
          () =>
            Combobox.createItems(users.slice(0, 1), {
              getValue: getUserId,
              getLabel: getUserName,
            }),
          [],
        );

        return (
          <Combobox.Root items={items} filteredItems={props.results} value={99}>
            <Combobox.Input data-testid="input" />
          </Combobox.Root>
        );
      }

      const { setProps } = await render(<App results={[{ id: 99, name: 'Ann' }]} />);

      expect(screen.getByTestId('input')).toHaveValue('Ann');

      // The same record comes back renamed: the label must follow the newer item, not the first
      // one the collection happened to borrow.
      await setProps({ results: [{ id: 99, name: 'Anna' }] });

      expect(screen.getByTestId('input')).toHaveValue('Anna');
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
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
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

      try {
        // Resolving an absent value first exercises the fallback path, which must not change what
        // the duplicated value resolves to: the first occurrence always wins.
        const { setProps } = await render(<App value={99} />);
        await setProps({ value: 1 });

        expect(screen.getByTestId<HTMLInputElement>('input').value).toBe('First');
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('Two items passed to createItems() derived the same value'),
        );
      } finally {
        consoleErrorSpy.mockRestore();
      }
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

    it('only projects the leaf items of the data', async () => {
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
      expect(new Set(getValue.mock.calls.map(([item]) => item))).toEqual(new Set(users));

      await user.clear(screen.getByTestId('input'));
      await user.type(screen.getByTestId('input'), 'car');

      expect(screen.getByRole('option', { name: 'Carol' })).not.toBe(null);
      expect(screen.queryByRole('option', { name: 'Alice' })).toBe(null);
      expect(new Set(getValue.mock.calls.map(([item]) => item))).toEqual(new Set(users));
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

    it('resets an empty external result when reopening a grouped selection', async () => {
      const { user } = await render(<GroupedApp defaultValue={3} filteredItems={[]} />);

      expect(screen.getByTestId('input')).toHaveValue('Carol');

      await user.click(screen.getByTestId('input'));

      expect(await screen.findAllByRole('option')).toHaveLength(3);
      expect(screen.getByRole('option', { name: 'Carol' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });

    it('keeps a flat external window shape when its results are emptied', async () => {
      function App(props: { results: User[] }) {
        const items = Combobox.createItems(teams, {
          getValue: getUserId,
          getLabel: getUserName,
        });
        return (
          <Combobox.Root items={items} filteredItems={props.results} defaultValue={3}>
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

      // The source is grouped but the window is flat, so falling back to the internal items would
      // render group objects through a callback written for users.
      const { setProps, user } = await render(<App results={[users[0]]} />);

      await setProps({ results: [] });
      await user.click(screen.getByTestId('input'));

      await waitFor(() => expect(screen.getByRole('listbox')).not.toBe(null));
      expect(screen.queryAllByRole('option')).toHaveLength(0);
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
