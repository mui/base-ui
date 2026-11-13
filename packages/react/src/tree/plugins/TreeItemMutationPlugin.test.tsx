import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { describe, it, expect, vi } from 'vitest';
import { act, screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { TreeStoreTap } from '../../../test/describeTree';
import { Tree } from '..';
import type { TreeStore } from '../store/TreeStore';
import type { TreeItemId, TreeItemChange } from '../store/types';
import { getItemIdKey, getParentKey } from '../utils/itemIdKey';
import { selectAncestorLastChildFlags } from '../item-indent-guide/selectAncestorLastChildFlags';

const { render } = createRenderer();

interface Item {
  id: string;
  label: string;
  disabled?: boolean;
  children?: Item[];
}

const ITEMS: Item[] = [
  {
    id: 'a',
    label: 'A',
    children: [
      { id: 'a1', label: 'A1' },
      { id: 'a2', label: 'A2' },
      { id: 'a3', label: 'A3' },
    ],
  },
  {
    id: 'b',
    label: 'B',
    children: [
      { id: 'b1', label: 'B1' },
      { id: 'b2', label: 'B2' },
    ],
  },
  { id: 'c', label: 'C' },
];

function childIds(result: Item[], parentId?: string): string[] {
  if (!parentId) {
    return result.map((i) => i.id);
  }
  for (const item of result) {
    if (item.id === parentId) {
      return (item.children ?? []).map((c) => c.id);
    }
    if (item.children) {
      const found = childIds(item.children, parentId);
      if (found.length > 0 || item.children.some((c) => c.id === parentId)) {
        return found;
      }
    }
  }
  return [];
}

function TestTree({
  initialItems,
  actionsRef,
  onItemsChange,
}: {
  initialItems: Item[];
  actionsRef: React.RefObject<Tree.Root.Actions<Item> | null>;
  onItemsChange: (...args: any[]) => void;
}) {
  return (
    <Tree.Root
      items={initialItems}
      onItemsChange={onItemsChange}
      actionsRef={actionsRef}
      defaultExpandedItems={['a', 'b']}
    >
      <Tree.List>
        {(item) => (
          <Tree.Item itemId={item.id}>
            <Tree.ItemContent>{item.label}</Tree.ItemContent>
          </Tree.Item>
        )}
      </Tree.List>
    </Tree.Root>
  );
}

/**
 * An *uncontrolled* tree: `defaultItems` plus an `onItemsChange` spy. Mutations
 * apply to the store's own item state, so the rendered rows and the lookups
 * behind them are the assertion — not just the reported payload.
 */
function UncontrolledTree({
  initialItems,
  actionsRef,
  onItemsChange,
}: {
  initialItems: Item[];
  actionsRef: React.RefObject<Tree.Root.Actions<Item> | null>;
  onItemsChange?: ((...args: any[]) => void) | undefined;
}) {
  return (
    <Tree.Root
      defaultItems={initialItems}
      onItemsChange={onItemsChange}
      actionsRef={actionsRef}
      defaultExpandedItems={['a', 'b']}
    >
      <Tree.List>
        {(item) => (
          <Tree.Item itemId={item.id} data-testid={`item-${item.id}`}>
            <Tree.ItemContent>{item.label}</Tree.ItemContent>
          </Tree.Item>
        )}
      </Tree.List>
    </Tree.Root>
  );
}

/**
 * Applies reported changes to a copy of `items` the way the `TreeItemChange` docs
 * describe: in order, each one relative to the items the previous ones left.
 */
function applyChanges(items: readonly Item[], changes: readonly TreeItemChange<Item>[]): Item[] {
  const root: Item = { id: 'root', label: 'root', children: structuredClone([...items]) };
  const find = (id: string, parent: Item = root): [Item, Item] | null => {
    for (const child of parent.children ?? []) {
      if (child.id === id) {
        return [child, parent];
      }
      const found = find(id, child);
      if (found != null) {
        return found;
      }
    }
    return null;
  };
  const getParent = (parentId: TreeItemId | null) =>
    parentId == null ? root : find(String(parentId))![0];
  const detach = (id: TreeItemId) => {
    const [item, parent] = find(String(id))!;
    parent.children!.splice(parent.children!.indexOf(item), 1);
    return item;
  };
  const insert = (parentId: TreeItemId | null, index: number, inserted: Item[]) => {
    const parent = getParent(parentId);
    parent.children = parent.children ?? [];
    parent.children.splice(index, 0, ...inserted);
  };
  for (const change of changes) {
    if (change.type === 'add') {
      insert(change.parentId, change.index, structuredClone(change.items));
    } else if (change.type === 'remove') {
      change.itemIds.forEach(detach);
    } else if (change.type === 'move') {
      insert(change.parentId, change.index, change.itemIds.map(detach));
    } else {
      const [item, parent] = find(String(change.itemId))!;
      parent.children!.splice(parent.children!.indexOf(item), 1, structuredClone(change.item));
    }
  }
  return root.children!;
}

/** Every rendered row's item id, in visual order. */
function renderedItemIds(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('[data-item-id]')).map((element) =>
    element.getAttribute('data-item-id')!,
  );
}

describe('applyTransaction', () => {
  it('applies each operation to the items the earlier ones left', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    await render(<UncontrolledTree initialItems={ITEMS} actionsRef={actionsRef} />);

    await act(() =>
      actionsRef.current!.applyTransaction((transaction) => {
        transaction.add({ id: 'd', label: 'D', children: [] }, { after: 'a' });
        transaction.move('a1', { parentId: 'd' });
        transaction.add({ id: 'd2', label: 'D2' }, { after: 'a1' });
        transaction.remove('b');
        transaction.update('d', { label: 'Renamed D' });
      }),
    );

    expect(actionsRef.current!.getChildIds(null)).toEqual(['a', 'd', 'c']);
    expect(actionsRef.current!.getChildIds('d')).toEqual(['a1', 'd2']);
    expect(actionsRef.current!.getItemModel('d')?.label).toBe('Renamed D');
  });

  it('notifies once with the changes in the order they applied', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const onItemsChange = vi.fn();
    await render(
      <UncontrolledTree
        initialItems={ITEMS}
        actionsRef={actionsRef}
        onItemsChange={onItemsChange}
      />,
    );

    await act(() =>
      actionsRef.current!.applyTransaction((transaction) => {
        transaction.add({ id: 'temp', label: 'Temp' }, { before: 'a' });
        transaction.add({ id: 'kept', label: 'Kept' }, { after: 'c' });
        transaction.move('b1', { parentId: 'a', index: 0 });
        transaction.update('c', { label: 'C2' });
        transaction.remove('temp');
        transaction.remove('a3');
      }),
    );

    expect(onItemsChange).toHaveBeenCalledTimes(1);
    expect(onItemsChange.mock.calls[0][1].changes).toEqual([
      { type: 'add', items: [{ id: 'temp', label: 'Temp' }], parentId: null, index: 0 },
      { type: 'add', items: [{ id: 'kept', label: 'Kept' }], parentId: null, index: 4 },
      { type: 'move', itemIds: ['b1'], parentId: 'a', index: 0 },
      { type: 'update', itemId: 'c', item: { id: 'c', label: 'C2' } },
      { type: 'remove', itemIds: ['temp', 'a3'] },
    ]);
  });

  it.each<[string, (transaction: Tree.ItemTransaction<Item>) => void]>([
    [
      'a move into an item the transaction adds',
      (transaction) => {
        transaction.add({ id: 'p', label: 'P', children: [] }, { after: 'c' });
        transaction.move('b1', { parentId: 'p' });
      },
    ],
    [
      'a move out of an item the transaction removes',
      (transaction) => {
        transaction.move('b1', { after: 'c' });
        transaction.remove('b');
      },
    ],
    [
      'a move out of an item that moves into an added item',
      (transaction) => {
        transaction.add({ id: 'p', label: 'P', children: [] }, { after: 'c' });
        transaction.move('b', { parentId: 'p' });
        transaction.move('b1', { parentId: null });
      },
    ],
    [
      'moves that leave an item at its starting index',
      (transaction) => {
        transaction.move('b', { before: 'a' });
        transaction.move('c', { before: 'b' });
      },
    ],
    [
      'moves of several items',
      (transaction) => {
        transaction.move(['a1', 'a3'], { parentId: 'a' });
        transaction.move('a2', { after: 'a1' });
      },
    ],
    [
      'insertions at the same index',
      (transaction) => {
        for (const id of ['x', 'y', 'z']) {
          transaction.add({ id, label: id.toUpperCase() }, { parentId: null, index: 0 });
        }
      },
    ],
    [
      'a replacement whose new child moves out',
      (transaction) => {
        transaction.set({ id: 'b', label: 'B', children: [{ id: 'b1', label: 'B1 renamed' }] });
        transaction.move('b1', { parentId: null });
      },
    ],
    [
      'an item removed and added again',
      (transaction) => {
        transaction.remove('a');
        transaction.add({ id: 'a', label: 'A again' }, { after: 'c' });
      },
    ],
  ])(
    'reports changes that rebuild the items when applied in order, after %s',
    async (_, record) => {
      const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
      const onItemsChange = vi.fn();
      await render(
        <UncontrolledTree
          initialItems={ITEMS}
          actionsRef={actionsRef}
          onItemsChange={onItemsChange}
        />,
      );

      await act(() => actionsRef.current!.applyTransaction(record));

      const [items, details] = onItemsChange.mock.calls[0];
      expect(applyChanges(ITEMS, details.changes)).toEqual(items);
    },
  );

  it('applies a patch that only sets a symbol key', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const marker = Symbol('marker');
    await render(<UncontrolledTree initialItems={ITEMS} actionsRef={actionsRef} />);

    await act(() =>
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.update('a', { [marker]: true } as Partial<Item>),
      ),
    );

    expect(Reflect.get(actionsRef.current!.getItemModel('a')!, marker)).toBe(true);
  });

  it('keeps the insertions around one that a duplicate ID rejects', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const onItemsChange = vi.fn();
    await render(
      <UncontrolledTree
        initialItems={ITEMS}
        actionsRef={actionsRef}
        onItemsChange={onItemsChange}
      />,
    );
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await act(() =>
      actionsRef.current!.applyTransaction((transaction) => {
        transaction.add({ id: 'x', label: 'X' }, { parentId: null, index: 0 });
        transaction.add({ id: 'y', label: 'Y' }, { parentId: null, index: 1 });
        transaction.add(
          { id: 'clash', label: 'Clash', children: [{ id: 'b1', label: 'B1 again' }] },
          { parentId: null, index: 2 },
        );
        transaction.add({ id: 'z', label: 'Z' }, { after: 'y' });
      }),
    );

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('ID "clash" whose descendants'));
    expect(actionsRef.current!.getChildIds(null)).toEqual(['x', 'y', 'z', 'a', 'b', 'c']);
    expect(onItemsChange).toHaveBeenCalledTimes(1);
    expect(onItemsChange.mock.calls[0][1].changes).toEqual([
      {
        type: 'add',
        items: [
          { id: 'x', label: 'X' },
          { id: 'y', label: 'Y' },
        ],
        parentId: null,
        index: 0,
      },
      { type: 'add', items: [{ id: 'z', label: 'Z' }], parentId: null, index: 2 },
    ]);
  });

  it('applies nothing when the callback throws', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const onItemsChange = vi.fn();
    const { container } = await render(
      <UncontrolledTree
        initialItems={ITEMS}
        actionsRef={actionsRef}
        onItemsChange={onItemsChange}
      />,
    );

    await expect(
      actionsRef.current!.applyTransaction((transaction) => {
        transaction.remove('a');
        throw new Error('Failed');
      }),
    ).rejects.toThrow('Failed');

    expect(onItemsChange).not.toHaveBeenCalled();
    expect(renderedItemIds(container)).toEqual(['a', 'a1', 'a2', 'a3', 'b', 'b1', 'b2', 'c']);
  });

  it('throws when the transaction is used after its callback returned', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    await render(<UncontrolledTree initialItems={ITEMS} actionsRef={actionsRef} />);

    let escaped!: Tree.ItemTransaction<Item>;
    await act(() =>
      actionsRef.current!.applyTransaction((transaction) => {
        escaped = transaction;
      }),
    );

    expect(() => escaped.remove('a')).toThrow('used after its callback returned');
    expect(actionsRef.current!.hasItem('a')).toBe(true);
  });

  it('replaces an item in place with set, along with its children', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const onItemsChange = vi.fn();
    await render(
      <Tree.Root
        defaultItems={ITEMS}
        actionsRef={actionsRef}
        onItemsChange={onItemsChange}
        selectionMode="multiple"
        defaultSelectedItems={['a1', 'a2']}
        defaultExpandedItems={['a']}
      >
        <TreeRows />
      </Tree.Root>,
    );
    const replacement: Item = {
      id: 'a',
      label: 'A again',
      children: [
        { id: 'a2', label: 'A2 again' },
        { id: 'new', label: 'New' },
      ],
    };

    await act(() =>
      actionsRef.current!.applyTransaction((transaction) => transaction.set(replacement)),
    );

    expect(actionsRef.current!.getChildIds(null)).toEqual(['a', 'b', 'c']);
    expect(actionsRef.current!.getChildIds('a')).toEqual(['a2', 'new']);
    expect(actionsRef.current!.getItemModel('a')).toBe(replacement);
    // A child the replacement drops leaves the selection, one it keeps stays.
    expect([...actionsRef.current!.getSelectedItemIds()]).toEqual(['a2']);

    onItemsChange.mockClear();
    await act(() =>
      actionsRef.current!.applyTransaction((transaction) => transaction.set(replacement)),
    );
    expect(onItemsChange).not.toHaveBeenCalled();
  });

  const itemX: Item = { id: 'x', label: 'X' };
  const itemY: Item = { id: 'y', label: 'Y' };
  it.each<[string, (transaction: Tree.ItemTransaction<Item>) => void, string[]]>([
    [
      'at consecutive indexes',
      (transaction) => {
        transaction.add(itemX, { parentId: null, index: 0 });
        transaction.add(itemY, { parentId: null, index: 1 });
      },
      ['x', 'y', 'a', 'b', 'c'],
    ],
    [
      'at the same index',
      (transaction) => {
        transaction.add(itemX, { parentId: null, index: 0 });
        transaction.add(itemY, { parentId: null, index: 0 });
      },
      ['y', 'x', 'a', 'b', 'c'],
    ],
    [
      'each after the previous one',
      (transaction) => {
        transaction.add(itemX, { after: 'a' });
        transaction.add(itemY, { after: 'x' });
      },
      ['a', 'x', 'y', 'b', 'c'],
    ],
    [
      'after the same item',
      (transaction) => {
        transaction.add(itemX, { after: 'a' });
        transaction.add(itemY, { after: 'a' });
      },
      ['a', 'y', 'x', 'b', 'c'],
    ],
    [
      'before the same item',
      (transaction) => {
        transaction.add(itemX, { before: 'b' });
        transaction.add(itemY, { before: 'b' });
      },
      ['a', 'x', 'y', 'b', 'c'],
    ],
    [
      'at the end',
      (transaction) => {
        transaction.add(itemX);
        transaction.add(itemY);
      },
      ['a', 'b', 'c', 'x', 'y'],
    ],
    [
      'past the end',
      (transaction) => {
        transaction.add(itemX, { parentId: null, index: 10 });
        transaction.add(itemY, { parentId: null, index: 11 });
      },
      ['a', 'b', 'c', 'x', 'y'],
    ],
    [
      'before the start',
      (transaction) => {
        transaction.add(itemX, { parentId: null, index: -1 });
        transaction.add(itemY, { parentId: null, index: -1 });
      },
      ['y', 'x', 'a', 'b', 'c'],
    ],
  ])('places insertions %s as if applied one at a time', async (_, record, expected) => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    await render(<UncontrolledTree initialItems={ITEMS} actionsRef={actionsRef} />);

    await act(() => actionsRef.current!.applyTransaction(record));

    expect(actionsRef.current!.getChildIds(null)).toEqual(expected);
  });
});

describe('transactionThrottle', () => {
  const { render: renderWithClock, clock } = createRenderer();
  clock.withFakeTimers();

  async function renderThrottled() {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const onItemsChange = vi.fn();
    const { unmount } = await renderWithClock(
      <Tree.Root
        defaultItems={ITEMS}
        actionsRef={actionsRef}
        onItemsChange={onItemsChange}
        transactionThrottle={100}
      >
        <TreeRows />
      </Tree.Root>,
    );
    const rename = (itemId: string, label: string) =>
      actionsRef.current!.applyTransaction((transaction) => transaction.update(itemId, { label }));
    return { actions: actionsRef, onItemsChange, rename, unmount };
  }

  it('commits the transactions within a window together when it ends', async () => {
    const { actions, onItemsChange, rename } = await renderThrottled();

    await act(() => rename('a', 'A renamed'));
    expect(onItemsChange).toHaveBeenCalledTimes(1);

    let held!: Promise<boolean>;
    act(() => {
      held = rename('b', 'B renamed');
      void rename('c', 'C renamed');
    });
    expect(onItemsChange).toHaveBeenCalledTimes(1);
    expect(actions.current!.getItemModel('b')?.label).toBe('B');

    act(() => clock.tick(100));
    expect(onItemsChange).toHaveBeenCalledTimes(2);
    expect(onItemsChange.mock.calls[1][1].changes).toEqual([
      {
        type: 'update',
        itemId: 'b',
        item: { id: 'b', label: 'B renamed', children: ITEMS[1].children },
      },
      { type: 'update', itemId: 'c', item: { id: 'c', label: 'C renamed' } },
    ]);
    expect(await held).toBe(true);
  });

  it('settles the held transactions when the tree unmounts', async () => {
    const { rename, unmount } = await renderThrottled();
    await act(() => rename('a', 'A renamed'));

    let held: Promise<boolean>[] = [];
    act(() => {
      held = [rename('b', 'B renamed'), rename('c', 'C renamed')];
    });
    unmount();

    expect(await Promise.all(held)).toEqual([false, false]);
  });

  it('rejects the held transactions when the change handler throws, then commits later ones', async () => {
    const { actions, onItemsChange, rename } = await renderThrottled();
    await act(() => rename('a', 'A renamed'));

    let held: Promise<boolean>[] = [];
    act(() => {
      held = [rename('b', 'B renamed'), rename('c', 'C renamed')];
    });
    onItemsChange.mockImplementationOnce(() => {
      throw new Error('Rejected');
    });
    act(() => clock.tick(100));
    const outcomes = await Promise.allSettled(held);
    expect(outcomes.map(({ status }) => status)).toEqual(['rejected', 'rejected']);

    act(() => clock.tick(100));
    await act(() => rename('b', 'B renamed again'));
    expect(actions.current!.getItemModel('b')?.label).toBe('B renamed again');
  });

  it('commits the held transactions at once with flushTransactions', async () => {
    const { actions, onItemsChange, rename } = await renderThrottled();
    await act(() => rename('a', 'A renamed'));

    act(() => {
      void rename('b', 'B renamed');
    });
    act(() => actions.current!.flushTransactions());

    expect(onItemsChange).toHaveBeenCalledTimes(2);
    expect(actions.current!.getItemModel('b')?.label).toBe('B renamed');
    act(() => clock.tick(100));
    expect(onItemsChange).toHaveBeenCalledTimes(2);
  });
});

describe('transaction.move', () => {
  it('moves a single item to a different parent', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const onItemsChange = vi.fn();
    await render(
      <TestTree initialItems={ITEMS} actionsRef={actionsRef} onItemsChange={onItemsChange} />,
    );

    await act(() =>
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.move('a1', { parentId: 'b', index: 2 }),
      ),
    );

    const result = onItemsChange.mock.calls[0][0] as Item[];
    expect(childIds(result, 'a')).toEqual(['a2', 'a3']);
    expect(childIds(result, 'b')).toEqual(['b1', 'b2', 'a1']);
  });

  it('moves a single item within the same parent (backward)', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const onItemsChange = vi.fn();
    await render(
      <TestTree initialItems={ITEMS} actionsRef={actionsRef} onItemsChange={onItemsChange} />,
    );

    await act(() =>
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.move('a3', { parentId: 'a', index: 0 }),
      ),
    );

    const result = onItemsChange.mock.calls[0][0] as Item[];
    expect(childIds(result, 'a')).toEqual(['a3', 'a1', 'a2']);
  });

  it('moves a single item to root level', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const onItemsChange = vi.fn();
    await render(
      <TestTree initialItems={ITEMS} actionsRef={actionsRef} onItemsChange={onItemsChange} />,
    );

    await act(() =>
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.move('a1', { parentId: null, index: 0 }),
      ),
    );

    const result = onItemsChange.mock.calls[0][0] as Item[];
    expect(childIds(result)).toEqual(['a1', 'a', 'b', 'c']);
    expect(childIds(result, 'a')).toEqual(['a2', 'a3']);
  });

  it('prunes descendants when parent and child are both selected', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const onItemsChange = vi.fn();
    await render(
      <TestTree initialItems={ITEMS} actionsRef={actionsRef} onItemsChange={onItemsChange} />,
    );

    await act(() =>
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.move(['a', 'a1'], { parentId: null, index: 2 }),
      ),
    );

    const result = onItemsChange.mock.calls[0][0] as Item[];
    expect(childIds(result)).toEqual(['b', 'a', 'c']);
    expect(childIds(result, 'a')).toEqual(['a1', 'a2', 'a3']);
  });

  it('preserves current tree order for multi-item moves regardless of input order', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const onItemsChange = vi.fn();
    await render(
      <TestTree initialItems={ITEMS} actionsRef={actionsRef} onItemsChange={onItemsChange} />,
    );

    // Reversed input (a selection stored in click order) must still land in tree order.
    await act(() =>
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.move(['a3', 'a1'], { parentId: 'b', index: 0 }),
      ),
    );

    const result = onItemsChange.mock.calls[0][0] as Item[];
    expect(childIds(result, 'a')).toEqual(['a2']);
    expect(childIds(result, 'b')).toEqual(['a1', 'a3', 'b1', 'b2']);
  });

  it('rejects moving an item onto itself (no cycle)', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const onItemsChange = vi.fn();
    await render(
      <TestTree initialItems={ITEMS} actionsRef={actionsRef} onItemsChange={onItemsChange} />,
    );

    await act(() =>
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.move('a', { parentId: 'a', index: 0 }),
      ),
    );

    expect(onItemsChange).not.toHaveBeenCalled();
  });

  it('rejects moving an item into its own descendant (no cycle)', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const onItemsChange = vi.fn();
    await render(
      <TestTree initialItems={ITEMS} actionsRef={actionsRef} onItemsChange={onItemsChange} />,
    );

    // 'a1' is a child of 'a'; moving 'a' under 'a1' would create a cycle.
    await act(() =>
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.move('a', { parentId: 'a1', index: 0 }),
      ),
    );

    expect(onItemsChange).not.toHaveBeenCalled();
  });
});

describe('transaction.move before an item', () => {
  it('moves a single item before a target', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const onItemsChange = vi.fn();
    await render(
      <TestTree initialItems={ITEMS} actionsRef={actionsRef} onItemsChange={onItemsChange} />,
    );

    await act(() =>
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.move('a1', { before: 'b2' }),
      ),
    );

    const result = onItemsChange.mock.calls[0][0] as Item[];
    expect(childIds(result, 'a')).toEqual(['a2', 'a3']);
    expect(childIds(result, 'b')).toEqual(['b1', 'a1', 'b2']);
  });

  it('moves multiple items before a target', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const onItemsChange = vi.fn();
    await render(
      <TestTree initialItems={ITEMS} actionsRef={actionsRef} onItemsChange={onItemsChange} />,
    );

    await act(() =>
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.move(['a1', 'a2'], { before: 'b1' }),
      ),
    );

    const result = onItemsChange.mock.calls[0][0] as Item[];
    expect(childIds(result, 'a')).toEqual(['a3']);
    expect(childIds(result, 'b')).toEqual(['a1', 'a2', 'b1', 'b2']);
  });
});

describe('transaction.move after an item', () => {
  it('moves a single item after a target', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const onItemsChange = vi.fn();
    await render(
      <TestTree initialItems={ITEMS} actionsRef={actionsRef} onItemsChange={onItemsChange} />,
    );

    await act(() =>
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.move('a1', { after: 'b1' }),
      ),
    );

    const result = onItemsChange.mock.calls[0][0] as Item[];
    expect(childIds(result, 'a')).toEqual(['a2', 'a3']);
    expect(childIds(result, 'b')).toEqual(['b1', 'a1', 'b2']);
  });

  it('moves a single item after the last root item', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const onItemsChange = vi.fn();
    await render(
      <TestTree initialItems={ITEMS} actionsRef={actionsRef} onItemsChange={onItemsChange} />,
    );

    await act(() =>
      actionsRef.current!.applyTransaction((transaction) => transaction.move('a1', { after: 'c' })),
    );

    const result = onItemsChange.mock.calls[0][0] as Item[];
    expect(childIds(result)).toEqual(['a', 'b', 'c', 'a1']);
  });
});

describe('transaction.update of the disabled state', () => {
  it('reports the update in details', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const onItemsChange = vi.fn();
    await render(
      <TestTree initialItems={ITEMS} actionsRef={actionsRef} onItemsChange={onItemsChange} />,
    );

    act(() => {
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.update('a1', { disabled: true }),
      );
    });

    expect(onItemsChange.mock.calls[0][1].changes).toEqual([
      { type: 'update', itemId: 'a1', item: { id: 'a1', label: 'A1', disabled: true } },
    ]);
  });
});

describe('transaction.update of the label', () => {
  it('reports the update in details', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const onItemsChange = vi.fn();
    await render(
      <TestTree initialItems={ITEMS} actionsRef={actionsRef} onItemsChange={onItemsChange} />,
    );

    act(() => {
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.update('a1', { label: 'New A1' }),
      );
    });

    expect(onItemsChange.mock.calls[0][1].changes).toEqual([
      { type: 'update', itemId: 'a1', item: { id: 'a1', label: 'New A1' } },
    ]);
  });
});

describe('mutations against the live tree', () => {
  it('demotes a parent after removing its last child', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const storeRef = React.createRef<TreeStore | null>();
    await render(
      <Tree.Root
        defaultItems={[
          { id: 'parent', label: 'Parent', children: [{ id: 'child', label: 'Child' }] },
        ]}
        actionsRef={actionsRef}
      >
        <TreeStoreTap storeRef={storeRef} />
        <Tree.List>
          {(item) => (
            <Tree.Item itemId={item.id}>
              <Tree.ItemContent>{item.label}</Tree.ItemContent>
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>,
    );

    act(() => {
      actionsRef.current!.applyTransaction((transaction) => transaction.remove('child'));
    });

    expect(storeRef.current!.state.itemMetaLookup[getItemIdKey('parent')].expandable).toBe(false);
  });

  it('keeps ancestor models current after adding and removing children', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    await render(<UncontrolledTree initialItems={ITEMS} actionsRef={actionsRef} />);

    await act(() =>
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.add({ id: 'a4', label: 'A4' }, { parentId: 'a', index: 3 }),
      ),
    );
    expect(actionsRef.current!.getItemModel('a')?.children?.map((item) => item.id)).toEqual([
      'a1',
      'a2',
      'a3',
      'a4',
    ]);

    act(() => {
      actionsRef.current!.applyTransaction((transaction) => transaction.remove('a2'));
    });
    expect(actionsRef.current!.getItemModel('a')?.children?.map((item) => item.id)).toEqual([
      'a1',
      'a3',
      'a4',
    ]);
  });

  it('renaming a parent after removing a child does not resurrect the child', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const { container } = await render(
      <UncontrolledTree initialItems={ITEMS} actionsRef={actionsRef} />,
    );

    act(() => {
      actionsRef.current!.applyTransaction((transaction) => transaction.remove('a1'));
    });
    expect(renderedItemIds(container)).toEqual(['a', 'a2', 'a3', 'b', 'b1', 'b2', 'c']);

    // A parent model embeds its children, so `itemModelLookup['a']` still holds
    // the pre-removal subtree. Renaming through it would splice `a1` back in.
    act(() => {
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.update('a', { label: 'A renamed' }),
      );
    });

    expect(renderedItemIds(container)).toEqual(['a', 'a2', 'a3', 'b', 'b1', 'b2', 'c']);
  });

  it('disabling a parent after removing a child does not resurrect the child', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const { container } = await render(
      <UncontrolledTree initialItems={ITEMS} actionsRef={actionsRef} />,
    );

    act(() => {
      actionsRef.current!.applyTransaction((transaction) => transaction.remove('b1'));
    });
    act(() => {
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.update('b', { disabled: true }),
      );
    });

    expect(renderedItemIds(container)).toEqual(['a', 'a1', 'a2', 'a3', 'b', 'b2', 'c']);
  });

  it('renaming a parent after adding a child keeps the child', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const onItemsChange = vi.fn();
    const { container } = await render(
      <UncontrolledTree
        initialItems={ITEMS}
        actionsRef={actionsRef}
        onItemsChange={onItemsChange}
      />,
    );

    await act(() =>
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.add({ id: 'a4', label: 'A4' }, { parentId: 'a', index: 3 }),
      ),
    );
    act(() => {
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.update('a', { label: 'A renamed' }),
      );
    });

    expect(renderedItemIds(container)).toEqual(['a', 'a1', 'a2', 'a3', 'a4', 'b', 'b1', 'b2', 'c']);
    // The reported payload has to agree with what is rendered, or a consumer
    // persisting it drops the item that is still on screen.
    const reported = onItemsChange.mock.calls.at(-1)![0] as Item[];
    expect(childIds(reported, 'a')).toEqual(['a1', 'a2', 'a3', 'a4']);
  });

  it('renames in an uncontrolled tree without a change handler', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    await render(<UncontrolledTree initialItems={ITEMS} actionsRef={actionsRef} />);

    act(() => {
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.update('a1', { label: 'Renamed A1' }),
      );
    });

    expect(screen.getByTestId('item-a1')).toHaveTextContent('Renamed A1');
  });

  it('drops duplicate ids from the items array, not just from the lookups', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const onItemsChange = vi.fn();
    const { container } = await render(
      <UncontrolledTree
        initialItems={ITEMS}
        actionsRef={actionsRef}
        onItemsChange={onItemsChange}
      />,
    );

    // `a1` already exists: the lookups refuse the duplicate, so the items array
    // must refuse it too or the two describe different trees.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await act(() =>
      actionsRef.current!.applyTransaction((transaction) => {
        transaction.add({ id: 'a1', label: 'Duplicate' }, { before: 'a' });
        transaction.add({ id: 'd', label: 'D' }, { before: 'a' });
      }),
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('ID "a1", which already exists'));

    expect(renderedItemIds(container)).toEqual(['d', 'a', 'a1', 'a2', 'a3', 'b', 'b1', 'b2', 'c']);
    const reported = onItemsChange.mock.calls.at(-1)![0] as Item[];
    expect(childIds(reported)).toEqual(['d', 'a', 'b', 'c']);
  });

  it('rejects an incoming subtree when any descendant id is duplicated', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const onItemsChange = vi.fn();
    const { container } = await render(
      <UncontrolledTree
        initialItems={ITEMS}
        actionsRef={actionsRef}
        onItemsChange={onItemsChange}
      />,
    );

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await act(() =>
      actionsRef.current!.applyTransaction((transaction) => {
        transaction.add(
          { id: 'rejected', label: 'Rejected', children: [{ id: 'a1', label: 'Duplicate' }] },
          { before: 'a' },
        );
        transaction.add(
          {
            id: 'also-rejected',
            label: 'Also rejected',
            children: [
              { id: 'within', label: 'First' },
              { id: 'within', label: 'Second' },
            ],
          },
          { before: 'a' },
        );
        transaction.add({ id: 'accepted', label: 'Accepted' }, { before: 'a' });
      }),
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('ID "rejected" whose descendants'));
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('ID "also-rejected" whose descendants'),
    );

    expect(renderedItemIds(container)).toEqual([
      'accepted',
      'a',
      'a1',
      'a2',
      'a3',
      'b',
      'b1',
      'b2',
      'c',
    ]);
    expect(childIds(onItemsChange.mock.calls.at(-1)![0] as Item[])).toEqual([
      'accepted',
      'a',
      'b',
      'c',
    ]);
    expect(actionsRef.current!.getParentId('a1')).toBe('a');
  });
});

describe('removal selection/expansion pruning', () => {
  it.each<[string, (transaction: Tree.ItemTransaction<Item>) => void, string]>([
    ['removing the selected item', (transaction) => transaction.remove('selected'), 'other'],
    [
      'replacing the selected item',
      (transaction) => {
        transaction.remove('selected');
        transaction.remove('other');
        transaction.remove('fallback');
        transaction.add({ id: 'added', label: 'Added' });
      },
      'added',
    ],
    [
      'disabling the first remaining item while removing the selected one',
      (transaction) => {
        transaction.remove('selected');
        transaction.update('other', { disabled: true });
      },
      'fallback',
    ],
  ])('preserves a required selection when %s', async (_, edit, expected) => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const onSelectedItemsChange = vi.fn();
    await render(
      <Tree.Root
        defaultItems={[
          { id: 'selected', label: 'Selected' },
          { id: 'other', label: 'Other' },
          { id: 'fallback', label: 'Fallback' },
        ]}
        actionsRef={actionsRef}
        defaultSelectedItems="selected"
        disableEmptySelection
        onSelectedItemsChange={onSelectedItemsChange}
      >
        <Tree.List>
          {(item) => (
            <Tree.Item itemId={item.id} data-testid={`item-${item.id}`}>
              <Tree.ItemContent>{item.label}</Tree.ItemContent>
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>,
    );

    act(() => {
      actionsRef.current!.applyTransaction(edit);
    });

    expect(screen.getByTestId(`item-${expected}`)).toHaveAttribute('aria-selected', 'true');
    expect(onSelectedItemsChange).toHaveBeenLastCalledWith(expected, expect.anything());
  });

  it('does not prune interaction state when controlled items reject the proposal', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const onItemsChange = vi.fn();
    const onSelectedItemsChange = vi.fn();
    const onExpandedItemsChange = vi.fn();
    await render(
      <Tree.Root
        items={ITEMS}
        onItemsChange={onItemsChange}
        actionsRef={actionsRef}
        selectionMode="multiple"
        defaultSelectedItems={['a']}
        defaultExpandedItems={['a']}
        onSelectedItemsChange={onSelectedItemsChange}
        onExpandedItemsChange={onExpandedItemsChange}
      >
        <Tree.List>
          {(item) => (
            <Tree.Item itemId={item.id} data-testid={`item-${item.id}`}>
              <Tree.ItemContent>{item.label}</Tree.ItemContent>
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>,
    );

    act(() => {
      actionsRef.current!.applyTransaction((transaction) => transaction.remove('a'));
    });

    expect(onItemsChange).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('item-a')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('item-a')).toHaveAttribute('aria-expanded', 'true');
    expect(onSelectedItemsChange).not.toHaveBeenCalled();
    expect(onExpandedItemsChange).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    'prunes interaction state when controlled items accept the proposal, flushSync: %s',
    async (sync) => {
      const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
      const onSelectedItemsChange = vi.fn();
      const onExpandedItemsChange = vi.fn();

      function App() {
        const [items, setItems] = React.useState(ITEMS);
        return (
          <Tree.Root
            items={items}
            onItemsChange={(next) =>
              sync ? ReactDOM.flushSync(() => setItems(next)) : setItems(next)
            }
            actionsRef={actionsRef}
            selectionMode="multiple"
            defaultSelectedItems={['a']}
            defaultExpandedItems={['a']}
            onSelectedItemsChange={onSelectedItemsChange}
            onExpandedItemsChange={onExpandedItemsChange}
          >
            <Tree.List>
              {(item) => (
                <Tree.Item itemId={item.id} data-testid={`item-${item.id}`}>
                  <Tree.ItemContent>{item.label}</Tree.ItemContent>
                </Tree.Item>
              )}
            </Tree.List>
          </Tree.Root>
        );
      }

      await render(<App />);
      act(() => {
        actionsRef.current!.applyTransaction((transaction) => transaction.remove('a'));
      });

      expect(screen.queryByTestId('item-a')).toBeNull();
      expect(onSelectedItemsChange).toHaveBeenLastCalledWith(
        [],
        expect.objectContaining({ reason: 'missing' }),
      );
      expect(onExpandedItemsChange).toHaveBeenLastCalledWith(
        [],
        expect.objectContaining({ reason: 'missing' }),
      );
    },
  );

  it('accepts a controlled proposal returned as equivalent cloned models', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const onSelectedItemsChange = vi.fn();
    const onExpandedItemsChange = vi.fn();

    function App() {
      const [items, setItems] = React.useState(ITEMS);
      return (
        <Tree.Root
          items={items}
          onItemsChange={(nextItems) =>
            setItems(
              nextItems.map((item) => ({
                ...item,
                children: item.children?.map((child) => ({ ...child })),
              })),
            )
          }
          actionsRef={actionsRef}
          selectionMode="multiple"
          defaultSelectedItems={['a']}
          defaultExpandedItems={['a']}
          onSelectedItemsChange={onSelectedItemsChange}
          onExpandedItemsChange={onExpandedItemsChange}
        >
          <Tree.List>
            {(item) => (
              <Tree.Item itemId={item.id} data-testid={`item-${item.id}`}>
                <Tree.ItemContent>{item.label}</Tree.ItemContent>
              </Tree.Item>
            )}
          </Tree.List>
        </Tree.Root>
      );
    }

    await render(<App />);
    act(() => {
      actionsRef.current!.applyTransaction((transaction) => transaction.remove('a'));
    });

    expect(screen.queryByTestId('item-a')).toBeNull();
    expect(onSelectedItemsChange).toHaveBeenLastCalledWith([], expect.anything());
    expect(onExpandedItemsChange).toHaveBeenLastCalledWith([], expect.anything());
  });

  it('selects descendants added under a selected parent', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const onSelectedItemsChange = vi.fn();
    await render(
      <Tree.Root
        defaultItems={ITEMS}
        actionsRef={actionsRef}
        selectionMode="multiple"
        defaultSelectedItems={['a']}
        checkboxSelectionPropagation={{ descendants: true }}
        onSelectedItemsChange={onSelectedItemsChange}
      >
        <Tree.List>
          {(item) => (
            <Tree.Item itemId={item.id}>
              <Tree.ItemContent>{item.label}</Tree.ItemContent>
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>,
    );

    await act(() =>
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.add({ id: 'a4', label: 'A4' }, { parentId: 'a', index: 3 }),
      ),
    );

    expect(new Set(onSelectedItemsChange.mock.calls.at(-1)![0])).toEqual(
      new Set(['a', 'a1', 'a2', 'a3', 'a4']),
    );
  });

  it('selects a parent when removing its only unselected child', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const onSelectedItemsChange = vi.fn();
    await render(
      <Tree.Root
        defaultItems={[
          {
            id: 'parent',
            label: 'Parent',
            children: [
              { id: 'selected', label: 'Selected' },
              { id: 'unselected', label: 'Unselected' },
            ],
          },
        ]}
        actionsRef={actionsRef}
        selectionMode="multiple"
        defaultSelectedItems={['selected']}
        checkboxSelectionPropagation={{ parents: true }}
        onSelectedItemsChange={onSelectedItemsChange}
      >
        <Tree.List>
          {(item) => (
            <Tree.Item itemId={item.id}>
              <Tree.ItemContent>{item.label}</Tree.ItemContent>
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>,
    );

    act(() => {
      actionsRef.current!.applyTransaction((transaction) => transaction.remove('unselected'));
    });

    expect(new Set(onSelectedItemsChange.mock.calls.at(-1)![0])).toEqual(
      new Set(['selected', 'parent']),
    );
  });

  it('fires the change callbacks with the pruned models', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const onSelectedItemsChange = vi.fn();
    const onExpandedItemsChange = vi.fn();
    await render(
      <Tree.Root
        defaultItems={ITEMS}
        actionsRef={actionsRef}
        selectionMode="multiple"
        // `gone` is not an item, but a removal that names it drops it too.
        defaultSelectedItems={['a1', 'c', 'gone']}
        defaultExpandedItems={['a', 'b', 'gone']}
        onSelectedItemsChange={onSelectedItemsChange}
        onExpandedItemsChange={onExpandedItemsChange}
      >
        <Tree.List>
          {(item) => (
            <Tree.Item itemId={item.id} data-testid={`item-${item.id}`}>
              <Tree.ItemContent>{item.label}</Tree.ItemContent>
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>,
    );

    act(() => {
      actionsRef.current!.applyTransaction((transaction) => {
        transaction.remove('a');
        transaction.remove('c');
        transaction.remove('gone');
      });
    });

    // Pruning used to write straight into store state, leaving a consumer
    // mirroring the selection permanently out of date.
    expect(onSelectedItemsChange).toHaveBeenCalledTimes(1);
    expect(onSelectedItemsChange.mock.calls[0][0]).toEqual([]);
    expect(onExpandedItemsChange).toHaveBeenCalledTimes(1);
    expect(onExpandedItemsChange.mock.calls[0][0]).toEqual(['b']);
  });

  it('does not write the internal model while the selection is controlled', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const storeRef = React.createRef<TreeStore | null>();
    const onSelectedItemsChange = vi.fn();
    await render(
      <Tree.Root
        defaultItems={ITEMS}
        actionsRef={actionsRef}
        selectionMode="multiple"
        selectedItems={['a1', 'b1']}
        defaultExpandedItems={['a', 'b']}
        onSelectedItemsChange={onSelectedItemsChange}
      >
        <TreeStoreTap storeRef={storeRef} />
        <Tree.List>
          {(item) => (
            <Tree.Item itemId={item.id} data-testid={`item-${item.id}`}>
              <Tree.ItemContent>{item.label}</Tree.ItemContent>
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>,
    );

    act(() => {
      actionsRef.current!.applyTransaction((transaction) => transaction.remove('a1'));
    });

    expect(onSelectedItemsChange).toHaveBeenCalledTimes(1);
    expect(onSelectedItemsChange.mock.calls[0][0]).toEqual(['b1']);
    // The prop still says `['a1', 'b1']`, and a controlled model is the parent's to move.
    expect(storeRef.current!.state.selectedItems).toEqual(['a1', 'b1']);
    expect(screen.getByTestId('item-b1')).toHaveAttribute('aria-selected', 'true');
  });

  it('does not include an ignored removal in a later controlled rename', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const onItemsChange = vi.fn();
    function App() {
      const [items, setItems] = React.useState(ITEMS);
      return (
        <Tree.Root
          items={items}
          actionsRef={actionsRef}
          onItemsChange={(nextItems, details) => {
            onItemsChange(nextItems);
            if (details.changes.some((change) => change.type === 'update')) {
              setItems(nextItems);
            }
          }}
        >
          <Tree.List>
            {(item) => (
              <Tree.Item itemId={item.id}>
                <Tree.ItemContent>{item.label}</Tree.ItemContent>
              </Tree.Item>
            )}
          </Tree.List>
        </Tree.Root>
      );
    }
    await render(<App />);
    await act(async () =>
      actionsRef.current!.applyTransaction((transaction) => transaction.remove('a')),
    );
    expect(actionsRef.current!.getItemModel('a')).toBe(ITEMS[0]);

    await act(async () =>
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.update('b', { label: 'Renamed B' }),
      ),
    );

    expect(onItemsChange.mock.calls[1][0].map((item: Item) => item.id)).toEqual(['a', 'b', 'c']);
    expect(actionsRef.current!.getItemModel('a')).toBe(ITEMS[0]);
    expect(actionsRef.current!.getItemModel('b')?.label).toBe('Renamed B');
  });

  it('keeps the state of an item that a later controlled mutation in the same event adds back', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const item: Item = { id: 'a', label: 'A', children: [{ id: 'a1', label: 'A1' }] };

    function App() {
      const [items, setItems] = React.useState<Item[]>([item]);
      return (
        <Tree.Root
          items={items}
          onItemsChange={setItems}
          actionsRef={actionsRef}
          defaultSelectedItems="a"
          defaultExpandedItems={['a']}
        >
          <Tree.List>
            {(row) => (
              <Tree.Item itemId={row.id} data-testid={`item-${row.id}`}>
                <Tree.ItemContent>{row.label}</Tree.ItemContent>
              </Tree.Item>
            )}
          </Tree.List>
        </Tree.Root>
      );
    }

    await render(<App />);
    act(() => {
      actionsRef.current!.applyTransaction((transaction) => transaction.remove('a'));
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.add(item, { parentId: null, index: 0 }),
      );
    });

    expect(screen.getByTestId('item-a')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('item-a')).toHaveAttribute('aria-expanded', 'true');
  });

  it('composes controlled mutations dispatched in the same event', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();

    function App() {
      const [items, setItems] = React.useState<Item[]>([]);
      return (
        <Tree.Root items={items} onItemsChange={setItems} actionsRef={actionsRef}>
          <Tree.List>
            {(item) => (
              <Tree.Item itemId={item.id} data-testid={`item-${item.id}`}>
                <Tree.ItemContent>{item.label}</Tree.ItemContent>
              </Tree.Item>
            )}
          </Tree.List>
        </Tree.Root>
      );
    }

    await render(<App />);
    act(() => {
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.add({ id: 'a', label: 'A' }, { parentId: null, index: 0 }),
      );
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.add({ id: 'b', label: 'B' }, { parentId: null, index: 1 }),
      );
    });

    expect(screen.getAllByRole('row').map((item) => item.dataset.itemId)).toEqual(['a', 'b']);
  });
});

describe('lookups tolerate Object.prototype ids', () => {
  it('renders and navigates a tree whose ids collide with Object.prototype', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const colliding: Item[] = [
      { id: 'constructor', label: 'Constructor' },
      { id: 'toString', label: 'To string', children: [{ id: 'hasOwnProperty', label: 'Own' }] },
    ];
    const { container } = await render(
      <Tree.Root
        defaultItems={colliding}
        actionsRef={actionsRef}
        defaultExpandedItems={['toString']}
      >
        <Tree.List>
          {(item) => (
            <Tree.Item itemId={item.id} data-testid={`item-${item.id}`}>
              <Tree.ItemContent>
                {item.label}
                <Tree.ItemIndentGuide />
              </Tree.ItemContent>
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>,
    );

    // A plain `{}` lookup hands back a function for these keys, which crashed
    // typeahead and the indent guide.
    expect(renderedItemIds(container)).toEqual(['constructor', 'toString', 'hasOwnProperty']);

    act(() => {
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.update('constructor', { label: 'Renamed' }),
      );
    });
    expect(screen.getByTestId('item-constructor')).toHaveTextContent('Renamed');
  });
});

describe('indent guide lookup scalability', () => {
  it('computes flags lazily for a deep item without recursively walking the tree', async () => {
    const storeRef = React.createRef<TreeStore | null>();
    const depth = 5000;
    const itemMetaLookup: TreeStore['state']['itemMetaLookup'] = Object.create(null);
    const itemOrderedChildrenIdsLookup: TreeStore['state']['itemOrderedChildrenIdsLookup'] =
      Object.create(null);

    for (let index = 0; index < depth; index += 1) {
      const itemId = `item-${index}`;
      const parentId = index === 0 ? null : `item-${index - 1}`;
      itemMetaLookup[getItemIdKey(itemId)] = {
        id: itemId,
        parentId,
        level: index + 1,
        expandable: index < depth - 1,
        disabled: false,
        resolvedDisabled: false,
        selectable: true,
        label: itemId,
      };
      itemOrderedChildrenIdsLookup[getParentKey(parentId)] = [itemId];
    }

    await render(
      <Tree.Root defaultItems={[]}>
        <TreeStoreTap storeRef={storeRef} />
      </Tree.Root>,
    );
    act(() => {
      storeRef.current!.update({ itemMetaLookup, itemOrderedChildrenIdsLookup });
    });

    const flags = selectAncestorLastChildFlags(storeRef.current!.state, `item-${depth - 1}`);
    expect(flags).toHaveLength(depth - 1);
    expect(flags.every(Boolean)).toBe(true);
  });
});

describe('controlled mutation lookup reuse', () => {
  it.each(['exact', 'cloned', 'accessors changed', 'lookups changed'] as const)(
    'accepts a delayed proposal with %s input',
    async (mode) => {
      const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
      const storeRef = React.createRef<TreeStore | null>();
      const onItemsChange = vi.fn();
      const getLabel = vi.fn((item: Item) => item.label);
      const getId = (item: Item) => item.id;
      const getChildren = (item: Item) => item.children;
      const collection = (items: Item[], labelAccessor = getLabel) =>
        Tree.createItems(items, { getId, getChildren, getLabel: labelAccessor });
      function App({ items }: { items: Tree.ItemCollection<Item> }) {
        return (
          <Tree.Root items={items} actionsRef={actionsRef} onItemsChange={onItemsChange}>
            <TreeStoreTap storeRef={storeRef} />
            <Tree.List>
              {(item) => (
                <Tree.Item itemId={item.id}>
                  <Tree.ItemContent>{item.label}</Tree.ItemContent>
                </Tree.Item>
              )}
            </Tree.List>
          </Tree.Root>
        );
      }
      const { rerender } = await render(<App items={collection(ITEMS)} />);
      act(() => {
        actionsRef.current!.applyTransaction((transaction) =>
          transaction.update('c', { label: 'Renamed' }),
        );
      });
      expect(screen.getByRole('row', { name: 'C' })).toBeVisible();
      expect(screen.queryByRole('row', { name: 'Renamed' })).toBeNull();
      const proposed = onItemsChange.mock.calls[0][0] as Item[];
      if (mode === 'lookups changed') {
        act(() =>
          storeRef.current!.update({
            itemMetaLookup: { ...storeRef.current!.state.itemMetaLookup },
          }),
        );
      }
      getLabel.mockClear();
      const changedLabel = vi.fn((item: Item) => `${item.label}!`);
      await rerender(
        <App
          items={collection(
            mode === 'cloned' ? proposed.slice() : proposed,
            mode === 'accessors changed' ? changedLabel : getLabel,
          )}
        />,
      );
      expect(
        screen.getByRole('row', { name: mode === 'accessors changed' ? 'Renamed!' : 'Renamed' }),
      ).toBeVisible();
      const reader = mode === 'accessors changed' ? changedLabel : getLabel;
      expect(reader.mock.calls.length > 0).toBe(mode !== 'exact');
    },
  );
});

describe('mutations run from onItemsChange', () => {
  it('keeps the state of items that a mutation run from its callback did not remove', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    function App() {
      const [items, setItems] = React.useState<Item[]>([
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B', children: [{ id: 'd', label: 'D' }] },
      ]);
      const nested = React.useRef(false);
      return (
        <Tree.Root
          items={items}
          actionsRef={actionsRef}
          defaultExpandedItems={['b']}
          defaultSelectedItems={['b']}
          selectionMode="multiple"
          onItemsChange={(next) => {
            // The rename's own items win over the removal run from its callback.
            if (!nested.current) {
              nested.current = true;
              actionsRef.current!.applyTransaction((transaction) => transaction.remove('b'));
              nested.current = false;
            }
            setItems(next);
          }}
        >
          <TreeRows />
        </Tree.Root>
      );
    }
    await render(<App />);

    act(() => {
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.update('a', { label: 'Renamed' }),
      );
    });

    expect(screen.getByTestId('item-a')).toHaveTextContent('Renamed');
    expect(actionsRef.current!.isItemExpanded('b')).toBe(true);
    expect([...actionsRef.current!.getSelectedItemIds()]).toEqual(['b']);
  });
});

function TreeRows() {
  return (
    <Tree.List>
      {(item) => (
        <Tree.Item itemId={item.id} data-testid={`item-${item.id}`}>
          <Tree.ItemContent>{item.label}</Tree.ItemContent>
        </Tree.Item>
      )}
    </Tree.List>
  );
}

describe('onItemsChange details', () => {
  it('reports the inserted items with their index, skipping duplicates', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const onItemsChange = vi.fn();
    await render(
      <TestTree initialItems={ITEMS} actionsRef={actionsRef} onItemsChange={onItemsChange} />,
    );

    const d = { id: 'd', label: 'D' };
    const itemE = { id: 'e', label: 'E', children: [{ id: 'e1', label: 'E1' }] };
    // Logged once per file: the duplicate's warning is asserted elsewhere.
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await act(() =>
      actionsRef.current!.applyTransaction((transaction) => {
        transaction.add({ id: 'a1', label: 'Duplicate' }, { before: 'b' });
        transaction.add(d, { before: 'b' });
        transaction.add(itemE, { before: 'b' });
      }),
    );

    const details = onItemsChange.mock.calls[0][1];
    expect(details.reason).toBe('imperative-action');
    expect(details.changes).toEqual([{ type: 'add', items: [d, itemE], parentId: null, index: 1 }]);
    expect(childIds(onItemsChange.mock.calls[0][0])).toEqual(['a', 'd', 'e', 'b', 'c']);
  });

  it('reports each removed subtree root, leaving its descendants implied', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const onItemsChange = vi.fn();
    await render(
      <TestTree initialItems={ITEMS} actionsRef={actionsRef} onItemsChange={onItemsChange} />,
    );

    act(() => {
      actionsRef.current!.applyTransaction((transaction) => {
        transaction.remove('a');
        transaction.remove('a1');
        transaction.remove('b2');
      });
    });

    expect(onItemsChange.mock.calls[0][1].changes).toEqual([
      { type: 'remove', itemIds: ['a', 'b2'] },
    ]);
    expect(childIds(onItemsChange.mock.calls[0][0])).toEqual(['b', 'c']);
  });

  it('reports a forward move within a parent with its index once the item left', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const onItemsChange = vi.fn();
    await render(
      <TestTree initialItems={ITEMS} actionsRef={actionsRef} onItemsChange={onItemsChange} />,
    );

    await act(() =>
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.move('a1', { parentId: 'a', index: 2 }),
      ),
    );

    expect(onItemsChange.mock.calls[0][1].changes).toEqual([
      { type: 'move', itemIds: ['a1'], parentId: 'a', index: 1 },
    ]);
    expect(childIds(onItemsChange.mock.calls[0][0], 'a')).toEqual(['a2', 'a1', 'a3']);
  });
});

describe('invalid mutations', () => {
  it.each<[string, (actions: Tree.Root.Actions<Item>) => unknown, string[]]>([
    [
      'removing an unknown id',
      (actions) => actions.applyTransaction((transaction) => transaction.remove('nope')),
      [],
    ],
    ['an empty transaction', (actions) => actions.applyTransaction(() => {}), []],
    [
      'adding only duplicates',
      (actions) =>
        actions.applyTransaction((transaction) => {
          transaction.add({ id: 'a', label: 'A again' }, { parentId: null, index: 0 });
          transaction.add({ id: 'b1', label: 'B1 again' }, { parentId: null, index: 1 });
        }),
      ['ID "a", which already exists', 'ID "b1", which already exists'],
    ],
    [
      'adding under an unknown parent',
      (actions) =>
        actions.applyTransaction((transaction) =>
          transaction.add({ id: 'x', label: 'X' }, { parentId: 'unknown-parent', index: 0 }),
        ),
      ['under ID "unknown-parent"'],
    ],
    [
      'moving an unknown id',
      (actions) =>
        actions.applyTransaction((transaction) =>
          transaction.move('nope', { parentId: null, index: 0 }),
        ),
      [],
    ],
    [
      'moving before an unknown reference',
      (actions) =>
        actions.applyTransaction((transaction) =>
          transaction.move('a1', { before: 'unknown-before' }),
        ),
      ['under ID "unknown-before"'],
    ],
    [
      'moving after an unknown reference',
      (actions) =>
        actions.applyTransaction((transaction) =>
          transaction.move('a1', { after: 'unknown-after' }),
        ),
      ['under ID "unknown-after"'],
    ],
    [
      'updating an unknown id',
      (actions) =>
        actions.applyTransaction((transaction) =>
          transaction.update('unknown-update', { label: 'Nope' }),
        ),
      ['patch for ID "unknown-update"'],
    ],
    [
      'changing the id of an item',
      (actions) =>
        actions.applyTransaction((transaction) => transaction.update('a1', { id: 'renamed' })),
      ['changed the ID of the item with ID "a1"'],
    ],
  ])('ignores %s', async (_, run, warnings) => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const onItemsChange = vi.fn();
    const { container } = await render(
      <UncontrolledTree
        initialItems={ITEMS}
        actionsRef={actionsRef}
        onItemsChange={onItemsChange}
      />,
    );

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await act(async () => {
      await run(actionsRef.current!);
    });

    expect(warn.mock.calls.map(([message]) => message)).toEqual(
      warnings.map((warning) => expect.stringContaining(warning)),
    );
    expect(onItemsChange).not.toHaveBeenCalled();
    expect(renderedItemIds(container)).toEqual(['a', 'a1', 'a2', 'a3', 'b', 'b1', 'b2', 'c']);
  });

  it('warns and changes nothing when controlled items have no change handler', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
      const { container } = await render(
        <Tree.Root items={ITEMS} actionsRef={actionsRef} defaultExpandedItems={['a', 'b']}>
          <TreeRows />
        </Tree.Root>,
      );

      act(() => {
        actionsRef.current!.applyTransaction((transaction) => transaction.remove('a'));
      });

      expect(renderedItemIds(container)).toEqual(['a', 'a1', 'a2', 'a3', 'b', 'b1', 'b2', 'c']);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('no `onItemsChange` handler'));
    } finally {
      warn.mockRestore();
    }
  });
});

describe('disabled state updates cascade', () => {
  it('disables descendants, re-enables them, and ignores a no-op', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const onItemsChange = vi.fn();
    await render(
      <UncontrolledTree
        initialItems={ITEMS}
        actionsRef={actionsRef}
        onItemsChange={onItemsChange}
      />,
    );

    act(() => {
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.update('a', { disabled: true }),
      );
    });
    for (const id of ['a', 'a1', 'a2', 'a3']) {
      expect(screen.getByTestId(`item-${id}`)).toHaveAttribute('aria-disabled', 'true');
    }
    expect(screen.getByTestId('item-b')).not.toHaveAttribute('aria-disabled');

    act(() => {
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.update('a', { disabled: false }),
      );
    });
    for (const id of ['a', 'a1', 'a2', 'a3']) {
      expect(screen.getByTestId(`item-${id}`)).not.toHaveAttribute('aria-disabled');
    }

    onItemsChange.mockClear();
    act(() => {
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.update('a', { disabled: false }),
      );
    });
    expect(onItemsChange).not.toHaveBeenCalled();
  });

  it('keeps a child disabled on its own when its parent is re-enabled', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    await render(<UncontrolledTree initialItems={ITEMS} actionsRef={actionsRef} />);

    act(() => {
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.update('a2', { disabled: true }),
      );
    });
    act(() => {
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.update('a', { disabled: true }),
      );
    });
    act(() => {
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.update('a', { disabled: false }),
      );
    });

    expect(screen.getByTestId('item-a1')).not.toHaveAttribute('aria-disabled');
    expect(screen.getByTestId('item-a2')).toHaveAttribute('aria-disabled', 'true');
  });
});

describe('metadata after a cross-parent move', () => {
  it('updates level, expandability and inherited disabled state', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const items: Item[] = [
      ...ITEMS.slice(0, 2),
      { id: 'c', label: 'C', children: [{ id: 'c1', label: 'C1' }] },
    ];
    await render(
      <Tree.Root
        defaultItems={items}
        actionsRef={actionsRef}
        defaultExpandedItems={['a', 'b', 'c']}
      >
        <TreeRows />
      </Tree.Root>,
    );
    act(() => {
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.update('b', { disabled: true }),
      );
    });

    await act(() =>
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.move('c', { parentId: 'b', index: 0 }),
      ),
    );
    expect(screen.getByTestId('item-c')).toHaveAttribute('aria-level', '2');
    expect(screen.getByTestId('item-c1')).toHaveAttribute('aria-level', '3');
    expect(screen.getByTestId('item-c')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByTestId('item-c1')).toHaveAttribute('aria-disabled', 'true');

    await act(() =>
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.move(['a1', 'a2', 'a3'], { parentId: null, index: 0 }),
      ),
    );
    expect(screen.getByTestId('item-a')).not.toHaveAttribute('aria-expanded');
    expect(screen.getByTestId('item-a1')).toHaveAttribute('aria-level', '1');
    expect(screen.getByTestId('item-a1')).not.toHaveAttribute('aria-disabled');
  });
});

describe('selection pruning', () => {
  it('falls back to the first enabled item in multiple mode with disableEmptySelection', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const onSelectedItemsChange = vi.fn();
    await render(
      <Tree.Root
        defaultItems={[
          { id: 'x', label: 'X' },
          { id: 'y', label: 'Y', disabled: true } as Item,
          { id: 'z', label: 'Z' },
        ]}
        actionsRef={actionsRef}
        selectionMode="multiple"
        defaultSelectedItems={['x']}
        disableEmptySelection
        onSelectedItemsChange={onSelectedItemsChange}
      >
        <TreeRows />
      </Tree.Root>,
    );

    act(() => {
      actionsRef.current!.applyTransaction((transaction) => transaction.remove('x'));
    });

    expect(onSelectedItemsChange).toHaveBeenLastCalledWith(['z'], expect.anything());
    expect(screen.getByTestId('item-z')).toHaveAttribute('aria-selected', 'true');
  });

  it('prunes a delayed controlled removal against the selection at acceptance', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    const onSelectedItemsChange = vi.fn();
    let acceptProposal: (() => void) | undefined;
    const initialItems: Item[] = [
      { id: 'x', label: 'X' },
      { id: 'y', label: 'Y' },
      { id: 'z', label: 'Z' },
    ];

    function App() {
      const [items, setItems] = React.useState(initialItems);
      return (
        <Tree.Root
          items={items}
          onItemsChange={(nextItems) => {
            acceptProposal = () => setItems(nextItems);
          }}
          actionsRef={actionsRef}
          selectionMode="multiple"
          defaultSelectedItems={['x', 'z']}
          onSelectedItemsChange={onSelectedItemsChange}
        >
          <TreeRows />
        </Tree.Root>
      );
    }

    await render(<App />);
    act(() => {
      actionsRef.current!.applyTransaction((transaction) => transaction.remove('x'));
    });
    act(() => actionsRef.current!.setItemSelection('y', true));
    act(() => acceptProposal!());

    expect(screen.queryByTestId('item-x')).toBeNull();
    expect(new Set(onSelectedItemsChange.mock.lastCall![0])).toEqual(new Set(['y', 'z']));
    expect(screen.getByTestId('item-y')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('item-z')).toHaveAttribute('aria-selected', 'true');
  });
});

describe('wide item mutations', () => {
  it('adds and moves more siblings than a call accepts as arguments', async () => {
    const width = 200_000;
    const wide = Array.from({ length: width }, (_, index) => ({
      id: `wide-${index}`,
      label: `Wide ${index}`,
    }));
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    await render(
      <UncontrolledTree
        initialItems={[
          { id: 'source', label: 'Source', children: [] },
          { id: 'target', label: 'Target', children: [{ id: 'kept', label: 'Kept' }] },
        ]}
        actionsRef={actionsRef}
      />,
    );

    await act(async () => {
      await actionsRef.current!.applyTransaction((transaction) =>
        wide.forEach((item, offset) =>
          transaction.add(item, { parentId: 'source', index: 0 + offset }),
        ),
      );
    });
    await act(async () => {
      await actionsRef.current!.applyTransaction((transaction) =>
        transaction.move(
          wide.map((item) => item.id),
          { parentId: 'target', index: 1 },
        ),
      );
    });

    const children = actionsRef.current!.getChildIds('target');
    expect(children).toHaveLength(width + 1);
    expect(children[0]).toBe('kept');
    expect(children[width]).toBe(`wide-${width - 1}`);
  }, 20_000);
});

describe('deep item mutations', () => {
  it('accepts an equivalent cloned controlled hierarchy deeper than the call stack', async () => {
    const depth = 10000;
    let initial: Item = { id: String(depth), label: String(depth) };
    for (let index = depth - 1; index >= 0; index -= 1) {
      initial = { id: String(index), label: String(index), children: [initial] };
    }
    const actionsRef = React.createRef<Tree.Root.Actions<Item>>();
    function ControlledTree() {
      const [items, setItems] = React.useState([initial]);
      return (
        <Tree.Root
          items={items}
          actionsRef={actionsRef}
          onItemsChange={(next) => {
            const models: Item[] = [];
            let model: Item | undefined = next[0];
            while (model) {
              models.push(model);
              model = model.children?.[0];
            }
            let cloned = { ...models.pop()! };
            while (models.length > 0) {
              cloned = { ...models.pop()!, children: [cloned] };
            }
            setItems([cloned]);
          }}
        >
          <Tree.List>
            {(item) => (
              <Tree.Item itemId={item.id}>
                <Tree.ItemContent>{item.label}</Tree.ItemContent>
              </Tree.Item>
            )}
          </Tree.List>
        </Tree.Root>
      );
    }
    await render(<ControlledTree />);
    await act(async () =>
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.update('0', { label: 'Renamed' }),
      ),
    );
    expect(actionsRef.current!.getItemModel('0')!.label).toBe('Renamed');
    expect(actionsRef.current!.getItemModel(String(depth))!.label).toBe(String(depth));
  });

  const depth = 10000;
  type Actions = Tree.Root.Actions<Item>;
  const cases: {
    operation: string;
    mutate: (api: Actions, id: string) => void;
    read: (api: Actions, id: string) => unknown;
    expected: unknown;
  }[] = [
    {
      operation: 'rename',
      mutate: (api, id) =>
        api.applyTransaction((transaction) => transaction.update(id, { label: 'Renamed' })),
      read: (api, id) => api.getItemModel(id)?.label,
      expected: 'Renamed',
    },
    {
      operation: 'add',
      mutate: (api, id) =>
        api.applyTransaction((transaction) =>
          transaction.add({ id: 'added', label: 'Added' }, { parentId: id, index: 0 }),
        ),
      read: (api, id) => api.getItemModel(id)?.children?.map((child) => child.id),
      expected: ['added'],
    },
    {
      operation: 'remove',
      mutate: (api, id) => api.applyTransaction((transaction) => transaction.remove(id)),
      read: (api, id) => api.getItemModel(id),
      expected: undefined,
    },
    {
      operation: 'disable',
      mutate: (api) =>
        api.applyTransaction((transaction) => transaction.update('0', { disabled: true })),
      read: (api, id) => api.isItemDisabled(id),
      expected: true,
    },
    {
      operation: 'move',
      mutate: (api) =>
        api.applyTransaction((transaction) =>
          transaction.move('0', { parentId: 'target', index: 0 }),
        ),
      read: (api, id) => api.getAncestorIds(id).length,
      expected: depth + 1,
    },
  ];
  it.each(cases)(
    'applies $operation in a hierarchy deeper than the call stack',
    async ({ mutate, read, expected }) => {
      let item: Item = { id: String(depth), label: String(depth) };
      for (let index = depth - 1; index >= 0; index -= 1) {
        item = { id: String(index), label: String(index), children: [item] };
      }
      const actionsRef = React.createRef<Actions>();
      await render(
        <UncontrolledTree
          initialItems={[item, { id: 'target', label: 'Target' }]}
          actionsRef={actionsRef}
        />,
      );
      await act(async () => {
        mutate(actionsRef.current!, String(depth));
      });
      expect(read(actionsRef.current!, String(depth))).toEqual(expected);
    },
  );
});
