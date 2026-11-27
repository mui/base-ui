import { describe, it, expect } from 'vitest';
import { TreeItemsProposals } from './itemsProposals';
import { EMPTY_SET } from './selectors';
import type { TreeItemLookupKey, TreeState } from './types';

type Item = { id: string };

/** A state whose lookups and readers are distinct objects, as the store's are. */
function createState(): TreeState<Item> {
  return {
    itemModelLookup: {},
    itemMetaLookup: {},
    itemOrderedChildrenIdsLookup: {},
    itemCollection: {
      itemToId: (item: Item) => item.id,
      itemToStringLabel: (item: Item) => item.id,
      itemToChildren: () => undefined,
      isItemDisabled: () => false,
      isItemSelectionDisabled: () => false,
    },
  } as unknown as TreeState<Item>;
}

function propose(
  proposals: TreeItemsProposals<Item>,
  items: Item[],
  current: TreeState<Item>,
  {
    removedIds = undefined as ReadonlySet<string> | undefined,
    changedParentKeys = EMPTY_SET as ReadonlySet<TreeItemLookupKey>,
  } = {},
) {
  // The lookups the proposal prepared, with the readers of the state it was made on.
  const state = { ...current, items, itemMetaLookup: {} };
  proposals.propose({
    base: proposals.latest,
    items,
    state,
    baseItemsState: current,
    removedIds,
    changedParentKeys,
  });
  return state;
}

describe('TreeItemsProposals', () => {
  it('builds on the proposals of the same task, and settles them first in a later one', async () => {
    const proposals = new TreeItemsProposals<Item>((items, expected) => items === expected);
    const first = propose(proposals, [{ id: 'a' }], createState());

    expect(proposals.isStale()).toBe(false);
    expect(proposals.baseState).toBe(first);
    await Promise.resolve();
    expect(proposals.isStale()).toBe(true);
  });

  it('leaves the items being notified to their proposal', () => {
    const proposals = new TreeItemsProposals<Item>((items, expected) => items === expected);
    const items = [{ id: 'a' }];

    expect(proposals.notify(items, () => proposals.accept(items))).toBe(null);
    expect(proposals.accept(items)).not.toBe(null);
  });

  it('accepts the latest proposal the items match with the ones it builds on', () => {
    const proposals = new TreeItemsProposals<Item>((items, expected) => items === expected);
    const current = createState();
    const first = propose(proposals, [{ id: 'a' }], current, {
      removedIds: new Set(['x']),
      changedParentKeys: new Set(['p']),
    });
    const second = propose(proposals, [{ id: 'b' }], current, {
      changedParentKeys: new Set(['q']),
    });
    const third = propose(proposals, [{ id: 'c' }], current);

    const acceptance = proposals.accept(second.items)!;
    expect(acceptance.removedIds).toEqual(new Set(['x']));
    expect(acceptance.changedParentKeys).toEqual(new Set(['p', 'q']));
    // The later proposal stays pending, and the earlier ones are gone.
    expect(proposals.latest?.items).toBe(third.items);
    expect(proposals.accept(first.items)).toEqual({
      removedIds: new Set(),
      changedParentKeys: new Set(),
    });
    expect(proposals.latest).toBe(null);
  });

  it('reuses the lookups the latest proposal prepared while those it was built from are current', () => {
    const proposals = new TreeItemsProposals<Item>((items, expected) => items === expected);
    const current = createState();
    const state = propose(proposals, [{ id: 'a' }], current);

    expect(proposals.getPreparedItemsState(state.items, current)?.itemMetaLookup).toBe(
      state.itemMetaLookup,
    );
    expect(proposals.getPreparedItemsState([...state.items], current)).toBe(null);
    expect(proposals.getPreparedItemsState(state.items, { ...current, itemMetaLookup: {} })).toBe(
      null,
    );
  });
});
