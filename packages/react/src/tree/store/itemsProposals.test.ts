import { describe, it, expect, vi } from 'vitest';
import { TreeItemsProposals } from './itemsProposals';
import type { TreeState } from './types';

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
  { removedIds = undefined as ReadonlySet<string> | undefined, reconcileSelection = false } = {},
) {
  // The lookups the proposal prepared, with the readers of the state it was made on.
  const state = { ...current, items, itemMetaLookup: {} };
  const handle = proposals.propose({
    base: proposals.latest,
    items,
    state,
    baseItemsState: current,
    removedIds,
    reconcileSelection,
  });
  const settled = vi.fn();
  handle.whenSettled(settled);
  return { state, settled };
}

describe('TreeItemsProposals', () => {
  it('builds on the proposals of the same task, and settles them first in a later one', async () => {
    const proposals = new TreeItemsProposals<Item>((items, expected) => items === expected);
    const first = propose(proposals, [{ id: 'a' }], createState());

    expect(proposals.isStale()).toBe(false);
    expect(proposals.baseState).toBe(first.state);
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
    const first = propose(proposals, [{ id: 'a' }], current, { removedIds: new Set(['x']) });
    const second = propose(proposals, [{ id: 'b' }], current, { reconcileSelection: true });
    const third = propose(proposals, [{ id: 'c' }], current);

    const acceptance = proposals.accept(second.state.items)!;
    // The caller prunes and reconciles the selection before the proposals settle.
    expect(acceptance.removedIds).toEqual(new Set(['x']));
    expect(acceptance.reconcileSelection).toBe(true);
    expect(first.settled).not.toHaveBeenCalled();
    acceptance.settle();

    expect(first.settled).toHaveBeenCalledWith(true);
    expect(second.settled).toHaveBeenCalledWith(true);
    expect(third.settled).not.toHaveBeenCalled();
    expect(proposals.latest?.items).toBe(third.state.items);
  });

  it('reuses the lookups the latest proposal prepared while those it was built from are current', () => {
    const proposals = new TreeItemsProposals<Item>((items, expected) => items === expected);
    const current = createState();
    const { state } = propose(proposals, [{ id: 'a' }], current);

    expect(proposals.getPreparedItemsState(state.items, current)?.itemMetaLookup).toBe(
      state.itemMetaLookup,
    );
    expect(proposals.getPreparedItemsState([...state.items], current)).toBe(null);
    expect(proposals.getPreparedItemsState(state.items, { ...current, itemMetaLookup: {} })).toBe(
      null,
    );
  });
});
