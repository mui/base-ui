import * as React from 'react';
import { act, fireEvent, screen } from '@mui/internal-test-utils';
import { describe, expect, it, vi } from 'vitest';
import { createRenderer } from '#test-utils';
import { Tree } from '..';

const { render } = createRenderer();

interface Node {
  key: string;
  name: string;
  nodes?: Node[];
  locked?: boolean;
  selectionLocked?: boolean;
}

function createNodeCollection(data: readonly Node[] | undefined) {
  return Tree.createItems(data, {
    getId: (item) => item.key,
    getLabel: (item) => item.name,
    getChildren: (item) => item.nodes,
    isDisabled: (item) => item.locked ?? false,
    isSelectionDisabled: (item) => item.selectionLocked ?? item.locked ?? false,
    setChildren: (item, children) => ({ ...item, nodes: [...children] }),
  });
}

function TestTree(props: {
  items: TreeItemInput;
  actionsRef?: React.RefObject<Tree.Root.Actions<Node> | null>;
  onItemsChange?: (items: Node[]) => void;
}) {
  return (
    <Tree.Root
      items={props.items}
      actionsRef={props.actionsRef}
      onItemsChange={props.onItemsChange}
      defaultExpandedItems={['parent']}
    >
      <Tree.List<Node>>
        {(item) => (
          <Tree.Item itemId={item.key} data-testid={item.key}>
            <Tree.ItemContent>{item.name}</Tree.ItemContent>
          </Tree.Item>
        )}
      </Tree.List>
    </Tree.Root>
  );
}

type TreeItemInput = ReturnType<typeof createNodeCollection>;

async function expectMissingWriter(
  run: () => unknown,
  option: 'setChildren' | 'setLabel',
  operation: string,
) {
  let error: Error | undefined;
  try {
    await run();
  } catch (caught) {
    error = caught as Error;
  }
  expect(error?.message).toContain('Base UI:');
  expect(error?.message).toContain(operation);
  expect(error?.message).toContain('source model cannot be updated safely');
  expect(error?.message).toContain(option);
  expect(error?.message).toContain('https://base-ui.com/react/components/tree#createitems');
}

describe('Tree.createItems', () => {
  it('does not call accessors while creating a collection', () => {
    const getId = vi.fn((item: Node) => item.key);
    const getLabel = vi.fn((item: Node) => item.name);
    const getChildren = vi.fn((item: Node) => item.nodes);
    const isDisabled = vi.fn((item: Node) => item.locked ?? false);
    const isSelectionDisabled = vi.fn((item: Node) => item.selectionLocked ?? false);
    const setChildren = vi.fn((item: Node, children: readonly Node[]) => ({
      ...item,
      nodes: [...children],
    }));

    Tree.createItems([{ key: 'a', name: 'A' }], {
      getId,
      getLabel,
      getChildren,
      isDisabled,
      isSelectionDisabled,
      setChildren,
    });

    for (const accessor of [
      getId,
      getLabel,
      getChildren,
      isDisabled,
      isSelectionDisabled,
      setChildren,
    ]) {
      expect(accessor).not.toHaveBeenCalled();
    }
  });

  it('uses custom ids, labels, children, disabled state, and selection state', async () => {
    const items = createNodeCollection([
      {
        key: 'parent',
        name: 'Folder',
        nodes: [
          { key: 'disabled', name: 'Disabled', locked: true },
          { key: 'selection-disabled', name: 'Selection disabled', selectionLocked: true },
        ],
      },
    ]);

    await render(<TestTree items={items} />);

    expect(screen.getByTestId('parent')).toHaveTextContent('Folder');
    expect(screen.getByTestId('disabled')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByTestId('parent')).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByTestId('selection-disabled')).not.toHaveAttribute('aria-selected');
    fireEvent.click(screen.getByTestId('selection-disabled'));
    expect(screen.getByTestId('selection-disabled')).not.toHaveAttribute('data-selected');

    act(() => screen.getByTestId('parent').focus());
    fireEvent.keyDown(screen.getByTestId('parent'), { key: 'ArrowDown' });
    // Disabled items stay focusable by default.
    expect(screen.getByTestId('disabled')).toHaveFocus();
    fireEvent.keyDown(screen.getByTestId('disabled'), { key: 'ArrowDown' });
    expect(screen.getByTestId('selection-disabled')).toHaveFocus();
  });

  it.each(['collection', 'array'] as const)(
    'keeps a selected disabled item selected but not selectable by default (%s)',
    async (kind) => {
      const data = [
        { key: 'disabled', name: 'Disabled', locked: true },
        { key: 'other', name: 'Other', locked: true },
      ];
      const items =
        kind === 'collection'
          ? Tree.createItems(data, {
              getId: (item) => item.key,
              getLabel: (item) => item.name,
              isDisabled: (item) => item.locked ?? false,
            })
          : data.map((item) => ({ id: item.key, label: item.name, disabled: item.locked }));
      const onSelectedItemsChange = vi.fn();

      await render(
        <Tree.Root
          items={items as TreeItemInput}
          selectionMode="multiple"
          selectedItems={['disabled']}
          onSelectedItemsChange={onSelectedItemsChange}
        >
          <Tree.List<Node>>
            {(item) => {
              const id = kind === 'collection' ? item.key : (item as unknown as { id: string }).id;
              const label =
                kind === 'collection' ? item.name : (item as unknown as { label: string }).label;
              return (
                <Tree.Item itemId={id} data-testid={id}>
                  <Tree.ItemContent>{label}</Tree.ItemContent>
                </Tree.Item>
              );
            }}
          </Tree.List>
        </Tree.Root>,
      );

      const disabled = screen.getByTestId('disabled');
      expect(disabled).toHaveAttribute('aria-disabled', 'true');
      expect(disabled).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByTestId('other')).toHaveAttribute('aria-selected', 'false');

      fireEvent.click(screen.getByTestId('other'));
      expect(onSelectedItemsChange).not.toHaveBeenCalled();
    },
  );

  it('updates data while accessor identity remains stable', async () => {
    const getId = (item: Node) => item.key;
    const getLabel = (item: Node) => item.name;
    function App(props: { data: readonly Node[] }) {
      const collection = React.useMemo(
        () =>
          Tree.createItems(props.data, {
            getId,
            getLabel,
          }),
        [props.data],
      );
      return <TestTree items={collection} />;
    }

    const view = await render(<App data={[{ key: 'a', name: 'A' }]} />);
    expect(screen.getByTestId('a')).toHaveTextContent('A');

    await view.rerender(<App data={[{ key: 'a', name: 'Renamed' }]} />);
    expect(screen.getByTestId('a')).toHaveTextContent('Renamed');

    await view.rerender(<App data={[{ key: 'b', name: 'B' }]} />);
    expect(screen.queryByTestId('a')).toBeNull();
    expect(screen.getByTestId('b')).toHaveTextContent('B');
  });

  it('does not warn about collection churn when a memoized collection follows new data', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      function App(props: { version: number }) {
        const data = React.useMemo(
          () => [{ key: `item-${props.version}`, name: `Item ${props.version}` }],
          [props.version],
        );
        const collection = React.useMemo(
          () =>
            Tree.createItems(data, {
              getId: (item) => item.key,
              getLabel: (item) => item.name,
            }),
          [data],
        );
        return <TestTree items={collection} />;
      }

      const view = await render(<App version={0} />);
      for (let version = 1; version <= 21; version += 1) {
        // eslint-disable-next-line no-await-in-loop
        await view.rerender(<App version={version} />);
      }

      expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('item lookups'));
    } finally {
      warn.mockRestore();
    }
  });

  it('warns when an unmemoized collection keeps rebuilding the item lookups', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const data = [{ key: 'a', name: 'A' }];
      function App(props: { version: number }) {
        const collection = Tree.createItems(data, {
          getId: (item) => item.key,
          getLabel: (item) => `${item.name}${props.version}`,
        });
        return <TestTree items={collection} />;
      }

      const view = await render(<App version={0} />);
      for (let version = 1; version <= 20; version += 1) {
        // eslint-disable-next-line no-await-in-loop
        await view.rerender(<App version={version} />);
      }

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('rebuilt its item lookups'));
    } finally {
      warn.mockRestore();
    }
  });

  it('rebuilds lookup metadata when accessor identity changes', async () => {
    const data = [{ key: 'a', name: 'A' }];
    function App(props: { prefix: string }) {
      const collection = React.useMemo(
        () =>
          Tree.createItems(data, {
            getId: (item) => item.key,
            getLabel: (item) => `${props.prefix}${item.name}`,
          }),
        [props.prefix],
      );
      return <TestTree items={collection} />;
    }

    const view = await render(<App prefix="" />);
    expect(screen.getByTestId('a')).toHaveAttribute('aria-label', 'A');

    await view.rerender(<App prefix="Item: " />);
    expect(screen.getByTestId('a')).toHaveAttribute('aria-label', 'Item: A');
  });

  it('treats undefined collection data as controlled loading data', async () => {
    const view = await render(
      <Tree.Root
        items={createNodeCollection(undefined)}
        defaultItems={createNodeCollection([{ key: 'default', name: 'Default' }])}
      >
        <Tree.List<Node>>
          {(item) => (
            <Tree.Item itemId={item.key}>
              <Tree.ItemContent>{item.name}</Tree.ItemContent>
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>,
    );
    expect(screen.queryAllByRole('row')).toHaveLength(0);

    await view.rerender(
      <Tree.Root
        items={createNodeCollection([{ key: 'a', name: 'A' }])}
        defaultItems={createNodeCollection([{ key: 'default', name: 'Default' }])}
      >
        <Tree.List<Node>>
          {(item) => (
            <Tree.Item itemId={item.key} data-testid={item.key}>
              <Tree.ItemContent>{item.name}</Tree.ItemContent>
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>,
    );
    expect(screen.queryByText('Default')).toBeNull();
    expect(screen.getByTestId('a')).toHaveTextContent('A');
  });

  it('reports source item models from controlled mutations', async () => {
    const onItemsChange = vi.fn();
    const actionsRef = React.createRef<Tree.Root.Actions<Node> | null>();
    await render(
      <TestTree
        items={createNodeCollection([{ key: 'a', name: 'A' }])}
        actionsRef={actionsRef}
        onItemsChange={onItemsChange}
      />,
    );

    act(() => {
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.update('a', { name: 'Renamed' }),
      );
    });

    expect(onItemsChange.mock.calls[0][0]).toEqual([{ key: 'a', name: 'Renamed' }]);
    expect(screen.getByTestId('a')).toHaveTextContent('A');
  });

  it.each(['items', 'defaultItems'] as const)(
    'rejects non-collection objects passed as %s',
    async (prop) => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        await expect(
          render(
            <Tree.Root {...{ [prop]: { data: [] } as never }}>
              <Tree.List>{() => null}</Tree.List>
            </Tree.Root>,
          ),
        ).rejects.toThrow(/not a valid item collection/);
      } finally {
        consoleError.mockRestore();
      }
    },
  );

  it.each([false, true])(
    'derives a parent label from its children after a nested mutation, controlled: %s',
    async (controlled) => {
      const options = {
        getId: (item: Node) => item.key,
        getLabel: (item: Node) => `${item.name} (${item.nodes?.length ?? 0})`,
        getChildren: (item: Node) => item.nodes,
        setChildren: (item: Node, children: readonly Node[]) => ({ ...item, nodes: [...children] }),
      };
      const data = [{ key: 'parent', name: 'Parent', nodes: [{ key: 'a', name: 'A' }] }];
      const actionsRef = React.createRef<Tree.Root.Actions<Node> | null>();
      function App() {
        const [items, setItems] = React.useState<Node[]>(data);
        const collection = React.useMemo(() => Tree.createItems(items, options), [items]);
        return (
          <Tree.Root
            items={controlled ? collection : undefined}
            defaultItems={controlled ? undefined : collection}
            onItemsChange={setItems}
            actionsRef={actionsRef}
          >
            <Tree.List<Node>>
              {(item) => (
                <Tree.Item itemId={item.key} data-testid={item.key}>
                  <Tree.ItemContent>{item.name}</Tree.ItemContent>
                </Tree.Item>
              )}
            </Tree.List>
          </Tree.Root>
        );
      }

      await render(<App />);
      await act(async () => {
        await actionsRef.current!.applyTransaction((transaction) =>
          transaction.add({ key: 'b', name: 'B' }, { parentId: 'parent', index: 1 }),
        );
      });
      expect(screen.getByTestId('parent')).toHaveAttribute('aria-label', 'Parent (2)');

      act(() => {
        actionsRef.current!.applyTransaction((transaction) => {
          transaction.remove('a');
          transaction.remove('b');
        });
      });
      expect(screen.getByTestId('parent')).toHaveAttribute('aria-label', 'Parent (0)');
    },
  );

  it('keeps the first item when custom items derive duplicate IDs', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await render(
        <TestTree
          items={createNodeCollection([
            { key: 'duplicate', name: 'First' },
            { key: 'duplicate', name: 'Second' },
          ])}
        />,
      );

      expect(screen.getByText('First')).toBeVisible();
      expect(screen.queryByText('Second')).toBeNull();
      expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('have the same id'));
    } finally {
      consoleError.mockRestore();
    }
  });
});

describe('Tree.createItems writers', () => {
  const readonlyItems = Tree.createItems<Node>(
    [{ key: 'parent', name: 'Parent', nodes: [{ key: 'child', name: 'Child' }] }],
    {
      getId: (item: Node) => item.key,
      getLabel: (item) => item.name,
      getChildren: (item) => item.nodes,
    },
  );

  it('rejects a nested mutation without setChildren', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Node> | null>();
    await render(<TestTree items={readonlyItems} actionsRef={actionsRef} />);

    await expectMissingWriter(
      () =>
        act(() =>
          actionsRef.current!.applyTransaction((transaction) => transaction.remove('child')),
        ),
      'setChildren',
      'Tree structural mutation',
    );
    expect(screen.getByTestId('child')).toBeVisible();
  });

  it('rejects a nested insertion without setChildren', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Node> | null>();
    await render(<TestTree items={readonlyItems} actionsRef={actionsRef} />);

    await expect(
      act(() =>
        actionsRef.current!.applyTransaction((transaction) =>
          transaction.add({ key: 'added', name: 'Added' }, { parentId: 'parent', index: 1 }),
        ),
      ),
    ).rejects.toThrow(/setChildren/);
    expect(screen.queryByText('Added')).toBeNull();
  });

  it('rejects moving an item out of a nested parent without setChildren', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Node> | null>();
    const onItemsChange = vi.fn();
    await render(
      <TestTree items={readonlyItems} actionsRef={actionsRef} onItemsChange={onItemsChange} />,
    );

    await expect(
      act(() =>
        actionsRef.current!.applyTransaction((transaction) =>
          transaction.move('child', { parentId: null, index: 1 }),
        ),
      ),
    ).rejects.toThrow(/setChildren/);
    expect(actionsRef.current!.getParentId('child')).toBe('parent');
    expect(actionsRef.current!.getChildIds(null)).toEqual(['parent']);
    expect(actionsRef.current!.getChildIds('parent')).toEqual(['child']);
    expect(onItemsChange).not.toHaveBeenCalled();
  });

  it('allows root-level structural mutations without setChildren', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Node> | null>();
    const rootItems = Tree.createItems<Node>(
      [
        { key: 'first', name: 'First' },
        { key: 'second', name: 'Second' },
      ],
      {
        getId: (item) => item.key,
        getLabel: (item) => item.name,
      },
    );
    await render(
      <Tree.Root defaultItems={rootItems} actionsRef={actionsRef}>
        <Tree.List<Node>>
          {(item) => (
            <Tree.Item itemId={item.key}>
              <Tree.ItemContent>{item.name}</Tree.ItemContent>
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>,
    );

    await act(() =>
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.add({ key: 'sibling', name: 'Sibling' }, { parentId: null, index: 2 }),
      ),
    );
    expect(screen.getByText('Sibling')).toBeVisible();

    await act(() =>
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.move('sibling', { parentId: null, index: 0 }),
      ),
    );
    expect(actionsRef.current!.getChildIds(null)).toEqual(['sibling', 'first', 'second']);

    act(() => {
      actionsRef.current!.applyTransaction((transaction) => transaction.remove('first'));
    });
    expect(actionsRef.current!.getChildIds(null)).toEqual(['sibling', 'second']);
  });

  it('updates selection support when an update changes a custom item', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Node> | null>();
    const items = Tree.createItems<Node>([{ key: 'item', name: 'Item', locked: true }], {
      getId: (item) => item.key,
      getLabel: (item) => item.name,
      isDisabled: (item) => item.locked ?? false,
      isSelectionDisabled: (item) => item.locked ?? false,
    });
    await render(
      <Tree.Root defaultItems={items} actionsRef={actionsRef} selectionMode="multiple">
        <Tree.List<Node>>
          {(item) => (
            <Tree.Item itemId={item.key}>
              <Tree.ItemContent>{item.name}</Tree.ItemContent>
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>,
    );

    const item = screen.getByRole('row');
    expect(item).not.toHaveAttribute('aria-selected');
    act(() => {
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.update('item', { locked: false }),
      );
    });
    expect(item).toHaveAttribute('aria-selected', 'false');
    fireEvent.click(item);
    expect(item).toHaveAttribute('aria-selected', 'true');

    act(() => {
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.update('item', { locked: true }),
      );
    });
    expect(item).not.toHaveAttribute('aria-selected');
  });

  it('updates the state a custom item derives from its label when an update renames it', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Node> | null>();
    const items = Tree.createItems<Node>([{ key: 'item', name: 'Item' }], {
      getId: (item) => item.key,
      getLabel: (item) => item.name,
      isDisabled: (item) => item.name.startsWith('_'),
    });
    await render(
      <Tree.Root defaultItems={items} actionsRef={actionsRef} selectionMode="multiple">
        <Tree.List<Node>>
          {(item) => (
            <Tree.Item itemId={item.key}>
              <Tree.ItemContent>{item.name}</Tree.ItemContent>
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>,
    );

    act(() => {
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.update('item', { name: '_Item' }),
      );
    });

    expect(screen.getByRole('row')).toHaveAttribute('aria-disabled', 'true');
    expect(actionsRef.current!.isItemDisabled('item')).toBe(true);
  });
});
