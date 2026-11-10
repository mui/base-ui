import { describe, it, expect, vi } from 'vitest';
import {
  buildItemsState,
  getInsertionEdit,
  getItemReplacementEdit,
  getMoveEdit,
  getRemovalEdit,
} from './itemIndex';
import type { TreeItemsEdit } from './itemIndex';
import { selectors } from './selectors';
import { getTransactionEdit, recordItemsTransaction } from './itemsTransaction';
import { TREE_VIEW_ROOT_PARENT_ID } from './types';
import type { TreeDefaultItem, TreeItemTransaction, TreeState } from './types';
import type { InternalTreeItemCollection } from '../items/itemCollection';
import { getItemIdKey } from '../utils/itemIdKey';

interface TestItem extends TreeDefaultItem {
  children?: TestItem[];
  locked?: boolean;
}

const accessors = {
  itemToId: (item: TestItem) => item.id,
  itemToStringLabel: (item: TestItem) => item.label,
  itemToChildren: (item: TestItem) => item.children,
  isItemDisabled: (item: TestItem) => item.disabled ?? false,
  isItemSelectionDisabled: (item: TestItem) => item.locked ?? false,
};

function build(items: readonly TestItem[]) {
  return buildItemsState(items, accessors);
}

describe('buildItemsState', () => {
  it('does not report inherited object properties as existing items', () => {
    // Item ids are arbitrary consumer strings, and `constructor` / `toString` /
    // `valueOf` are perfectly ordinary file and node names. On a plain `{}`
    // lookup they all resolve through the prototype, so every `!= null` existence
    // check answered "yes" for items that were never in the tree.
    const state = build([{ id: 'a', label: 'a' }]);

    for (const inherited of ['constructor', 'toString', 'valueOf', 'hasOwnProperty']) {
      expect(state.itemMetaLookup[inherited]).toBeUndefined();
      expect(state.itemModelLookup[inherited]).toBeUndefined();
      expect(state.itemOrderedChildrenIdsLookup[inherited]).toBeUndefined();
    }
    expect(state.itemMetaLookup[getItemIdKey('a')]).toBeDefined();
  });

  it('cannot be reached through __proto__', () => {
    const state = build([{ id: '__proto__', label: 'proto' }]);

    // On a plain object this assignment mutates the prototype instead of adding
    // an entry, so the item silently vanishes.
    const entry = state.itemMetaLookup[getItemIdKey('__proto__')];
    expect(entry).toBeDefined();
    expect(entry.id).toBe('__proto__');
    expect(Object.getPrototypeOf(state.itemMetaLookup)).toBe(null);
  });

  it('keeps an item literally named __ROOT__ separate from the root', () => {
    const state = build([
      { id: '__ROOT__', label: 'root-named', children: [{ id: 'child', label: 'child' }] },
    ]);

    expect(state.itemOrderedChildrenIdsLookup[TREE_VIEW_ROOT_PARENT_ID]).toEqual(['__ROOT__']);
    expect(state.itemOrderedChildrenIdsLookup[getItemIdKey('__ROOT__')]).toEqual(['child']);
  });

  it('keeps numeric and string IDs with the same text distinct', () => {
    const state = build([
      { id: 1, label: 'number' },
      { id: '1', label: 'string' },
    ]);

    expect(state.itemOrderedChildrenIdsLookup[TREE_VIEW_ROOT_PARENT_ID]).toEqual([1, '1']);
    expect(state.itemMetaLookup[getItemIdKey(1)]?.label).toBe('number');
    expect(state.itemMetaLookup[getItemIdKey('1')]?.label).toBe('string');
  });

  it('builds lookups for deeply nested items without overflowing the call stack', () => {
    const depth = 10_000;
    let item: TestItem = { id: depth, label: String(depth) };
    for (let level = depth - 1; level >= 1; level -= 1) {
      item = { id: level, label: String(level), children: [item] };
    }

    const state = build([item]);

    expect(state.itemMetaLookup[getItemIdKey(depth)]?.level).toBe(depth);
  });

  it('skips a duplicate id and keeps the siblings after it', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const state = build([
        { id: 'a', label: 'a' },
        { id: 'a', label: 'duplicate' },
        { id: 'b', label: 'b' },
      ]);

      expect(state.itemOrderedChildrenIdsLookup[TREE_VIEW_ROOT_PARENT_ID]).toEqual(['a', 'b']);
      expect(state.itemMetaLookup[getItemIdKey('a')]?.label).toBe('a');
      expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('have the same id'));
    } finally {
      consoleError.mockRestore();
    }
  });

  describe('item metadata', () => {
    const state = build([
      {
        id: 'disabled-parent',
        label: 'Disabled parent',
        disabled: true,
        children: [{ id: 'inherits-disabled', label: 'Inherits disabled' }],
      },
      { id: 'empty-children', label: 'Empty children', children: [] },
      {
        id: 'parent',
        label: 'Parent',
        children: [{ id: 'locked', label: 'Locked', locked: true }],
      },
    ]);

    it.each([
      {
        id: 'disabled-parent',
        expected: {
          parentId: null,
          level: 1,
          expandable: true,
          disabled: true,
          resolvedDisabled: true,
          selectable: true,
        },
      },
      {
        id: 'inherits-disabled',
        expected: {
          parentId: 'disabled-parent',
          level: 2,
          expandable: false,
          disabled: false,
          resolvedDisabled: true,
          selectable: true,
        },
      },
      {
        id: 'empty-children',
        expected: {
          parentId: null,
          level: 1,
          expandable: false,
          disabled: false,
          resolvedDisabled: false,
          selectable: true,
        },
      },
      {
        id: 'locked',
        expected: {
          parentId: 'parent',
          level: 2,
          expandable: false,
          disabled: false,
          resolvedDisabled: false,
          selectable: false,
        },
      },
    ])('derives the metadata of $id', ({ id, expected }) => {
      expect(state.itemMetaLookup[getItemIdKey(id)]).toMatchObject({ id, ...expected });
    });
  });
});

describe('item index edits', () => {
  interface Item extends TestItem {
    /** Lazily loaded: expandable without inline children. */
    children?: Item[];
  }

  const collection = {
    ...accessors,
    setItemChildren: (item: Item, children: readonly Item[]) => ({
      ...item,
      children: [...children],
    }),
    setItemLabel: (item: Item, label: string) => ({ ...item, label }),
  } as unknown as InternalTreeItemCollection<Item>;

  const ITEMS: Item[] = [
    {
      id: 'a',
      label: 'A',
      children: [
        { id: 'a1', label: 'A1' },
        { id: 'a2', label: 'A2', children: [{ id: 'a2x', label: 'A2X' }] },
      ],
    },
    { id: 'folder', label: 'Folder', children: [{ id: 'f1', label: 'F1' }] },
    { id: 'off', label: 'Off', disabled: true, children: [{ id: 'o1', label: 'O1' }] },
    { id: 'leaf', label: 'Leaf' },
  ];

  function makeState(items: readonly Item[]): TreeState<Item> {
    return {
      items,
      itemCollection: collection,
      ...buildItemsState(items, collection),
    } as unknown as TreeState<Item>;
  }

  /** What the tree reads from the index, without the lookups' representation. */
  function read(state: TreeState<Item>) {
    const entries = Object.values(state.itemMetaLookup).map(
      (meta) =>
        [
          String(meta.id),
          {
            meta,
            model: selectors.itemModel(state, meta.id),
            index: selectors.itemIndex(state, meta.id),
            children: selectors.itemOrderedChildrenIds(state, meta.id),
          },
        ] as const,
    );
    return { root: selectors.itemOrderedChildrenIds(state, null), entries: new Map(entries) };
  }

  it.each([
    {
      edit: 'removing a nested item',
      apply: (state: TreeState<Item>) => getRemovalEdit(state, new Set(['a1'])),
    },
    {
      edit: 'removing the last child of a folder',
      apply: (state: TreeState<Item>) => getRemovalEdit(state, new Set(['a2x'])),
    },
    {
      edit: 'inserting a subtree into a leaf',
      apply: (state: TreeState<Item>) =>
        getInsertionEdit(state, [{ id: 'n', label: 'N', children: [{ id: 'n1', label: 'N1' }] }], {
          parentId: 'leaf',
          index: 0,
        }),
    },
    {
      edit: 'inserting next to an item with the same id',
      apply: (state: TreeState<Item>) =>
        getInsertionEdit(
          state,
          [
            { id: 'a1', label: 'Duplicate' },
            { id: 'n', label: 'N' },
          ],
          { parentId: 'a', index: 1 },
        ),
    },
    {
      edit: 'moving an item into a disabled folder',
      apply: (state: TreeState<Item>) => getMoveEdit(state, ['a2'], 'off', 0),
    },
    {
      edit: 'moving an item within its parent',
      apply: (state: TreeState<Item>) => getMoveEdit(state, ['a2'], 'a', 0),
    },
    {
      edit: 'renaming a nested item',
      apply: (state: TreeState<Item>) =>
        getItemReplacementEdit(state, 'a2x', {
          ...selectors.itemModel(state, 'a2x')!,
          label: 'Renamed',
        }),
    },
    {
      edit: 'replacing the children of a nested item',
      apply: (state: TreeState<Item>) =>
        getItemReplacementEdit(state, 'a2', {
          ...selectors.itemModel(state, 'a2')!,
          children: [
            { id: 'a2x', label: 'Kept' },
            { id: 'n', label: 'N', children: [{ id: 'n1', label: 'N1' }] },
          ],
        }),
    },
  ])('derives the same index as a rebuild after $edit', ({ apply }) => {
    const state = makeState(ITEMS);
    const edit = apply(state) as TreeItemsEdit<Item>;
    expect(edit).not.toBe(null);
    const edited = { ...state, items: edit.items, ...edit.lookups };
    expect(read(edited)).toEqual(read(makeState(edit.items)));
  });

  it.each<[string, (transaction: TreeItemTransaction<Item>) => void]>([
    [
      'updates many items',
      (transaction) => {
        for (const id of ['a1', 'a2', 'a2x', 'o1', 'leaf']) {
          transaction.update(id, { label: `${id} renamed` });
        }
      },
    ],
    [
      'rejects a replacement after an insertion',
      (transaction) => {
        transaction.add({ id: 'n', label: 'N' });
        // `leaf` is outside `a2`, so the new children are rejected.
        transaction.update('a2', { children: [{ id: 'leaf', label: 'Leaf' }] });
        transaction.update('o1', { label: 'Renamed' });
      },
    ],
    [
      'mixes every operation',
      (transaction) => {
        transaction.add({ id: 'n', label: 'N', children: [{ id: 'n1', label: 'N1' }] });
        transaction.move('a2', { parentId: 'off' });
        transaction.update('a2x', { label: 'Renamed' });
        transaction.remove('a1');
        transaction.set({ id: 'folder', label: 'Folder', children: [] });
        transaction.move('leaf', { parentId: 'n', index: 0 });
        transaction.add({ id: 'm', label: 'M' }, { after: 'n1' });
        transaction.remove('o1');
      },
    ],
  ])('derives the same index as a rebuild after a transaction that %s', (_, record) => {
    // A rejected replacement warns.
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const state = makeState(ITEMS);
    const before = read(state);
    const operations = recordItemsTransaction(record, (item: Item) => item.id);
    const { edit } = getTransactionEdit(state, operations);
    expect(edit).not.toBe(null);
    const edited = { ...state, items: edit!.items, ...edit!.lookups };
    expect(read(edited)).toEqual(read(makeState(edit!.items)));
    // The edits write in place only into the lookups the transaction copied.
    expect(read(state)).toEqual(before);
  });

  it.each<[string, (transaction: TreeItemTransaction<Item>) => void]>([
    [
      'updates an item twice',
      (transaction) => {
        transaction.update('a1', { label: 'Renamed' });
        transaction.update('a1', { disabled: true });
      },
    ],
    [
      'updates an item, then one of its descendants',
      (transaction) => {
        transaction.update('a', { label: 'Renamed' });
        transaction.update('a2x', { label: 'Renamed' });
        transaction.update('a1', { disabled: true });
      },
    ],
    [
      'updates an item, then one of its ancestors',
      (transaction) => {
        transaction.update('a2x', { label: 'Renamed' });
        transaction.set({ ...ITEMS[0], label: 'Replaced' });
        transaction.update('o1', { label: 'Renamed' });
      },
    ],
    [
      'updates items around a no-op and an insertion',
      (transaction) => {
        transaction.update('leaf', { label: 'Renamed' });
        transaction.update('o1', { label: 'O1' });
        transaction.set({ id: 'n', label: 'N' });
        transaction.update('a1', { label: 'Renamed' });
      },
    ],
  ])('matches the operations applied one by one when a transaction %s', (_, record) => {
    // Frozen in place: the transaction must not write into the models it was given.
    const freeze = (items: readonly Item[]): readonly Item[] => {
      for (const item of items) {
        freeze(item.children ?? []);
        Object.freeze(item);
      }
      return Object.freeze(items);
    };
    const state = makeState(freeze(ITEMS));
    const operations = recordItemsTransaction(record, (item: Item) => item.id);
    const { edit } = getTransactionEdit(state, operations);

    let sequential = state;
    const changes = [];
    for (const operation of operations) {
      const step = getTransactionEdit(sequential, [operation]).edit;
      if (step != null) {
        sequential = { ...sequential, items: step.items, ...step.lookups };
        changes.push(...step.changes);
      }
    }
    expect(edit!.items).toEqual(sequential.items);
    expect(edit!.changes).toEqual(changes);
    expect(read({ ...state, items: edit!.items, ...edit!.lookups })).toEqual(read(sequential));
  });
});
