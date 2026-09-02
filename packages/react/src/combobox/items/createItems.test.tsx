import { expect, vi, describe, it } from 'vitest';
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

interface Person {
  id: string;
  name: string;
}

// Created once and reused by more than one root, the way a module-scope collection is.
const sharedPersonItems = Combobox.createItems([] as Person[], {
  getValue: (person: Person) => person.id,
  getLabel: (person: Person) => person.name,
});

describe('Combobox.createItems', () => {
  const { render, renderToString } = createRenderer();

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

    it('treats undefined data as the absence of items rather than as an empty list', async () => {
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

    it('keeps nullish entries out of the accessors, the render callback, and filtered results', async () => {
      // A hole in otherwise well-typed data, which is how it reaches a collection in practice.
      const sourceItems = [null, users[0]] as unknown as User[];
      const getValue = vi.fn((user: User) => user.id);
      const renderItem = vi.fn((user: User) => (
        <Combobox.Item key={user.id} value={user.id}>
          {user.name}
        </Combobox.Item>
      ));

      function App() {
        const items = Combobox.createItems(sourceItems, {
          getValue,
          getLabel: getUserName,
        });
        return (
          <Combobox.Root items={items} filteredItems={[users[0]]} defaultValue={1} defaultOpen>
            <Combobox.Input data-testid="input" />
            <Combobox.List>{renderItem}</Combobox.List>
          </Combobox.Root>
        );
      }

      const { user } = await render(<App />);

      expect(screen.getByTestId('input')).toHaveValue('Alice');

      // The hole never reaches the render callback, with or without a query, exactly as it never
      // reaches the accessors.
      await user.type(screen.getByTestId('input'), 'a');

      expect(screen.getAllByRole('option')).toHaveLength(1);
      expect(screen.getByRole('option', { name: 'Alice' })).not.toBe(null);
      expect(getValue.mock.calls.every(([item]) => item != null)).toBe(true);
      expect(renderItem.mock.calls.every(([item]) => item != null)).toBe(true);
    });

    it('keeps nullish entries out of a custom filter', async () => {
      const sourceItems = [undefined, users[0], null, users[1]] as unknown as User[];
      // A custom filter trusts the item the way the accessors do.
      const filter = vi.fn((user: User, query: string, itemToString?: (item: User) => string) =>
        (itemToString?.(user) ?? '').toLowerCase().includes(query.toLowerCase()),
      );

      function App() {
        const items = Combobox.createItems(sourceItems, {
          getValue: getUserId,
          getLabel: getUserName,
        });
        return (
          <Combobox.Root items={items} filter={filter} defaultOpen>
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

      await user.type(screen.getByTestId('input'), 'ali');

      expect(screen.getAllByRole('option')).toHaveLength(1);
      expect(screen.getByRole('option', { name: 'Alice' })).not.toBe(null);
      // The filter saw every real item and nothing else.
      expect(new Set(filter.mock.calls.map(([item]) => item.id))).toEqual(new Set([1, 2]));
    });

    it('highlights past a nullish entry without desyncing the reported value', async () => {
      const sourceItems = [null, users[0], users[1]] as unknown as User[];
      const onItemHighlighted = vi.fn();

      function App() {
        const items = Combobox.createItems(sourceItems, {
          getValue: getUserId,
          getLabel: getUserName,
        });
        return (
          <Combobox.Root items={items} onItemHighlighted={onItemHighlighted}>
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
      const input = screen.getByTestId('input');

      await user.click(input);
      await user.keyboard('{ArrowDown}');

      expect(screen.getByRole('option', { name: 'Alice' }).id).toBe(
        input.getAttribute('aria-activedescendant'),
      );
      expect(onItemHighlighted.mock.lastCall?.[0]).toBe(1);

      await user.keyboard('{ArrowDown}');

      expect(screen.getByRole('option', { name: 'Bob' }).id).toBe(
        input.getAttribute('aria-activedescendant'),
      );
      expect(onItemHighlighted.mock.lastCall?.[0]).toBe(2);
    });

    it('keeps an explicit index from the render callback aligned past a nullish entry', async () => {
      const sourceItems = [null, users[0], users[1]] as unknown as User[];
      const onItemHighlighted = vi.fn();

      function App() {
        const items = Combobox.createItems(sourceItems, {
          getValue: getUserId,
          getLabel: getUserName,
        });
        return (
          <Combobox.Root items={items} onItemHighlighted={onItemHighlighted}>
            <Combobox.Input data-testid="input" />
            <Combobox.List>
              {(user: User, index: number) => (
                <Combobox.Item key={user.id} value={user.id} index={index}>
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

      expect(screen.getByRole('option', { name: 'Alice' }).id).toBe(
        input.getAttribute('aria-activedescendant'),
      );
      expect(onItemHighlighted.mock.lastCall?.[0]).toBe(1);

      await user.keyboard('{ArrowDown}');

      expect(screen.getByRole('option', { name: 'Bob' }).id).toBe(
        input.getAttribute('aria-activedescendant'),
      );
      expect(onItemHighlighted.mock.lastCall?.[0]).toBe(2);
    });

    it('drops nullish entries from externally filtered items', async () => {
      const sourceItems = [null, users[0], users[1]] as unknown as User[];
      const onItemHighlighted = vi.fn();

      function App() {
        const items = Combobox.createItems(sourceItems, {
          getValue: getUserId,
          getLabel: getUserName,
        });
        return (
          <Combobox.Root
            items={items}
            filteredItems={sourceItems}
            onItemHighlighted={onItemHighlighted}
          >
            <Combobox.Input data-testid="input" />
            <Combobox.List>
              {(user: User, index: number) => (
                <Combobox.Item key={user.id} value={user.id} index={index}>
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

      expect(screen.getAllByRole('option')).toHaveLength(2);
      expect(screen.getByRole('option', { name: 'Alice' }).id).toBe(
        input.getAttribute('aria-activedescendant'),
      );
      expect(onItemHighlighted.mock.lastCall?.[0]).toBe(1);
    });

    it('does not count nullish entries toward the limit or the empty state', async () => {
      const sourceItems = [null, users[0], undefined] as unknown as User[];

      function App() {
        const items = Combobox.createItems(sourceItems, {
          getValue: getUserId,
          getLabel: getUserName,
        });
        return (
          <Combobox.Root items={items} limit={1} defaultOpen>
            <Combobox.Input data-testid="input" />
            <Combobox.Empty>No results</Combobox.Empty>
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

      expect(screen.getByRole('option', { name: 'Alice' })).not.toBe(null);
      expect(screen.queryByText('No results')).toBe(null);
    });

    it('keeps nullish entries in grouped data out of a custom filter and the group render callback', async () => {
      interface Team {
        label: string;
        items: User[];
      }
      // A nullish group entry and nullish leaf entries, so the array is classified from a hole.
      const teams = [
        null,
        { label: 'Team A', items: [null, users[0]] },
        { label: 'Team B', items: [users[1], undefined] },
      ] as unknown as Team[];
      const filter = vi.fn((user: User, query: string, itemToString?: (item: User) => string) =>
        (itemToString?.(user) ?? '').toLowerCase().includes(query.toLowerCase()),
      );
      const renderItem = vi.fn((user: User) => (
        <Combobox.Item key={user.id} value={user.id}>
          {user.name}
        </Combobox.Item>
      ));

      function App() {
        const items = Combobox.createItems(teams, {
          getValue: getUserId,
          getLabel: getUserName,
        });
        return (
          <Combobox.Root items={items} filter={filter} defaultOpen>
            <Combobox.Input data-testid="input" />
            <Combobox.List>
              {(team: Team) => (
                <Combobox.Group key={team.label} items={team.items}>
                  <Combobox.GroupLabel>{team.label}</Combobox.GroupLabel>
                  <Combobox.Collection>{renderItem}</Combobox.Collection>
                </Combobox.Group>
              )}
            </Combobox.List>
          </Combobox.Root>
        );
      }

      const { user } = await render(<App />);

      expect(screen.getAllByRole('option')).toHaveLength(2);

      await user.type(screen.getByTestId('input'), 'bo');

      expect(screen.getAllByRole('option')).toHaveLength(1);
      expect(screen.getByRole('option', { name: 'Bob' })).not.toBe(null);
      // The filter and the render callback saw every real item and nothing else.
      expect(new Set(filter.mock.calls.map(([item]) => item.id))).toEqual(new Set([1, 2]));
      expect(renderItem.mock.calls.every(([item]) => item != null)).toBe(true);
    });

    it.each([
      ['leading', (team: unknown) => [null, team]],
      ['trailing', (team: unknown) => [team, null]],
    ])(
      'resolves the selected label through grouped data with a %s nullish group entry',
      async (_position, withHole) => {
        // The collection indexes its own data, so a nullish group entry must be a hole there too.
        const teams = withHole({ label: 'Team A', items: [users[0]] }) as unknown as {
          label: string;
          items: User[];
        }[];
        const items = Combobox.createItems(teams, {
          getValue: getUserId,
          getLabel: getUserName,
        });

        await render(
          <Combobox.Root items={items} defaultValue={1}>
            <Combobox.Input data-testid="input" />
          </Combobox.Root>,
        );

        expect(screen.getByTestId('input')).toHaveValue('Alice');
      },
    );

    it('treats a non-array items field as item data rather than as a group', async () => {
      const onValueChange = vi.fn();
      // Only an actual `items` array marks a group; unrelated or optional fields stay item data.
      const records = [
        { id: 1, name: 'Alice', items: undefined },
        { id: 2, name: 'Bob', items: 3 },
      ];
      const recordItems = Combobox.createItems(records, {
        getValue: (record) => record.id,
        getLabel: (record) => record.name,
      });

      function App() {
        return (
          <Combobox.Root items={recordItems} defaultOpen onValueChange={onValueChange}>
            <Combobox.Input data-testid="input" />
            <Combobox.List>
              {(record: (typeof records)[number]) => (
                <Combobox.Item key={record.id} value={record.id}>
                  {record.name}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Root>
        );
      }

      const { user } = await render(<App />);

      expect(screen.getAllByRole('option')).toHaveLength(2);

      await user.click(screen.getByRole('option', { name: 'Bob' }));

      expect(onValueChange.mock.lastCall?.[0]).toBe(2);
      expect(screen.getByTestId('input')).toHaveValue('Bob');
    });

    it('treats an array-valued items field as a group when its declared type is unknown', async () => {
      interface BroadRecord {
        id: string;
        items: unknown;
      }

      const records: BroadRecord[] = [{ id: 'people', items: [users[0]] }];
      // @ts-expect-error A broad `items` field is rejected because its runtime value may be an array.
      const items = Combobox.createItems(records, {
        getValue: (user: User) => user.id,
        getLabel: (user: User) => user.name,
      });

      await render(
        <Combobox.Root items={items} defaultValue={1}>
          <Combobox.Input data-testid="input" />
        </Combobox.Root>,
      );

      expect(screen.getByTestId('input')).toHaveValue('Alice');
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

    it('highlights an initially selected derived value on mount when inline', async () => {
      function App() {
        const items = userItems;
        return (
          <Combobox.Root items={items} inline open defaultValue={3}>
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

      const input = screen.getByTestId('input');
      const carol = screen.getByRole('option', { name: 'Carol' });

      await waitFor(() => expect(carol).toHaveAttribute('data-highlighted'));
      expect(input).toHaveAttribute('aria-activedescendant', carol.id);
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
        const items = Combobox.createItems(cities, {
          getValue: (city) => city,
          getLabel: (city) => city,
        });
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

    it('updates a selected label when a stable accessor returns a new result', async () => {
      let language: 'en' | 'es' = 'en';
      const items = Combobox.createItems(users, {
        getValue: getUserId,
        getLabel: (user) => (language === 'es' && user.id === 1 ? 'Alicia' : user.name),
      });

      function App(props: { language: 'en' | 'es' }) {
        return (
          <Combobox.Root items={items} defaultValue={1} locale={props.language}>
            <Combobox.Input data-testid="input" />
            <span data-testid="value">
              <Combobox.Value />
            </span>
            <Combobox.Trigger>Open</Combobox.Trigger>
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

      const { setProps, user } = await render(<App language="en" />);
      const input = screen.getByTestId('input');

      expect(input).toHaveValue('Alice');
      expect(screen.getByTestId('value')).toHaveTextContent('Alice');

      language = 'es';
      await setProps({ language: 'es' });

      expect(input).toHaveValue('Alicia');
      expect(screen.getByTestId('value')).toHaveTextContent('Alicia');

      await user.click(screen.getByRole('button', { name: 'Open' }));

      expect(await screen.findAllByRole('option')).toHaveLength(users.length);
    });

    it('resolves a value that only a custom comparer matches from the collection', async () => {
      function App() {
        const items = Combobox.createItems(users, {
          getValue: (user) => user.name.toLowerCase(),
          getLabel: getUserName,
        });
        return (
          <Combobox.Root
            items={items}
            filteredItems={[users[0]]}
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

      expect(screen.getAllByRole('option')).toHaveLength(users.length);
      expect(screen.getByRole('option', { name: 'Bob' })).toHaveAttribute('aria-selected', 'true');
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

    it('labels a derived selection when useFilter receives its value', async () => {
      function App() {
        const items = Combobox.createItems(users, {
          getValue: getUserId,
          getLabel: (user) => user.name.trim(),
        });
        const filter = Combobox.useFilter({ value: 2 }).contains;

        return (
          <Combobox.Root items={items} filter={filter} defaultValue={2} defaultOpen>
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
      await user.clear(input);
      await user.type(input, 'ali');

      expect(screen.getByRole('option', { name: 'Alice' })).not.toBe(null);
      expect(screen.queryByRole('option', { name: 'Bob' })).toBe(null);
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

    it('uses the custom comparer to label a value from the externally filtered window', async () => {
      function App() {
        const items = Combobox.createItems([users[0]], {
          getValue: (user) => user.name.toLowerCase(),
          getLabel: getUserName,
        });
        return (
          <Combobox.Root
            items={items}
            filteredItems={[users[1]]}
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

      expect(screen.getByRole('option', { name: 'Bob' })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByTestId('input')).toHaveValue('Bob');
    });

    it('keeps an external result visible when the selected item is absent from known data', async () => {
      function App() {
        const items = React.useMemo(
          () =>
            Combobox.createItems([apiUsers[1]], {
              getValue: (apiUser: ApiUser) => apiUser.id,
              getLabel: (apiUser: ApiUser) => apiUser.name,
            }),
          [],
        );
        return (
          <Combobox.Root
            items={items}
            filteredItems={[apiUsers[0]]}
            defaultValue="user-1"
            defaultOpen
          >
            <Combobox.Input data-testid="input" />
            <Combobox.List>
              {(apiUser: ApiUser) => (
                <Combobox.Item key={apiUser.id} value={apiUser.id}>
                  {apiUser.name}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Root>
        );
      }

      await render(<App />);

      expect(screen.getByTestId('input')).toHaveValue('Alice');
      expect(screen.getByRole('option', { name: 'Alice' })).not.toBe(null);
      expect(screen.queryByRole('option', { name: 'Bob' })).toBe(null);
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

    it('degrades the label of an externally filtered item after its window is gone', async () => {
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

      // Nothing from a past window is remembered: keep the item in the data or supply
      // `itemToStringLabel` to keep the label.
      await setProps({ results: [] });

      expect(screen.getByTestId('input')).toHaveValue('99');
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

    it('resolves each root against its own external window when the collection is shared', async () => {
      function App(props: { resultsA: Person[] }) {
        return (
          <React.Fragment>
            <Combobox.Root items={sharedPersonItems} filteredItems={props.resultsA} value="user-1">
              <Combobox.Input data-testid="input-a" />
            </Combobox.Root>
            <Combobox.Root
              items={sharedPersonItems}
              filteredItems={[{ id: 'user-1', name: 'Alicia' }]}
              value="user-1"
            >
              <Combobox.Input data-testid="input-b" />
            </Combobox.Root>
          </React.Fragment>
        );
      }

      const { setProps } = await render(<App resultsA={[{ id: 'user-1', name: 'Alice' }]} />);

      expect(screen.getByTestId('input-a')).toHaveValue('Alice');
      expect(screen.getByTestId('input-b')).toHaveValue('Alicia');

      // Window items never touch the shared collection: with its own window gone, the first root
      // degrades to the raw value rather than picking up the label from the sibling's window.
      await setProps({ resultsA: [] });

      expect(screen.getByTestId('input-a')).toHaveValue('user-1');
      expect(screen.getByTestId('input-b')).toHaveValue('Alicia');
    });

    it('labels multiple selected values from the current external window', async () => {
      function App(props: { results: Person[] }) {
        return (
          <Combobox.Root
            multiple
            items={sharedPersonItems}
            filteredItems={props.results}
            value={['user-1', 'user-2']}
          >
            <Combobox.Input data-testid="input" />
            <span data-testid="value">
              <Combobox.Value />
            </span>
          </Combobox.Root>
        );
      }

      const { setProps } = await render(
        <App
          results={[
            { id: 'user-1', name: 'Alice' },
            { id: 'user-2', name: 'Bob' },
          ]}
        />,
      );

      expect(screen.getByTestId('value')).toHaveTextContent('Alice, Bob');

      // Each selected value degrades independently when its item leaves the window.
      await setProps({ results: [{ id: 'user-2', name: 'Bob' }] });

      expect(screen.getByTestId('value')).toHaveTextContent('user-1, Bob');
    });

    it('resolves a server-rendered defaultValue label from the external window', () => {
      renderToString(
        <Combobox.Root
          items={sharedPersonItems}
          filteredItems={[{ id: 'user-1', name: 'Alice' }]}
          defaultValue="user-1"
        >
          <Combobox.Input data-testid="input" />
        </Combobox.Root>,
      );

      expect(screen.getByTestId('input')).toHaveValue('Alice');
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

    it.each([
      { derivedValue: 0, label: 'Zero' },
      { derivedValue: '', label: 'Empty string' },
      { derivedValue: false, label: 'False' },
      { derivedValue: 10n, label: 'Bigint' },
    ] as const)('resolves $label as a primitive selection', async ({ derivedValue, label }) => {
      const sourceItems = [{ value: derivedValue, label }];
      const items = Combobox.createItems(sourceItems, {
        getValue: (item) => item.value,
        getLabel: (item) => item.label,
      });

      await render(
        <Combobox.Root items={items} defaultValue={derivedValue} name="choice" defaultOpen>
          <Combobox.Input data-testid="input" />
          <span data-testid="value">
            <Combobox.Value placeholder="Pick one" />
          </span>
          <Combobox.List>
            {(item) => (
              <Combobox.Item key={item.label} value={item.value}>
                {item.label}
              </Combobox.Item>
            )}
          </Combobox.List>
        </Combobox.Root>,
      );

      expect(screen.getByTestId('input')).toHaveValue(label);
      expect(screen.getByTestId('value')).toHaveTextContent(label);
      expect(screen.getByRole('option', { name: label })).toHaveAttribute('aria-selected', 'true');
      expect(document.querySelector('input[name="choice"]')).toHaveValue(String(derivedValue));
    });

    it('resolves a duplicated derived value to the same label regardless of lookup order', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const duplicated = [
        { id: 1, name: 'First' },
        { id: 2, name: 'Bob' },
        { id: 1, name: 'Clone' },
        { id: 2, name: 'Copy' },
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
        expect(consoleErrorSpy.mock.calls).toEqual(
          expect.arrayContaining([
            [expect.stringContaining('Two items passed to createItems() derived the value 1')],
            [expect.stringContaining('Two items passed to createItems() derived the value 2')],
          ]),
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

    it('resets an emptied external result when reopening a grouped selection', async () => {
      const { setProps, user } = await render(
        <GroupedApp defaultValue={3} filteredItems={[{ value: 'Design', items: [users[2]] }]} />,
      );

      expect(screen.getByTestId('input')).toHaveValue('Carol');

      await setProps({ filteredItems: [] });
      await user.click(screen.getByTestId('input'));

      expect(await screen.findAllByRole('option')).toHaveLength(3);
      expect(screen.getByRole('option', { name: 'Carol' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });

    it('resets an initially empty external result when opening a grouped selection', async () => {
      const { user } = await render(<GroupedApp defaultValue={3} filteredItems={[]} />);

      expect(screen.getByTestId('input')).toHaveValue('Carol');

      await user.click(screen.getByTestId('input'));

      expect(await screen.findAllByRole('option')).toHaveLength(3);
      expect(screen.getByRole('option', { name: 'Carol' })).toHaveAttribute(
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
